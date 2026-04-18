import { CircuitElementType } from '@/api/types/circuit.types';
import { CircuitElementBase, ElementComputationContext } from './CircuitElement';
import { booleanToVoltage, stampDrivenNode, voltageToLogic } from './driveHelpers';
import { MNAMatrix } from '../MNAMatrix';

type LogicState = boolean | null;

type ScheduledState = {
  time: number;
  value: LogicState;
};

const xorReduce = (values: boolean[]) => values.reduce((acc, value) => acc !== value, false);

export class DigitalGateElement extends CircuitElementBase {
  private readonly type: CircuitElementType;
  private readonly delay: number;
  private readonly oeActiveHigh: boolean;
  private outputState: LogicState = false;
  private lastInputs: LogicState[] = [];
  private queue: ScheduledState[] = [];

  constructor(
    id: string,
    label: string,
    type: CircuitElementType,
    nodes: number[],
    netIds: string[],
    delay: number,
    oeActiveHigh: boolean,
  ) {
    super(id, label, nodes, netIds);
    this.type = type;
    this.delay = delay;
    this.oeActiveHigh = oeActiveHigh;
  }

  private computeOutput(inputs: LogicState[]) {
    const normalized = inputs.map((value) => value === true);
    switch (this.type) {
      case CircuitElementType.DIGITAL_AND:
      case CircuitElementType.DIGITAL_AND3:
      case CircuitElementType.DIGITAL_AND4:
        return normalized.every(Boolean);
      case CircuitElementType.DIGITAL_OR:
      case CircuitElementType.DIGITAL_OR3:
      case CircuitElementType.DIGITAL_OR4:
        return normalized.some(Boolean);
      case CircuitElementType.DIGITAL_NOT:
      case CircuitElementType.DIGITAL_SCHMITT_NOT:
        return !(inputs[0] === true);
      case CircuitElementType.DIGITAL_BUF:
        return inputs[0];
      case CircuitElementType.DIGITAL_NAND:
      case CircuitElementType.DIGITAL_NAND3:
      case CircuitElementType.DIGITAL_NAND4:
        return !normalized.every(Boolean);
      case CircuitElementType.DIGITAL_NOR:
      case CircuitElementType.DIGITAL_NOR3:
      case CircuitElementType.DIGITAL_NOR4:
        return !normalized.some(Boolean);
      case CircuitElementType.DIGITAL_XOR:
        return xorReduce(normalized);
      case CircuitElementType.DIGITAL_XNOR:
        return !xorReduce(normalized);
      default:
        return false;
    }
  }

  beginStep(context: ElementComputationContext) {
    while (this.queue.length && this.queue[0].time <= context.time + 1e-18) {
      const next = this.queue.shift();
      if (next) this.outputState = next.value;
    }
    const inputs = this.nodes.slice(0, -1).map((node, index) =>
      voltageToLogic(this.voltageAt(context.solution, node), this.lastInputs[index] ?? false),
    );
    this.lastInputs = inputs;
    let nextOutput: LogicState;
    if (this.type === CircuitElementType.DIGITAL_TRI) {
      const enabled = this.oeActiveHigh ? inputs[1] === true : inputs[1] !== true;
      nextOutput = enabled ? inputs[0] : null;
    } else {
      nextOutput = this.computeOutput(inputs);
    }
    if (nextOutput !== this.outputState && !this.queue.some((entry) => entry.value === nextOutput)) {
      this.queue.push({ time: context.time + this.delay, value: nextOutput });
    }
  }

  stampDynamic(matrix: MNAMatrix) {
    const outputNode = this.nodes[this.nodes.length - 1];
    if (this.outputState === null) return;
    stampDrivenNode(matrix, outputNode, booleanToVoltage(this.outputState));
  }

  updateFromSolution(solution: Float64Array) {
    super.updateFromSolution(solution);
    this.current = 0;
    this.power = 0;
  }
}
