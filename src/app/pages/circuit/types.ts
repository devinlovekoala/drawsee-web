import { CircuitElementType } from '@/api/types/circuit.types';
import { XYPosition } from 'reactflow';

export interface CircuitElement {
  id: string;
  type: CircuitElementType;
  label?: string;
  value?: string;
  position?: XYPosition;
  rotation?: number;
  properties?: Record<string, any>;
}

export interface Port {
  id: string;
  type: 'input' | 'output';
  position: 'top' | 'bottom' | 'left' | 'right';
  label?: string;
  style?: React.CSSProperties;
}

export interface CircuitNodeData {
  id: string;
  label?: string;
  value?: string;
  description?: string;
  element?: CircuitElement;
  ports?: Port[];
  position?: XYPosition;
  rotation?: number;
  onNodeDoubleClick?: (id: string) => void;
}

export interface ConnectionData {
  id: string;
  source: string;
  sourceHandle: string;
  target: string;
  targetHandle: string;
  style?: React.CSSProperties;
  label?: string;
  animated?: boolean;
}

export interface CircuitDesign {
  id: string;
  name: string;
  description?: string;
  nodes: CircuitNodeData[];
  edges: ConnectionData[];
  version: string;
}

export enum ModelType {
  CIRCUIT = 'circuit',
  SIMULATION = 'simulation',
  ANALYSIS = 'analysis'
} 