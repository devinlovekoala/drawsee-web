import { CircuitElementBase, ElementComputationContext } from './CircuitElement';
import { stampDrivenNode } from './driveHelpers';
import { MNAMatrix } from '../MNAMatrix';

export class OpAmpElement extends CircuitElementBase {
  private readonly gbw: number;
  private readonly slewRateVPerSecond: number;
  private readonly inputOffset: number;
  private readonly saturationLimit: number;
  private outputVoltage = 0;

  constructor(
    id: string,
    label: string,
    nodes: number[],
    netIds: string[],
    gbw: number,
    slewRateVPerMicrosecond: number,
    inputOffset: number,
    saturationMargin: number,
  ) {
    super(id, label, nodes, netIds);
    this.gbw = gbw;
    this.slewRateVPerSecond = slewRateVPerMicrosecond * 1e6;
    this.inputOffset = inputOffset;
    this.saturationLimit = Math.max(1, 15 - saturationMargin);
  }

  beginStep(context: ElementComputationContext) {
    const vp = this.voltageAt(context.solution, this.nodes[0]);
    const vn = this.voltageAt(context.solution, this.nodes[1]);
    const openLoopGain = Math.max(1e4, this.gbw * context.timeStep);
    const desired = Math.max(
      -this.saturationLimit,
      Math.min(this.saturationLimit, openLoopGain * ((vp - vn) + this.inputOffset)),
    );
    const maxDelta = this.slewRateVPerSecond * context.timeStep;
    const delta = desired - this.outputVoltage;
    if (Math.abs(delta) <= maxDelta) {
      this.outputVoltage = desired;
    } else {
      this.outputVoltage += Math.sign(delta) * maxDelta;
    }
  }

  stampDynamic(matrix: MNAMatrix) {
    stampDrivenNode(matrix, this.nodes[2], this.outputVoltage, 25);
  }

  updateFromSolution(solution: Float64Array) {
    super.updateFromSolution(solution);
    this.current = 0;
    this.power = 0;
  }
}
