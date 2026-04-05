import { CircuitElementType } from '@/api/types/circuit.types';
import { Netlist } from '@/simulation/types/netlist';
import { ScopeSample } from '@/simulation/types/simResult';
import { MNAMatrix } from './MNAMatrix';
import { LUSolver } from './LUSolver';
import { CircuitElementBase } from './elements/CircuitElement';
import { ResistorElement } from './elements/ResistorElement';
import { CurrentSourceElement } from './elements/CurrentSourceElement';
import { VoltageSourceElement } from './elements/VoltageSourceElement';
import { CapacitorElement } from './elements/CapacitorElement';
import { InductorElement } from './elements/InductorElement';
import { DiodeElement } from './elements/DiodeElement';
import { ProbeElement } from './elements/ProbeElement';
import { AmmeterElement } from './elements/AmmeterElement';
import { DigitalSourceElement } from './elements/DigitalSourceElement';
import { DigitalGateElement } from './elements/DigitalGateElement';
import { DigitalFlipFlopElement } from './elements/DigitalFlipFlopElement';
import { OpAmpElement } from './elements/OpAmpElement';
import { TransistorElement } from './elements/TransistorElement';

export interface CircuitEngineOptions {
  timeStep?: number;
  maxIterations?: number;
  convergenceTolerance?: number;
}

type ScopeBuffer = {
  samples: ScopeSample[];
  maxSize: number;
};

const createScopeBuffer = (maxSize = 256): ScopeBuffer => ({
  samples: [],
  maxSize,
});

export class CircuitEngine {
  readonly timeStep: number;
  readonly maxIterations: number;
  readonly convergenceTolerance: number;

  time = 0;
  converged = true;
  lastError: string | null = null;

  private netlist: Netlist | null = null;
  private elements: CircuitElementBase[] = [];
  private nodeIndexByNet = new Map<string, number>();
  private branchCount = 0;
  private baseMatrix = new MNAMatrix(0);
  private solver = new LUSolver();
  private solution = new Float64Array(0);
  private hasNonlinearElements = false;
  private scopeBuffers = new Map<string, ScopeBuffer>();

  constructor(options: CircuitEngineOptions = {}) {
    this.timeStep = options.timeStep ?? 5e-6;
    this.maxIterations = options.maxIterations ?? 48;
    this.convergenceTolerance = options.convergenceTolerance ?? 1e-6;
  }

  loadNetlist(netlist: Netlist) {
    this.netlist = netlist;
    this.time = 0;
    this.lastError = null;
    this.nodeIndexByNet.clear();
    this.branchCount = 0;
    this.elements = [];
    this.scopeBuffers.clear();

    const nonGroundNets = netlist.nets.filter((net) => net !== '0');
    nonGroundNets.forEach((net, index) => {
      this.nodeIndexByNet.set(net, index);
      this.scopeBuffers.set(net, createScopeBuffer());
    });

    const makeNodes = (nets: string[]) => nets.map((net) => this.nodeIndexByNet.get(net) ?? -1);
    for (const element of netlist.elements) {
      const nodes = makeNodes(element.nets);
      switch (element.type) {
        case CircuitElementType.RESISTOR:
          this.elements.push(new ResistorElement(element.id, element.label, nodes, element.nets, element.params.resistance));
          break;
        case CircuitElementType.CAPACITOR:
          this.elements.push(new CapacitorElement(element.id, element.label, nodes, element.nets, element.params.capacitance));
          break;
        case CircuitElementType.INDUCTOR:
          this.elements.push(new InductorElement(element.id, element.label, nodes, element.nets, element.params.inductance));
          break;
        case CircuitElementType.CURRENT_SOURCE:
          this.elements.push(new CurrentSourceElement(element.id, element.label, nodes, element.nets, element.params.current));
          break;
        case CircuitElementType.VOLTAGE_SOURCE:
        case CircuitElementType.AC_SOURCE:
        case CircuitElementType.PULSE_SOURCE:
        case CircuitElementType.PWM_SOURCE:
        case CircuitElementType.SINE_SOURCE:
          this.elements.push(new VoltageSourceElement(element.id, element.label, nodes, element.nets, element.params.voltage, element.waveform));
          break;
        case CircuitElementType.DIODE:
        case CircuitElementType.DIODE_ZENER:
        case CircuitElementType.DIODE_LED:
        case CircuitElementType.DIODE_SCHOTTKY:
          this.elements.push(new DiodeElement(
            element.id,
            element.label,
            nodes,
            element.nets,
            element.params.saturationCurrent,
            element.params.emissionCoefficient,
          ));
          break;
        case CircuitElementType.TRANSISTOR_NPN:
          this.elements.push(new TransistorElement(
            element.id,
            element.label,
            nodes,
            element.nets,
            element.params.beta,
            element.params.saturationCurrent,
            false,
          ));
          break;
        case CircuitElementType.TRANSISTOR_PNP:
          this.elements.push(new TransistorElement(
            element.id,
            element.label,
            nodes,
            element.nets,
            element.params.beta,
            element.params.saturationCurrent,
            true,
          ));
          break;
        case CircuitElementType.OPAMP:
          this.elements.push(new OpAmpElement(
            element.id,
            element.label,
            nodes,
            element.nets,
            element.params.gbw,
            element.params.sr,
            element.params.vos,
            element.params.vsatMargin,
          ));
          break;
        case CircuitElementType.AMMETER:
          this.elements.push(new AmmeterElement(element.id, element.label, nodes, element.nets));
          break;
        case CircuitElementType.VOLTMETER:
        case CircuitElementType.DIGITAL_OUTPUT:
          this.elements.push(new ProbeElement(element.id, element.label, nodes, element.nets));
          break;
        case CircuitElementType.DIGITAL_INPUT:
        case CircuitElementType.DIGITAL_CLOCK:
          this.elements.push(new DigitalSourceElement(
            element.id,
            element.label,
            nodes,
            element.nets,
            element.waveform,
            element.params.high,
          ));
          break;
        case CircuitElementType.DIGITAL_AND:
        case CircuitElementType.DIGITAL_AND3:
        case CircuitElementType.DIGITAL_AND4:
        case CircuitElementType.DIGITAL_OR:
        case CircuitElementType.DIGITAL_OR3:
        case CircuitElementType.DIGITAL_OR4:
        case CircuitElementType.DIGITAL_NOT:
        case CircuitElementType.DIGITAL_BUF:
        case CircuitElementType.DIGITAL_TRI:
        case CircuitElementType.DIGITAL_SCHMITT_NOT:
        case CircuitElementType.DIGITAL_NAND:
        case CircuitElementType.DIGITAL_NAND3:
        case CircuitElementType.DIGITAL_NAND4:
        case CircuitElementType.DIGITAL_NOR:
        case CircuitElementType.DIGITAL_NOR3:
        case CircuitElementType.DIGITAL_NOR4:
        case CircuitElementType.DIGITAL_XOR:
        case CircuitElementType.DIGITAL_XNOR:
          this.elements.push(new DigitalGateElement(
            element.id,
            element.label,
            element.type,
            nodes,
            element.nets,
            element.params.tpd,
            Boolean(element.params.oeActiveHigh ?? 1),
          ));
          break;
        case CircuitElementType.DIGITAL_DFF:
        case CircuitElementType.DIGITAL_JKFF:
        case CircuitElementType.DIGITAL_TFF:
        case CircuitElementType.DIGITAL_SRFF:
          this.elements.push(new DigitalFlipFlopElement(
            element.id,
            element.label,
            element.type,
            nodes,
            element.nets,
            element.params.tpd,
            element.params.edge === -1 ? 'negedge' : 'posedge',
          ));
          break;
        default:
          break;
      }
    }

    const allocateBranch = () => {
      const branchIndex = nonGroundNets.length + this.branchCount;
      this.branchCount += 1;
      return branchIndex;
    };
    for (const element of this.elements) {
      element.initialize({ timeStep: this.timeStep, allocateBranch });
    }

    const matrixSize = nonGroundNets.length + this.branchCount;
    this.baseMatrix = new MNAMatrix(matrixSize);
    for (const element of this.elements) {
      element.stampStatic(this.baseMatrix);
    }
    for (let index = 0; index < nonGroundNets.length; index += 1) {
      this.baseMatrix.stamp(index, index, 1e-12);
    }

    this.solution = new Float64Array(matrixSize);
    this.hasNonlinearElements = this.elements.some((element) => element.hasNonlinearBehavior);
  }

  private buildStepMatrix() {
    const matrix = new MNAMatrix(this.baseMatrix.size);
    matrix.data.set(this.baseMatrix.data);
    return matrix;
  }

  runStep() {
    if (!this.netlist || this.baseMatrix.size === 0) {
      return;
    }
    if (this.lastError) {
      return;
    }

    const stepContext = {
      time: this.time,
      timeStep: this.timeStep,
      solution: this.solution,
    };
    this.elements.forEach((element) => element.beginStep(stepContext));

    let converged = true;
    let matrix = this.buildStepMatrix();
    for (const element of this.elements) {
      element.stampDynamic(matrix, stepContext);
    }

    if (this.hasNonlinearElements) {
      let solved = false;
      for (let iteration = 0; iteration < this.maxIterations; iteration += 1) {
        const ok = this.solver.factor(matrix.cloneData(), matrix.size);
        if (!ok) {
          this.lastError = '实时仿真失败：矩阵不可逆。';
          return;
        }
        const nextSolution = this.solver.solve(matrix.cloneRHS());
        converged = this.elements
          .filter((element) => element.hasNonlinearBehavior)
          .every((element) => element.isConverged(nextSolution, this.convergenceTolerance));
        this.solution = nextSolution;
        if (converged) {
          solved = true;
          break;
        }
        matrix = this.buildStepMatrix();
        const nonlinearContext = {
          time: this.time,
          timeStep: this.timeStep,
          solution: this.solution,
        };
        for (const element of this.elements) {
          element.stampDynamic(matrix, nonlinearContext);
        }
      }
      if (!solved) {
        converged = false;
      }
    } else {
      const ok = this.solver.factor(matrix.cloneData(), matrix.size);
      if (!ok) {
        this.lastError = '实时仿真失败：矩阵不可逆。';
        return;
      }
      this.solution = this.solver.solve(matrix.cloneRHS());
    }

    this.converged = converged;
    for (const element of this.elements) {
      element.updateFromSolution(this.solution);
    }
    for (const [net, index] of this.nodeIndexByNet.entries()) {
      const buffer = this.scopeBuffers.get(net);
      if (!buffer) continue;
      buffer.samples.push({ time: this.time, value: this.solution[index] });
      if (buffer.samples.length > buffer.maxSize) {
        buffer.samples.shift();
      }
    }
    this.time += this.timeStep;
  }

  stepFrames(stepCount: number) {
    for (let index = 0; index < stepCount; index += 1) {
      this.runStep();
      if (this.lastError) break;
    }
  }

  getNodeVoltage(netId: string) {
    const index = this.nodeIndexByNet.get(netId);
    return index === undefined ? 0 : this.solution[index];
  }

  getElementResults() {
    const results: Record<string, { label: string; voltage: number; current: number; power: number; nodeVoltages: number[] }> = {};
    for (const element of this.elements) {
      const voltage = (element.nodeVoltages[0] ?? 0) - (element.nodeVoltages[1] ?? 0);
      results[element.id] = {
        label: element.label,
        voltage,
        current: element.current,
        power: element.power,
        nodeVoltages: [...element.nodeVoltages],
      };
    }
    return results;
  }

  getNodeVoltages() {
    const result: Record<string, number> = { '0': 0 };
    for (const [net, index] of this.nodeIndexByNet.entries()) {
      result[net] = this.solution[index];
    }
    return result;
  }

  getScopeSamples(netId: string) {
    return [...(this.scopeBuffers.get(netId)?.samples || [])];
  }
}
