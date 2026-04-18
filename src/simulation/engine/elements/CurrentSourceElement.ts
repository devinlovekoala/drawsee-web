import { MNAMatrix } from '../MNAMatrix';
import { CircuitElementBase } from './CircuitElement';

export class CurrentSourceElement extends CircuitElementBase {
  currentValue: number;

  constructor(id: string, label: string, nodes: number[], netIds: string[], currentValue: number) {
    super(id, label, nodes, netIds);
    this.currentValue = currentValue;
  }

  stampDynamic(matrix: MNAMatrix) {
    matrix.stampCurrentSource(this.nodes[0], this.nodes[1], this.currentValue);
  }

  updateFromSolution(solution: Float64Array) {
    super.updateFromSolution(solution);
    const voltage = this.nodeVoltages[0] - this.nodeVoltages[1];
    this.current = this.currentValue;
    this.power = voltage * this.current;
  }
}
