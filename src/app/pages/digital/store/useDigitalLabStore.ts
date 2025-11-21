import { create } from 'zustand';
import {
  DigitalDesign,
  DigitalSimulationRequest,
  DigitalSimulationResult,
  DigitalSimulationStatus,
  DigitalTestbenchConfig,
} from '../types';
import { runDigitalSimulation } from '../api/digitalSimulationClient';

const SAMPLE_DIGITAL_PROJECT = {
  devices: {
    btnA: { type: 'Button', label: 'A', bits: 1 },
    btnB: { type: 'Button', label: 'B', bits: 1 },
    clk: { type: 'Clock', label: 'CLK', bits: 1 },
    xor1: { type: 'Xor', bits: 1 },
    lampSum: { type: 'Lamp', label: 'SUM', bits: 1 },
  },
  connectors: [
    { from: { id: 'btnA', port: 'out' }, to: { id: 'xor1', port: 'in1' }, name: 'a' },
    { from: { id: 'btnB', port: 'out' }, to: { id: 'xor1', port: 'in2' }, name: 'b' },
    { from: { id: 'xor1', port: 'out' }, to: { id: 'lampSum', port: 'in' }, name: 'sum' },
  ],
  subcircuits: {},
};

const createRunId = () => {
  const cryptoRef = globalThis?.crypto;
  if (cryptoRef?.randomUUID) {
    return cryptoRef.randomUUID();
  }
  return `digital-${Date.now()}`;
};

const createDefaultDesign = (): DigitalDesign => ({
  id: 'digital-demo',
  name: '数字逻辑示例',
  topModule: 'digital_top',
  description: '示例：异或门 + 时序激励',
  ports: {
    inputs: [
      { name: 'clk', default: 0 },
      { name: 'a', default: 0 },
      { name: 'b', default: 0 },
    ],
    outputs: [{ name: 'sum' }],
  },
  nets: [],
  components: [],
  artifacts: {
    verilog: [
      'module digital_top(',
      '  input clk,',
      '  input a,',
      '  input b,',
      '  output reg sum',
      ');',
      '  always @(posedge clk) begin',
      '    sum <= a ^ b;',
      '  end',
      'endmodule',
    ].join('\n'),
    digitalJsProject: SAMPLE_DIGITAL_PROJECT,
  },
  simulation: {
    durationNs: 80,
    timescale: '1ns/1ps',
    clocks: [{ signal: 'clk', periodNs: 10 }],
    stimuli: [
      { signal: 'a', at: 5, value: 1 },
      { signal: 'b', at: 25, value: 1 },
      { signal: 'a', at: 45, value: 0 },
      { signal: 'b', at: 55, value: 0 },
    ],
  },
});

const buildSimulationPayload = (
  design: DigitalDesign,
  overrides?: Partial<DigitalSimulationRequest>
): DigitalSimulationRequest => {
  const runId = overrides?.runId || createRunId();
  const io = overrides?.io || design.ports;
  const topModule = overrides?.topModule || design.topModule || 'digital_top';
  const sources = overrides?.verilogSources || design.artifacts?.sources;
  const verilog = overrides?.verilog ?? design.artifacts?.verilog;

  if ((!sources || sources.length === 0) && (!verilog || !verilog.trim())) {
    throw new Error('当前设计缺少 Verilog 代码或源文件，无法发起仿真。');
  }

  let testbench: DigitalTestbenchConfig | undefined = overrides?.testbench;
  if (!testbench) {
    const profile = design.simulation || {};
    testbench = profile.testbenchCode
      ? { code: profile.testbenchCode }
      : {
          clocks: profile.clocks,
          stimuli: profile.stimuli,
          durationNs: profile.durationNs,
          timescale: profile.timescale,
        };
  }

  const request: DigitalSimulationRequest = {
    runId,
    topModule,
    io,
    verilog,
    verilogSources: sources,
    digitalNetlist: overrides?.digitalNetlist || {
      name: design.name,
      topModule,
      verilog,
      io,
      design,
    },
    testbench,
    simulation: overrides?.simulation,
  };

  if (!request.verilogSources || request.verilogSources.length === 0) {
    delete request.verilogSources;
  }
  if (!request.verilog) {
    delete request.verilog;
  }
  if (!request.digitalNetlist?.verilog && !request.digitalNetlist?.design) {
    delete request.digitalNetlist;
  }

  return request;
};

export interface DigitalLabState {
  design: DigitalDesign;
  isDirty: boolean;
  simulation: {
    status: DigitalSimulationStatus;
    runId?: string;
    result?: DigitalSimulationResult;
    error?: string;
  };
  setDesign: (design: DigitalDesign) => void;
  updateDesign: (updater: (design: DigitalDesign) => DigitalDesign) => void;
  clearSimulation: () => void;
  runSimulation: (overrides?: Partial<DigitalSimulationRequest>) => Promise<DigitalSimulationResult>;
}

export const useDigitalLabStore = create<DigitalLabState>((set, get) => ({
  design: createDefaultDesign(),
  isDirty: false,
  simulation: { status: 'idle' },
  setDesign: (design) => set({ design, isDirty: true }),
  updateDesign: (updater) =>
    set((state) => {
      const next = updater(state.design);
      return { design: next, isDirty: true };
    }),
  clearSimulation: () => set({ simulation: { status: 'idle' } }),
  runSimulation: async (overrides) => {
    const state = get();
    const payload = buildSimulationPayload(state.design, overrides);
    set({ simulation: { status: 'running', runId: payload.runId } });
    try {
      const result = await runDigitalSimulation(payload);
      set({
        simulation: {
          status: 'success',
          runId: payload.runId,
          result,
        },
      });
      return result;
    } catch (error) {
      const message = error instanceof Error ? error.message : '仿真失败';
      set({
        simulation: {
          status: 'error',
          runId: payload.runId,
          error: message,
        },
      });
      throw error;
    }
  },
}));
