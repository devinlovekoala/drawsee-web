'use client';

import React, { useCallback, useState, useRef, useEffect, useMemo } from 'react';
import ReactFlow, {
  addEdge,
  Background,
  Controls,
  Connection,
  Edge,
  Node,
  NodeChange,
  EdgeChange,
  applyNodeChanges,
  applyEdgeChanges,
  useReactFlow,
  ReactFlowProvider,
} from 'reactflow';
import { Button, Dropdown, message, Space, Modal, Spin } from 'antd';
import 'reactflow/dist/style.css';
import { CircuitNode } from './CircuitNode';
import ConnectionEdge, { ConnectionPreview } from './ConnectionEdge';
import ComponentConfig from './ComponentConfig';
import {
  CircuitElementType,
  CircuitDesign,
  Port,
  CircuitElement
} from '@/api/types/circuit.types';
import { createAiTask } from '@/api/methods/flow.methods';
import { updateCircuitDesign } from '@/api/methods/circuit.methods';
import { recognizeCircuitDesignFromImage } from '@/api/methods/tool.methods';
import { CircuitNodeData, ModelType } from '../types';
import { useAppContext } from '@/app/contexts/AppContext';
import { CreateAiTaskDTO } from '@/api/types/flow.types';
import { useHotkeys } from 'react-hotkeys-hook';
import { ModelSelector } from '@/app/pages/blank/components/ModelSelector';
import { ModelType as FlowModelType } from '@/app/pages/flow/components/input/FlowInputPanel';
import ElementLibrary, { ElementCategory } from './ElementLibrary';
import CircuitToolbar from './CircuitToolbar';
import SaveCircuitModal from './SaveCircuitModal';
import { Line } from '@ant-design/charts';
import { simulationClient } from '../simulation/simulationClient';
import { SimulationMeasurementResult } from '../simulation/types';
import { runDigitalSimulation } from '@/app/pages/digital/simulation/digitalSimulationClient';
import { DigitalSimulationResult } from '@/app/pages/digital/simulation/types';
import {
  ExperimentOutlined,
  ThunderboltOutlined,
  ApartmentOutlined,
  SettingOutlined,
  DashboardOutlined,
  GatewayOutlined,
  ApiOutlined,
  HddOutlined
} from '@ant-design/icons';
import ImageUploader from '@/app/components/ImageUploader';

// 唯一节点ID生成
let nodeIdCounter = 1;
const getNewNodeId = () => `node-${nodeIdCounter++}`;

// 定义节点类型
const nodeTypes = {
  circuitNode: CircuitNode,
};

// 定义边类型
const edgeTypes = {
  default: ConnectionEdge,
};

// 元件命名前缀
const elementNamePrefixes: Record<CircuitElementType, string> = {
  [CircuitElementType.RESISTOR]: 'R',
  [CircuitElementType.CAPACITOR]: 'C',
  [CircuitElementType.INDUCTOR]: 'L',
  [CircuitElementType.VOLTAGE_SOURCE]: 'V',
  [CircuitElementType.CURRENT_SOURCE]: 'I',
  [CircuitElementType.DIODE]: 'D',
  [CircuitElementType.TRANSISTOR_NPN]: 'Q',
  [CircuitElementType.TRANSISTOR_PNP]: 'Q',
  [CircuitElementType.GROUND]: 'GND',
  [CircuitElementType.OPAMP]: 'U',
  [CircuitElementType.WIRE]: 'W',
  [CircuitElementType.JUNCTION]: 'N',
  [CircuitElementType.AMMETER]: 'AM',
  [CircuitElementType.VOLTMETER]: 'VM',
  [CircuitElementType.OSCILLOSCOPE]: 'OSC',
  [CircuitElementType.DIGITAL_INPUT]: 'DIN',
  [CircuitElementType.DIGITAL_OUTPUT]: 'DOUT',
  [CircuitElementType.DIGITAL_CLOCK]: 'CLK',
  [CircuitElementType.DIGITAL_AND]: 'AND',
  [CircuitElementType.DIGITAL_OR]: 'OR',
  [CircuitElementType.DIGITAL_NOT]: 'NOT',
  [CircuitElementType.DIGITAL_NAND]: 'NAND',
  [CircuitElementType.DIGITAL_NOR]: 'NOR',
  [CircuitElementType.DIGITAL_XOR]: 'XOR',
  [CircuitElementType.DIGITAL_XNOR]: 'XNOR',
  [CircuitElementType.DIGITAL_DFF]: 'DFF'
};

type CircuitWorkspaceMode = 'analog' | 'digital' | 'hybrid';

const analogElementCategories: ElementCategory[] = [
  {
    key: 'passive',
    label: '无源元件',
    icon: <ExperimentOutlined />,
    elements: [
      { type: CircuitElementType.RESISTOR, name: '电阻器 (R)', shortcut: 'R' },
      { type: CircuitElementType.CAPACITOR, name: '电容器 (C)', shortcut: 'C' },
      { type: CircuitElementType.INDUCTOR, name: '电感器 (L)', shortcut: 'L' },
      { type: CircuitElementType.GROUND, name: '接地 (GND)', shortcut: 'G' }
    ]
  },
  {
    key: 'source',
    label: '电源元件',
    icon: <ThunderboltOutlined />,
    elements: [
      { type: CircuitElementType.VOLTAGE_SOURCE, name: '电压源 (V)', shortcut: 'V' },
      { type: CircuitElementType.CURRENT_SOURCE, name: '电流源 (I)', shortcut: 'I' }
    ]
  },
  {
    key: 'semiconductor',
    label: '半导体',
    icon: <ApartmentOutlined />,
    elements: [
      { type: CircuitElementType.DIODE, name: '二极管 (D)', shortcut: 'D' },
      { type: CircuitElementType.TRANSISTOR_NPN, name: 'NPN 晶体管', shortcut: 'N' },
      { type: CircuitElementType.TRANSISTOR_PNP, name: 'PNP 晶体管', shortcut: 'P' }
    ]
  },
  {
    key: 'other',
    label: '其他',
    icon: <SettingOutlined />,
    elements: [
      { type: CircuitElementType.OPAMP, name: '运算放大器', shortcut: 'O' },
      { type: CircuitElementType.WIRE, name: '导线', shortcut: 'W' },
      { type: CircuitElementType.JUNCTION, name: '连接点', shortcut: 'J' }
    ]
  },
  {
    key: 'measurement',
    label: '测量仪表',
    icon: <DashboardOutlined />,
    elements: [
      { type: CircuitElementType.AMMETER, name: '电流表 (A)', shortcut: 'Am' },
      { type: CircuitElementType.VOLTMETER, name: '电压表 (V)', shortcut: 'Vm' },
      { type: CircuitElementType.OSCILLOSCOPE, name: '示波器 (OSC)', shortcut: 'Osc' }
    ]
  }
];

const digitalElementCategories: ElementCategory[] = [
  {
    key: 'digital-io',
    label: '数字I/O',
    icon: <ApiOutlined />,
    elements: [
      { type: CircuitElementType.DIGITAL_INPUT, name: '数字输入', shortcut: 'IN' },
      { type: CircuitElementType.DIGITAL_OUTPUT, name: '数字输出', shortcut: 'OUT' },
      { type: CircuitElementType.DIGITAL_CLOCK, name: '时钟源', shortcut: 'CLK' }
    ]
  },
  {
    key: 'digital-logic',
    label: '逻辑门',
    icon: <GatewayOutlined />,
    elements: [
      { type: CircuitElementType.DIGITAL_AND, name: '与门 (AND)', shortcut: 'AND' },
      { type: CircuitElementType.DIGITAL_OR, name: '或门 (OR)', shortcut: 'OR' },
      { type: CircuitElementType.DIGITAL_NOT, name: '非门 (NOT)', shortcut: 'NOT' },
      { type: CircuitElementType.DIGITAL_NAND, name: '与非门 (NAND)', shortcut: 'NAND' },
      { type: CircuitElementType.DIGITAL_NOR, name: '或非门 (NOR)', shortcut: 'NOR' },
      { type: CircuitElementType.DIGITAL_XOR, name: '异或门 (XOR)', shortcut: 'XOR' },
      { type: CircuitElementType.DIGITAL_XNOR, name: '同或门 (XNOR)', shortcut: 'XNOR' }
    ]
  },
  {
    key: 'digital-seq',
    label: '时序单元',
    icon: <HddOutlined />,
    elements: [
      { type: CircuitElementType.DIGITAL_DFF, name: 'D 触发器', shortcut: 'DFF' }
    ]
  }
];

type MenuItemConfig = { key: CircuitElementType; label: string };

const analogElementMenuItems: MenuItemConfig[] = [
  { key: CircuitElementType.RESISTOR, label: '电阻器 (R)' },
  { key: CircuitElementType.CAPACITOR, label: '电容器 (C)' },
  { key: CircuitElementType.INDUCTOR, label: '电感器 (L)' },
  { key: CircuitElementType.VOLTAGE_SOURCE, label: '电压源 (V)' },
  { key: CircuitElementType.CURRENT_SOURCE, label: '电流源 (I)' },
  { key: CircuitElementType.DIODE, label: '二极管 (D)' },
  { key: CircuitElementType.TRANSISTOR_NPN, label: 'NPN 晶体管' },
  { key: CircuitElementType.TRANSISTOR_PNP, label: 'PNP 晶体管' },
  { key: CircuitElementType.GROUND, label: '接地 (GND)' },
  { key: CircuitElementType.OPAMP, label: '运算放大器' },
  { key: CircuitElementType.AMMETER, label: '电流表 (A)' },
  { key: CircuitElementType.VOLTMETER, label: '电压表 (V)' },
  { key: CircuitElementType.OSCILLOSCOPE, label: '示波器 (OSC)' }
];

const digitalElementMenuItems: MenuItemConfig[] = [
  { key: CircuitElementType.DIGITAL_INPUT, label: '数字输入 (IN)' },
  { key: CircuitElementType.DIGITAL_OUTPUT, label: '数字输出 (OUT)' },
  { key: CircuitElementType.DIGITAL_CLOCK, label: '时钟源 (CLK)' },
  { key: CircuitElementType.DIGITAL_AND, label: '与门 (AND)' },
  { key: CircuitElementType.DIGITAL_OR, label: '或门 (OR)' },
  { key: CircuitElementType.DIGITAL_NOT, label: '非门 (NOT)' },
  { key: CircuitElementType.DIGITAL_NAND, label: '与非门 (NAND)' },
  { key: CircuitElementType.DIGITAL_NOR, label: '或非门 (NOR)' },
  { key: CircuitElementType.DIGITAL_XOR, label: '异或门 (XOR)' },
  { key: CircuitElementType.DIGITAL_XNOR, label: '同或门 (XNOR)' },
  { key: CircuitElementType.DIGITAL_DFF, label: 'D 触发器 (DFF)' }
];

const getElementCategories = (mode: CircuitWorkspaceMode): ElementCategory[] => {
  if (mode === 'digital') return digitalElementCategories;
  if (mode === 'hybrid') return [...digitalElementCategories, ...analogElementCategories];
  return analogElementCategories;
};

const getElementMenuItems = (mode: CircuitWorkspaceMode): MenuItemConfig[] => {
  if (mode === 'digital') return digitalElementMenuItems;
  if (mode === 'hybrid') return [...digitalElementMenuItems, ...analogElementMenuItems];
  return analogElementMenuItems;
};

// 默认端口配置
const defaultPorts = {
  [CircuitElementType.RESISTOR]: [
    { id: 'port1', name: '端口1', type: 'bidirectional' as const, position: { side: 'left' as const, x: 0, y: 50, align: 'center' as const } },
    { id: 'port2', name: '端口2', type: 'bidirectional' as const, position: { side: 'right' as const, x: 100, y: 50, align: 'center' as const } }
  ],
  [CircuitElementType.CAPACITOR]: [
    { id: 'port1', name: '端口1', type: 'bidirectional' as const, position: { side: 'left' as const, x: 0, y: 50, align: 'center' as const } },
    { id: 'port2', name: '端口2', type: 'bidirectional' as const, position: { side: 'right' as const, x: 100, y: 50, align: 'center' as const } }
  ],
  [CircuitElementType.INDUCTOR]: [
    { id: 'port1', name: '端口1', type: 'bidirectional' as const, position: { side: 'left' as const, x: 0, y: 50, align: 'center' as const } },
    { id: 'port2', name: '端口2', type: 'bidirectional' as const, position: { side: 'right' as const, x: 100, y: 50, align: 'center' as const } }
  ],
  [CircuitElementType.VOLTAGE_SOURCE]: [
    { id: 'positive', name: '正极', type: 'output' as const, position: { side: 'right' as const, x: 100, y: 50, align: 'center' as const } },
    { id: 'negative', name: '负极', type: 'input' as const, position: { side: 'left' as const, x: 0, y: 50, align: 'center' as const } }
  ],
  [CircuitElementType.CURRENT_SOURCE]: [
    { id: 'positive', name: '正极', type: 'output' as const, position: { side: 'right' as const, x: 100, y: 50, align: 'center' as const } },
    { id: 'negative', name: '负极', type: 'input' as const, position: { side: 'left' as const, x: 0, y: 50, align: 'center' as const } }
  ],
  [CircuitElementType.DIODE]: [
    { id: 'anode', name: '阳极', type: 'input' as const, position: { side: 'left' as const, x: 0, y: 50, align: 'center' as const } },
    { id: 'cathode', name: '阴极', type: 'output' as const, position: { side: 'right' as const, x: 100, y: 50, align: 'center' as const } }
  ],
  [CircuitElementType.TRANSISTOR_NPN]: [
    { id: 'base', name: '基极', type: 'input' as const, position: { side: 'left' as const, x: 0, y: 50, align: 'center' as const } },
    { id: 'collector', name: '集电极', type: 'input' as const, position: { side: 'right' as const, x: 100, y: 15, align: 'center' as const } },
    { id: 'emitter', name: '发射极', type: 'output' as const, position: { side: 'right' as const, x: 100, y: 85, align: 'center' as const } }
  ],
  [CircuitElementType.TRANSISTOR_PNP]: [
    { id: 'base', name: '基极', type: 'input' as const, position: { side: 'left' as const, x: 0, y: 50, align: 'center' as const } },
    { id: 'collector', name: '集电极', type: 'output' as const, position: { side: 'right' as const, x: 100, y: 15, align: 'center' as const } },
    { id: 'emitter', name: '发射极', type: 'input' as const, position: { side: 'right' as const, x: 100, y: 85, align: 'center' as const } }
  ],
  [CircuitElementType.GROUND]: [
    { id: 'ground', name: '接地点', type: 'input' as const, position: { side: 'top' as const, x: 50, y: 0, align: 'center' as const } }
  ],
  [CircuitElementType.OPAMP]: [
    { id: 'input1', name: '输入1', type: 'input' as const, position: { side: 'left' as const, x: 0, y: 30, align: 'center' as const } },
    { id: 'input2', name: '输入2', type: 'input' as const, position: { side: 'left' as const, x: 0, y: 70, align: 'center' as const } },
    { id: 'output', name: '输出', type: 'output' as const, position: { side: 'right' as const, x: 100, y: 50, align: 'center' as const } }
  ],
  [CircuitElementType.AMMETER]: [
    { id: 'in', name: '输入', type: 'bidirectional' as const, position: { side: 'left' as const, x: 0, y: 50, align: 'center' as const } },
    { id: 'out', name: '输出', type: 'bidirectional' as const, position: { side: 'right' as const, x: 100, y: 50, align: 'center' as const } }
  ],
  [CircuitElementType.VOLTMETER]: [
    { id: 'positive', name: '正端', type: 'bidirectional' as const, position: { side: 'left' as const, x: 0, y: 30, align: 'center' as const } },
    { id: 'negative', name: '负端', type: 'bidirectional' as const, position: { side: 'right' as const, x: 100, y: 70, align: 'center' as const } }
  ],
  [CircuitElementType.OSCILLOSCOPE]: [
    { id: 'channel1', name: '通道1', type: 'input' as const, position: { side: 'left' as const, x: 0, y: 40, align: 'center' as const } },
    { id: 'channel2', name: '通道2', type: 'input' as const, position: { side: 'left' as const, x: 0, y: 70, align: 'center' as const } },
    { id: 'ground', name: '参考地', type: 'bidirectional' as const, position: { side: 'bottom' as const, x: 50, y: 100, align: 'center' as const } }
  ],
  [CircuitElementType.DIGITAL_INPUT]: [
    { id: 'out', name: '输出', type: 'output' as const, position: { side: 'right' as const, x: 100, y: 50, align: 'center' as const } }
  ],
  [CircuitElementType.DIGITAL_OUTPUT]: [
    { id: 'in', name: '输入', type: 'input' as const, position: { side: 'left' as const, x: 0, y: 50, align: 'center' as const } }
  ],
  [CircuitElementType.DIGITAL_CLOCK]: [
    { id: 'out', name: 'CLK', type: 'output' as const, position: { side: 'right' as const, x: 100, y: 50, align: 'center' as const } }
  ],
  [CircuitElementType.DIGITAL_AND]: [
    { id: 'in1', name: '输入A', type: 'input' as const, position: { side: 'left' as const, x: 0, y: 35, align: 'center' as const } },
    { id: 'in2', name: '输入B', type: 'input' as const, position: { side: 'left' as const, x: 0, y: 65, align: 'center' as const } },
    { id: 'out', name: '输出', type: 'output' as const, position: { side: 'right' as const, x: 100, y: 50, align: 'center' as const } }
  ],
  [CircuitElementType.DIGITAL_OR]: [
    { id: 'in1', name: '输入A', type: 'input' as const, position: { side: 'left' as const, x: 0, y: 35, align: 'center' as const } },
    { id: 'in2', name: '输入B', type: 'input' as const, position: { side: 'left' as const, x: 0, y: 65, align: 'center' as const } },
    { id: 'out', name: '输出', type: 'output' as const, position: { side: 'right' as const, x: 100, y: 50, align: 'center' as const } }
  ],
  [CircuitElementType.DIGITAL_NOT]: [
    { id: 'in', name: '输入', type: 'input' as const, position: { side: 'left' as const, x: 0, y: 50, align: 'center' as const } },
    { id: 'out', name: '输出', type: 'output' as const, position: { side: 'right' as const, x: 100, y: 50, align: 'center' as const } }
  ],
  [CircuitElementType.DIGITAL_NAND]: [
    { id: 'in1', name: '输入A', type: 'input' as const, position: { side: 'left' as const, x: 0, y: 35, align: 'center' as const } },
    { id: 'in2', name: '输入B', type: 'input' as const, position: { side: 'left' as const, x: 0, y: 65, align: 'center' as const } },
    { id: 'out', name: '输出', type: 'output' as const, position: { side: 'right' as const, x: 100, y: 50, align: 'center' as const } }
  ],
  [CircuitElementType.DIGITAL_NOR]: [
    { id: 'in1', name: '输入A', type: 'input' as const, position: { side: 'left' as const, x: 0, y: 35, align: 'center' as const } },
    { id: 'in2', name: '输入B', type: 'input' as const, position: { side: 'left' as const, x: 0, y: 65, align: 'center' as const } },
    { id: 'out', name: '输出', type: 'output' as const, position: { side: 'right' as const, x: 100, y: 50, align: 'center' as const } }
  ],
  [CircuitElementType.DIGITAL_XOR]: [
    { id: 'in1', name: '输入A', type: 'input' as const, position: { side: 'left' as const, x: 0, y: 35, align: 'center' as const } },
    { id: 'in2', name: '输入B', type: 'input' as const, position: { side: 'left' as const, x: 0, y: 65, align: 'center' as const } },
    { id: 'out', name: '输出', type: 'output' as const, position: { side: 'right' as const, x: 100, y: 50, align: 'center' as const } }
  ],
  [CircuitElementType.DIGITAL_XNOR]: [
    { id: 'in1', name: '输入A', type: 'input' as const, position: { side: 'left' as const, x: 0, y: 35, align: 'center' as const } },
    { id: 'in2', name: '输入B', type: 'input' as const, position: { side: 'left' as const, x: 0, y: 65, align: 'center' as const } },
    { id: 'out', name: '输出', type: 'output' as const, position: { side: 'right' as const, x: 100, y: 50, align: 'center' as const } }
  ],
  [CircuitElementType.DIGITAL_DFF]: [
    { id: 'd', name: 'D', type: 'input' as const, position: { side: 'left' as const, x: 0, y: 40, align: 'center' as const } },
    { id: 'clk', name: 'CLK', type: 'input' as const, position: { side: 'bottom' as const, x: 50, y: 100, align: 'center' as const } },
    { id: 'q', name: 'Q', type: 'output' as const, position: { side: 'right' as const, x: 100, y: 40, align: 'center' as const } }
  ],
};

const measurementElementTypes = new Set<CircuitElementType>([
  CircuitElementType.AMMETER,
  CircuitElementType.VOLTMETER,
  CircuitElementType.OSCILLOSCOPE,
]);

const powerSourceElementTypes = new Set<CircuitElementType>([
  CircuitElementType.VOLTAGE_SOURCE,
  CircuitElementType.CURRENT_SOURCE,
]);

const measurementTypeLabels: Partial<Record<CircuitElementType, string>> = {
  [CircuitElementType.AMMETER]: '电流表',
  [CircuitElementType.VOLTMETER]: '电压表',
  [CircuitElementType.OSCILLOSCOPE]: '示波器',
};

const measurementMetricLabels: Record<string, string> = {
  current: '瞬时电流 (A)',
  minCurrent: '最小电流 (A)',
  maxCurrent: '最大电流 (A)',
  avgCurrent: '平均电流 (A)',
  rmsCurrent: '有效值电流 (A)',
  peakCurrent: '峰值电流 (A)',
  peakToPeakCurrent: '峰-峰电流 (A)',
  voltage: '瞬时电压 (V)',
  minVoltage: '最小电压 (V)',
  maxVoltage: '最大电压 (V)',
  avgVoltage: '平均电压 (V)',
  rmsVoltage: '有效值电压 (V)',
  peakVoltage: '峰值电压 (V)',
  peakToPeakVoltage: '峰-峰电压 (V)',
  frequency: '频率 (Hz)',
  amplitude: '幅值 (V)',
};

const measurementMetricUnits: Record<string, string> = {
  current: 'A',
  minCurrent: 'A',
  maxCurrent: 'A',
  avgCurrent: 'A',
  rmsCurrent: 'A',
  peakCurrent: 'A',
  peakToPeakCurrent: 'A',
  voltage: 'V',
  minVoltage: 'V',
  maxVoltage: 'V',
  avgVoltage: 'V',
  rmsVoltage: 'V',
  peakVoltage: 'V',
  peakToPeakVoltage: 'V',
  frequency: 'Hz',
  amplitude: 'V',
};

const SI_PREFIXES = [
  { factor: 1e12, symbol: 'T' },
  { factor: 1e9, symbol: 'G' },
  { factor: 1e6, symbol: 'M' },
  { factor: 1e3, symbol: 'k' },
  { factor: 1, symbol: '' },
  { factor: 1e-3, symbol: 'm' },
  { factor: 1e-6, symbol: 'μ' },
  { factor: 1e-9, symbol: 'n' },
  { factor: 1e-12, symbol: 'p' },
];

const formatMeasurementValue = (value: number, unit?: string) => {
  if (!Number.isFinite(value)) return '-';
  if (value === 0) return unit ? `0 ${unit}` : '0';
  const absValue = Math.abs(value);
  if (absValue < 1e-12) {
    return `${value.toExponential(3)}${unit ? ` ${unit}` : ''}`;
  }
  const prefix = SI_PREFIXES.find(p => absValue >= p.factor) || SI_PREFIXES[SI_PREFIXES.length - 1];
  const scaled = value / prefix.factor;
  const absScaled = Math.abs(scaled);
  const precision = absScaled >= 100 ? 1 : absScaled >= 10 ? 2 : 3;
  const suffix = `${prefix.symbol}${unit || ''}`.trim();
  return `${scaled.toFixed(precision)}${suffix ? ` ${suffix}` : ''}`;
};

// 在文件顶部添加接口定义
interface CircuitFlowProps {
  onCircuitDesignChange?: (design: CircuitDesign) => void;
  selectedModel?: string;
  initialCircuitDesign?: CircuitDesign; // 添加初始电路设计数据
  isReadOnly?: boolean; // 是否为只读模式，禁用编辑功能
  classId?: string | null; // 添加班级ID参数
  onModelChange?: (model: FlowModelType) => void; // 修改为使用 FlowModelType
  workspaceMode?: CircuitWorkspaceMode;
}

export const CircuitFlow = ({ onCircuitDesignChange, selectedModel = 'deepseekV3', initialCircuitDesign, isReadOnly = false, classId = null, onModelChange, workspaceMode: workspaceModeProp = 'analog' }: CircuitFlowProps) => {
  const workspaceMode = workspaceModeProp;
  const [nodes, setNodes] = useState<Node[]>([]);
  const [edges, setEdges] = useState<Edge[]>([]);
  const [isAnalyzing, setIsAnalyzing] = useState(false);
  const [isSimulating, setIsSimulating] = useState(false);
  const [simulationResults, setSimulationResults] = useState<Record<string, SimulationMeasurementResult>>({});
  const [simulationStale, setSimulationStale] = useState(false);
  const [measurementModalVisible, setMeasurementModalVisible] = useState(false);
  const [activeMeasurementResult, setActiveMeasurementResult] = useState<SimulationMeasurementResult | null>(null);
  const [activeScopeChannel, setActiveScopeChannel] = useState<string | null>(null);
  const [digitalSimResult, setDigitalSimResult] = useState<DigitalSimulationResult | null>(null);
  const [digitalSimModalVisible, setDigitalSimModalVisible] = useState(false);
  const [selectedNodeId, setSelectedNodeId] = useState<string | null>(null);
  const [currentModel, setCurrentModel] = useState<FlowModelType>(selectedModel as FlowModelType);
  const [selectedEdgeId, setSelectedEdgeId] = useState<string | null>(null);
  const [showElementLibrary, setShowElementLibrary] = useState<boolean>(true);
  const [canUndo, setCanUndo] = useState<boolean>(false);
  const [canRedo, setCanRedo] = useState<boolean>(false);
  const [fullScreenMode, setFullScreenMode] = useState<boolean>(false);
  const [historyState, setHistoryState] = useState<{
    past: Array<{nodes: Node[], edges: Edge[]}>,
    present: {nodes: Node[], edges: Edge[]},
    future: Array<{nodes: Node[], edges: Edge[]}>
  }>({
    past: [],
    present: {nodes: [], edges: []},
    future: []
  });
  // 添加配置面板状态
  const [configVisible, setConfigVisible] = useState<boolean>(false);
  const [selectedElement, setSelectedElement] = useState<CircuitNodeData | null>(null);
  // 添加保存弹窗状态
  const [saveModalVisible, setSaveModalVisible] = useState<boolean>(false);
  const [currentCircuitDesign, setCurrentCircuitDesign] = useState<CircuitDesign | null>(null);
  const elementNameCountersRef = useRef<Record<string, number>>({});
  const initialDesignMetadata = React.useMemo(() => ({
    title: initialCircuitDesign?.metadata?.title || '电路设计',
    description: initialCircuitDesign?.metadata?.description || '使用DrawSee创建的电路',
    createdAt: initialCircuitDesign?.metadata?.createdAt || new Date().toISOString(),
    updatedAt: initialCircuitDesign?.metadata?.updatedAt || new Date().toISOString(),
  }), [initialCircuitDesign]);
  const [designMetadata, setDesignMetadata] = useState(initialDesignMetadata);
  const designMetadataRef = useRef(designMetadata);
  useEffect(() => {
    designMetadataRef.current = designMetadata;
  }, [designMetadata]);
  const [persistedDesignId, setPersistedDesignId] = useState<string | null>(initialCircuitDesign?.id ?? null);
  const designIdRef = useRef<string | null>(persistedDesignId);
  useEffect(() => {
    designIdRef.current = persistedDesignId;
  }, [persistedDesignId]);
  const [saveModalMode, setSaveModalMode] = useState<'save' | 'saveAs'>('save');
  const [saveModalInitialValues, setSaveModalInitialValues] = useState<{ title?: string; description?: string }>({});
  const autoSaveTimerRef = useRef<number | null>(null);
  const autoSaveInfoShownRef = useRef(false);
  const [isImportingFromImage, setIsImportingFromImage] = useState(false);
  const [isImportModalVisible, setIsImportModalVisible] = useState(false);
  
  const reactFlowInstance = useReactFlow();
  const reactFlowWrapper = useRef<HTMLDivElement>(null);
  const { handleBlankQuery, handleAiTaskCountPlus } = useAppContext();
  const paletteCategories = useMemo(() => getElementCategories(workspaceMode), [workspaceMode]);
  const elementMenuItems = useMemo(() => getElementMenuItems(workspaceMode), [workspaceMode]);
  const lastSimSignatureRef = useRef<string | null>(null);
  
  const getLabelPrefix = useCallback((type: CircuitElementType) => {
    return elementNamePrefixes[type] || 'X';
  }, []);
  
  const getNextElementLabel = useCallback((type: CircuitElementType) => {
    const prefix = getLabelPrefix(type);
    const currentValue = elementNameCountersRef.current[type] || 0;
    const nextValue = currentValue + 1;
    elementNameCountersRef.current[type] = nextValue;
    return `${prefix}${nextValue}`;
  }, [getLabelPrefix]);
  
  const registerExistingElementLabel = useCallback((type: CircuitElementType, label?: string) => {
    if (!label) return;
    const prefix = getLabelPrefix(type);
    const normalizedLabel = label.toUpperCase();
    const normalizedPrefix = prefix.toUpperCase();
    if (!normalizedLabel.startsWith(normalizedPrefix)) return;
    const suffix = normalizedLabel.slice(normalizedPrefix.length);
    const parsedValue = parseInt(suffix, 10);
    if (!isNaN(parsedValue)) {
      const current = elementNameCountersRef.current[type] || 0;
      elementNameCountersRef.current[type] = Math.max(current, parsedValue);
    }
  }, [getLabelPrefix]);

  const loadCircuitDesign = useCallback((design: CircuitDesign, options: { fitView?: boolean; notifyChange?: boolean } = {}) => {
    if (!design) {
      return;
    }

    const safeElements = design.elements || [];
    const safeConnections = design.connections || [];

    const newNodes: Node[] = safeElements.map((element) => {
      const propertyLabel = typeof element.properties?.['label'] === 'string'
        ? element.properties['label'] as string
        : undefined;
      const propertyValue = typeof element.properties?.['value'] === 'string'
        ? element.properties['value'] as string
        : undefined;

      const resolvedLabel = element.label || propertyLabel || element.id;
      const resolvedValue = element.value || propertyValue || '';

      return {
        id: element.id,
        type: 'circuitNode',
        position: element.position || { x: 0, y: 0 },
        data: {
          id: element.id,
          type: element.type,
          label: resolvedLabel,
          value: resolvedValue,
          element,
          description: '',
          ports: element.ports || []
        }
      };
    });

    const newEdges: Edge[] = safeConnections.map((connection) => {
      const edgeId = connection.id || `edge-${connection.source.elementId}-${connection.source.portId}-${connection.target.elementId}-${connection.target.portId}`;
      return {
        id: edgeId,
        source: connection.source.elementId,
        sourceHandle: connection.source.portId,
        target: connection.target.elementId,
        targetHandle: connection.target.portId,
        type: 'default',
        animated: false,
        style: { stroke: '#3B82F6', strokeWidth: 2 },
        data: {}
      };
    });

    setNodes(newNodes);
    setEdges(newEdges);
    setSelectedNodeId(null);
    setSelectedEdgeId(null);
    setHistoryState({
      past: [],
      present: { nodes: newNodes, edges: newEdges },
      future: []
    });
    setCanUndo(false);
    setCanRedo(false);

    if (safeElements.length > 0) {
      safeElements.forEach((element) => {
        registerExistingElementLabel(
          element.type as CircuitElementType,
          element.label || (typeof element.properties?.['label'] === 'string' ? element.properties['label'] as string : undefined)
        );
      });
    }

    if (options.notifyChange && onCircuitDesignChange) {
      onCircuitDesignChange(design);
    }

    if (options.fitView !== false) {
      setTimeout(() => {
        reactFlowInstance.fitView({ padding: 0.2 });
      }, 100);
    }
  }, [onCircuitDesignChange, reactFlowInstance, registerExistingElementLabel]);

  const handleImageImportClick = useCallback(() => {
    setIsImportModalVisible(true);
  }, []);

  const recognizeCircuitImage = useCallback(async (file: File) => {
    const design = await recognizeCircuitDesignFromImage(file);
    const summary = `识别成功，包含${design.elements?.length ?? 0}个元件和${design.connections?.length ?? 0}条连接`;
    return { text: summary, extraData: design };
  }, []);

  const handleCircuitDesignFromImage = useCallback((data: unknown) => {
    const design = data as CircuitDesign;
    loadCircuitDesign(design, { fitView: true, notifyChange: true });
    setIsImportModalVisible(false);
    message.success('识别完成，电路已载入画布');
  }, [loadCircuitDesign]);

  const handleImportModalClose = useCallback(() => {
    if (isImportingFromImage) return;
    setIsImportModalVisible(false);
  }, [isImportingFromImage]);
  
  const getFallbackLabelFromId = useCallback((type: CircuitElementType, nodeId: string) => {
    const prefix = getLabelPrefix(type);
    const numericSuffix = nodeId.replace(/\D/g, '');
    return `${prefix}${numericSuffix || '1'}`;
  }, [getLabelPrefix]);

  const computeSimSignature = useCallback(() => {
    const nodeKey = nodes
      .map(n => `${n.id}:${n.data.type}:${Math.round(n.position.x)}:${Math.round(n.position.y)}`)
      .sort()
      .join('|');
    const edgeKey = edges
      .map(e => `${e.id}:${e.source}:${e.sourceHandle}-${e.target}:${e.targetHandle}`)
      .sort()
      .join('|');
    return `${nodeKey}#${edgeKey}`;
  }, [nodes, edges]);
  
  // 监控节点和边变化，更新历史状态和撤销/重做按钮
  useEffect(() => {
    // 防止初始化或状态更新时频繁触发历史记录更新
    // 只有当用户实际进行了操作，才更新历史状态
    if (historyState.present.nodes.length === 0 && historyState.present.edges.length === 0) {
      // 首次加载，直接设置当前状态而不添加到历史记录中
      setHistoryState(prev => ({
        ...prev,
        present: { nodes, edges },
      }));
      
      // 更新撤销/重做按钮状态
      setCanUndo(false);
      setCanRedo(false);
      return;
    }
    
    // 比较当前的节点和边与历史记录中present的节点和边是否相同
    const nodesChanged = nodes.length !== historyState.present.nodes.length ||
      nodes.some((node, index) => {
        const presentNode = historyState.present.nodes[index];
        return !presentNode || node.id !== presentNode.id || 
          node.position.x !== presentNode.position.x || 
          node.position.y !== presentNode.position.y;
      });
      
    const edgesChanged = edges.length !== historyState.present.edges.length ||
      edges.some((edge, index) => {
        const presentEdge = historyState.present.edges[index];
        return !presentEdge || edge.id !== presentEdge.id;
      });
    
    // 只有当节点或边发生实质性变化时，才更新历史状态
    if (nodesChanged || edgesChanged) {
      console.log('节点或边发生了实质性变化，更新历史状态');
      
      // 保存当前状态到历史记录中
      setHistoryState(prev => ({
        past: [...prev.past, prev.present],
        present: { nodes, edges },
        future: []
      }));
      
      // 更新撤销/重做按钮状态
      setCanUndo(true);
      setCanRedo(false);
    }
  }, [nodes, edges]);
  
  // 显示班级ID信息（如果有）
  useEffect(() => {
    if (classId) {
      console.log('当前班级ID:', classId);
    }
  }, [classId]);
  
  // 加载初始电路设计数据 - 使用 useRef 避免重复加载
  const initialLoadRef = useRef(false);
  
  useEffect(() => {
    if (initialCircuitDesign && initialCircuitDesign.elements.length > 0 && !initialLoadRef.current) {
      console.log('加载初始电路设计数据', initialCircuitDesign);
      initialLoadRef.current = true;
      loadCircuitDesign(initialCircuitDesign, { fitView: true, notifyChange: false });
    }
  }, [initialCircuitDesign, loadCircuitDesign]);
  
  // 监听节点旋转事件，更新连线
  useEffect(() => {
    const handleNodeRotated = (event: CustomEvent) => {
      const { nodeId, rotation } = event.detail;
      
      // 找到与旋转节点相关的所有边
      const relatedEdges = edges.filter(
        edge => edge.source === nodeId || edge.target === nodeId
      );
      
      if (relatedEdges.length > 0) {
        // 强制边重新渲染
        setEdges(currentEdges => {
          return currentEdges.map(edge => {
            if (edge.source === nodeId || edge.target === nodeId) {
              return {
                ...edge,
                data: {
                  ...edge.data,
                  updateRotation: rotation,
                  updateTimestamp: Date.now()
                }
              };
            }
            return edge;
          });
        });
        
        // 轻微延迟后重新计算流程图视图
        setTimeout(() => {
          reactFlowInstance.setNodes([...reactFlowInstance.getNodes()]);
        }, 10);
      }
    };
    
    // 添加自定义事件监听
    document.addEventListener('circuit-node-rotated', handleNodeRotated as EventListener);
    
    return () => {
      document.removeEventListener('circuit-node-rotated', handleNodeRotated as EventListener);
    };
  }, [edges, reactFlowInstance]);
  
  // 处理节点变更
  const onNodesChange = useCallback(
    (changes: NodeChange[]) => setNodes((nds) => applyNodeChanges(changes, nds)),
    []
  );

  // 处理边变更
  const onEdgesChange = useCallback(
    (changes: EdgeChange[]) => {
      setEdges((eds) => {
        const newEdges = applyEdgeChanges(changes, eds);
        // 如果选中的边被删除，清除选中状态
        if (selectedEdgeId && !newEdges.some(edge => edge.id === selectedEdgeId)) {
          setSelectedEdgeId(null);
        }
        return newEdges;
      });
    },
    [selectedEdgeId]
  );

  // 处理连接创建
  const onConnect = useCallback(
    (connection: Connection) => {
      // 检查连接是否有效
      if (!connection.source || !connection.target || !connection.sourceHandle || !connection.targetHandle) {
        message.warning('无效的连接，请确保正确连接两个端口');
        return;
      }

      // 清除之前选中的边缘
      setSelectedEdgeId(null);

      // 检查是否已存在相同的连接
      const connectionExists = edges.some(
        edge => 
          edge.source === connection.source && 
          edge.sourceHandle === connection.sourceHandle && 
          edge.target === connection.target && 
          edge.targetHandle === connection.targetHandle
      );

      if (connectionExists) {
        message.warning('此连接已存在');
        return;
      }

      // 检查是否连接到同一个节点上的不同端口
      if (connection.source === connection.target) {
        // 允许同一节点上的端口相连，适用于某些电路设计（如电阻自连）
        console.log('同一节点上的端口相连:', connection);
      }

      // 创建新的边对象
      const newEdge = {
        ...connection,
        id: `edge-${connection.source}-${connection.sourceHandle}-${connection.target}-${connection.targetHandle}`,
        type: 'default',
        animated: false,
        style: { stroke: '#3B82F6', strokeWidth: 2 },
        data: {}
      };
      
      setEdges((eds) => addEdge(newEdge, eds));
      message.success('连接成功', 0.5);
    },
    [edges]
  );

  // 添加一个函数来处理元件双击事件
  const handleNodeDoubleClick = useCallback((nodeId: string) => {
    console.log('CircuitFlow.handleNodeDoubleClick 被调用，nodeId:', nodeId);
    const node = nodes.find(n => n.id === nodeId);
    if (!node) {
      console.warn('未找到节点数据 id:', nodeId);
      return;
    }
    
    const nodeType = node.data.type as CircuitElementType;
    if (measurementElementTypes.has(nodeType)) {
      const measurement = simulationResults[nodeId];
      if (measurement) {
        setActiveMeasurementResult(measurement);
        if (measurement.elementType === CircuitElementType.OSCILLOSCOPE) {
          const firstChannel = (measurement.channels && measurement.channels[0]) || (measurement.nets && measurement.nets[0]) || null;
          setActiveScopeChannel(firstChannel);
        } else {
          setActiveScopeChannel(null);
        }
        setMeasurementModalVisible(true);
      } else {
        message.info('请先点击工具栏中的“运行电路”按钮完成模拟仿真');
      }
      return;
    }
    
    // 创建一个完整的数据对象，只包含 CircuitNodeData 支持的属性
    const nodeData = {
      id: node.id,
      label: node.data.label || '',
      value: node.data.value || '',
      element: node.data.element,
      description: '',
      ports: node.data.ports || [],
    };
    
    setSelectedElement(nodeData);
    setConfigVisible(true);
  }, [nodes, simulationResults]);

  // 创建新节点
  const addNewNode = useCallback(
    (type: CircuitElementType) => {
      // 使用ReactFlow实例计算新节点的位置
      const position = reactFlowInstance.project({
        x: Math.random() * 400 + 50,
        y: Math.random() * 400 + 50,
      });

      // 生成唯一ID
      const nodeId = getNewNodeId();
      
      // 节点标签 - 使用元件类型专属前缀
      const elementLabel = getNextElementLabel(type);
      
      // 获取节点默认值
      const defaultValues: Record<string, string> = {
        [CircuitElementType.RESISTOR]: '1kΩ',
        [CircuitElementType.CAPACITOR]: '1μF',
        [CircuitElementType.INDUCTOR]: '1mH',
        [CircuitElementType.VOLTAGE_SOURCE]: '5V',
        [CircuitElementType.CURRENT_SOURCE]: '10mA',
        [CircuitElementType.DIODE]: '',
        [CircuitElementType.TRANSISTOR_NPN]: '',
        [CircuitElementType.TRANSISTOR_PNP]: '',
        [CircuitElementType.GROUND]: '',
        [CircuitElementType.OPAMP]: '',
        [CircuitElementType.AMMETER]: '0A',
        [CircuitElementType.VOLTMETER]: '0V',
        [CircuitElementType.OSCILLOSCOPE]: 'CH1',
        [CircuitElementType.DIGITAL_INPUT]: '1',
        [CircuitElementType.DIGITAL_OUTPUT]: '',
        [CircuitElementType.DIGITAL_CLOCK]: '10ns',
        [CircuitElementType.DIGITAL_AND]: '',
        [CircuitElementType.DIGITAL_OR]: '',
        [CircuitElementType.DIGITAL_NOT]: '',
        [CircuitElementType.DIGITAL_NAND]: '',
        [CircuitElementType.DIGITAL_NOR]: '',
        [CircuitElementType.DIGITAL_XOR]: '',
        [CircuitElementType.DIGITAL_XNOR]: '',
        [CircuitElementType.DIGITAL_DFF]: ''
      };
      
      const elementValue = defaultValues[type] || '';
      
      // 获取节点默认端口配置
      const ports = (type in defaultPorts) 
        ? [...(defaultPorts[type as keyof typeof defaultPorts] || [])]
        : [];
      
      // 创建完整的CircuitElement对象
      const element: CircuitElement = {
        id: nodeId,
        type, // 直接使用 CircuitElementType 枚举值，这是合法的
        position: { x: position.x, y: position.y },
        rotation: 0,
        ports,
        properties: {
          value: elementValue,
          label: elementLabel
        },
        label: elementLabel,
        value: elementValue
      };

      // 创建完整的结构化节点数据
      const completeNodeData = {
        type,
        label: elementLabel,
        value: elementValue,
        element: element,
        id: nodeId,
        ports: ports,
        description: ''
      };

      // 创建ReactFlow节点
      const newNode: Node = {
        id: nodeId,
        type: 'circuitNode',
        position,
        data: {
          ...completeNodeData,
          // 不需要单独的回调函数，直接通过 ReactFlow 的 onNodeDoubleClick 处理
        },
      };

      console.log('添加新节点，完整数据:', newNode);
      
      // 使用函数形式更新状态，确保获取最新的节点列表
      setNodes(currentNodes => {
        const updatedNodes = [...currentNodes, newNode];
        console.log('更新后的节点列表:', updatedNodes.map(n => ({ id: n.id, type: n.data.type })));
        return updatedNodes;
      });
      
      // 添加元件后显示简短提示
      message.success(`已添加${elementMenuItems.find(item => item.key === type)?.label || type}`, 1);
    },
    [reactFlowInstance, getNextElementLabel, elementMenuItems]
  );
  
  // 将Flow画布数据转换为CircuitDesign格式
  const convertToCircuitDesign = useCallback((): CircuitDesign => {
    try {
      // 从节点中提取电路元件数据
      const elements = nodes.map(node => {
        // 如果节点已经包含完整的element数据，直接使用
        if (node.data.element) {
          const elementData = { 
            ...node.data.element,
            position: node.position, // 确保位置是最新的
          };
          
          // 确保元件类型正确
          const validTypes = Object.values(CircuitElementType);
          if (!validTypes.includes(elementData.type as CircuitElementType)) {
            console.warn(`元件类型 ${elementData.type} 不在预定义类型中，请检查`);
          }
          
          // 确保element.properties中必须有resistance/voltage等标准属性
          if (!elementData.properties.hasOwnProperty('value') && elementData.value) {
            elementData.properties.value = elementData.value;
          }
          
          if (!elementData.properties.hasOwnProperty('label') && elementData.label) {
            elementData.properties.label = elementData.label;
          }
          
          // 确保每个端口都有正确的position属性
          elementData.ports = elementData.ports.map((port: Port) => {
            if (!port.position.hasOwnProperty('align')) {
              port.position.align = 'center';
            }
            return port;
          });
          
          return elementData;
        }
        
        // 获取节点类型，确保类型符合后端期望
        const nodeType = node.data.type;
        
        // 默认值设置
        const defaultValues: Record<string, string> = {
          [CircuitElementType.RESISTOR]: '1kΩ',
          [CircuitElementType.CAPACITOR]: '1μF',
          [CircuitElementType.INDUCTOR]: '1mH',
          [CircuitElementType.VOLTAGE_SOURCE]: '5V',
          [CircuitElementType.CURRENT_SOURCE]: '10mA',
          [CircuitElementType.DIODE]: '',
          [CircuitElementType.TRANSISTOR_NPN]: '',
          [CircuitElementType.TRANSISTOR_PNP]: '',
          [CircuitElementType.GROUND]: '',
          [CircuitElementType.OPAMP]: '',
          [CircuitElementType.AMMETER]: '0A',
          [CircuitElementType.VOLTMETER]: '0V',
          [CircuitElementType.OSCILLOSCOPE]: 'CH1',
        };
        
        // 根据节点类型获取默认端口配置
        const ports = (nodeType in defaultPorts) 
          ? [...(defaultPorts[nodeType as keyof typeof defaultPorts] || [])]
          : [];
        
        // 确保端口配置符合文档规范
        const standardizedPorts = ports.map((port: Port) => ({
          ...port,
          position: {
            ...port.position,
            align: port.position.align || 'center'
          }
        }));
        
        // 构造符合文档规范的CircuitElement对象
        const elementValue = node.data.value || defaultValues[nodeType as CircuitElementType] || '';
        const elementLabel = node.data.label || getFallbackLabelFromId(nodeType as CircuitElementType, node.id);
        
        return {
          id: node.id,
          type: nodeType,
          position: node.position,
          rotation: node.data.element?.rotation || 0,
          ports: standardizedPorts,
          properties: {
            value: elementValue,  // 元件值（如电阻值、电压值）
            label: elementLabel   // 元件标签
          },
          label: elementLabel,
          value: elementValue
        };
      });

      // 从边中提取连接数据
      const connections = edges.map(edge => ({
        id: edge.id,
        source: {
          elementId: edge.source,
          portId: edge.sourceHandle || ''
        },
        target: {
          elementId: edge.target,
          portId: edge.targetHandle || ''
        }
      }));

      // 创建符合文档规范的电路设计对象
      const metadataSnapshot = designMetadataRef.current;
      const circuitDesign: CircuitDesign = {
        id: designIdRef.current ?? undefined,
        elements,
        connections,
        metadata: {
          title: metadataSnapshot.title,
          description: metadataSnapshot.description,
          createdAt: metadataSnapshot.createdAt,
          updatedAt: metadataSnapshot.updatedAt
        }
      };
      
      // 如果提供了回调函数，则调用它通知父组件电路设计已经改变
      if (onCircuitDesignChange) {
        onCircuitDesignChange(circuitDesign);
      }
      
      return circuitDesign;
    } catch (error) {
      console.error('转换电路设计时出错:', error);
      message.error('转换电路设计时出错');
      return {
        id: designIdRef.current ?? undefined,
        elements: [],
        connections: [],
        metadata: {
          title: designMetadataRef.current.title,
          description: designMetadataRef.current.description,
          createdAt: designMetadataRef.current.createdAt,
          updatedAt: designMetadataRef.current.updatedAt
        }
      };
    }
  }, [nodes, edges, onCircuitDesignChange, getFallbackLabelFromId]);

  // 每当节点或边发生变化时，更新电路设计
  useEffect(() => {
    if (nodes.length > 0 || edges.length > 0) {
      convertToCircuitDesign();
    }
  }, [nodes, edges, convertToCircuitDesign]);

  useEffect(() => {
    return () => {
      if (autoSaveTimerRef.current) {
        window.clearTimeout(autoSaveTimerRef.current);
      }
    };
  }, []);

  const quickSaveExistingCircuit = useCallback(async (reason: 'manual' | 'auto' = 'manual', snapshot?: CircuitDesign) => {
    if (!designIdRef.current) return false;
    const baseDesign = snapshot || convertToCircuitDesign();
    const now = new Date().toISOString();
    const payload: CircuitDesign = {
      ...baseDesign,
      id: designIdRef.current || undefined,
      metadata: {
        ...baseDesign.metadata,
        title: designMetadataRef.current.title,
        description: designMetadataRef.current.description,
        updatedAt: now,
      },
    };

    try {
      if (reason === 'manual') {
        message.loading({ content: '保存电路中...', key: 'circuit-quick-save', duration: 0 });
      }
      await updateCircuitDesign(designIdRef.current!, payload, designMetadataRef.current.title, designMetadataRef.current.description);
      setDesignMetadata(prev => ({ ...prev, updatedAt: now }));
      if (reason === 'manual') {
        message.success({ content: '电路已保存', key: 'circuit-quick-save', duration: 1.5 });
      } else {
        message.success({ content: '元件参数已自动保存', key: 'circuit-auto-save', duration: 1.5 });
      }
      return true;
    } catch (error) {
      console.error('保存电路失败:', error);
      if (reason === 'manual') {
        message.error({ content: '保存失败，请稍后重试', key: 'circuit-quick-save' });
      } else {
        message.error('自动保存失败，请手动保存');
      }
      return false;
    }
  }, [convertToCircuitDesign]);

  const scheduleAutoSave = useCallback(() => {
    if (!designIdRef.current) {
      if (!autoSaveInfoShownRef.current) {
        message.info('请先保存电路以启用自动保存');
        autoSaveInfoShownRef.current = true;
      }
      return;
    }
    if (autoSaveTimerRef.current) {
      window.clearTimeout(autoSaveTimerRef.current);
    }
    autoSaveTimerRef.current = window.setTimeout(() => {
      quickSaveExistingCircuit('auto');
      autoSaveTimerRef.current = null;
    }, 600);
  }, [quickSaveExistingCircuit]);

  const openSaveModal = useCallback((mode: 'save' | 'saveAs', snapshot: CircuitDesign) => {
    const designForModal: CircuitDesign = {
      ...snapshot,
      id: mode === 'saveAs' ? undefined : snapshot.id,
      metadata: { ...snapshot.metadata },
    };
    setCurrentCircuitDesign(designForModal);
    setSaveModalMode(mode);
    const defaultTitle = mode === 'saveAs'
      ? `${designMetadata.title || '电路设计'}-副本`
      : (designMetadata.title || '');
    setSaveModalInitialValues({
      title: defaultTitle,
      description: designMetadata.description,
    });
    setSaveModalVisible(true);
  }, [designMetadata]);

  const handleSaveModalSuccess = useCallback(({ id, title, description }: { id: string; title: string; description: string }) => {
    const now = new Date().toISOString();
    setPersistedDesignId(id);
    setDesignMetadata(prev => ({
      ...prev,
      title,
      description,
      updatedAt: now,
      createdAt: prev.createdAt || now,
    }));
    autoSaveInfoShownRef.current = false;
  }, []);

  // 拓扑变化时使仿真结果失效
  useEffect(() => {
    const sig = computeSimSignature();
    if (lastSimSignatureRef.current && lastSimSignatureRef.current !== sig) {
      if (Object.keys(simulationResults).length > 0) {
        setSimulationResults({});
        setActiveMeasurementResult(null);
        setMeasurementModalVisible(false);
        setActiveScopeChannel(null);
        setNodes(currentNodes => currentNodes.map(node => {
          if (!node.data.measurement) return node;
          return {
            ...node,
            data: {
              ...node.data,
              measurement: undefined,
            },
          };
        }));
      }
      setSimulationStale(true);
    }
    if (!lastSimSignatureRef.current) {
      lastSimSignatureRef.current = sig;
    }
  }, [computeSimSignature, simulationResults]);

  // 分析电路
  const handleAnalyzeCircuit = useCallback(async () => {
    try {
      // 开始分析，设置状态为正在分析
      setIsAnalyzing(true);
      
      const circuitDesign = convertToCircuitDesign();
      
      // 检查电路是否为空
      if (circuitDesign.elements.length === 0) {
        message.error('电路中没有元件，请先添加元件');
        setIsAnalyzing(false);
        return;
      }
      
      // 检查电路连接
      if (circuitDesign.connections.length === 0) {
        message.error('电路中没有连接，请先连接元件');
        setIsAnalyzing(false);
        return;
      }
      
      // 深拷贝电路设计，以便修改而不影响原始对象
      const processedCircuitDesign = JSON.parse(JSON.stringify(circuitDesign));
      
      // 确保所有元件类型在 CircuitElementType 枚举中
      const validTypes = Object.values(CircuitElementType);
      
      // 检查是否有无效的元件类型
      const invalidElements = processedCircuitDesign.elements.filter(
        (element: any) => !validTypes.includes(element.type)
      );
      
      if (invalidElements.length > 0) {
        const invalidTypes = invalidElements.map((e: any) => e.type).join(', ');
        message.error(`电路包含无效的元件类型：${invalidTypes}`);
        console.error('无效的元件类型：', invalidElements);
        setIsAnalyzing(false);
        return;
      }
      
      // 显示加载提示
      message.loading({
        content: '正在准备分析电路...',
        key: 'circuit-analysis',
        duration: 0 // 不自动关闭
      });
      
      // 按照文档规范构造电路分析任务数据
      const createAiTaskDTO: CreateAiTaskDTO = {
        type: 'CIRCUIT_ANALYSIS',
        // 按照文档规范，prompt需要是具有特定格式的对象
        prompt: JSON.stringify(processedCircuitDesign),
        promptParams: {},
        convId: null,
        parentId: null,
        model: currentModel,
        classId: classId // 添加班级ID
      };
      
      console.log('发送电路分析AI任务', createAiTaskDTO);
      
      // 创建AI任务并获取结果
      const response = await createAiTask(createAiTaskDTO);
      
      // 计数+1
      handleAiTaskCountPlus();
      
      // 将classId存储到sessionStorage，以便在flow页面获取
      if (classId) {
        sessionStorage.setItem(`circuit_class_id_${response.conversation.id}`, classId);
      }
      
      // 更新loading消息内容
      message.loading({
        content: '分析启动成功，即将跳转到分析页面...',
        key: 'circuit-analysis',
        duration: 1 // 显示1秒
      });
      
      // 立即触发跳转
      handleBlankQuery(response);
      
      // 跳转后关闭分析中状态
      setIsAnalyzing(false);
      
      // 在跳转完成后稍微延迟再显示成功消息，避免界面闪烁
      setTimeout(() => {
        // 关闭之前的loading消息
        message.destroy('circuit-analysis');
        // 显示成功消息
        message.success('已成功跳转到电路分析页面');
      }, 800);
      
    } catch (error) {
      console.error('电路分析失败:', error);
      // 关闭分析中的loading消息
      message.destroy('circuit-analysis');
      
      if (error instanceof Error) {
        // 对于参数错误，给出更具体的提示
        if (error.message.includes('参数错误')) {
          Modal.error({
            title: '电路分析请求发送失败',
            content: (
              <div>
                <p>服务器拒绝了分析请求，可能是因为电路设计不完整或存在错误：</p>
                <ul>
                  <li>检查电路是否有完整的闭合回路</li>
                  <li>确保所有元件的参数设置合理</li>
                  <li>您可能需要补充缺失的元件（如接地元件）</li>
                  <li>检查元件类型是否与API预期一致</li>
                </ul>
                <p>技术错误信息: {error.message}</p>
              </div>
            )
          });
        } else {
          message.error(`电路分析失败: ${error.message || '未知错误'}`);
        }
      } else {
        message.error('电路分析失败，请检查电路连接是否完整');
      }
      setIsAnalyzing(false);
    }
  }, [convertToCircuitDesign, currentModel, handleBlankQuery, handleAiTaskCountPlus, classId]);
  
  // 运行模拟仿真
  const handleRunSimulation = useCallback(async () => {
    const circuitDesign = convertToCircuitDesign();
    if (workspaceMode === 'digital') {
      if (isSimulating) return;
      if (circuitDesign.elements.length === 0) {
        message.error('请先在画布中放置至少一个数字元件');
        return;
      }
      const hasOutput = circuitDesign.elements.some(
        (el) => el.type === CircuitElementType.DIGITAL_OUTPUT
      );
      if (!hasOutput) {
        message.warning('至少放置一个数字输出元件以观察波形');
        return;
      }
      setIsSimulating(true);
      message.loading({ content: '正在运行数字仿真...', key: 'circuit-sim', duration: 0 });
      try {
        const result = await runDigitalSimulation(circuitDesign);
        setDigitalSimResult(result);
        setDigitalSimModalVisible(true);
        message.success({ content: '数字仿真完成，查看波形面板了解详情', key: 'circuit-sim' });
        if (result.warnings.length) {
          result.warnings.forEach((warn, idx) => {
            message.warning({ content: warn, key: `digital-warn-${idx}` });
          });
        }
      } catch (err: any) {
        console.error('数字仿真失败', err);
        message.error({ content: `数字仿真失败: ${err?.message || '未知错误'}`, key: 'circuit-sim' });
      } finally {
        setIsSimulating(false);
      }
      return;
    }
    if (isSimulating) return;
    if (circuitDesign.elements.length === 0) {
      message.error('电路中没有元件，无法进行模拟');
      return;
    }
    const hasPowerSource = circuitDesign.elements.some(el =>
      powerSourceElementTypes.has(el.type as CircuitElementType)
    );
    if (!hasPowerSource) {
      message.error('电路缺少电源器件，请添加电压源或电流源后再运行仿真');
      return;
    }
    const measurementNodes = nodes.filter(node => 
      measurementElementTypes.has(node.data.type as CircuitElementType)
    );
    
    if (measurementNodes.length === 0) {
      message.warning('请先在电路中放置电流表、电压表或示波器后再运行模拟');
      setSimulationResults({});
      return;
    }
    
    const connectionMap = edges.reduce<Record<string, Set<string>>>((acc, edge) => {
      if (!acc[edge.source]) acc[edge.source] = new Set();
      if (!acc[edge.target]) acc[edge.target] = new Set();
      if (edge.sourceHandle) acc[edge.source].add(edge.sourceHandle);
      if (edge.targetHandle) acc[edge.target].add(edge.targetHandle);
      return acc;
    }, {});
    const unconnectedMeasurements = measurementNodes.filter(n => {
      const ports = connectionMap[n.id] || new Set();
      return ports.size < 2;
    });
    if (unconnectedMeasurements.length > 0) {
      const labels = unconnectedMeasurements.map(n => n.data.label || n.id).join('、');
      message.error(`以下仪表未正确接线，无法仿真：${labels}`);
      return;
    }
    
    setIsSimulating(true);
    message.loading({ content: '正在运行仿真 (WASM)...', key: 'circuit-sim', duration: 0 });
    try {
      const results = await simulationClient.runSimulation(circuitDesign);
      if (Object.keys(results).length === 0) {
        message.warning({ content: '仿真未返回任何数据，请检查电路或参数设置', key: 'circuit-sim' });
      }
      setSimulationResults(results);
      setNodes(currentNodes => currentNodes.map(node => {
        const measurement = results[node.id] || null;
        if (!measurement && !node.data.measurement) {
          return node;
        }
        return {
          ...node,
          data: {
            ...node.data,
            measurement: measurement || undefined,
          },
        };
      }));
      setActiveMeasurementResult(null);
      setMeasurementModalVisible(false);
      setActiveScopeChannel(null);
      lastSimSignatureRef.current = computeSimSignature();
      setSimulationStale(false);
      message.success({ content: '仿真完成，双击仪表查看数据/波形', key: 'circuit-sim' });
    } catch (err: any) {
      console.error('仿真失败', err);
      message.error({ content: `仿真失败: ${err?.message || '未知错误'}`, key: 'circuit-sim' });
    } finally {
      setIsSimulating(false);
    }
  }, [convertToCircuitDesign, nodes, edges, isSimulating, workspaceMode, computeSimSignature]);

  const handleDownloadDigitalVcd = useCallback(() => {
    if (!digitalSimResult?.rawVcd) {
      message.warning('暂无可下载的数字波形。');
      return;
    }
    const blob = new Blob([digitalSimResult.rawVcd], { type: 'text/plain;charset=utf-8' });
    const link = document.createElement('a');
    link.href = URL.createObjectURL(blob);
    link.download = 'digital-wave.vcd';
    link.click();
    URL.revokeObjectURL(link.href);
  }, [digitalSimResult]);

  // 节点旋转功能
  const handleRotate = useCallback(() => {
    console.log('执行旋转操作，selectedNodeId:', selectedNodeId);
    if (!selectedNodeId) {
      console.log('没有选中节点，无法执行旋转');
      return;
    }
    
    setNodes((nds) =>
      nds.map((node) => {
        if (node.id === selectedNodeId) {
          // 获取当前旋转角度
          const match = node.style?.transform?.match(/rotate\((\d+)deg\)/);
          const currentRotation = match ? parseInt(match[1], 10) : 0;
          
          // 每次旋转90度
          const newRotation = (currentRotation + 90) % 360;
          
          console.log(`节点 ${node.id} 旋转角度从 ${currentRotation} 变为 ${newRotation}`);
          
          return {
            ...node,
            style: {
              ...node.style,
              transform: `rotate(${newRotation}deg)`
            },
            data: {
              ...node.data,
              element: node.data.element ? {
                ...node.data.element,
                rotation: newRotation,
              } : node.data.element
            }
          };
        }
        return node;
      })
    );
    
    // 触发自定义事件，通知连线需要更新
    const event = new CustomEvent('circuit-node-rotated', {
      detail: { nodeId: selectedNodeId, rotation: 90 }
    });
    document.dispatchEvent(event);
    
    message.success('元件已旋转', 0.5);
  }, [selectedNodeId, setNodes]);
  
  // 删除选中的节点
  const deleteSelectedNode = useCallback(() => {
    console.log('执行删除操作，selectedNodeId:', selectedNodeId);
    if (!selectedNodeId) {
      console.log('没有选中节点，无法执行删除');
      return;
    }
    
    // 删除连接到该节点的所有边
    setEdges((edges) => {
      const filteredEdges = edges.filter(
        (edge) => edge.source !== selectedNodeId && edge.target !== selectedNodeId
      );
      console.log(`删除了 ${edges.length - filteredEdges.length} 条与节点 ${selectedNodeId} 相关的连线`);
      return filteredEdges;
    });
    
    // 删除节点
    setNodes((nodes) => {
      const filteredNodes = nodes.filter((node) => node.id !== selectedNodeId);
      console.log(`删除了节点 ${selectedNodeId}`);
      return filteredNodes;
    });
    
    // 清除选中状态
    setSelectedNodeId(null);
    
    message.success('元件已删除');
  }, [selectedNodeId]);
  
  // 处理边点击
  const onEdgeClick = useCallback((e: React.MouseEvent, edge: Edge) => {
    setSelectedEdgeId(edge.id);
    // 取消选中节点
    setSelectedNodeId(null);
    e.stopPropagation();
  }, []);
  
  // 处理删除键按下
  const handleKeyDown = useCallback((e: KeyboardEvent) => {
    if ((e.key === 'Delete' || e.key === 'Backspace') && selectedEdgeId) {
      setEdges((eds) => eds.filter((edge) => edge.id !== selectedEdgeId));
      setSelectedEdgeId(null);
      message.info('连线已删除');
    }
  }, [selectedEdgeId]);
  
  // 添加键盘事件监听
  useEffect(() => {
    window.addEventListener('keydown', handleKeyDown);
    return () => {
      window.removeEventListener('keydown', handleKeyDown);
    };
  }, [handleKeyDown]);
  
  // 添加画布点击处理以取消选择
  const onPaneClick = useCallback(() => {
    console.log('取消选择节点');
    setSelectedNodeId(null);
    setSelectedEdgeId(null);
  }, []);

  // 处理节点点击
  const handleNodeClick = useCallback((event: React.MouseEvent, node: Node) => {
    console.log('节点被点击:', node.id, '节点数据:', node);
    // 立即设置选中节点ID
    setSelectedNodeId(node.id);
    // 取消选中边
    setSelectedEdgeId(null);
    // 阻止事件冒泡
    event.stopPropagation();
  }, []);
  
  // 注册快捷键
  useHotkeys('ctrl+r', (event) => {
    event.preventDefault();
    handleRotate();
  }, [handleRotate]);
  
  useHotkeys('ctrl+d, delete', (event) => {
    event.preventDefault();
    deleteSelectedNode();
  }, [deleteSelectedNode]);

  // 添加边缘选中状态的更新逻辑
  useEffect(() => {
    if (selectedEdgeId) {
      setEdges((eds) =>
        eds.map((edge) => ({
          ...edge,
          selected: edge.id === selectedEdgeId,
        }))
      );
    }
  }, [selectedEdgeId]);

  // 处理元件配置更新
  const handleElementUpdate = useCallback((nodeId: string, updates: Partial<CircuitNodeData>) => {
    console.log('开始更新元件:', nodeId, updates);
    
    setNodes(nds => 
      nds.map(node => {
        if (node.id === nodeId) {
          // 创建更新后的数据对象
          const updatedData = {
            ...node.data,
            ...updates
          };
          
          // 确保element属性正确更新
          if (updatedData.element) {
            updatedData.element = {
              ...updatedData.element,
              label: updates.label || updatedData.element.label,
              value: updates.value || updatedData.element.value,
              properties: {
                ...updatedData.element.properties,
                label: updates.label || updatedData.element.properties?.label,
                value: updates.value || updatedData.element.properties?.value
              }
            };
          }
          
          console.log('更新的节点数据:', updatedData);
          
          return {
            ...node,
            data: updatedData
          };
        }
        return node;
      })
    );
    
    // 关闭配置面板
    setConfigVisible(false);
    // 清空选中的元件
    setSelectedElement(null);
    
    console.log('元件更新完成');

    scheduleAutoSave();
  }, [scheduleAutoSave]);
  
  // 处理撤销
  const handleUndo = useCallback(() => {
    if (historyState.past.length === 0) return;
    
    const previous = historyState.past[historyState.past.length - 1];
    const newPast = historyState.past.slice(0, historyState.past.length - 1);
    
    setHistoryState({
      past: newPast,
      present: previous,
      future: [historyState.present, ...historyState.future]
    });
    
    // 恢复节点和边的状态
    setNodes(previous.nodes);
    setEdges(previous.edges);
    
    // 清除选中状态
    setSelectedNodeId(null);
    
    // 更新按钮状态
    setCanUndo(newPast.length > 0);
    setCanRedo(true);
  }, [historyState, setNodes, setEdges]);
  
  // 处理重做
  const handleRedo = useCallback(() => {
    if (historyState.future.length === 0) return;
    
    const next = historyState.future[0];
    const newFuture = historyState.future.slice(1);
    
    setHistoryState({
      past: [...historyState.past, historyState.present],
      present: next,
      future: newFuture
    });
    
    // 恢复节点和边的状态
    setNodes(next.nodes);
    setEdges(next.edges);
    
    // 清除选中状态
    setSelectedNodeId(null);
    
    // 更新按钮状态
    setCanUndo(true);
    setCanRedo(newFuture.length > 0);
  }, [historyState, setNodes, setEdges]);
  
  // 保存电路设计
  const handleSaveCircuit = useCallback(() => {
    const circuitDesign = convertToCircuitDesign();

    // 检查电路是否为空
    if (circuitDesign.elements.length === 0) {
      message.error('电路中没有元件，请先添加元件');
      return;
    }

    if (!persistedDesignId) {
      openSaveModal('save', circuitDesign);
      return;
    }

    quickSaveExistingCircuit('manual', circuitDesign);
  }, [convertToCircuitDesign, persistedDesignId, openSaveModal, quickSaveExistingCircuit]);

  const handleSaveAsCircuit = useCallback(() => {
    const circuitDesign = convertToCircuitDesign();
    if (circuitDesign.elements.length === 0) {
      message.error('电路中没有元件，请先添加元件');
      return;
    }
    openSaveModal('saveAs', circuitDesign);
  }, [convertToCircuitDesign, openSaveModal]);
  
  // 清空电路
  const handleClearCircuit = useCallback(() => {
    Modal.confirm({
      title: '确认清空电路？',
      content: '此操作将删除所有元件和连接，且不可恢复',
      okText: '确认清空',
      okType: 'danger',
      cancelText: '取消',
      onOk: () => {
        setNodes([]);
        setEdges([]);
        message.success('电路已清空');
      }
    });
  }, []);
  
  // 处理节点选择状态变化，更新工具栏按钮状态
  useEffect(() => {
    // 当节点被选中时，确保相关按钮可用
    if (selectedNodeId) {
      console.log('节点已选中:', selectedNodeId, '可以操作相关按钮');
      
      // 更新节点的选中样式
      setNodes((nds) =>
        nds.map((node) => ({
          ...node,
          selected: node.id === selectedNodeId,
          style: {
            ...node.style,
            // 为选中的节点添加高亮边框
            boxShadow: node.id === selectedNodeId ? '0 0 0 2px #1890ff' : undefined,
            zIndex: node.id === selectedNodeId ? 1000 : undefined,
          },
        }))
      );
    } else {
      console.log('没有选中节点，相关按钮将被禁用');
      // 当没有节点被选中时，清除所有节点的选中样式
      setNodes((nds) =>
        nds.map((node) => ({
          ...node,
          selected: false,
          style: {
            ...node.style,
            boxShadow: undefined,
            zIndex: undefined,
          },
        }))
      );
    }
  }, [selectedNodeId]);

  // 监听节点双击事件，打开配置面板
  useEffect(() => {
    const handleNodeDoubleClicked = (event: CustomEvent) => {
      const { nodeId } = event.detail;
      handleNodeDoubleClick(nodeId);
    };
    
    document.addEventListener('circuit-node-double-clicked', handleNodeDoubleClicked as EventListener);
    
    return () => {
      document.removeEventListener('circuit-node-double-clicked', handleNodeDoubleClicked as EventListener);
    };
  }, [handleNodeDoubleClick]);

  // 使用React.useMemo来优化ComponentConfig的渲染
  const componentConfigElement = React.useMemo(() => {
    return (
      <ComponentConfig 
        element={selectedElement}
        visible={configVisible}
        onClose={() => {
          setConfigVisible(false);
          setSelectedElement(null);
        }}
        onUpdate={handleElementUpdate}
      />
    );
  }, [selectedElement, configVisible, handleElementUpdate]);
  
  const availableScopeChannels = React.useMemo(() => {
    if (!activeMeasurementResult || activeMeasurementResult.elementType !== CircuitElementType.OSCILLOSCOPE) {
      return [];
    }
    const channelKeys = Object.keys(activeMeasurementResult.channelWaveforms || {});
    if (channelKeys.length > 0) return channelKeys;
    if (activeMeasurementResult.channels && activeMeasurementResult.channels.length > 0) {
      return activeMeasurementResult.channels;
    }
    if (activeMeasurementResult.nets && activeMeasurementResult.nets.length > 0) {
      return activeMeasurementResult.nets;
    }
    return [];
  }, [activeMeasurementResult]);
  
  const activeWaveform = React.useMemo(() => {
    if (!activeMeasurementResult) return null;
    if (activeMeasurementResult.elementType === CircuitElementType.OSCILLOSCOPE) {
      const selectedChannel = activeScopeChannel || availableScopeChannels[0] || null;
      const channelWaveform = selectedChannel
        ? activeMeasurementResult.channelWaveforms?.[selectedChannel]
        : null;
      if (channelWaveform && channelWaveform.length > 0) {
        return channelWaveform;
      }
    }
    return activeMeasurementResult.waveform || null;
  }, [activeMeasurementResult, activeScopeChannel, availableScopeChannels]);
  
  const waveformChartConfig = React.useMemo(() => {
    if (!activeWaveform || activeWaveform.length === 0) {
      return null;
    }
    
    return {
      data: activeWaveform,
      xField: 'time',
      yField: 'value',
      smooth: true,
      height: 220,
      autoFit: true,
      xAxis: { title: { text: '时间 (ms)' } },
      yAxis: { title: { text: '幅值' } },
      tooltip: { showMarkers: true },
      padding: [20, 10, 40, 50],
    };
  }, [activeWaveform]);
  const hasPersistedDesign = Boolean(persistedDesignId);

  return (
    <div ref={reactFlowWrapper} className="flex flex-row w-full h-full bg-white">
      {/* 左侧元件库面板 */}
      {!isReadOnly && showElementLibrary && (
        <div className="w-64 h-full overflow-auto border-r border-gray-200">
          <ElementLibrary 
            onSelectElement={addNewNode} 
            categories={paletteCategories}
          />
        </div>
      )}
      
      {/* 主画布区域 */}
      <div className="flex-1 flex flex-col h-full">
        {/* 工具栏 */}
        {!isReadOnly && (
          <div className="flex justify-between items-center">
            <CircuitToolbar 
              onSave={handleSaveCircuit}
              onSaveAs={hasPersistedDesign ? handleSaveAsCircuit : undefined}
              onUndo={handleUndo}
              onRedo={handleRedo}
              onCopy={() => {
                // 复制选中节点
                if (selectedNodeId) {
                  // TODO: 实现复制功能
                  message.info('复制功能开发中');
                }
              }}
              onDelete={deleteSelectedNode}
              onRotate={handleRotate}
              onZoomIn={() => reactFlowInstance.zoomIn()}
              onZoomOut={() => reactFlowInstance.zoomOut()}
              onFitView={() => reactFlowInstance.fitView()}
              onFullScreen={() => setFullScreenMode(!fullScreenMode)}
              onAnalysis={handleAnalyzeCircuit}
              onRunSimulation={handleRunSimulation}
              onClear={handleClearCircuit}
              isAnalyzing={isAnalyzing}
              isSimulating={isSimulating}
              selectedModel={currentModel}
              onModelChange={(model) => {
                setCurrentModel(model);
                if (onModelChange) {
                  onModelChange(model);
                }
              }}
              canUndo={canUndo}
              canRedo={canRedo}
              hasSelectedNode={!!selectedNodeId}
              hasContent={nodes.length > 0 || edges.length > 0}
              canSaveAs={hasPersistedDesign && (nodes.length > 0 || edges.length > 0)}
              onImageImport={handleImageImportClick}
              isImportingImage={isImportingFromImage}
            />
          </div>
        )}
      
        {/* 流程图区域 */}
        <div className="flex-1">
          <ReactFlow
            nodes={nodes}
            edges={edges}
            onNodesChange={isReadOnly ? undefined : onNodesChange}
            onEdgesChange={isReadOnly ? undefined : onEdgesChange}
            onConnect={isReadOnly ? undefined : onConnect}
            nodeTypes={nodeTypes}
            edgeTypes={edgeTypes}
            connectionLineComponent={ConnectionPreview}
            deleteKeyCode={isReadOnly ? null : ['Backspace', 'Delete']}
            multiSelectionKeyCode={isReadOnly ? null : ['Control', 'Meta']}
            snapToGrid={true}
            snapGrid={[15, 15]}
            defaultViewport={{ x: 0, y: 0, zoom: 1 }}
            fitView
            attributionPosition="bottom-left"
            // @ts-ignore
            connectionMode="loose"
            defaultMarkerColor="#3B82F6"
            connectOnClick={!isReadOnly}
            connectionRadius={20}
            isValidConnection={() => !isReadOnly}
            onNodeClick={isReadOnly ? undefined : handleNodeClick}
            onNodeDoubleClick={isReadOnly ? undefined : (event, node) => {
              // 阻止事件传播，避免与ReactFlow内置行为冲突
              event.preventDefault();
              event.stopPropagation();
              
              // 触发自定义事件
              const doubleClickEvent = new CustomEvent('circuit-node-double-clicked', {
                detail: { nodeId: node.id }
              });
              document.dispatchEvent(doubleClickEvent);
            }}
            onEdgeClick={isReadOnly ? undefined : onEdgeClick}
            onPaneClick={onPaneClick}
            elementsSelectable={!isReadOnly}
            selectNodesOnDrag={!isReadOnly}
            edgesFocusable={!isReadOnly}
            edgesUpdatable={!isReadOnly}
            nodesDraggable={!isReadOnly}
            nodesConnectable={!isReadOnly}
            zoomOnScroll={true}
            panOnScroll={false}
            zoomOnDoubleClick={false}
            disableKeyboardA11y={true}
            className="circuit-flow-canvas"
          >
            <Background />
            <Controls />
          </ReactFlow>
        </div>
        
        {/* 状态信息栏 */}
        <div className="bg-gray-50 border-t border-gray-200 p-2 text-xs text-gray-600 flex justify-between items-center">
          <div>元件: {nodes.length} | 连接: {edges.length}</div>
          
          {selectedNodeId && (
            <div className="text-blue-600">
              已选择: {nodes.find(node => node.id === selectedNodeId)?.data.label || selectedNodeId}
            </div>
          )}
          
          <div className="flex items-center gap-3">
            {simulationStale && (
              <span className="text-amber-600">仿真结果已失效，请重新运行</span>
            )}
            <button 
              className="text-gray-500 hover:text-gray-800 transition-colors"
              onClick={() => setShowElementLibrary(!showElementLibrary)}
            >
              {showElementLibrary ? '隐藏元件库' : '显示元件库'}
            </button>
          </div>
        </div>
      </div>
      
      {/* 使用优化后的组件配置面板 */}
      {componentConfigElement}

      {/* 保存电路表单弹窗 */}
      <SaveCircuitModal
        visible={saveModalVisible}
        circuitDesign={currentCircuitDesign}
        onClose={() => {
          setSaveModalVisible(false);
          setCurrentCircuitDesign(null);
        }}
        onSuccess={handleSaveModalSuccess}
        mode={saveModalMode}
        initialValues={saveModalInitialValues}
      />

      <Modal
        title="AI 图片识别导入"
        open={isImportModalVisible}
        onCancel={handleImportModalClose}
        footer={null}
        destroyOnClose
        width={520}
      >
        <div className="space-y-3 text-sm text-gray-600">
          <p>上传线下电路图或手绘草图，系统会尝试解析并转换为可编辑的画布设计。</p>
          <ul className="list-disc list-inside text-xs text-gray-500">
            <li>支持 PNG/JPG 图片，建议保持线条清晰。</li>
            <li>识别成功会直接更新当前画布，请在导入前保存重要设计。</li>
          </ul>
        </div>
        <ImageUploader
          className="mt-4"
          customRecognizeFn={recognizeCircuitImage}
          onExtraData={handleCircuitDesignFromImage}
          enableMathDetection={false}
          resultTitle="识别摘要"
          onLoadingChange={setIsImportingFromImage}
          showStartButton={true}
        />
      </Modal>
      
      <Modal
        title={activeMeasurementResult ? `${activeMeasurementResult.label} 测量结果` : '测量结果'}
        open={measurementModalVisible}
        onCancel={() => {
          setMeasurementModalVisible(false);
          setActiveMeasurementResult(null);
        }}
        footer={null}
        width={640}
      >
        {activeMeasurementResult ? (
          <div className="space-y-4">
            <div className="text-xs text-gray-500">
              仪表类型：{measurementTypeLabels[activeMeasurementResult.type] || activeMeasurementResult.type}
            </div>
            {activeMeasurementResult.nets && activeMeasurementResult.nets.length > 0 && (
              <div className="text-[11px] text-gray-500 flex flex-wrap gap-2">
                <span className="text-gray-600">关联节点:</span>
                {activeMeasurementResult.nets.map((n) => (
                  <span key={n} className="rounded bg-gray-100 px-2 py-0.5 text-gray-700 border border-gray-200">
                    {n}
                  </span>
                ))}
              </div>
            )}
            {activeMeasurementResult.elementType === CircuitElementType.OSCILLOSCOPE && availableScopeChannels.length > 0 && (
              <div className="flex items-center gap-2 text-[11px] text-gray-600">
                <span className="text-gray-500">通道选择:</span>
                {availableScopeChannels.map(ch => (
                  <button
                    key={ch}
                    className={`px-2 py-0.5 rounded border text-xs transition ${activeScopeChannel === ch ? 'bg-blue-50 border-blue-400 text-blue-700' : 'border-gray-200 text-gray-700 hover:border-blue-300'}`}
                    onClick={() => setActiveScopeChannel(ch)}
                  >
                    {ch}
                  </button>
                ))}
              </div>
            )}
            <div className="grid grid-cols-2 gap-3">
              {Object.entries(activeMeasurementResult.metrics || {}).map(([key, value]) => (
                <div key={key} className="rounded border border-gray-100 bg-gray-50 px-3 py-2">
                  <div className="text-[11px] text-gray-500">{measurementMetricLabels[key] || key}</div>
                  <div className="text-base font-semibold text-gray-800">
                    {typeof value === 'number'
                      ? formatMeasurementValue(value, measurementMetricUnits[key])
                      : value}
                  </div>
                </div>
              ))}
            </div>
            {waveformChartConfig ? (
              <div className="rounded border border-gray-100 p-2 bg-white">
                <Line {...waveformChartConfig} />
                {activeScopeChannel && (
                  <div className="mt-2 text-[11px] text-gray-500">当前波形通道: {activeScopeChannel}</div>
                )}
              </div>
            ) : (
              <div className="text-xs text-gray-500">当前仪表不提供波形显示。</div>
            )}
          </div>
        ) : (
          <div className="text-sm text-gray-500">暂无测量数据，请先运行模拟。</div>
        )}
      </Modal>

      <Modal
        title="数字仿真波形"
        open={digitalSimModalVisible}
        onCancel={() => setDigitalSimModalVisible(false)}
        footer={(
          <div className="flex w-full flex-wrap items-center justify-between gap-2">
            <div className="text-xs text-gray-500">
              {digitalSimResult?.warnings?.length ? digitalSimResult.warnings.join(' / ') : '仿真完成，可下载 VCD 查看完整波形'}
            </div>
            <div className="flex gap-2">
              <Button onClick={handleDownloadDigitalVcd} disabled={!digitalSimResult?.rawVcd}>
                下载 VCD
              </Button>
              <Button type="primary" onClick={() => setDigitalSimModalVisible(false)}>
                关闭
              </Button>
            </div>
          </div>
        )}
        width={760}
      >
        {digitalSimResult ? (
          <div className="space-y-4">
            {digitalSimResult.waveforms.length ? digitalSimResult.waveforms.map((trace) => (
              <div key={trace.signal} className="rounded-md border border-slate-200 bg-white p-3 shadow-sm">
                <div className="flex items-center justify-between text-sm font-medium text-slate-700">
                  <div>
                    {trace.label || trace.signal}
                    {trace.role && (
                      <span className="ml-2 rounded bg-slate-100 px-2 py-0.5 text-[11px] font-normal uppercase text-slate-500">
                        {trace.role}
                      </span>
                    )}
                  </div>
                  <span className="text-xs text-slate-400">{trace.samples.length} 点</span>
                </div>
                <div className="mt-2 flex flex-wrap gap-2 text-xs text-slate-600">
                  {trace.samples.length ? trace.samples.slice(0, 32).map((sample) => (
                    <code
                      key={`${trace.signal}-${sample.time}`}
                      className="rounded bg-slate-100 px-2 py-0.5 font-mono text-[11px]"
                    >
                      t={sample.time}ns → {sample.value}
                    </code>
                  )) : (
                    <span className="text-slate-400">暂无波形数据</span>
                  )}
                </div>
              </div>
            )) : (
              <div className="rounded border border-dashed border-slate-200 p-6 text-center text-sm text-slate-500">
                未捕获任何波形信号，请检查是否添加了数字输入/输出。
              </div>
            )}
          </div>
        ) : (
          <div className="rounded border border-dashed border-slate-200 p-6 text-center text-sm text-slate-500">
            暂无仿真结果。
          </div>
        )}
      </Modal>

      {isAnalyzing && (
        <div style={{ 
          position: 'absolute', 
          top: 0, 
          left: 0, 
          width: '100%', 
          height: '100%', 
          display: 'flex', 
          justifyContent: 'center', 
          alignItems: 'center',
          backgroundColor: 'rgba(255, 255, 255, 0.8)',
          zIndex: 1000
        }}>
          <Spin size="large" spinning={true} />
        </div>
      )}
    </div>
  );
};

export const CircuitFlowWithProvider = ({ onCircuitDesignChange, selectedModel, initialCircuitDesign, isReadOnly, classId, onModelChange, workspaceMode }: CircuitFlowProps) => (
  <ReactFlowProvider>
    <CircuitFlow 
      onCircuitDesignChange={onCircuitDesignChange}
      selectedModel={selectedModel}
      initialCircuitDesign={initialCircuitDesign}
      isReadOnly={isReadOnly}
      classId={classId}
      onModelChange={onModelChange}
      workspaceMode={workspaceMode}
    />
  </ReactFlowProvider>
);
