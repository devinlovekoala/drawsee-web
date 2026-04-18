export class LUSolver {
  private lu = new Float64Array(0);
  private perm = new Int32Array(0);
  private size = 0;

  factor(matrix: Float64Array, size: number) {
    this.size = size;
    this.lu = new Float64Array(matrix);
    this.perm = new Int32Array(size);
    for (let i = 0; i < size; i += 1) {
      this.perm[i] = i;
    }

    for (let col = 0; col < size; col += 1) {
      let pivotRow = col;
      let pivotValue = Math.abs(this.lu[col * size + col]);
      for (let row = col + 1; row < size; row += 1) {
        const candidate = Math.abs(this.lu[row * size + col]);
        if (candidate > pivotValue) {
          pivotValue = candidate;
          pivotRow = row;
        }
      }
      if (pivotValue < 1e-18) {
        return false;
      }
      if (pivotRow !== col) {
        for (let k = 0; k < size; k += 1) {
          const indexA = col * size + k;
          const indexB = pivotRow * size + k;
          const temp = this.lu[indexA];
          this.lu[indexA] = this.lu[indexB];
          this.lu[indexB] = temp;
        }
        const permTemp = this.perm[col];
        this.perm[col] = this.perm[pivotRow];
        this.perm[pivotRow] = permTemp;
      }
      const pivot = this.lu[col * size + col];
      for (let row = col + 1; row < size; row += 1) {
        const factor = this.lu[row * size + col] / pivot;
        this.lu[row * size + col] = factor;
        for (let k = col + 1; k < size; k += 1) {
          this.lu[row * size + k] -= factor * this.lu[col * size + k];
        }
      }
    }
    return true;
  }

  solve(rhs: Float64Array) {
    const result = new Float64Array(this.size);
    for (let i = 0; i < this.size; i += 1) {
      result[i] = rhs[this.perm[i]];
    }
    for (let row = 0; row < this.size; row += 1) {
      for (let col = 0; col < row; col += 1) {
        result[row] -= this.lu[row * this.size + col] * result[col];
      }
    }
    for (let row = this.size - 1; row >= 0; row -= 1) {
      for (let col = row + 1; col < this.size; col += 1) {
        result[row] -= this.lu[row * this.size + col] * result[col];
      }
      result[row] /= this.lu[row * this.size + row];
    }
    return result;
  }
}
