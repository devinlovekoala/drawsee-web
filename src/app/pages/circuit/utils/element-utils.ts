import { CircuitElementType } from '@/api/types/circuit.types';

// 添加更多元件类型的常量，这些在原有枚举中不存在
const EXTENDED_ELEMENT_TYPES = {
  BATTERY: 'battery',
  SWITCH: 'switch',
  LED: 'led',
  MOTOR: 'motor',
  SPEAKER: 'speaker',
  MICROPHONE: 'microphone',
  IC: 'ic',
  FUSE: 'fuse',
  TRANSFORMER: 'transformer',
  RELAY: 'relay',
  METER: 'meter',
  POTENTIOMETER: 'potentiometer',
  OPERATIONAL_AMPLIFIER: 'operational_amplifier',
  CONNECTOR: 'connector'
} as const;

// 获取元件类型对应的单位
export function getElementUnit(type?: CircuitElementType | string): string {
  if (!type) return '';
  
  switch (type) {
    case CircuitElementType.RESISTOR:
      return 'Ω';
    case CircuitElementType.CAPACITOR:
      return 'F';
    case CircuitElementType.INDUCTOR:
      return 'H';
    case CircuitElementType.VOLTAGE_SOURCE:
      return 'V';
    case CircuitElementType.CURRENT_SOURCE:
      return 'A';
    case CircuitElementType.DIODE:
      return '';
    case CircuitElementType.TRANSISTOR_NPN:
    case CircuitElementType.TRANSISTOR_PNP:
      return '';
    case CircuitElementType.GROUND:
      return '';
    case EXTENDED_ELEMENT_TYPES.BATTERY:
      return 'V';
    case EXTENDED_ELEMENT_TYPES.SWITCH:
      return '';
    case EXTENDED_ELEMENT_TYPES.LED:
      return '';
    case EXTENDED_ELEMENT_TYPES.MOTOR:
      return '';
    case EXTENDED_ELEMENT_TYPES.SPEAKER:
      return '';
    case EXTENDED_ELEMENT_TYPES.MICROPHONE:
      return '';
    case EXTENDED_ELEMENT_TYPES.IC:
      return '';
    case EXTENDED_ELEMENT_TYPES.FUSE:
      return 'A';
    case EXTENDED_ELEMENT_TYPES.TRANSFORMER:
      return '';
    case EXTENDED_ELEMENT_TYPES.RELAY:
      return '';
    case EXTENDED_ELEMENT_TYPES.METER:
      return '';
    case EXTENDED_ELEMENT_TYPES.POTENTIOMETER:
      return 'Ω';
    case CircuitElementType.OPAMP:
    case EXTENDED_ELEMENT_TYPES.OPERATIONAL_AMPLIFIER:
      return '';
    case EXTENDED_ELEMENT_TYPES.CONNECTOR:
      return '';
    default:
      return '';
  }
}

// 获取元件类型的友好名称
export function getElementTypeName(type?: CircuitElementType | string): string {
  if (!type) return '元件';
  
  switch (type) {
    case CircuitElementType.RESISTOR:
      return '电阻';
    case CircuitElementType.CAPACITOR:
      return '电容';
    case CircuitElementType.INDUCTOR:
      return '电感';
    case CircuitElementType.VOLTAGE_SOURCE:
      return '电压源';
    case CircuitElementType.CURRENT_SOURCE:
      return '电流源';
    case CircuitElementType.DIODE:
      return '二极管';
    case CircuitElementType.TRANSISTOR_NPN:
      return 'NPN三极管';
    case CircuitElementType.TRANSISTOR_PNP:
      return 'PNP三极管';
    case CircuitElementType.GROUND:
      return '接地';
    case EXTENDED_ELEMENT_TYPES.BATTERY:
      return '电池';
    case EXTENDED_ELEMENT_TYPES.SWITCH:
      return '开关';
    case EXTENDED_ELEMENT_TYPES.LED:
      return 'LED灯';
    case EXTENDED_ELEMENT_TYPES.MOTOR:
      return '电机';
    case EXTENDED_ELEMENT_TYPES.SPEAKER:
      return '扬声器';
    case EXTENDED_ELEMENT_TYPES.MICROPHONE:
      return '麦克风';
    case EXTENDED_ELEMENT_TYPES.IC:
      return '集成电路';
    case EXTENDED_ELEMENT_TYPES.FUSE:
      return '保险丝';
    case EXTENDED_ELEMENT_TYPES.TRANSFORMER:
      return '变压器';
    case EXTENDED_ELEMENT_TYPES.RELAY:
      return '继电器';
    case EXTENDED_ELEMENT_TYPES.METER:
      return '测量表';
    case EXTENDED_ELEMENT_TYPES.POTENTIOMETER:
      return '电位器';
    case CircuitElementType.OPAMP:
    case EXTENDED_ELEMENT_TYPES.OPERATIONAL_AMPLIFIER:
      return '运算放大器';
    case EXTENDED_ELEMENT_TYPES.CONNECTOR:
      return '连接器';
    case CircuitElementType.DIGITAL_INPUT:
      return '数字输入';
    case CircuitElementType.DIGITAL_OUTPUT:
      return '数字输出';
    case CircuitElementType.DIGITAL_CLOCK:
      return '时钟源';
    case CircuitElementType.DIGITAL_AND:
      return '与门 (AND)';
    case CircuitElementType.DIGITAL_OR:
      return '或门 (OR)';
    case CircuitElementType.DIGITAL_NOT:
      return '非门 (NOT)';
    case CircuitElementType.DIGITAL_NAND:
      return '与非门 (NAND)';
    case CircuitElementType.DIGITAL_NOR:
      return '或非门 (NOR)';
    case CircuitElementType.DIGITAL_XOR:
      return '异或门 (XOR)';
    case CircuitElementType.DIGITAL_XNOR:
      return '同或门 (XNOR)';
    case CircuitElementType.DIGITAL_DFF:
      return 'D 触发器';
    case CircuitElementType.WIRE:
      return '导线';
    case CircuitElementType.JUNCTION:
      return '接点';
    default:
      return '未知元件';
  }
}

// 解析带单位的值，返回数值和单位部分
export function parseValueWithUnit(value: string): { value: number, unit: string } {
  if (!value) return { value: 0, unit: '' };
  
  // 正则表达式匹配数字和单位
  const match = value.match(/^([\d.]+)([a-zA-Z\u2126Ω]+)?$/);
  if (!match) return { value: 0, unit: '' };
  
  return {
    value: parseFloat(match[1]),
    unit: match[2] || ''
  };
}

// 格式化带单位的值
export function formatValueWithUnit(value: number, unit: string): string {
  return `${value}${unit}`;
}

// 获取元件默认值
export function getDefaultElementValue(type: CircuitElementType | string): string {
  switch (type) {
    case CircuitElementType.RESISTOR:
      return '1kΩ';
    case CircuitElementType.CAPACITOR:
      return '10μF';
    case CircuitElementType.INDUCTOR:
      return '1mH';
    case CircuitElementType.VOLTAGE_SOURCE:
      return '5V';
    case CircuitElementType.CURRENT_SOURCE:
      return '1A';
    case EXTENDED_ELEMENT_TYPES.BATTERY:
      return '9V';
    case EXTENDED_ELEMENT_TYPES.POTENTIOMETER:
      return '10kΩ';
    case EXTENDED_ELEMENT_TYPES.FUSE:
      return '1A';
    default:
      return '';
  }
}

// 获取元件的默认端口配置
export function getDefaultPorts(type: CircuitElementType | string): { inputs: string[], outputs: string[] } {
  switch (type) {
    case CircuitElementType.RESISTOR:
    case CircuitElementType.CAPACITOR:
    case CircuitElementType.INDUCTOR:
    case EXTENDED_ELEMENT_TYPES.SWITCH:
    case EXTENDED_ELEMENT_TYPES.FUSE:
      return {
        inputs: ['in'],
        outputs: ['out']
      };
    case CircuitElementType.DIODE:
    case EXTENDED_ELEMENT_TYPES.LED:
      return {
        inputs: ['anode'],
        outputs: ['cathode']
      };
    case CircuitElementType.VOLTAGE_SOURCE:
    case CircuitElementType.CURRENT_SOURCE:
    case EXTENDED_ELEMENT_TYPES.BATTERY:
      return {
        inputs: ['negative'],
        outputs: ['positive']
      };
    case CircuitElementType.TRANSISTOR_NPN:
    case CircuitElementType.TRANSISTOR_PNP:
      return {
        inputs: ['base', 'collector'],
        outputs: ['emitter']
      };
    case CircuitElementType.GROUND:
      return {
        inputs: ['ground'],
        outputs: []
      };
    case CircuitElementType.OPAMP:
    case EXTENDED_ELEMENT_TYPES.OPERATIONAL_AMPLIFIER:
      return {
        inputs: ['in+', 'in-'],
        outputs: ['out']
      };
    default:
      return {
        inputs: ['in'],
        outputs: ['out']
      };
  }
} 
