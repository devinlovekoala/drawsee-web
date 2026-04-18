import { MNAMatrix } from '../MNAMatrix';
import { CircuitElementBase, ElementBuildContext } from './CircuitElement';

export class CapacitorElement extends CircuitElementBase {
  capacitance: number;
  private conductance = 0;
  private previousVoltage = 0;

  constructor(id: string, label: string, nodes: number[], netIds: string[], capacitance: number) {
    super(id, label, nodes, netIds);
    this.capacitance = Math.max(capacitance, 1e-15);
  }

  initialize(context: ElementBuildContext) {
    this.conductance = this.capacitance / context.timeStep;
  }

  stampStatic(matrix: MNAMatrix) {
    matrix.stampConductance(this.nodes[0], this.nodes[1], this.conductance);
  }

  stampDynamic(matrix: MNAMatrix) {
    matrix.stampCurrentSource(this.nodes[0], this.nodes[1], -this.conductance * this.previousVoltage);
  }

  updateFromSolution(solution: Float64Array) {
    super.updateFromSolution(solution);
    const voltage = this.nodeVoltages[0] - this.nodeVoltages[1];
    this.current = this.conductance * (voltage - this.previousVoltage);
    this.power = voltage * this.current;
    this.previousVoltage = voltage;
  }
}
