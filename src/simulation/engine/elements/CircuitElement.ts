import { MNAMatrix } from '../MNAMatrix';

export interface ElementBuildContext {
  timeStep: number;
  allocateBranch: () => number;
}

export interface ElementComputationContext {
  time: number;
  timeStep: number;
  solution: Float64Array;
}

export abstract class CircuitElementBase {
  readonly id: string;
  readonly label: string;
  readonly nodes: number[];
  readonly netIds: string[];
  readonly hasNonlinearBehavior: boolean;
  nodeVoltages: number[] = [];
  current = 0;
  power = 0;

  protected constructor(
    id: string,
    label: string,
    nodes: number[],
    netIds: string[],
    hasNonlinearBehavior = false,
  ) {
    this.id = id;
    this.label = label;
    this.nodes = nodes;
    this.netIds = netIds;
    this.hasNonlinearBehavior = hasNonlinearBehavior;
  }

  initialize(_context: ElementBuildContext) {
    return;
  }

  stampStatic(_matrix: MNAMatrix) {
    return;
  }

  stampDynamic(_matrix: MNAMatrix, _context: ElementComputationContext) {
    return;
  }

  beginStep(_context: ElementComputationContext) {
    return;
  }

  updateFromSolution(solution: Float64Array) {
    this.nodeVoltages = this.nodes.map((node) => (node >= 0 ? solution[node] : 0));
  }

  isConverged(_solution: Float64Array, _tolerance: number) {
    return true;
  }

  protected voltageAt(solution: Float64Array, nodeIndex: number) {
    return nodeIndex >= 0 ? solution[nodeIndex] : 0;
  }
}
