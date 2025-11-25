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
  XYPosition,
} from 'reactflow';
import { Button, message, Modal, Spin } from 'antd';
import 'reactflow/dist/style.css';
import { CircuitNode } from './CircuitNode';
import ConnectionEdge, { ConnectionPreview } from './ConnectionEdge';
import ComponentConfig from './ComponentConfig';
import {
  CircuitElementType,
  CircuitDesign,
  Port,
  CircuitElement,
  CircuitConnection
} from '@/api/types/circuit.types';
import { createAiTask } from '@/api/methods/flow.methods';
import { updateCircuitDesign } from '@/api/methods/circuit.methods';
import { recognizeCircuitDesignFromImage } from '@/api/methods/tool.methods';
import { CircuitNodeData } from '../types';
import { useAppContext } from '@/app/contexts/AppContext';
import { CreateAiTaskDTO } from '@/api/types/flow.types';
import { useHotkeys } from 'react-hotkeys-hook';
import { ModelType as FlowModelType } from '@/app/pages/flow/components/input/FlowInputPanel';
import ElementLibrary, { ElementCategory } from './ElementLibrary';
import CircuitToolbar from './CircuitToolbar';
import JunctionNode from './JunctionNode';
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
import { nanoid } from 'nanoid';

// 唯一节点ID生成
let nodeIdCounter = 1;
const getNewNodeId = () => `node-${nodeIdCounter++}`;

// 定义节点类型
const nodeTypes = {
  circuitNode: CircuitNode,
  junctionNode: JunctionNode,
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
  [CircuitElementType.AC_SOURCE]: 'VAC',
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

const serializeCircuitDesignSnapshot = (design?: CircuitDesign | null): string => JSON.stringify({
  elements: design?.elements ?? [],
  connections: design?.connections ?? [],
  metadata: {
    title: design?.metadata?.title ?? '',
    description: design?.metadata?.description ?? ''
  }
});

type CircuitWorkspaceMode = 'analog' | 'digital' | 'hybrid';

type WireAnchor = {
  nodeId: string;
  handleId: string | null;
  handleType: 'source' | 'target';
  autoHandle?: boolean;
};

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
      { type: CircuitElementType.CURRENT_SOURCE, name: '电流源 (I)', shortcut: 'I' },
      { type: CircuitElementType.AC_SOURCE, name: '交流信号源 (AC)', shortcut: 'A' }
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
      { type: CircuitElementType.OPAMP, name: '运算放大器', shortcut: 'O' }
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
  { key: CircuitElementType.AC_SOURCE, label: '交流信号源 (AC)' },
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
  [CircuitElementType.AC_SOURCE]: [
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
  [CircuitElementType.JUNCTION]: [
    { id: 'port-left', name: 'Left', type: 'bidirectional' as const, position: { side: 'left' as const, x: 0, y: 50, align: 'center' as const } },
    { id: 'port-right', name: 'Right', type: 'bidirectional' as const, position: { side: 'right' as const, x: 100, y: 50, align: 'center' as const } },
    { id: 'port-top', name: 'Top', type: 'bidirectional' as const, position: { side: 'top' as const, x: 50, y: 0, align: 'center' as const } },
    { id: 'port-bottom', name: 'Bottom', type: 'bidirectional' as const, position: { side: 'bottom' as const, x: 50, y: 100, align: 'center' as const } }
  ],
};

const DIGITAL_ELEMENT_TYPES = new Set<CircuitElementType>([
  CircuitElementType.DIGITAL_INPUT,
  CircuitElementType.DIGITAL_OUTPUT,
  CircuitElementType.DIGITAL_CLOCK,
  CircuitElementType.DIGITAL_AND,
  CircuitElementType.DIGITAL_OR,
  CircuitElementType.DIGITAL_NOT,
  CircuitElementType.DIGITAL_NAND,
  CircuitElementType.DIGITAL_NOR,
  CircuitElementType.DIGITAL_XOR,
  CircuitElementType.DIGITAL_XNOR,
  CircuitElementType.DIGITAL_DFF,
]);

const ANALOG_ELEMENT_TYPES = new Set<CircuitElementType>([
  CircuitElementType.RESISTOR,
  CircuitElementType.CAPACITOR,
  CircuitElementType.INDUCTOR,
  CircuitElementType.VOLTAGE_SOURCE,
  CircuitElementType.CURRENT_SOURCE,
  CircuitElementType.AC_SOURCE,
  CircuitElementType.DIODE,
  CircuitElementType.TRANSISTOR_NPN,
  CircuitElementType.TRANSISTOR_PNP,
  CircuitElementType.GROUND,
  CircuitElementType.OPAMP,
  CircuitElementType.AMMETER,
  CircuitElementType.VOLTMETER,
  CircuitElementType.OSCILLOSCOPE,
]);

const ANALOG_COLUMN_GROUPS: CircuitElementType[][] = [
  [CircuitElementType.VOLTAGE_SOURCE, CircuitElementType.CURRENT_SOURCE, CircuitElementType.AC_SOURCE],
  [CircuitElementType.RESISTOR, CircuitElementType.CAPACITOR, CircuitElementType.INDUCTOR, CircuitElementType.DIODE],
  [CircuitElementType.TRANSISTOR_NPN, CircuitElementType.TRANSISTOR_PNP, CircuitElementType.OPAMP],
  [CircuitElementType.AMMETER, CircuitElementType.VOLTMETER, CircuitElementType.OSCILLOSCOPE, CircuitElementType.GROUND],
];

const analogColumnIndexMap = ANALOG_COLUMN_GROUPS.reduce<Map<CircuitElementType, number>>((map, columnTypes, columnIndex) => {
  columnTypes.forEach((type) => map.set(type, columnIndex));
  return map;
}, new Map<CircuitElementType, number>());

const analogLabelHints: Array<{ keywords: RegExp; type: CircuitElementType }> = [
  { keywords: /(VCC|VDD|VSS|VBAT|UCC|VIN|VREF|VBIAS|VDC|SUPPLY|电源)/i, type: CircuitElementType.VOLTAGE_SOURCE },
  { keywords: /(VAC|AC\s*IN|ACIN|SINE|Sin|信号源|Vin_ac|Vsig|波形)/i, type: CircuitElementType.AC_SOURCE },
  { keywords: /(IREF|IBIAS|ITAIL|IIN|IOUT|恒流|ISRC|CURRENT)/i, type: CircuitElementType.CURRENT_SOURCE },
  { keywords: /(OSC|scope|示波器|Probe|CH\d+)/i, type: CircuitElementType.OSCILLOSCOPE },
  { keywords: /(VM|Vmeter|voltmeter|电压表)/i, type: CircuitElementType.VOLTMETER },
  { keywords: /(AM|ammeter|Imeter|电流表)/i, type: CircuitElementType.AMMETER },
];

const analogVoltageAnnotationPattern = /(Ube|Vbe|Uce|Vce|Ucb|Vcb|Ubc|Vbc)/i;
const resistorBasePattern = /(Rb|R_b|Rbase|BiasR|Rbias)/i;
const resistorCollectorPattern = /(Rc|R_c|Rcol|Rload)/i;
const resistorEmitterPattern = /(Re|R_e|Remit|Ree)/i;
const supplyUccPattern = /(UCC|VCC|VDD|VSS|VBAT|SUPPLY)/i;

const labelTypeHints: Array<{ keywords: RegExp; type: CircuitElementType }> = [
  { keywords: /NAND/i, type: CircuitElementType.DIGITAL_NAND },
  { keywords: /NOR/i, type: CircuitElementType.DIGITAL_NOR },
  { keywords: /XNOR/i, type: CircuitElementType.DIGITAL_XNOR },
  { keywords: /XOR/i, type: CircuitElementType.DIGITAL_XOR },
  { keywords: /AND/i, type: CircuitElementType.DIGITAL_AND },
  { keywords: /OR/i, type: CircuitElementType.DIGITAL_OR },
  { keywords: /NOT|INV|INVERTER/i, type: CircuitElementType.DIGITAL_NOT },
  { keywords: /^Q$/i, type: CircuitElementType.DIGITAL_DFF },
];

const normalizeElementType = (type: CircuitElementType, label?: string): CircuitElementType => {
  if (!label) return type;
  const analogHint = analogLabelHints.find(entry => entry.keywords.test(label));
  if (analogHint) {
    return analogHint.type;
  }
  const digitalHint = labelTypeHints.find(entry => entry.keywords.test(label));
  return digitalHint ? digitalHint.type : type;
};

const clonePorts = (ports: Port[]) => ports.map(port => ({
  ...port,
  position: {
    ...port.position,
    align: port.position?.align || 'center'
  }
}));

const getElementResolvedLabel = (element: CircuitElement) => {
  const propertyLabel = typeof element.properties?.['label'] === 'string'
    ? (element.properties['label'] as string)
    : undefined;
  return element.label || propertyLabel || element.id;
};

const sanitizeAnalogElements = (
  elements: CircuitElement[],
  connections: CircuitConnection[]
) => {
  const removableIds = new Set<string>();
  elements.forEach((element) => {
    if (
      analogVoltageAnnotationPattern.test(getElementResolvedLabel(element)) &&
      (
        element.type === CircuitElementType.VOLTAGE_SOURCE ||
        element.type === CircuitElementType.AC_SOURCE ||
        element.type === CircuitElementType.CURRENT_SOURCE ||
        element.type === CircuitElementType.VOLTMETER
      )
    ) {
      removableIds.add(element.id);
    }
  });

  if (removableIds.size === 0) {
    return { elements, connections };
  }

  const filteredElements = elements.filter((element) => !removableIds.has(element.id));
  const filteredConnections = connections.filter(
    (connection) =>
      !removableIds.has(connection.source.elementId) &&
      !removableIds.has(connection.target.elementId)
  );
  return {
    elements: filteredElements,
    connections: filteredConnections,
  };
};

const autoCompleteAnalogConnections = (
  elements: CircuitElement[],
  connections: CircuitConnection[]
) => {
  const bjts = elements.filter(
    (element) =>
      element.type === CircuitElementType.TRANSISTOR_NPN ||
      element.type === CircuitElementType.TRANSISTOR_PNP
  );
  if (bjts.length === 0) {
    return connections;
  }

  const workingConnections = [...connections];
  const connectionExists = (aId: string, aPort: string, bId: string, bPort: string) =>
    workingConnections.some((connection) => {
      const matchesForward =
        connection.source.elementId === aId &&
        connection.source.portId === aPort &&
        connection.target.elementId === bId &&
        connection.target.portId === bPort;
      const matchesReverse =
        connection.source.elementId === bId &&
        connection.source.portId === bPort &&
        connection.target.elementId === aId &&
        connection.target.portId === aPort;
      return matchesForward || matchesReverse;
    });

  const countPortConnections = (elementId: string, portId: string) =>
    workingConnections.reduce((acc, connection) => {
      if (
        (connection.source.elementId === elementId && connection.source.portId === portId) ||
        (connection.target.elementId === elementId && connection.target.portId === portId)
      ) {
        return acc + 1;
      }
      return acc;
    }, 0);

  const ensureConnection = (sourceId: string, sourcePort: string, targetId: string, targetPort: string) => {
    if (connectionExists(sourceId, sourcePort, targetId, targetPort)) {
      return;
    }
    workingConnections.push({
      id: `auto-${nanoid(8)}`,
      source: { elementId: sourceId, portId: sourcePort },
      target: { elementId: targetId, portId: targetPort },
    });
  };

  const findResistorByLabel = (pattern: RegExp) =>
    elements.find(
      (element) =>
        element.type === CircuitElementType.RESISTOR &&
        pattern.test(getElementResolvedLabel(element))
    );

  const findSupply = () =>
    elements.find(
      (element) =>
        powerSourceElementTypes.has(element.type as CircuitElementType) &&
        supplyUccPattern.test(getElementResolvedLabel(element))
    );

  const groundElement = elements.find((element) => element.type === CircuitElementType.GROUND);

  bjts.forEach((bjt) => {
    const baseConnected = countPortConnections(bjt.id, 'base') > 0;
    const collectorConnected = countPortConnections(bjt.id, 'collector') > 0;
    const emitterConnected = countPortConnections(bjt.id, 'emitter') > 0;

    const baseResistor = findResistorByLabel(resistorBasePattern);
    const collectorResistor = findResistorByLabel(resistorCollectorPattern);
    const emitterResistor = findResistorByLabel(resistorEmitterPattern);
    const supply = findSupply();

    if (!baseConnected && baseResistor) {
      ensureConnection(baseResistor.id, 'port2', bjt.id, 'base');
    }
    if (!collectorConnected) {
      if (collectorResistor) {
        ensureConnection(collectorResistor.id, 'port2', bjt.id, 'collector');
      } else if (supply) {
        ensureConnection(supply.id, 'positive', bjt.id, 'collector');
      }
    }
    if (!emitterConnected) {
      if (emitterResistor) {
        ensureConnection(emitterResistor.id, 'port2', bjt.id, 'emitter');
      } else if (groundElement) {
        ensureConnection(bjt.id, 'emitter', groundElement.id, 'ground');
      }
    }

    if (baseResistor && countPortConnections(baseResistor.id, 'port1') === 0 && supply) {
      ensureConnection(supply.id, 'positive', baseResistor.id, 'port1');
    }
    if (collectorResistor && countPortConnections(collectorResistor.id, 'port1') === 0 && supply) {
      ensureConnection(supply.id, 'positive', collectorResistor.id, 'port1');
    }
    if (emitterResistor && countPortConnections(emitterResistor.id, 'port1') === 0 && groundElement) {
      ensureConnection(emitterResistor.id, 'port1', groundElement.id, 'ground');
    }
  });

  return workingConnections;
};

const removeInvalidPowerGroundShorts = (
  elements: CircuitElement[],
  connections: CircuitConnection[]
) => {
  if (!connections.length) return connections;
  const elementMap = new Map(elements.map((element) => [element.id, element]));
  return connections.filter((connection) => {
    const sourceElement = elementMap.get(connection.source.elementId);
    const targetElement = elementMap.get(connection.target.elementId);
    if (!sourceElement || !targetElement) {
      return true;
    }
    const sourceType = sourceElement.type as CircuitElementType;
    const targetType = targetElement.type as CircuitElementType;
    const sourceIsPositive = powerSourceElementTypes.has(sourceType) && connection.source.portId === 'positive';
    const targetIsPositive = powerSourceElementTypes.has(targetType) && connection.target.portId === 'positive';
    const sourceIsGround = sourceType === CircuitElementType.GROUND && connection.source.portId === 'ground';
    const targetIsGround = targetType === CircuitElementType.GROUND && connection.target.portId === 'ground';
    if ((sourceIsPositive && targetIsGround) || (targetIsPositive && sourceIsGround)) {
      return false;
    }
    return true;
  });
};

const ensurePowerNegativeGrounded = (
  elements: CircuitElement[],
  connections: CircuitConnection[]
) => {
  const ground = elements.find((element) => element.type === CircuitElementType.GROUND);
  if (!ground) {
    return connections;
  }
  const groundId = ground.id;
  const connectionExists = (sourceId: string, sourcePort: string, targetId: string, targetPort: string) =>
    connections.some(
      (connection) =>
        connection.source.elementId === sourceId &&
        connection.source.portId === sourcePort &&
        connection.target.elementId === targetId &&
        connection.target.portId === targetPort
    );

  const newConnections = [...connections];
  elements.forEach((element) => {
    if (!powerSourceElementTypes.has(element.type as CircuitElementType)) {
      return;
    }
    if (!connectionExists(element.id, 'negative', groundId, 'ground')) {
      newConnections.push({
        id: `auto-ground-${element.id}-${groundId}`,
        source: { elementId: element.id, portId: 'negative' },
        target: { elementId: groundId, portId: 'ground' },
      });
    }
  });

  return newConnections;
};

const isBjtBiasCandidate = (elements: CircuitElement[]) => {
  const hasBjt = elements.some(
    (element) =>
      element.type === CircuitElementType.TRANSISTOR_NPN ||
      element.type === CircuitElementType.TRANSISTOR_PNP
  );
  if (!hasBjt) return false;
  const hasSupply = elements.some((element) =>
    powerSourceElementTypes.has(element.type as CircuitElementType)
  );
  const hasGround = elements.some((element) => element.type === CircuitElementType.GROUND);
  const hasBiasResistor = elements.some(
    (element) =>
      element.type === CircuitElementType.RESISTOR &&
      (resistorBasePattern.test(getElementResolvedLabel(element)) ||
        resistorCollectorPattern.test(getElementResolvedLabel(element)) ||
        resistorEmitterPattern.test(getElementResolvedLabel(element)))
  );
  return hasBjt && hasSupply && hasGround && hasBiasResistor;
};

const rebuildBjtBiasConnections = (
  elements: CircuitElement[],
  connections: CircuitConnection[]
) => {
  if (!isBjtBiasCandidate(elements)) {
    return connections;
  }
  const transistor = elements.find(
    (element) =>
      element.type === CircuitElementType.TRANSISTOR_NPN ||
      element.type === CircuitElementType.TRANSISTOR_PNP
  );
  const ground = elements.find((element) => element.type === CircuitElementType.GROUND);
  const baseResistor = elements.find(
    (element) =>
      element.type === CircuitElementType.RESISTOR &&
      resistorBasePattern.test(getElementResolvedLabel(element))
  );
  const collectorResistor = elements.find(
    (element) =>
      element.type === CircuitElementType.RESISTOR &&
      resistorCollectorPattern.test(getElementResolvedLabel(element))
  );
  const emitterResistor = elements.find(
    (element) =>
      element.type === CircuitElementType.RESISTOR &&
      resistorEmitterPattern.test(getElementResolvedLabel(element))
  );
  const supplies = elements.filter((element) =>
    powerSourceElementTypes.has(element.type as CircuitElementType)
  );
  if (!transistor || !ground || !baseResistor || supplies.length === 0) {
    return connections;
  }

  const elementById = new Map(elements.map((element) => [element.id, element]));
  const findConnectedPowerSource = (elementId?: string, portId?: string) => {
    if (!elementId) return undefined;
    for (const connection of connections) {
      const matchSource =
        connection.source.elementId === elementId &&
        (!portId || connection.source.portId === portId);
      const matchTarget =
        connection.target.elementId === elementId &&
        (!portId || connection.target.portId === portId);
      if (matchSource) {
        const candidate = elementById.get(connection.target.elementId);
        if (candidate && powerSourceElementTypes.has(candidate.type as CircuitElementType)) {
          return candidate;
        }
      }
      if (matchTarget) {
        const candidate = elementById.get(connection.source.elementId);
        if (candidate && powerSourceElementTypes.has(candidate.type as CircuitElementType)) {
          return candidate;
        }
      }
    }
    return undefined;
  };

  const fallbackSupply = supplies[0];
  const baseSupply = findConnectedPowerSource(baseResistor.id, 'port1') || fallbackSupply;
  const rawCollectorSupply = collectorResistor
    ? findConnectedPowerSource(collectorResistor.id, 'port1')
    : baseSupply;
  const collectorSupply = rawCollectorSupply || baseSupply;

  const involvedIds = new Set<string>([
    baseSupply?.id,
    collectorSupply?.id,
    baseResistor.id,
    collectorResistor?.id,
    emitterResistor?.id,
    transistor.id,
    ground.id,
  ].filter((id): id is string => Boolean(id)));

  const preservedConnections = connections.filter((connection) => {
    const sourceInvolved = involvedIds.has(connection.source.elementId);
    const targetInvolved = involvedIds.has(connection.target.elementId);
    return !(sourceInvolved && targetInvolved);
  });

  const addConnection = (
    list: CircuitConnection[],
    seen: Set<string>,
    sourceId: string | undefined,
    sourcePort: string,
    targetId: string | undefined,
    targetPort: string
  ) => {
    if (!sourceId || !targetId) return;
    const key = `${sourceId}.${sourcePort}->${targetId}.${targetPort}`;
    if (seen.has(key)) return;
    seen.add(key);
    list.push({
      id: `bjt-${nanoid(8)}`,
      source: { elementId: sourceId, portId: sourcePort },
      target: { elementId: targetId, portId: targetPort },
    });
  };

  const canonicalConnections: CircuitConnection[] = [];
  const seen = new Set<string>();

  addConnection(canonicalConnections, seen, baseSupply?.id, 'positive', baseResistor.id, 'port1');
  addConnection(canonicalConnections, seen, baseResistor.id, 'port2', transistor.id, 'base');
  addConnection(
    canonicalConnections,
    seen,
    collectorSupply?.id,
    'positive',
    collectorResistor ? collectorResistor.id : transistor.id,
    collectorResistor ? 'port1' : 'collector'
  );
  if (collectorResistor) {
    addConnection(canonicalConnections, seen, collectorResistor.id, 'port2', transistor.id, 'collector');
  }
  if (emitterResistor) {
    addConnection(canonicalConnections, seen, emitterResistor.id, 'port2', transistor.id, 'emitter');
    addConnection(canonicalConnections, seen, emitterResistor.id, 'port1', ground.id, 'ground');
  } else {
    addConnection(canonicalConnections, seen, transistor.id, 'emitter', ground.id, 'ground');
  }
  addConnection(canonicalConnections, seen, baseSupply?.id, 'negative', ground.id, 'ground');
  if (collectorSupply && collectorSupply.id !== baseSupply?.id) {
    addConnection(canonicalConnections, seen, collectorSupply.id, 'negative', ground.id, 'ground');
  }

  return [...preservedConnections, ...canonicalConnections];
};


const applyBjtBiasLayout = (elements: CircuitElement[], connections: CircuitConnection[]) => {
  const layoutMap = new Map<string, { x: number; y: number }>();
  const rotationOverrides = new Map<string, number>();
  const elementById = new Map(elements.map((element) => [element.id, element]));

  const baseColumnX = 180;
  const collectorColumnX = 440;
  const baseSupplyY = 80;
  const baseResistorY = 240;
  const collectorSupplyY = 80;
  const collectorResistorY = 210;
  const transistorY = 360;
  const emitterResistorY = 520;
  const groundY = 660;

  const baseResistor = elements.find(
    (element) =>
      element.type === CircuitElementType.RESISTOR &&
      resistorBasePattern.test(getElementResolvedLabel(element))
  );
  const collectorResistor = elements.find(
    (element) =>
      element.type === CircuitElementType.RESISTOR &&
      resistorCollectorPattern.test(getElementResolvedLabel(element))
  );
  const emitterResistor = elements.find(
    (element) =>
      element.type === CircuitElementType.RESISTOR &&
      resistorEmitterPattern.test(getElementResolvedLabel(element))
  );
  const transistor = elements.find(
    (element) =>
      element.type === CircuitElementType.TRANSISTOR_NPN ||
      element.type === CircuitElementType.TRANSISTOR_PNP
  );
  const ground = elements.find((element) => element.type === CircuitElementType.GROUND);

  const findConnectedPowerSource = (elementId?: string, portId?: string) => {
    if (!elementId) return undefined;
    for (const connection of connections) {
      const isSourceMatch =
        connection.source.elementId === elementId &&
        (!portId || connection.source.portId === portId);
      const isTargetMatch =
        connection.target.elementId === elementId &&
        (!portId || connection.target.portId === portId);
      if (isSourceMatch) {
        const candidate = elementById.get(connection.target.elementId);
        if (candidate && powerSourceElementTypes.has(candidate.type as CircuitElementType)) {
          return candidate;
        }
      }
      if (isTargetMatch) {
        const candidate = elementById.get(connection.source.elementId);
        if (candidate && powerSourceElementTypes.has(candidate.type as CircuitElementType)) {
          return candidate;
        }
      }
    }
    return undefined;
  };

  const fallbackSupply = elements.find((element) =>
    powerSourceElementTypes.has(element.type as CircuitElementType)
  );
  const baseSupply = findConnectedPowerSource(baseResistor?.id, 'port1') || fallbackSupply;
  const rawCollectorSupply = findConnectedPowerSource(collectorResistor?.id, 'port1');
  const collectorSupply =
    rawCollectorSupply && rawCollectorSupply.id !== baseSupply?.id
      ? rawCollectorSupply
      : undefined;

  if (baseSupply) {
    layoutMap.set(baseSupply.id, { x: baseColumnX, y: baseSupplyY });
  }
  if (baseResistor) {
    layoutMap.set(baseResistor.id, { x: baseColumnX, y: baseResistorY });
    rotationOverrides.set(baseResistor.id, 90);
  }
  if (collectorSupply) {
    layoutMap.set(collectorSupply.id, { x: collectorColumnX, y: collectorSupplyY });
  }
  if (collectorResistor) {
    layoutMap.set(collectorResistor.id, { x: collectorColumnX, y: collectorResistorY });
    rotationOverrides.set(collectorResistor.id, 90);
  }
  if (transistor) {
    layoutMap.set(transistor.id, { x: collectorColumnX, y: transistorY });
  }
  if (emitterResistor) {
    layoutMap.set(emitterResistor.id, { x: collectorColumnX, y: emitterResistorY });
    rotationOverrides.set(emitterResistor.id, 90);
  }
  if (ground) {
    layoutMap.set(ground.id, { x: collectorColumnX, y: groundY });
  }

  return elements.map((element) => {
    const layout = layoutMap.get(element.id);
    const rotationOverride = rotationOverrides.get(element.id);
    if (!layout && rotationOverride === undefined) {
      return element;
    }
    return {
      ...element,
      position: layout
        ? {
            x: layout.x,
            y: layout.y,
          }
        : element.position,
      rotation: rotationOverride !== undefined ? rotationOverride : element.rotation,
    };
  });
};

const normalizeElementPorts = (element: CircuitElement): Port[] => {
  const defaults = defaultPorts[element.type as keyof typeof defaultPorts];
  const existing = element.ports ? clonePorts(element.ports) : [];
  if (!defaults) {
    return existing;
  }

  if (existing.length === 0) {
    return clonePorts(defaults);
  }

  const positionMissing = existing.some(port => !port.position || typeof port.position.x !== 'number' || typeof port.position.y !== 'number');
  const overlapping = (() => {
    const seen = new Set<string>();
    return existing.some(port => {
      const key = `${port.position?.side}-${Math.round(port.position?.y ?? 0)}`;
      if (seen.has(key)) {
        return true;
      }
      seen.add(key);
      return false;
    });
  })();

  if (positionMissing || overlapping || existing.length !== defaults.length) {
    return clonePorts(defaults);
  }

  return existing;
};

const clusterCenters = (values: number[], threshold: number) => {
  if (!values.length) return [0];
  const sorted = [...values].sort((a, b) => a - b);
  const centers: number[] = [];
  let clusterSum = sorted[0];
  let clusterCount = 1;
  let lastValue = sorted[0];
  for (let i = 1; i < sorted.length; i++) {
    const value = sorted[i];
    if (Math.abs(value - lastValue) > threshold) {
      centers.push(clusterSum / clusterCount);
      clusterSum = value;
      clusterCount = 1;
    } else {
      clusterSum += value;
      clusterCount += 1;
    }
    lastValue = value;
  }
  centers.push(clusterSum / clusterCount);
  return centers;
};

const mapToGridPosition = (value: number, centers: number[], spacing: number, padding: number) => {
  if (!centers.length) return padding;
  let bestIndex = 0;
  let bestDelta = Infinity;
  centers.forEach((center, idx) => {
    const delta = Math.abs(value - center);
    if (delta < bestDelta) {
      bestDelta = delta;
      bestIndex = idx;
    }
  });
  return padding + bestIndex * spacing;
};

const enhanceDigitalLayout = (elements: CircuitElement[]) => {
  if (!elements.length) return elements;
  const xValues = elements.map(el => el.position?.x ?? 0);
  const yValues = elements.map(el => el.position?.y ?? 0);
  const xCenters = clusterCenters(xValues, 140);
  const yCenters = clusterCenters(yValues, 90);
  const columnSpacing = 200;
  const rowSpacing = 130;
  const paddingX = 60;
  const paddingY = 60;

  return elements.map(element => {
    const currentPos = element.position || { x: 0, y: 0 };
    return {
      ...element,
      position: {
        x: mapToGridPosition(currentPos.x, xCenters, columnSpacing, paddingX),
        y: mapToGridPosition(currentPos.y, yCenters, rowSpacing, paddingY)
      }
    };
  });
};

const enhanceAnalogLayout = (elements: CircuitElement[]) => {
  if (!elements.length) return elements;
  const analogElements = elements.filter((element) =>
    ANALOG_ELEMENT_TYPES.has(element.type as CircuitElementType)
  );
  if (analogElements.length === 0) {
    return elements;
  }

  const columnSpacing = 220;
  const rowSpacing = 130;
  const paddingX = 80;
  const paddingY = 80;

  const columnBuckets = new Map<number, CircuitElement[]>();
  analogElements.forEach((element) => {
    const type = element.type as CircuitElementType;
    const columnIndex = analogColumnIndexMap.get(type) ?? 1;
    const bucket = columnBuckets.get(columnIndex) ?? [];
    bucket.push(element);
    columnBuckets.set(columnIndex, bucket);
  });

  const positioned = new Map<string, { x: number; y: number }>();
  columnBuckets.forEach((bucket, columnIndex) => {
    bucket.sort((a, b) => (a.position?.y ?? 0) - (b.position?.y ?? 0));
    bucket.forEach((element, rowIndex) => {
      const newX = paddingX + columnIndex * columnSpacing;
      const baseY = paddingY + rowIndex * rowSpacing;
      const adjustedY = element.type === CircuitElementType.GROUND
        ? baseY + rowSpacing * 0.5
        : baseY;
      positioned.set(element.id, {
        x: newX,
        y: adjustedY
      });
    });
  });

  return elements.map((element) => {
    const mapped = positioned.get(element.id);
    if (!mapped) {
      return element;
    }
    return {
      ...element,
      position: {
        x: mapped.x,
        y: mapped.y,
      }
    };
  });
};

const determineJunctionHandle = (from: XYPosition | undefined, to: XYPosition): string => {
  if (!from) {
    return 'port-right';
  }
  const dx = to.x - from.x;
  const dy = to.y - from.y;
  if (Math.abs(dx) >= Math.abs(dy)) {
    return dx >= 0 ? 'port-right' : 'port-left';
  }
  return dy >= 0 ? 'port-bottom' : 'port-top';
};

const measurementElementTypes = new Set<CircuitElementType>([
  CircuitElementType.AMMETER,
  CircuitElementType.VOLTMETER,
  CircuitElementType.OSCILLOSCOPE,
]);

const powerSourceElementTypes = new Set<CircuitElementType>([
  CircuitElementType.VOLTAGE_SOURCE,
  CircuitElementType.CURRENT_SOURCE,
  CircuitElementType.AC_SOURCE,
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
  onUnsavedChange?: (hasUnsavedChanges: boolean) => void;
}

export const CircuitFlow = ({ onCircuitDesignChange, selectedModel = 'deepseekV3', initialCircuitDesign, isReadOnly = false, classId = null, onModelChange, workspaceMode: workspaceModeProp = 'analog', onUnsavedChange }: CircuitFlowProps) => {
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
  const hasSelectedEdge = !!selectedEdgeId;
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
  const getEmptyDesignSnapshot = () => ({
    id: designIdRef.current ?? undefined,
    elements: [],
    connections: [],
    metadata: { ...designMetadataRef.current },
  });
  const [, setHasUnsavedChanges] = useState(false);
  const hasUnsavedChangesRef = useRef(false);
  const currentDesignRef = useRef<CircuitDesign>(initialCircuitDesign ?? getEmptyDesignSnapshot());
  const lastSavedDesignHashRef = useRef<string>(serializeCircuitDesignSnapshot(currentDesignRef.current));
  const suppressUnsavedTrackingRef = useRef(true);
  const updateUnsavedState = useCallback((dirty: boolean) => {
    if (hasUnsavedChangesRef.current !== dirty) {
      hasUnsavedChangesRef.current = dirty;
      setHasUnsavedChanges(dirty);
      onUnsavedChange?.(dirty);
    }
  }, [onUnsavedChange]);
  const markCurrentDesignAsSaved = useCallback((snapshot?: CircuitDesign | null) => {
    const designSnapshot = snapshot ?? currentDesignRef.current ?? getEmptyDesignSnapshot();
    const normalizedSnapshot: CircuitDesign = {
      ...designSnapshot,
      metadata: {
        ...designSnapshot.metadata,
        title: designMetadataRef.current.title,
        description: designMetadataRef.current.description,
      },
    };
    currentDesignRef.current = normalizedSnapshot;
    lastSavedDesignHashRef.current = serializeCircuitDesignSnapshot(normalizedSnapshot);
    suppressUnsavedTrackingRef.current = false;
    updateUnsavedState(false);
  }, [updateUnsavedState]);
  const [saveModalMode, setSaveModalMode] = useState<'save' | 'saveAs'>('save');
  const [saveModalInitialValues, setSaveModalInitialValues] = useState<{ title?: string; description?: string }>({});
  const autoSaveTimerRef = useRef<number | null>(null);
  const autoSaveInfoShownRef = useRef(false);
  const [isImportingFromImage, setIsImportingFromImage] = useState(false);
  const [isImportModalVisible, setIsImportModalVisible] = useState(false);
  const [hasUploadedImage, setHasUploadedImage] = useState(false);
  const imageUploaderRef = useRef<{ triggerRecognition: () => void; hasImage: () => boolean }>(null);

  const reactFlowInstance = useReactFlow();
  const reactFlowWrapper = useRef<HTMLDivElement>(null);
  const { handleBlankQuery, handleAiTaskCountPlus } = useAppContext();
  const paletteCategories = useMemo(() => getElementCategories(workspaceMode), [workspaceMode]);
  const elementMenuItems = useMemo(() => getElementMenuItems(workspaceMode), [workspaceMode]);
  const lastSimSignatureRef = useRef<string | null>(null);
  const [isWireModeActive, setIsWireModeActive] = useState(false);
  const [wireAnchor, setWireAnchor] = useState<WireAnchor | null>(null);
  const [isJunctionModeActive, setIsJunctionModeActive] = useState(false);
  
  const getLabelPrefix = useCallback((type: CircuitElementType) => {
    return elementNamePrefixes[type] || 'X';
  }, [setNodes]);
  
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

  const addJunctionNode = useCallback((position: XYPosition) => {
    const junctionId = `junction-${nanoid(6)}`;
    const junctionPorts = clonePorts(defaultPorts[CircuitElementType.JUNCTION] || []);
    const junctionElement: CircuitElement = {
      id: junctionId,
      type: CircuitElementType.JUNCTION,
      position,
      rotation: 0,
      properties: { label: 'Junction' },
      ports: junctionPorts,
    };
    const junctionNode: Node = {
      id: junctionId,
      type: 'junctionNode',
      position,
      data: {
        id: junctionId,
        type: CircuitElementType.JUNCTION,
        label: '连接点',
        element: junctionElement,
        ports: junctionPorts,
      },
    };
    setNodes((current) => [...current, junctionNode]);
    return junctionId;
  }, []);

  const getCanvasPosition = useCallback((event: React.MouseEvent<Element, MouseEvent>) => {
    if (!reactFlowWrapper.current) return null;
    const bounds = reactFlowWrapper.current.getBoundingClientRect();
    return reactFlowInstance.project({
      x: event.clientX - bounds.left,
      y: event.clientY - bounds.top,
    });
  }, [reactFlowInstance]);

  const splitEdgeWithJunction = useCallback((edge: Edge, position: XYPosition) => {
    const junctionId = addJunctionNode(position);
    const sourceNode = reactFlowInstance.getNode(edge.source);
    const targetNode = reactFlowInstance.getNode(edge.target);
    const sourcePosition = sourceNode?.positionAbsolute || sourceNode?.position;
    const targetPosition = targetNode?.positionAbsolute || targetNode?.position;
    const inboundHandle = determineJunctionHandle(sourcePosition, position);
    const outboundHandle = determineJunctionHandle(position, targetPosition || position);
    setEdges((current) => {
      const preserved = current.filter((item) => item.id !== edge.id);
      const baseData = edge.data ? { ...edge.data } : {};
      const firstEdge: Edge = {
        ...edge,
        id: `${edge.id || 'edge'}-split-a-${junctionId}`,
        target: junctionId,
        targetHandle: inboundHandle,
        sourceHandle: edge.sourceHandle,
        data: baseData,
      };
      const secondEdge: Edge = {
        ...edge,
        id: `${edge.id || 'edge'}-split-b-${junctionId}`,
        source: junctionId,
        sourceHandle: outboundHandle,
        target: edge.target,
        targetHandle: edge.targetHandle,
        data: baseData,
      };
      return [...preserved, firstEdge, secondEdge];
    });
    return junctionId;
  }, [addJunctionNode, reactFlowInstance]);

  const loadCircuitDesign = useCallback((design: CircuitDesign, options: { fitView?: boolean; notifyChange?: boolean; enhanceLayout?: boolean } = {}) => {
    if (!design) {
      return;
    }
    suppressUnsavedTrackingRef.current = true;

    const applyEnhancedLayout = options.enhanceLayout ?? false;
    const safeElements = (design.elements || []).map((element) => ({
      ...element,
      position: {
        x: element.position?.x ?? 0,
        y: element.position?.y ?? 0
      }
    }));
    let workingElements = safeElements;
    let workingConnections: CircuitConnection[] = [...(design.connections || [])];

    const sanitized = sanitizeAnalogElements(workingElements, workingConnections);
    workingElements = sanitized.elements;
    workingConnections = sanitized.connections;

    workingConnections = removeInvalidPowerGroundShorts(workingElements, workingConnections);
    workingConnections = autoCompleteAnalogConnections(workingElements, workingConnections);
    workingConnections = ensurePowerNegativeGrounded(workingElements, workingConnections);
    workingConnections = removeInvalidPowerGroundShorts(workingElements, workingConnections);
    workingConnections = rebuildBjtBiasConnections(workingElements, workingConnections);
    workingConnections = removeInvalidPowerGroundShorts(workingElements, workingConnections);

    if (applyEnhancedLayout) {
      const containsAnalog = workingElements.some((element) =>
        ANALOG_ELEMENT_TYPES.has(element.type as CircuitElementType)
      );
      const containsDigital = !containsAnalog && workingElements.some((element) =>
        DIGITAL_ELEMENT_TYPES.has(element.type as CircuitElementType)
      );
      if (containsAnalog) {
        workingElements = isBjtBiasCandidate(workingElements)
          ? applyBjtBiasLayout(workingElements, workingConnections)
          : enhanceAnalogLayout(workingElements);
      } else if (containsDigital) {
        workingElements = enhanceDigitalLayout(workingElements);
      }
    }

    const normalizedElements = workingElements.map((element) => {
      const propertyLabel = typeof element.properties?.['label'] === 'string'
        ? element.properties['label'] as string
        : undefined;
      const resolvedLabel = element.label || propertyLabel || element.id;
      return {
        ...element,
        type: normalizeElementType(element.type as CircuitElementType, resolvedLabel),
      };
    });
    const elementTypeMap = new Map(normalizedElements.map((element) => [element.id, element.type]));

    const newNodes: Node[] = normalizedElements.map((element) => {
      const propertyLabel = typeof element.properties?.['label'] === 'string'
        ? element.properties['label'] as string
        : undefined;
      const propertyValue = typeof element.properties?.['value'] === 'string'
        ? element.properties['value'] as string
        : undefined;

      const resolvedLabel = element.label || propertyLabel || element.id;
      const resolvedValue = element.value || propertyValue || '';
      const normalizedPorts = normalizeElementPorts(element);

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
          ports: normalizedPorts
        }
      };
    });

    const newEdges: Edge[] = workingConnections.map((connection) => {
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
        data: {
          lineType: applyEnhancedLayout ? 'manhattan' : 'step',
          sourceType: elementTypeMap.get(connection.source.elementId),
          targetType: elementTypeMap.get(connection.target.elementId)
        }
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

    if (normalizedElements.length > 0) {
      normalizedElements.forEach((element) => {
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
    loadCircuitDesign(design, { fitView: true, notifyChange: true, enhanceLayout: true });
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
  const handleConnection = useCallback(
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
        [CircuitElementType.AC_SOURCE]: '1Vpp@1kHz',
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
          [CircuitElementType.AC_SOURCE]: '1Vpp@1kHz',
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
      currentDesignRef.current = circuitDesign;
      const serializedSnapshot = serializeCircuitDesignSnapshot(circuitDesign);
      if (suppressUnsavedTrackingRef.current) {
        lastSavedDesignHashRef.current = serializedSnapshot;
        suppressUnsavedTrackingRef.current = false;
        updateUnsavedState(false);
      } else {
        const isDirty = serializedSnapshot !== lastSavedDesignHashRef.current;
        updateUnsavedState(isDirty);
      }
      
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
  }, [nodes, edges, onCircuitDesignChange, getFallbackLabelFromId, updateUnsavedState]);

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
      markCurrentDesignAsSaved(payload);
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
  }, [convertToCircuitDesign, markCurrentDesignAsSaved]);

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
    designMetadataRef.current = {
      ...designMetadataRef.current,
      title,
      description,
      updatedAt: now,
      createdAt: designMetadataRef.current.createdAt || now,
    };
    markCurrentDesignAsSaved();
    autoSaveInfoShownRef.current = false;
  }, [markCurrentDesignAsSaved]);

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

  const deleteSelectedEdge = useCallback(() => {
    if (!selectedEdgeId) {
      message.info('请先选择需要删除的连线');
      return;
    }
    setEdges((eds) => eds.filter((edge) => edge.id !== selectedEdgeId));
    setSelectedEdgeId(null);
    message.success('连线已删除');
  }, [selectedEdgeId]);
  
  // 处理边点击
  const onEdgeClick = useCallback((e: React.MouseEvent, edge: Edge) => {
    if (isWireModeActive) {
      if (!reactFlowWrapper.current) return;
      const bounds = reactFlowWrapper.current.getBoundingClientRect();
      const position = reactFlowInstance.project({
        x: e.clientX - bounds.left,
        y: e.clientY - bounds.top,
      });
      const junctionId = splitEdgeWithJunction(edge, position);
      setWireAnchor({
        nodeId: junctionId,
        handleId: null,
        handleType: 'source',
        autoHandle: true,
      });
      setSelectedEdgeId(null);
      setSelectedNodeId(null);
      message.info('已创建连接点，选择另一个端点继续布线');
      return;
    }
    if (isJunctionModeActive) {
      if (!reactFlowWrapper.current) return;
      const bounds = reactFlowWrapper.current.getBoundingClientRect();
      const position = reactFlowInstance.project({
        x: e.clientX - bounds.left,
        y: e.clientY - bounds.top,
      });
      const junctionId = splitEdgeWithJunction(edge, position);
      setSelectedEdgeId(null);
      setSelectedNodeId(junctionId);
      message.success('连接点已插入');
      return;
    }
    setSelectedEdgeId(edge.id);
    setSelectedNodeId(null);
    e.stopPropagation();
  }, [isJunctionModeActive, isWireModeActive, reactFlowInstance, splitEdgeWithJunction]);
  
  // 处理删除键按下
  const handleKeyDown = useCallback((e: KeyboardEvent) => {
    if ((e.key === 'Delete' || e.key === 'Backspace') && selectedEdgeId) {
      deleteSelectedEdge();
      return;
    }
    if (e.key === 'Escape') {
      let handled = false;
      if (isWireModeActive) {
        if (wireAnchor) {
          setWireAnchor(null);
          message.info('已取消当前布线起点');
        } else {
          setIsWireModeActive(false);
          message.info('已退出布线模式');
        }
        handled = true;
      }
      if (isJunctionModeActive) {
        setIsJunctionModeActive(false);
        message.info('已退出连接点模式');
        handled = true;
      }
      if (handled) {
        setWireAnchor(null);
      }
    }
  }, [isJunctionModeActive, isWireModeActive, selectedEdgeId, wireAnchor]);
  
  // 添加键盘事件监听
  useEffect(() => {
    window.addEventListener('keydown', handleKeyDown);
    return () => {
      window.removeEventListener('keydown', handleKeyDown);
    };
  }, [handleKeyDown]);
  
  // 添加画布点击处理以取消选择
  const onPaneClick = useCallback((event?: React.MouseEvent<Element, MouseEvent>) => {
    if (isWireModeActive && event) {
      const position = getCanvasPosition(event);
      if (!position) return;
      const junctionId = addJunctionNode(position);
      setWireAnchor({
        nodeId: junctionId,
        handleId: null,
        handleType: 'source',
        autoHandle: true,
      });
      message.info('已放置连接点，选择另一个端点完成布线');
      return;
    }
    if (isJunctionModeActive && event) {
      const position = getCanvasPosition(event);
      if (!position) return;
      const junctionId = addJunctionNode(position);
      setSelectedNodeId(junctionId);
      setSelectedEdgeId(null);
      message.success('连接点已添加');
      return;
    }
    if (isWireModeActive && wireAnchor) {
      setWireAnchor(null);
      message.info('已取消当前布线起点');
      return;
    }
    setSelectedNodeId(null);
    setSelectedEdgeId(null);
  }, [addJunctionNode, getCanvasPosition, isJunctionModeActive, isWireModeActive, wireAnchor]);

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

  const resolveHandleId = useCallback((anchor: WireAnchor, opposite: WireAnchor) => {
    if (!anchor.autoHandle) {
      return anchor.handleId || undefined;
    }
    const anchorNode = reactFlowInstance.getNode(anchor.nodeId);
    const oppositeNode = reactFlowInstance.getNode(opposite.nodeId);
    const anchorPos = anchorNode?.positionAbsolute || anchorNode?.position;
    const oppositePos = oppositeNode?.positionAbsolute || oppositeNode?.position;
    if (!anchorPos || !oppositePos) {
      return anchor.handleId || 'port-right';
    }
    return determineJunctionHandle(anchorPos, oppositePos);
  }, [reactFlowInstance]);

  const handleWireHandleClick = useCallback((nextAnchor: WireAnchor) => {
    if (!isWireModeActive) {
      return;
    }
    setSelectedEdgeId(null);
    setSelectedNodeId(null);
    if (!wireAnchor) {
      setWireAnchor(nextAnchor);
      message.info('已选择起点，请选择终点');
      return;
    }
    if (wireAnchor.nodeId === nextAnchor.nodeId && wireAnchor.handleId === nextAnchor.handleId) {
      setWireAnchor(null);
      return;
    }
    let sourceAnchor = wireAnchor;
    let targetAnchor = nextAnchor;
    if (sourceAnchor.handleType === 'target' && targetAnchor.handleType === 'source') {
      sourceAnchor = nextAnchor;
      targetAnchor = wireAnchor;
    } else if (sourceAnchor.handleType === 'target' && targetAnchor.handleType === 'target') {
      sourceAnchor = nextAnchor;
      targetAnchor = wireAnchor;
    }
    const resolvedSourceHandle = resolveHandleId(sourceAnchor, targetAnchor) ?? null;
    const resolvedTargetHandle = resolveHandleId(targetAnchor, sourceAnchor) ?? null;
    const connection: Connection = {
      source: sourceAnchor.nodeId,
      sourceHandle: resolvedSourceHandle,
      target: targetAnchor.nodeId,
      targetHandle: resolvedTargetHandle,
    };
    handleConnection(connection);
    setWireAnchor(null);
  }, [handleConnection, isWireModeActive, resolveHandleId, wireAnchor]);

  const toggleWireMode = useCallback(() => {
    setIsWireModeActive((prev) => {
      const next = !prev;
      if (!next) {
        setWireAnchor(null);
        message.info('已退出布线模式');
      } else {
        setIsJunctionModeActive(false);
        message.info('布线模式已启用，点击端点或导线开始布线，按 Esc 退出');
      }
      return next;
    });
  }, []);

  const toggleJunctionMode = useCallback(() => {
    setIsJunctionModeActive((prev) => {
      const next = !prev;
      if (!next) {
        message.info('已退出连接点模式');
      } else {
        setIsWireModeActive(false);
        setWireAnchor(null);
        message.info('连接点模式已启用，点击导线或画布以添加连接点，按 Esc 退出');
      }
      return next;
    });
  }, []);

  const handleEdgeDoubleClick = useCallback((event: React.MouseEvent, edge: Edge) => {
    event.preventDefault();
    event.stopPropagation();
    if (!reactFlowWrapper.current) return;
    const bounds = reactFlowWrapper.current.getBoundingClientRect();
    const position = reactFlowInstance.project({
      x: event.clientX - bounds.left,
      y: event.clientY - bounds.top,
    });
    const junctionId = splitEdgeWithJunction(edge, position);
    setSelectedEdgeId(null);
    setSelectedNodeId(junctionId);
    message.success('已插入连接点，可继续布线');
  }, [reactFlowInstance, splitEdgeWithJunction]);

  useEffect(() => {
    if (!isWireModeActive || !reactFlowWrapper.current) return;
    const container = reactFlowWrapper.current;
    const handlePointerDown = (event: PointerEvent) => {
      const target = event.target as HTMLElement;
      const handleEl = target?.closest('.react-flow__handle');
      if (!handleEl) return;
      const nodeId = handleEl.getAttribute('data-nodeid');
      const handleId = handleEl.getAttribute('data-handleid');
      if (!nodeId || !handleId) return;
      const handleType: 'source' | 'target' = handleEl.classList.contains('react-flow__handle-target') ? 'target' : 'source';
      event.preventDefault();
      event.stopPropagation();
      handleWireHandleClick({
        nodeId,
        handleId,
        handleType,
      });
    };
    container.addEventListener('pointerdown', handlePointerDown, true);
    return () => {
      container.removeEventListener('pointerdown', handlePointerDown, true);
    };
  }, [handleWireHandleClick, isWireModeActive]);

  useEffect(() => {
    if (!reactFlowWrapper.current) return;
    const pane = reactFlowWrapper.current.querySelector('.react-flow__pane') as HTMLElement | null;
    if (pane) {
      pane.style.cursor = (isWireModeActive || isJunctionModeActive) ? 'crosshair' : '';
    }
    return () => {
      if (pane) {
        pane.style.cursor = '';
      }
    };
  }, [isJunctionModeActive, isWireModeActive]);
  
  // 注册快捷键
  useHotkeys('ctrl+r', (event) => {
    event.preventDefault();
    handleRotate();
  }, [handleRotate]);
  
  useHotkeys('ctrl+d, delete', (event) => {
    event.preventDefault();
    deleteSelectedNode();
  }, [deleteSelectedNode]);

  useEffect(() => {
    if (isReadOnly) {
      if (isWireModeActive) {
        setIsWireModeActive(false);
        setWireAnchor(null);
      }
      if (isJunctionModeActive) {
        setIsJunctionModeActive(false);
      }
    }
  }, [isJunctionModeActive, isReadOnly, isWireModeActive]);

  // 添加边缘选中状态的更新逻辑
  useEffect(() => {
    setEdges((eds) =>
      eds.map((edge) => {
        const isSelected = !!selectedEdgeId && edge.id === selectedEdgeId;
        if (edge.selected === isSelected) {
          return edge;
        }
        return {
          ...edge,
          selected: isSelected,
        };
      })
    );
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
    <div ref={reactFlowWrapper} className="flex flex-row w-full h-full min-h-0 bg-white">
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
      <div className="flex-1 flex flex-col h-full min-h-0">
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
              hasSelectedEdge={hasSelectedEdge}
              hasContent={nodes.length > 0 || edges.length > 0}
              canSaveAs={hasPersistedDesign && (nodes.length > 0 || edges.length > 0)}
              onImageImport={handleImageImportClick}
              isImportingImage={isImportingFromImage}
              onToggleWireMode={isReadOnly ? undefined : toggleWireMode}
              isWireModeActive={isWireModeActive}
              onToggleJunctionMode={isReadOnly ? undefined : toggleJunctionMode}
              isJunctionModeActive={isJunctionModeActive}
              onDeleteEdge={isReadOnly ? undefined : deleteSelectedEdge}
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
            onConnect={isReadOnly ? undefined : handleConnection}
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
            connectOnClick={!isReadOnly && !isWireModeActive && !isJunctionModeActive}
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
            onEdgeDoubleClick={isReadOnly ? undefined : handleEdgeDoubleClick}
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
            {isWireModeActive && (
              <span className="text-blue-600">
                布线模式{wireAnchor ? '：已选起点' : ''}
              </span>
            )}
            {isJunctionModeActive && (
              <span className="text-blue-600">连接点模式</span>
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
        footer={
          <div className="flex justify-end gap-2">
            <Button
              onClick={handleImportModalClose}
              disabled={isImportingFromImage}
            >
              取消
            </Button>
            <Button
              type="primary"
              onClick={() => {
                if (imageUploaderRef.current) {
                  imageUploaderRef.current.triggerRecognition();
                }
              }}
              disabled={!hasUploadedImage || isImportingFromImage}
              loading={isImportingFromImage}
            >
              开始转换
            </Button>
          </div>
        }
        destroyOnClose
        width={520}
        closable={!isImportingFromImage}
        maskClosable={!isImportingFromImage}
      >
        <div className="space-y-3 text-sm text-gray-600">
          <p>上传线下电路图或手绘草图，系统会尝试解析并转换为可编辑的画布设计。</p>
          <ul className="list-disc list-inside text-xs text-gray-500">
            <li>支持 PNG/JPG 图片，建议保持线条清晰。</li>
            <li>识别成功会直接更新当前画布，请在导入前保存重要设计。</li>
            <li>上传图片后，点击下方"开始转换"按钮开始识别。</li>
          </ul>
        </div>
        <ImageUploader
          ref={imageUploaderRef}
          className="mt-4"
          customRecognizeFn={recognizeCircuitImage}
          onExtraData={handleCircuitDesignFromImage}
          enableMathDetection={false}
          resultTitle="识别摘要"
          onLoadingChange={setIsImportingFromImage}
          onFileChange={setHasUploadedImage}
          showStartButton={false}
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

export const CircuitFlowWithProvider = ({ onCircuitDesignChange, selectedModel, initialCircuitDesign, isReadOnly, classId, onModelChange, workspaceMode, onUnsavedChange }: CircuitFlowProps) => (
  <ReactFlowProvider>
    <CircuitFlow 
      onCircuitDesignChange={onCircuitDesignChange}
      selectedModel={selectedModel}
      initialCircuitDesign={initialCircuitDesign}
      isReadOnly={isReadOnly}
      classId={classId}
      onModelChange={onModelChange}
      workspaceMode={workspaceMode}
      onUnsavedChange={onUnsavedChange}
    />
  </ReactFlowProvider>
);
