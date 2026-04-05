import { CircuitElementType } from '@/api/types/circuit.types';
import { CircuitElementBase, ElementComputationContext } from './CircuitElement';
import { booleanToVoltage, stampDrivenNode, voltageToLogic } from './driveHelpers';
import { MNAMatrix } from '../MNAMatrix';

type LogicState = boolean | null;

type ScheduledOutput = {
  time: number;
  q: LogicState;
};

export class DigitalFlipFlopElement extends CircuitElementBase {
  private readonly type: CircuitElementType;
  private readonly delay: number;
  private readonly edge: 'posedge' | 'negedge';
  private qState: LogicState = false;
  private previousClockHigh = false;
  private queue: ScheduledOutput[] = [];

  constructor(
    id: string,
    label: string,
    type: CircuitElementType,
    nodes: number[],
    netIds: string[],
    delay: number,
    edge: 'posedge' | 'negedge',
  ) {
    super(id, label, nodes, netIds);
    this.type = type;
    this.delay = delay;
    this.edge = edge;
  }

  beginStep(context: ElementComputationContext) {
    while (this.queue.length && this.queue[0].time <= context.time + 1e-18) {
      const next = this.queue.shift();
      if (next) this.qState = next.q;
    }
    const values = this.nodes.map((node) => voltageToLogic(this.voltageAt(context.solution, node), false));
    const clockIndex =
      this.type === CircuitElementType.DIGITAL_DFF ? 3 :
      this.type === CircuitElementType.DIGITAL_JKFF ? 2 :
      this.type === CircuitElementType.DIGITAL_TFF ? 1 :
      2;
    const clockHigh = values[clockIndex] === true;
    const edgeTriggered =
      this.edge === 'posedge'
        ? !this.previousClockHigh && clockHigh
        : this.previousClockHigh && !clockHigh;
    this.previousClockHigh = clockHigh;
    if (!edgeTriggered) return;

    let nextState: LogicState = this.qState;
    switch (this.type) {
      case CircuitElementType.DIGITAL_DFF: {
        const preset = values[1];
        const clear = values[2];
        if (preset === true && clear === true) nextState = null;
        else if (preset === true) nextState = true;
        else if (clear === true) nextState = false;
        else nextState = values[0];
        break;
      }
      case CircuitElementType.DIGITAL_JKFF:
        if (values[0] === true && values[1] === true) nextState = this.qState === null ? null : !this.qState;
        else if (values[0] === true) nextState = true;
        else if (values[1] === true) nextState = false;
        break;
      case CircuitElementType.DIGITAL_TFF:
        if (values[0] === true) nextState = this.qState === null ? null : !this.qState;
        break;
      case CircuitElementType.DIGITAL_SRFF:
        if (values[0] === true && values[1] === true) nextState = null;
        else if (values[0] === true) nextState = true;
        else if (values[1] === true) nextState = false;
        break;
      default:
        break;
    }
    this.queue.push({ time: context.time + this.delay, q: nextState });
  }

  stampDynamic(matrix: MNAMatrix) {
    const qNode = this.type === CircuitElementType.DIGITAL_DFF ? this.nodes[4] : this.nodes[3];
    const qnNode = this.type === CircuitElementType.DIGITAL_DFF ? this.nodes[5] : this.nodes[4];
    stampDrivenNode(matrix, qNode, booleanToVoltage(this.qState));
    if (qnNode >= 0) {
      const qnState = this.qState === null ? null : !this.qState;
      stampDrivenNode(matrix, qnNode, booleanToVoltage(qnState));
    }
  }

  updateFromSolution(solution: Float64Array) {
    super.updateFromSolution(solution);
    this.current = 0;
    this.power = 0;
  }
}
