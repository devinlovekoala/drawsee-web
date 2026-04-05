import { CircuitElementBase } from './CircuitElement';
import { MNAMatrix } from '../MNAMatrix';

const THERMAL_VOLTAGE = 0.025852;

type LinearizedJunction = {
  conductance: number;
  currentSource: number;
};

export class TransistorElement extends CircuitElementBase {
  private readonly beta: number;
  private readonly saturationCurrent: number;
  private readonly pnp: boolean;
  private previousVbe = 0;
  private previousVbc = 0;

  constructor(
    id: string,
    label: string,
    nodes: number[],
    netIds: string[],
    beta: number,
    saturationCurrent: number,
    pnp: boolean,
  ) {
    super(id, label, nodes, netIds, true);
    this.beta = Math.max(beta, 1);
    this.saturationCurrent = saturationCurrent;
    this.pnp = pnp;
  }

  private linearize(voltage: number): LinearizedJunction {
    const limited = Math.max(-1, Math.min(0.8, voltage));
    const exponent = Math.exp(limited / THERMAL_VOLTAGE);
    const conductance = Math.max(1e-12, (this.saturationCurrent / THERMAL_VOLTAGE) * exponent);
    const currentSource = (this.saturationCurrent * (exponent - 1)) - (conductance * limited);
    return { conductance, currentSource };
  }

  stampDynamic(matrix: MNAMatrix) {
    const [base, collector, emitter] = this.nodes;
    const be = this.linearize(this.previousVbe);
    const bc = this.linearize(this.previousVbc);

    if (!this.pnp) {
      matrix.stampConductance(base, emitter, be.conductance);
      matrix.stampCurrentSource(base, emitter, be.currentSource);
      matrix.stampConductance(base, collector, bc.conductance);
      matrix.stampCurrentSource(base, collector, bc.currentSource);
      const collectorCurrent = Math.max(0, this.beta * (be.conductance * this.previousVbe + be.currentSource));
      matrix.stampCurrentSource(collector, emitter, collectorCurrent);
    } else {
      matrix.stampConductance(emitter, base, be.conductance);
      matrix.stampCurrentSource(emitter, base, be.currentSource);
      matrix.stampConductance(collector, base, bc.conductance);
      matrix.stampCurrentSource(collector, base, bc.currentSource);
      const collectorCurrent = Math.max(0, this.beta * (be.conductance * this.previousVbe + be.currentSource));
      matrix.stampCurrentSource(emitter, collector, collectorCurrent);
    }

    matrix.stampConductance(collector, emitter, 1e-6);
  }

  updateFromSolution(solution: Float64Array) {
    super.updateFromSolution(solution);
    const vb = this.nodeVoltages[0] ?? 0;
    const vc = this.nodeVoltages[1] ?? 0;
    const ve = this.nodeVoltages[2] ?? 0;
    this.previousVbe = this.pnp ? (ve - vb) : (vb - ve);
    this.previousVbc = this.pnp ? (vc - vb) : (vb - vc);
    const beCurrent = this.saturationCurrent * (Math.exp(Math.max(-1, Math.min(0.8, this.previousVbe)) / THERMAL_VOLTAGE) - 1);
    const collectorCurrent = Math.max(0, this.beta * beCurrent);
    this.current = this.pnp ? -collectorCurrent : collectorCurrent;
    this.power = (vc - ve) * this.current;
  }

  isConverged(solution: Float64Array, tolerance: number) {
    const vb = this.voltageAt(solution, this.nodes[0]);
    const vc = this.voltageAt(solution, this.nodes[1]);
    const ve = this.voltageAt(solution, this.nodes[2]);
    const nextVbe = this.pnp ? (ve - vb) : (vb - ve);
    const nextVbc = this.pnp ? (vc - vb) : (vb - vc);
    return Math.abs(nextVbe - this.previousVbe) <= tolerance && Math.abs(nextVbc - this.previousVbc) <= tolerance;
  }
}
