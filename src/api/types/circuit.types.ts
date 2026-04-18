// 电路分析相关类型定义

// 标准电路元件类型
export enum CircuitElementType {
  RESISTOR = 'resistor',
  CAPACITOR = 'capacitor',
  INDUCTOR = 'inductor',
  VOLTAGE_SOURCE = 'dc_source',
  CURRENT_SOURCE = 'current_source',
  AC_SOURCE = 'ac_source',
  PULSE_SOURCE = 'pulse_source',
  PWM_SOURCE = 'pwm_source',
  SINE_SOURCE = 'sine_source',
  DIODE = 'diode',
  DIODE_ZENER = 'diode_zener',
  DIODE_LED = 'diode_led',
  DIODE_SCHOTTKY = 'diode_schottky',
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
  DIGITAL_AND3 = 'digital_and3',
  DIGITAL_AND4 = 'digital_and4',
  DIGITAL_OR = 'digital_or',
  DIGITAL_OR3 = 'digital_or3',
  DIGITAL_OR4 = 'digital_or4',
  DIGITAL_NOT = 'digital_not',
  DIGITAL_BUF = 'digital_buf',
  DIGITAL_TRI = 'digital_tri',
  DIGITAL_SCHMITT_NOT = 'digital_schmitt_not',
  DIGITAL_NAND = 'digital_nand',
  DIGITAL_NAND3 = 'digital_nand3',
  DIGITAL_NAND4 = 'digital_nand4',
  DIGITAL_NOR = 'digital_nor',
  DIGITAL_NOR3 = 'digital_nor3',
  DIGITAL_NOR4 = 'digital_nor4',
  DIGITAL_XOR = 'digital_xor',
  DIGITAL_XNOR = 'digital_xnor',
  DIGITAL_DFF = 'digital_dff',
  DIGITAL_JKFF = 'digital_jkff',
  DIGITAL_TFF = 'digital_tff',
  DIGITAL_SRFF = 'digital_srff'
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
  [CircuitElementType.AC_SOURCE]: {
    width: 40,
    height: 40
  },
  [CircuitElementType.PULSE_SOURCE]: {
    width: 40,
    height: 40
  },
  [CircuitElementType.PWM_SOURCE]: {
    width: 40,
    height: 40
  },
  [CircuitElementType.SINE_SOURCE]: {
    width: 40,
    height: 40
  },
  [CircuitElementType.DIODE_ZENER]: {
    width: 40,
    height: 40
  },
  [CircuitElementType.DIODE_LED]: {
    width: 40,
    height: 40
  },
  [CircuitElementType.DIODE_SCHOTTKY]: {
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
  [CircuitElementType.DIGITAL_AND3]: {
    width: 60,
    height: 44
  },
  [CircuitElementType.DIGITAL_AND4]: {
    width: 60,
    height: 48
  },
  [CircuitElementType.DIGITAL_OR]: {
    width: 60,
    height: 40
  },
  [CircuitElementType.DIGITAL_OR3]: {
    width: 60,
    height: 44
  },
  [CircuitElementType.DIGITAL_OR4]: {
    width: 60,
    height: 48
  },
  [CircuitElementType.DIGITAL_NOT]: {
    width: 60,
    height: 40
  },
  [CircuitElementType.DIGITAL_BUF]: {
    width: 60,
    height: 40
  },
  [CircuitElementType.DIGITAL_TRI]: {
    width: 60,
    height: 42
  },
  [CircuitElementType.DIGITAL_SCHMITT_NOT]: {
    width: 60,
    height: 40
  },
  [CircuitElementType.DIGITAL_NAND]: {
    width: 60,
    height: 40
  },
  [CircuitElementType.DIGITAL_NAND3]: {
    width: 60,
    height: 44
  },
  [CircuitElementType.DIGITAL_NAND4]: {
    width: 60,
    height: 48
  },
  [CircuitElementType.DIGITAL_NOR]: {
    width: 60,
    height: 40
  },
  [CircuitElementType.DIGITAL_NOR3]: {
    width: 60,
    height: 44
  },
  [CircuitElementType.DIGITAL_NOR4]: {
    width: 60,
    height: 48
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
  },
  [CircuitElementType.DIGITAL_JKFF]: {
    width: 64,
    height: 44
  },
  [CircuitElementType.DIGITAL_TFF]: {
    width: 64,
    height: 44
  },
  [CircuitElementType.DIGITAL_SRFF]: {
    width: 64,
    height: 44
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
