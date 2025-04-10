// 电路分析相关类型定义

export interface Position {
  x: number;
  y: number;
}

export interface PortPosition {
  side: string;
  x: number;
  y: number;
  align: string;
}

export interface Port {
  id: string;
  name: string;
  type: string;
  position: PortPosition;
}

export interface PortReference {
  elementId: string;
  portId: string;
}

export interface CircuitElement {
  id: string;
  type: string;
  position: Position;
  rotation: number;
  properties: Record<string, any>;
  ports: Port[];
}

export interface CircuitConnection {
  id: string;
  source: PortReference;
  target: PortReference;
}

export interface CircuitMetadata {
  title: string;
  description: string;
  createdAt: string;
  updatedAt: string;
}

export interface CircuitDesign {
  elements: CircuitElement[];
  connections: CircuitConnection[];
  metadata: CircuitMetadata;
}

export interface CircuitAnalysisDTO {
  circuitDesign: CircuitDesign;
}

export interface SpiceNetlistResponse {
  netlist: string;
}

export interface CircuitAnalysisResult {
  voltages: Record<string, number>;
  currents: Record<string, number>;
  powerConsumption: Record<string, number>;
  frequencyResponse?: FrequencyResponse;
  transientResponse?: TransientResponse;
  warnings?: string[];
  errors?: string[];
}

export interface FrequencyResponse {
  frequencies: number[];
  magnitudes: number[];
  phases: number[];
}

export interface TransientResponse {
  timePoints: number[];
  voltages: Record<string, number[]>;
  currents: Record<string, number[]>;
}

// 标准电路元件类型
export enum CircuitElementType {
  RESISTOR = 'resistor',
  CAPACITOR = 'capacitor',
  INDUCTOR = 'inductor',
  VOLTAGE_SOURCE = 'voltageSource',
  CURRENT_SOURCE = 'currentSource',
  DIODE = 'diode',
  TRANSISTOR_NPN = 'transistorNPN',
  TRANSISTOR_PNP = 'transistorPNP',
  OPAMP = 'opamp',
  GROUND = 'ground',
  WIRE = 'wire',
  JUNCTION = 'junction'
}