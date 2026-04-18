import { MNAMatrix } from '../MNAMatrix';
import { CircuitElementBase, ElementBuildContext, ElementComputationContext } from './CircuitElement';
import { SourceWaveform } from '@/simulation/types/netlist';
import { resolveWaveformVoltage } from './driveHelpers';

export class VoltageSourceElement extends CircuitElementBase {
  voltage: number;
  waveform?: SourceWaveform;
  branchIndex = -1;

  constructor(
    id: string,
    label: string,
    nodes: number[],
    netIds: string[],
    voltage: number,
    waveform?: SourceWaveform,
  ) {
    super(id, label, nodes, netIds);
    this.voltage = voltage;
    this.waveform = waveform;
  }

  initialize(context: ElementBuildContext) {
    this.branchIndex = context.allocateBranch();
  }

  stampStatic(matrix: MNAMatrix) {
    matrix.stampVoltageSource(this.nodes[0], this.nodes[1], this.branchIndex);
  }

  stampDynamic(matrix: MNAMatrix, context: ElementComputationContext) {
    matrix.stampRHS(this.branchIndex, resolveWaveformVoltage(this.waveform, context.time, this.voltage));
  }

  updateFromSolution(solution: Float64Array) {
    super.updateFromSolution(solution);
    const voltage = this.nodeVoltages[0] - this.nodeVoltages[1];
    this.current = this.branchIndex >= 0 ? solution[this.branchIndex] : 0;
    this.power = voltage * this.current;
  }
}
