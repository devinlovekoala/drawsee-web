declare module 'd3-flextree' {
  export interface FlextreeOptions {
    nodeSize?: (node: any) => [number, number];
    spacing?: number;
    children?: (node: any) => any[];
  }

  export interface FlextreeNode {
    x: number;
    y: number;
    data: any;
    children?: FlextreeNode[];
  }

  export interface FlextreeLayout {
    (root: any): any;
    nodeSize(): [number, number];
    nodeSize(size: [number, number]): FlextreeLayout;
    spacing(): number;
    spacing(spacing: number): FlextreeLayout;
    children(): (node: any) => any[];
    children(children: (node: any) => any[]): FlextreeLayout;
    hierarchy(data: any): FlextreeNode;
  }

  export function flextree(options?: FlextreeOptions): FlextreeLayout;
} 