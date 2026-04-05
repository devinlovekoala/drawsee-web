import { MNAMatrix } from '../MNAMatrix';
import { CircuitElementBase } from './CircuitElement';

export class DiodeElement extends CircuitElementBase {
  private readonly saturationCurrent: number;
  private readonly emissionCoefficient: number;
  private readonly thermalVoltage: number;
  private previousVoltage = 0;
  private linearConductance = 0;
  private linearCurrent = 0;

  constructor(
    id: string,
    label: string,
    nodes: number[],
    netIds: string[],
    saturationCurrent = 1e-14,
    emissionCoefficient = 1,
  ) {
    super(id, label, nodes, netIds, true);
    this.saturationCurrent = saturationCurrent;
    this.emissionCoefficient = emissionCoefficient;
    this.thermalVoltage = 0.025852;
  }

  stampDynamic(matrix: MNAMatrix) {
    const limitedVoltage = Math.max(-1, Math.min(0.8, this.previousVoltage));
    const exponent = Math.exp(limitedVoltage / (this.emissionCoefficient * this.thermalVoltage));
    this.linearConductance = Math.max(
      1e-12,
      (this.saturationCurrent / (this.emissionCoefficient * this.thermalVoltage)) * exponent,
    );
    this.linearCurrent = (this.saturationCurrent * (exponent - 1)) - (this.linearConductance * limitedVoltage);
    matrix.stampConductance(this.nodes[0], this.nodes[1], this.linearConductance);
    matrix.stampCurrentSource(this.nodes[0], this.nodes[1], this.linearCurrent);
  }

  updateFromSolution(solution: Float64Array) {
    super.updateFromSolution(solution);
    const voltage = this.nodeVoltages[0] - this.nodeVoltages[1];
    const limitedVoltage = Math.max(-1, Math.min(0.8, voltage));
    const exponent = Math.exp(limitedVoltage / (this.emissionCoefficient * this.thermalVoltage));
    this.current = this.saturationCurrent * (exponent - 1);
    this.power = voltage * this.current;
    this.previousVoltage = limitedVoltage;
  }

  isConverged(solution: Float64Array, tolerance: number) {
    const nextVoltage = this.voltageAt(solution, this.nodes[0]) - this.voltageAt(solution, this.nodes[1]);
    return Math.abs(nextVoltage - this.previousVoltage) <= tolerance;
  }
}
