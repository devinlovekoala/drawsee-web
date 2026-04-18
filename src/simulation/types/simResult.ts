export interface Point {
  x: number;
  y: number;
}

export interface ScopeSample {
  time: number;
  value: number;
}

export interface ScopeTraceResult {
  key: string;
  label: string;
  color: string;
  samples: ScopeSample[];
}

export interface ScopePanelResult {
  elementId: string;
  label: string;
  traces: ScopeTraceResult[];
  position: Point;
  width: number;
  height: number;
}

export interface ElementSimResult {
  elementId: string;
  label: string;
  voltage: number;
  current: number;
  power: number;
  nodeVoltages: number[];
  isActive: boolean;
}

export interface EdgeSimResult {
  edgeId: string;
  avgVoltage: number;
  sourceVoltage: number;
  targetVoltage: number;
  current: number;
  points: Point[];
}

export interface SimFrameResult {
  time: number;
  converged: boolean;
  lastError: string | null;
  nodeVoltages: Record<string, number>;
  elementResults: Record<string, ElementSimResult>;
  edgeResults: EdgeSimResult[];
  scopePanels: ScopePanelResult[];
  maxVoltage: number;
  maxCurrent: number;
  fpsHint: number;
}
