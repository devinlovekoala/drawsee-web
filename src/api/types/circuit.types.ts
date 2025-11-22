// 电路分析相关类型定义

// 标准电路元件类型
export enum CircuitElementType {
  RESISTOR = 'resistor',
  CAPACITOR = 'capacitor',
  INDUCTOR = 'inductor',
  VOLTAGE_SOURCE = 'dc_source',
  CURRENT_SOURCE = 'ac_source',
  DIODE = 'diode',
  TRANSISTOR_NPN = 'bjt',
  TRANSISTOR_PNP = 'bjt_pnp',
  OPAMP = 'opamp',
  GROUND = 'ground',
  WIRE = 'wire',
  JUNCTION = 'junction',
  AMMETER = 'ammeter',
  VOLTMETER = 'voltmeter',
  OSCILLOSCOPE = 'oscilloscope',
  DIGITAL_INPUT = 'digital_input',
  DIGITAL_OUTPUT = 'digital_output',
  DIGITAL_CLOCK = 'digital_clock',
  DIGITAL_AND = 'digital_and',
  DIGITAL_OR = 'digital_or',
  DIGITAL_NOT = 'digital_not',
  DIGITAL_NAND = 'digital_nand',
  DIGITAL_NOR = 'digital_nor',
  DIGITAL_XOR = 'digital_xor',
  DIGITAL_XNOR = 'digital_xnor',
  DIGITAL_DFF = 'digital_dff'
}

// 基础坐标类型
export type Vector2D = { x: number; y: number };

// 元件端口定义
export type PortType = 'input' | 'output' | 'bidirectional';

// 端口位置定义
export interface PortPosition {
  side: 'left' | 'right' | 'top' | 'bottom';
  x: number;  // 相对于元件边界的百分比位置 (0-100)
  y: number;  // 相对于元件边界的百分比位置 (0-100)
  offset?: number; // 可选的偏移量，用于微调位置
  align?: 'start' | 'center' | 'end'; // 可选的对齐方式
}

// 端口定义
export interface Port {
  id: string;
  name: string;
  type: PortType;
  position: PortPosition;
}

// CircuitPort 类型别名（等同于 Port 接口）
export type CircuitPort = Port;

// 电路元件定义
export interface CircuitElement {
  id: string;
  type: CircuitElementType;
  position: Vector2D;
  rotation: number;
  label?: string;
  value?: string;
  ports: Port[];
  properties: Record<string, unknown>;
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
  path?: Vector2D[];
}

// 电路设计定义
export interface CircuitDesign {
  id?: string;
  elements: CircuitElement[];
  connections: CircuitConnection[];
  metadata: {
    title: string;
    description: string;
    createdAt: string;
    updatedAt: string;
  };
}

// 可视化配置
export interface ComponentVisualConfig {
  width: number;
  height: number;
}

// 电路元件类型映射
export const ComponentVisualConfig: Record<CircuitElementType, ComponentVisualConfig> = {
  [CircuitElementType.GROUND]: {
    width: 40,
    height: 40
  },
  [CircuitElementType.RESISTOR]: {
    width: 60,
    height: 20
  },
  [CircuitElementType.CAPACITOR]: {
    width: 40,
    height: 40
  },
  [CircuitElementType.INDUCTOR]: {
    width: 40,
    height: 40
  },
  [CircuitElementType.DIODE]: {
    width: 40,
    height: 40
  },
  [CircuitElementType.TRANSISTOR_NPN]: {
    width: 60,
    height: 60
  },
  [CircuitElementType.TRANSISTOR_PNP]: {
    width: 60,
    height: 60
  },
  [CircuitElementType.OPAMP]: {
    width: 60,
    height: 40
  },
  [CircuitElementType.VOLTAGE_SOURCE]: {
    width: 40,
    height: 40
  },
  [CircuitElementType.CURRENT_SOURCE]: {
    width: 40,
    height: 40
  },
  [CircuitElementType.WIRE]: {
    width: 40,
    height: 40
  },
  [CircuitElementType.JUNCTION]: {
    width: 40,
    height: 40
  },
  [CircuitElementType.AMMETER]: {
    width: 50,
    height: 50
  },
  [CircuitElementType.VOLTMETER]: {
    width: 50,
    height: 50
  },
  [CircuitElementType.OSCILLOSCOPE]: {
    width: 60,
    height: 45
  },
  [CircuitElementType.DIGITAL_INPUT]: {
    width: 48,
    height: 32
  },
  [CircuitElementType.DIGITAL_OUTPUT]: {
    width: 48,
    height: 32
  },
  [CircuitElementType.DIGITAL_CLOCK]: {
    width: 48,
    height: 32
  },
  [CircuitElementType.DIGITAL_AND]: {
    width: 60,
    height: 40
  },
  [CircuitElementType.DIGITAL_OR]: {
    width: 60,
    height: 40
  },
  [CircuitElementType.DIGITAL_NOT]: {
    width: 60,
    height: 40
  },
  [CircuitElementType.DIGITAL_NAND]: {
    width: 60,
    height: 40
  },
  [CircuitElementType.DIGITAL_NOR]: {
    width: 60,
    height: 40
  },
  [CircuitElementType.DIGITAL_XOR]: {
    width: 60,
    height: 40
  },
  [CircuitElementType.DIGITAL_XNOR]: {
    width: 60,
    height: 40
  },
  [CircuitElementType.DIGITAL_DFF]: {
    width: 60,
    height: 40
  }
};

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
