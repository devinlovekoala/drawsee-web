import { MNAMatrix } from '../MNAMatrix';
import { CircuitElementBase, ElementBuildContext } from './CircuitElement';

export class InductorElement extends CircuitElementBase {
  inductance: number;
  private conductance = 0;
  private previousCurrent = 0;

  constructor(id: string, label: string, nodes: number[], netIds: string[], inductance: number) {
    super(id, label, nodes, netIds);
    this.inductance = Math.max(inductance, 1e-12);
  }

  initialize(context: ElementBuildContext) {
    this.conductance = context.timeStep / this.inductance;
  }

  stampStatic(matrix: MNAMatrix) {
    matrix.stampConductance(this.nodes[0], this.nodes[1], this.conductance);
  }

  stampDynamic(matrix: MNAMatrix) {
    matrix.stampCurrentSource(this.nodes[0], this.nodes[1], this.previousCurrent);
  }

  updateFromSolution(solution: Float64Array) {
    super.updateFromSolution(solution);
    const voltage = this.nodeVoltages[0] - this.nodeVoltages[1];
    this.current = this.previousCurrent + this.conductance * voltage;
    this.power = voltage * this.current;
    this.previousCurrent = this.current;
  }
}
