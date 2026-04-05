import { MNAMatrix } from '../MNAMatrix';
import { CircuitElementBase } from './CircuitElement';

export class ResistorElement extends CircuitElementBase {
  resistance: number;

  constructor(id: string, label: string, nodes: number[], netIds: string[], resistance: number) {
    super(id, label, nodes, netIds);
    this.resistance = Math.max(resistance, 1e-9);
  }

  stampStatic(matrix: MNAMatrix) {
    matrix.stampConductance(this.nodes[0], this.nodes[1], 1 / this.resistance);
  }

  updateFromSolution(solution: Float64Array) {
    super.updateFromSolution(solution);
    const voltage = this.nodeVoltages[0] - this.nodeVoltages[1];
    this.current = voltage / this.resistance;
    this.power = voltage * this.current;
  }
}
