import { CircuitDesign, CircuitElementType } from '@/api/types/circuit.types';
import { DigitalSimulationResult } from '@/app/pages/digital/simulation/types';
import { buildDigitalSimulationPlan } from '@/app/pages/digital/simulation/digitalNetlist';
import { SimulationMeasurementResult } from '@/app/pages/circuit/simulation/types';
import { diagnoseAnalogSimulationDesign } from '@/app/pages/circuit/simulation/simulationDiagnostics';
import { extractNetlist } from '@/simulation/hooks/useNetlistExtract';
import { SimFrameResult } from '@/simulation/types/simResult';

type WorkspaceMode = 'analog' | 'digital' | 'hybrid';
type AnalogSimulationMode = 'realtime' | 'precision';

type AnalysisProbePortSummary = {
  portId: string;
  portName: string;
  net: string;
};

type AnalysisMeasurementSummary = {
  elementId: string;
  label: string;
  type: string;
  nets: string[];
  ports: AnalysisProbePortSummary[];
  hint?: string;
};

type AnalysisAnalogContext = {
  simulator: 'drawsee-realtime';
  mode: AnalogSimulationMode;
  diagnostics?: {
    title: string;
    summary: string;
    suggestions: string[];
  };
  netlist: {
    nets: string[];
    elements: Array<{
      id: string;
      label: string;
      type: string;
      nets: string[];
      params: Record<string, number>;
      waveform?: Record<string, unknown>;
    }>;
    probes: Array<{
      id: string;
      label: string;
      nets: string[];
      ports: AnalysisProbePortSummary[];
      hint: string;
    }>;
  };
  measurementTargets: AnalysisMeasurementSummary[];
  latestRealtimeFrame?: {
    time: number;
    converged: boolean;
    fpsHint: number;
    scopePanels: Array<{
      elementId: string;
      label: string;
      traces: Array<{
        key: string;
        label: string;
        latestValue: number | null;
        sampleCount: number;
      }>;
    }>;
  };
  latestPrecisionMeasurements?: Array<{
    elementId: string;
    label: string;
    elementType: string;
    nets?: string[];
    metrics: Record<string, number>;
    channels?: string[];
  }>;
};

type AnalysisDigitalContext = {
  simulator: 'iverilog';
  plan?: {
    topModule: string;
    inputs: Array<{ name: string; default?: number | string }>;
    outputs: Array<{ name: string }>;
    inouts: Array<{ name: string }>;
    clocks: Array<{ signal: string; periodNs: number }>;
    probes: Array<{ elementId?: string; label: string; signal: string; role: string }>;
    warnings: string[];
    durationNs: number;
  };
  latestResult?: {
    durationNs: number;
    warnings: string[];
    waveforms: Array<{
      signal: string;
      label?: string;
      role?: string;
      sampleCount: number;
      latestValue?: string;
    }>;
  };
  planError?: string;
};

export interface CircuitAnalysisPromptPayload {
  version: 'drawsee-circuit-analysis-v2';
  workspaceMode: WorkspaceMode;
  circuitDesign: CircuitDesign;
  analysisContext: {
    analog?: AnalysisAnalogContext;
    digital?: AnalysisDigitalContext;
  };
}

interface BuildCircuitAnalysisPayloadInput {
  design: CircuitDesign;
  workspaceMode: WorkspaceMode;
  analogSimulationMode: AnalogSimulationMode;
  simulationResults: Record<string, SimulationMeasurementResult>;
  digitalSimResult: DigitalSimulationResult | null;
  realtimeFrameResult: SimFrameResult | null;
}

const measurementTypes = new Set<CircuitElementType>([
  CircuitElementType.AMMETER,
  CircuitElementType.VOLTMETER,
  CircuitElementType.OSCILLOSCOPE,
]);

const analogTypes = new Set<CircuitElementType>([
  CircuitElementType.RESISTOR,
  CircuitElementType.CAPACITOR,
  CircuitElementType.INDUCTOR,
  CircuitElementType.VOLTAGE_SOURCE,
  CircuitElementType.CURRENT_SOURCE,
  CircuitElementType.AC_SOURCE,
  CircuitElementType.PULSE_SOURCE,
  CircuitElementType.PWM_SOURCE,
  CircuitElementType.SINE_SOURCE,
  CircuitElementType.DIODE,
  CircuitElementType.DIODE_ZENER,
  CircuitElementType.DIODE_LED,
  CircuitElementType.DIODE_SCHOTTKY,
  CircuitElementType.TRANSISTOR_NPN,
  CircuitElementType.TRANSISTOR_PNP,
  CircuitElementType.OPAMP,
  CircuitElementType.GROUND,
  CircuitElementType.WIRE,
  CircuitElementType.JUNCTION,
  CircuitElementType.AMMETER,
  CircuitElementType.VOLTMETER,
  CircuitElementType.OSCILLOSCOPE,
]);

const resolveMeasurementHint = (element: CircuitDesign['elements'][number], nets: string[]) => {
  if (element.type === CircuitElementType.OSCILLOSCOPE) {
    const [ch1, ch2, ground] = nets;
    if (ch1 && ch2 && ch2 !== '0') {
      return `示波器差分测量 ${ch1} 相对 ${ch2} 的波形，参考地 ${ground || '0'}`;
    }
    return `示波器单端测量 ${ch1 || '0'} 相对 ${ground || '0'} 的波形`;
  }
  if (element.type === CircuitElementType.VOLTMETER) {
    return `电压表测量 ${nets[0] || '0'} 与 ${nets[1] || '0'} 之间的电位差`;
  }
  if (element.type === CircuitElementType.AMMETER) {
    return `电流表串联在 ${nets[0] || '0'} 与 ${nets[1] || '0'} 之间，测量支路电流`;
  }
  return undefined;
};

const buildMeasurementSummary = (
  design: CircuitDesign,
  elementNets: Record<string, string[]>,
): AnalysisMeasurementSummary[] => {
  return design.elements
    .filter((element) => measurementTypes.has(element.type))
    .map((element) => {
      const nets = elementNets[element.id] || [];
      const ports = (element.ports || []).map((port, index) => ({
        portId: port.id,
        portName: port.name || port.id,
        net: nets[index] || '0',
      }));
      return {
        elementId: element.id,
        label: element.label || String(element.properties?.label || element.id),
        type: element.type,
        nets,
        ports,
        hint: resolveMeasurementHint(element, nets),
      };
    });
};

const buildAnalogContext = ({
  design,
  analogSimulationMode,
  simulationResults,
  realtimeFrameResult,
}: Pick<
  BuildCircuitAnalysisPayloadInput,
  'design' | 'analogSimulationMode' | 'simulationResults' | 'realtimeFrameResult'
>): AnalysisAnalogContext | undefined => {
  const hasAnalog = design.elements.some((element) => analogTypes.has(element.type));
  if (!hasAnalog) return undefined;

  const netlist = extractNetlist(design);
  const diagnostics = diagnoseAnalogSimulationDesign(design, analogSimulationMode);
  const measurementTargets = buildMeasurementSummary(design, netlist.elementNets);

  return {
    simulator: 'drawsee-realtime',
    mode: analogSimulationMode,
    diagnostics: diagnostics
      ? {
          title: diagnostics.title,
          summary: diagnostics.summary,
          suggestions: diagnostics.suggestions,
        }
      : undefined,
    netlist: {
      nets: netlist.nets,
      elements: netlist.elements.map((element) => ({
        id: element.id,
        label: element.label,
        type: element.type,
        nets: element.nets,
        params: element.params,
        waveform: element.waveform,
      })),
      probes: netlist.probes.map((probe) => ({
        id: probe.id,
        label: probe.label,
        nets: probe.nets,
        ports: [
          { portId: 'channel1', portName: 'CH1', net: probe.nets[0] || '0' },
          { portId: 'channel2', portName: 'CH2', net: probe.nets[1] || '0' },
          { portId: 'ground', portName: 'GND', net: probe.nets[2] || '0' },
        ],
        hint:
          probe.nets[1] && probe.nets[1] !== '0'
            ? `差分观测 ${probe.nets[0]} 相对 ${probe.nets[1]}，参考地 ${probe.nets[2] || '0'}`
            : `单端观测 ${probe.nets[0]} 相对 ${probe.nets[2] || '0'}`,
      })),
    },
    measurementTargets,
    latestRealtimeFrame: realtimeFrameResult
      ? {
          time: realtimeFrameResult.time,
          converged: realtimeFrameResult.converged,
          fpsHint: realtimeFrameResult.fpsHint,
          scopePanels: realtimeFrameResult.scopePanels.map((panel) => ({
            elementId: panel.elementId,
            label: panel.label,
            traces: panel.traces.map((trace) => ({
              key: trace.key,
              label: trace.label,
              latestValue: trace.samples[trace.samples.length - 1]?.value ?? null,
              sampleCount: trace.samples.length,
            })),
          })),
        }
      : undefined,
    latestPrecisionMeasurements: Object.values(simulationResults).length
      ? Object.values(simulationResults).map((result) => ({
          elementId: result.elementId,
          label: result.label,
          elementType: result.elementType,
          nets: result.nets,
          metrics: result.metrics,
          channels: result.channels,
        }))
      : undefined,
  };
};

const buildDigitalContext = ({
  design,
  digitalSimResult,
}: Pick<BuildCircuitAnalysisPayloadInput, 'design' | 'digitalSimResult'>): AnalysisDigitalContext | undefined => {
  const hasDigital = design.elements.some((element) => String(element.type).startsWith('digital_'));
  if (!hasDigital) return undefined;

  try {
    const plan = digitalSimResult?.plan || buildDigitalSimulationPlan(design);
    return {
      simulator: 'iverilog',
      plan: {
        topModule: plan.topModule,
        inputs: plan.io.inputs.map((input) => ({ name: input.name, default: input.default })),
        outputs: plan.io.outputs.map((output) => ({ name: output.name })),
        inouts: (plan.io.inouts || []).map((inout) => ({ name: inout.name })),
        clocks: plan.testbench.clocks.map((clock) => ({
          signal: clock.signal,
          periodNs: clock.periodNs,
        })),
        probes: plan.probes.map((probe) => ({
          elementId: probe.elementId,
          label: probe.label,
          signal: probe.signal,
          role: probe.role,
        })),
        warnings: plan.warnings,
        durationNs: plan.testbench.durationNs,
      },
      latestResult: digitalSimResult
        ? {
            durationNs: digitalSimResult.durationNs,
            warnings: digitalSimResult.warnings,
            waveforms: digitalSimResult.waveforms.map((trace) => ({
              signal: trace.signal,
              label: trace.label,
              role: trace.role,
              sampleCount: trace.samples.length,
              latestValue: trace.samples[trace.samples.length - 1]?.value,
            })),
          }
        : undefined,
    };
  } catch (error) {
    return {
      simulator: 'iverilog',
      planError: error instanceof Error ? error.message : String(error || '数字分析上下文构建失败'),
      latestResult: digitalSimResult
        ? {
            durationNs: digitalSimResult.durationNs,
            warnings: digitalSimResult.warnings,
            waveforms: digitalSimResult.waveforms.map((trace) => ({
              signal: trace.signal,
              label: trace.label,
              role: trace.role,
              sampleCount: trace.samples.length,
              latestValue: trace.samples[trace.samples.length - 1]?.value,
            })),
          }
        : undefined,
    };
  }
};

export const buildCircuitAnalysisPromptPayload = (
  input: BuildCircuitAnalysisPayloadInput,
): CircuitAnalysisPromptPayload => {
  return {
    version: 'drawsee-circuit-analysis-v2',
    workspaceMode: input.workspaceMode,
    circuitDesign: input.design,
    analysisContext: {
      analog: buildAnalogContext(input),
      digital: buildDigitalContext(input),
    },
  };
};
