import { CircuitElementBase, ElementBuildContext } from './CircuitElement';
import { MNAMatrix } from '../MNAMatrix';

export class AmmeterElement extends CircuitElementBase {
  private branchIndex = -1;

  initialize(context: ElementBuildContext) {
    this.branchIndex = context.allocateBranch();
  }

  stampStatic(matrix: MNAMatrix) {
    matrix.stampVoltageSource(this.nodes[0], this.nodes[1], this.branchIndex);
  }

  updateFromSolution(solution: Float64Array) {
    super.updateFromSolution(solution);
    this.current = this.branchIndex >= 0 ? solution[this.branchIndex] : 0;
    const voltage = (this.nodeVoltages[0] ?? 0) - (this.nodeVoltages[1] ?? 0);
    this.power = voltage * this.current;
  }
}
