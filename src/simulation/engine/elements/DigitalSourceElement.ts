import { SourceWaveform } from '@/simulation/types/netlist';
import { CircuitElementBase, ElementComputationContext } from './CircuitElement';
import { resolveWaveformVoltage, stampDrivenNode } from './driveHelpers';
import { MNAMatrix } from '../MNAMatrix';

export class DigitalSourceElement extends CircuitElementBase {
  private waveform?: SourceWaveform;
  private high: number;

  constructor(
    id: string,
    label: string,
    nodes: number[],
    netIds: string[],
    waveform: SourceWaveform | undefined,
    high = 5,
  ) {
    super(id, label, nodes, netIds);
    this.waveform = waveform;
    this.high = high;
  }

  stampDynamic(matrix: MNAMatrix, context: ElementComputationContext) {
    const target = resolveWaveformVoltage(this.waveform, context.time, this.high);
    stampDrivenNode(matrix, this.nodes[0], target);
  }

  updateFromSolution(solution: Float64Array) {
    super.updateFromSolution(solution);
    this.current = 0;
    this.power = 0;
  }
}
