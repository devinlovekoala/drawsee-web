// 电路分析相关类型定义

export interface Position {
  x: number;
  y: number;
}

// 电路端口定义
export interface CircuitPort {
  id: string;
  name: string;
  type: string;
  position: {
    side: string;
    x: number;
    y: number;
    align: string;
  };
}

// 电路元件定义
export interface CircuitElement {
  id: string;
  type: CircuitElementType;
  label: string;
  value: string;
  position: Position;
  rotation: number;
  properties: Record<string, string>;
  ports: CircuitPort[];
}

// 电路连接定义
export interface CircuitConnection {
  id: string;
  source: {
    elementId: string;
    portId: string;
  };
  target: {
    elementId: string;
    portId: string;
  };
}

// 电路设计定义
export interface CircuitDesign {
  elements: CircuitElement[];
  connections: CircuitConnection[];
  metadata: {
    title: string;
    description: string;
    createdAt: string;
    updatedAt: string;
  };
}

// SPICE网表响应
export interface SpiceNetlistResponse {
  netlist: string;
  nodes: string[];
  components: string[];
}

// 频率响应数据
export interface FrequencyResponseData {
  frequencies: number[];  // 频率数据点
  magnitudes: number[];   // 幅值数据点
  phases: number[];       // 相位数据点
}

// 暂态响应数据
export interface TransientResponseData {
  times: number[];        // 时间数据点
  voltages: number[][];   // 电压数据点（多个节点）
  currents: number[][];   // 电流数据点（多个分支）
}

// 电路分析结果
export interface CircuitAnalysisResult {
  // 直流分析结果
  voltages: Record<string, number>;       // 节点电压
  currents: Record<string, number>;       // 分支电流
  powerConsumption: Record<string, number>; // 功耗
  
  // 交流分析结果
  frequencyResponse?: FrequencyResponseData;
  
  // 暂态分析结果
  transientResponse?: TransientResponseData;
  
  // 附加信息
  statistics?: {
    nodes: number;            // 节点数
    components: number;       // 元件数
    equations: number;        // 方程数
    solveTime: number;        // 求解时间（毫秒）
  };
  
  // 警告和错误
  warnings?: string[];
  errors?: string[];
}

// 用于API请求的DTO
export interface CircuitAnalysisDTO {
  circuitDesign: CircuitDesign;
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