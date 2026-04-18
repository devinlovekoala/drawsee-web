import { CircuitElementBase } from './CircuitElement';

export class ProbeElement extends CircuitElementBase {
  updateFromSolution(solution: Float64Array) {
    super.updateFromSolution(solution);
    this.current = 0;
    this.power = 0;
  }
}
