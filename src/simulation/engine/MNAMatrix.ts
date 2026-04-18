export class MNAMatrix {
  readonly size: number;
  readonly data: Float64Array;
  readonly rhs: Float64Array;

  constructor(size: number) {
    this.size = size;
    this.data = new Float64Array(size * size);
    this.rhs = new Float64Array(size);
  }

  cloneData() {
    return new Float64Array(this.data);
  }

  cloneRHS() {
    return new Float64Array(this.rhs);
  }

  clearAll() {
    this.data.fill(0);
    this.rhs.fill(0);
  }

  clearRHS() {
    this.rhs.fill(0);
  }

  stamp(row: number, col: number, value: number) {
    if (row < 0 || col < 0) return;
    this.data[row * this.size + col] += value;
  }

  stampRHS(row: number, value: number) {
    if (row < 0) return;
    this.rhs[row] += value;
  }

  stampConductance(a: number, b: number, conductance: number) {
    if (!Number.isFinite(conductance) || conductance === 0) return;
    this.stamp(a, a, conductance);
    this.stamp(b, b, conductance);
    this.stamp(a, b, -conductance);
    this.stamp(b, a, -conductance);
  }

  stampCurrentSource(a: number, b: number, current: number) {
    if (!Number.isFinite(current) || current === 0) return;
    this.stampRHS(a, -current);
    this.stampRHS(b, current);
  }

  stampVoltageSource(a: number, b: number, branchIndex: number) {
    this.stamp(branchIndex, a, 1);
    this.stamp(branchIndex, b, -1);
    this.stamp(a, branchIndex, 1);
    this.stamp(b, branchIndex, -1);
  }
}
