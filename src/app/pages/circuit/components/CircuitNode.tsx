'use client';

import React, { memo, useMemo, useEffect, useState, useCallback } from 'react';
import { Handle, Position, NodeProps } from 'reactflow';
import { CircuitElement, CircuitElementType } from '@/api/types/circuit.types';
import { SimulationMeasurementResult } from '../simulation/types';

// 端口类型定义
export type PortType = 'input' | 'output' | 'bidirectional';

// 端口位置定义
interface PortPosition {
  side: 'left' | 'right' | 'top' | 'bottom';
  x: number;  // 相对于元件边界的百分比位置 (0-100)
  y: number;  // 相对于元件边界的百分比位置 (0-100)
  align?: 'start' | 'center' | 'end'; // 可选的对齐方式
  rotatedOffset?: {  // 添加旋转后的位置偏移
    '90'?: { top?: string; bottom?: string; left?: string; right?: string };
    '180'?: { top?: string; bottom?: string; left?: string; right?: string };
    '270'?: { top?: string; bottom?: string; left?: string; right?: string };
  };
}

// 端口定义
interface Port {
  id: string;
  name: string;
  type: PortType;
  position: PortPosition;
}

// 节点数据接口
interface CircuitNodeData {
  id?: string;     // 添加id字段
  type: CircuitElementType;
  label: string;
  value: string;
  element?: CircuitElement; // 添加完整的元件数据
  onNodeClick?: (id: string) => void;
  description?: string;    // 添加description字段
  ports?: Port[];          // 添加ports字段
  measurement?: SimulationMeasurementResult;
}

// 为每种元件类型定义默认端口
const defaultPorts: Record<string, Port[]> = {
  [CircuitElementType.RESISTOR]: [
    { id: 'port1', name: '左端口', type: 'bidirectional', position: { side: 'left', x: 10, y: 50 } },
    { id: 'port2', name: '右端口', type: 'bidirectional', position: { side: 'right', x: 100, y: 50 } }
  ],
  [CircuitElementType.CAPACITOR]: [
    { id: 'port1', name: '左端口', type: 'bidirectional', position: { side: 'left', x: 20, y: 50 } },
    { id: 'port2', name: '右端口', type: 'bidirectional', position: { side: 'right', x: 100, y: 50 } }
  ],
  [CircuitElementType.INDUCTOR]: [
    { id: 'port1', name: '左端口', type: 'bidirectional', position: { side: 'left', x: 0, y: 50 } },
    { id: 'port2', name: '右端口', type: 'bidirectional', position: { side: 'right', x: 100, y: 50 } }
  ],
  [CircuitElementType.VOLTAGE_SOURCE]: [
    { id: 'positive', name: '正极', type: 'output', position: { side: 'left', x: 0, y: 50 } },
    { id: 'negative', name: '负极', type: 'input', position: { side: 'right', x: 120, y: 50 } }
  ],
  [CircuitElementType.CURRENT_SOURCE]: [
    { id: 'positive', name: '正极', type: 'output', position: { side: 'left', x: 0, y: 50 } },
    { id: 'negative', name: '负极', type: 'input', position: { side: 'right', x: 120, y: 50 } }
  ],
  [CircuitElementType.AC_SOURCE]: [
    { id: 'positive', name: '正极', type: 'output', position: { side: 'left', x: 0, y: 50 } },
    { id: 'negative', name: '负极', type: 'input', position: { side: 'right', x: 120, y: 50 } }
  ],
  [CircuitElementType.DIODE]: [
    { id: 'anode', name: '阳极', type: 'input', position: { side: 'left', x: 0, y: 50 } },
    { id: 'cathode', name: '阴极', type: 'output', position: { side: 'right', x: 120, y: 50 } }
  ],
  [CircuitElementType.TRANSISTOR_NPN]: [
    { id: 'base', name: '基极', type: 'input', position: { side: 'left', x: 5, y: 50 } },
    { id: 'collector', name: '集电极', type: 'input', position: { side: 'right', x: 95, y: 10 } },
    { id: 'emitter', name: '发射极', type: 'output', position: { side: 'right', x: 95, y: 90 } }
  ],
  [CircuitElementType.TRANSISTOR_PNP]: [
    { id: 'base', name: '基极', type: 'input', position: { side: 'left', x: 0, y: 50 } },
    { id: 'emitter', name: '发射极', type: 'input', position: { side: 'left', x: 80, y: 0 } },
    { id: 'collector', name: '集电极', type: 'output', position: { side: 'right', x: 100, y: 100 } }
  ],
  [CircuitElementType.GROUND]: [
    { id: 'ground', name: '接地点', type: 'input', position: { side: 'top', x: 50, y: 10 } }
  ],
  [CircuitElementType.OPAMP]: [
    { id: 'input1', name: '输入1', type: 'input', position: { side: 'left', x: 0, y: 40 } },
    { id: 'input2', name: '输入2', type: 'input', position: { side: 'left', x: 0, y: 65 } },
    { id: 'output', name: '输出', type: 'output', position: { side: 'right', x: 110, y: 50 } }
  ],
  [CircuitElementType.DIGITAL_INPUT]: [
    { id: 'out', name: '输出', type: 'output', position: { side: 'right', x: 100, y: 50 } }
  ],
  [CircuitElementType.DIGITAL_OUTPUT]: [
    { id: 'in', name: '输入', type: 'input', position: { side: 'left', x: 0, y: 50 } }
  ],
  [CircuitElementType.DIGITAL_CLOCK]: [
    { id: 'out', name: 'CLK', type: 'output', position: { side: 'right', x: 100, y: 50 } }
  ],
  [CircuitElementType.DIGITAL_AND]: [
    { id: 'in1', name: '输入A', type: 'input', position: { side: 'left', x: 0, y: 35 } },
    { id: 'in2', name: '输入B', type: 'input', position: { side: 'left', x: 0, y: 65 } },
    { id: 'out', name: '输出', type: 'output', position: { side: 'right', x: 100, y: 50 } }
  ],
  [CircuitElementType.DIGITAL_OR]: [
    { id: 'in1', name: '输入A', type: 'input', position: { side: 'left', x: 0, y: 35 } },
    { id: 'in2', name: '输入B', type: 'input', position: { side: 'left', x: 0, y: 65 } },
    { id: 'out', name: '输出', type: 'output', position: { side: 'right', x: 100, y: 50 } }
  ],
  [CircuitElementType.DIGITAL_NOT]: [
    { id: 'in', name: '输入', type: 'input', position: { side: 'left', x: 0, y: 50 } },
    { id: 'out', name: '输出', type: 'output', position: { side: 'right', x: 105, y: 50 } }
  ],
  [CircuitElementType.DIGITAL_NAND]: [
    { id: 'in1', name: '输入A', type: 'input', position: { side: 'left', x: 0, y: 35 } },
    { id: 'in2', name: '输入B', type: 'input', position: { side: 'left', x: 0, y: 65 } },
    { id: 'out', name: '输出', type: 'output', position: { side: 'right', x: 110, y: 50 } }
  ],
  [CircuitElementType.DIGITAL_NOR]: [
    { id: 'in1', name: '输入A', type: 'input', position: { side: 'left', x: 0, y: 35 } },
    { id: 'in2', name: '输入B', type: 'input', position: { side: 'left', x: 0, y: 65 } },
    { id: 'out', name: '输出', type: 'output', position: { side: 'right', x: 110, y: 50 } }
  ],
  [CircuitElementType.DIGITAL_XOR]: [
    { id: 'in1', name: '输入A', type: 'input', position: { side: 'left', x: 0, y: 35 } },
    { id: 'in2', name: '输入B', type: 'input', position: { side: 'left', x: 0, y: 65 } },
    { id: 'out', name: '输出', type: 'output', position: { side: 'right', x: 100, y: 50 } }
  ],
  [CircuitElementType.DIGITAL_XNOR]: [
    { id: 'in1', name: '输入A', type: 'input', position: { side: 'left', x: 0, y: 35 } },
    { id: 'in2', name: '输入B', type: 'input', position: { side: 'left', x: 0, y: 65 } },
    { id: 'out', name: '输出', type: 'output', position: { side: 'right', x: 110, y: 50 } }
  ],
  [CircuitElementType.DIGITAL_DFF]: [
    { id: 'd', name: 'D', type: 'input', position: { side: 'left', x: 0, y: 40 } },
    { id: 'pre', name: 'PRE', type: 'input', position: { side: 'top', x: 25, y: 0 } },
    { id: 'clr', name: 'CLR', type: 'input', position: { side: 'top', x: 75, y: 0 } },
    { id: 'clk', name: 'CLK', type: 'input', position: { side: 'bottom', x: 50, y: 100 } },
    { id: 'q', name: 'Q', type: 'output', position: { side: 'right', x: 100, y: 32 } },
    { id: 'qn', name: 'Q̄', type: 'output', position: { side: 'right', x: 100, y: 68 } },
  ],
};

Object.assign(defaultPorts, {
  [CircuitElementType.PULSE_SOURCE]: defaultPorts[CircuitElementType.AC_SOURCE],
  [CircuitElementType.PWM_SOURCE]: defaultPorts[CircuitElementType.AC_SOURCE],
  [CircuitElementType.SINE_SOURCE]: defaultPorts[CircuitElementType.AC_SOURCE],
  [CircuitElementType.DIODE_ZENER]: defaultPorts[CircuitElementType.DIODE],
  [CircuitElementType.DIODE_LED]: defaultPorts[CircuitElementType.DIODE],
  [CircuitElementType.DIODE_SCHOTTKY]: defaultPorts[CircuitElementType.DIODE],
  [CircuitElementType.DIGITAL_AND3]: [
    { id: 'in1', name: '输入A', type: 'input', position: { side: 'left', x: 0, y: 22 } },
    { id: 'in2', name: '输入B', type: 'input', position: { side: 'left', x: 0, y: 50 } },
    { id: 'in3', name: '输入C', type: 'input', position: { side: 'left', x: 0, y: 78 } },
    { id: 'out', name: '输出', type: 'output', position: { side: 'right', x: 100, y: 50 } },
  ],
  [CircuitElementType.DIGITAL_AND4]: [
    { id: 'in1', name: '输入A', type: 'input', position: { side: 'left', x: 0, y: 17 } },
    { id: 'in2', name: '输入B', type: 'input', position: { side: 'left', x: 0, y: 39 } },
    { id: 'in3', name: '输入C', type: 'input', position: { side: 'left', x: 0, y: 61 } },
    { id: 'in4', name: '输入D', type: 'input', position: { side: 'left', x: 0, y: 83 } },
    { id: 'out', name: '输出', type: 'output', position: { side: 'right', x: 100, y: 50 } },
  ],
  [CircuitElementType.DIGITAL_OR3]: [
    { id: 'in1', name: '输入A', type: 'input', position: { side: 'left', x: 0, y: 22 } },
    { id: 'in2', name: '输入B', type: 'input', position: { side: 'left', x: 0, y: 50 } },
    { id: 'in3', name: '输入C', type: 'input', position: { side: 'left', x: 0, y: 78 } },
    { id: 'out', name: '输出', type: 'output', position: { side: 'right', x: 100, y: 50 } },
  ],
  [CircuitElementType.DIGITAL_OR4]: [
    { id: 'in1', name: '输入A', type: 'input', position: { side: 'left', x: 0, y: 17 } },
    { id: 'in2', name: '输入B', type: 'input', position: { side: 'left', x: 0, y: 39 } },
    { id: 'in3', name: '输入C', type: 'input', position: { side: 'left', x: 0, y: 61 } },
    { id: 'in4', name: '输入D', type: 'input', position: { side: 'left', x: 0, y: 83 } },
    { id: 'out', name: '输出', type: 'output', position: { side: 'right', x: 100, y: 50 } },
  ],
  [CircuitElementType.DIGITAL_BUF]: [
    { id: 'in', name: '输入', type: 'input', position: { side: 'left', x: 0, y: 50 } },
    { id: 'out', name: '输出', type: 'output', position: { side: 'right', x: 100, y: 50 } },
  ],
  [CircuitElementType.DIGITAL_TRI]: [
    { id: 'in', name: 'IN', type: 'input', position: { side: 'left', x: 0, y: 32 } },
    { id: 'oe', name: 'OE', type: 'input', position: { side: 'left', x: 0, y: 70 } },
    { id: 'out', name: 'OUT', type: 'output', position: { side: 'right', x: 100, y: 50 } },
  ],
  [CircuitElementType.DIGITAL_SCHMITT_NOT]: [
    { id: 'in', name: '输入', type: 'input', position: { side: 'left', x: 0, y: 50 } },
    { id: 'out', name: '输出', type: 'output', position: { side: 'right', x: 100, y: 50 } },
  ],
  [CircuitElementType.DIGITAL_NAND3]: [
    { id: 'in1', name: '输入A', type: 'input', position: { side: 'left', x: 0, y: 22 } },
    { id: 'in2', name: '输入B', type: 'input', position: { side: 'left', x: 0, y: 50 } },
    { id: 'in3', name: '输入C', type: 'input', position: { side: 'left', x: 0, y: 78 } },
    { id: 'out', name: '输出', type: 'output', position: { side: 'right', x: 100, y: 50 } },
  ],
  [CircuitElementType.DIGITAL_NAND4]: [
    { id: 'in1', name: '输入A', type: 'input', position: { side: 'left', x: 0, y: 17 } },
    { id: 'in2', name: '输入B', type: 'input', position: { side: 'left', x: 0, y: 39 } },
    { id: 'in3', name: '输入C', type: 'input', position: { side: 'left', x: 0, y: 61 } },
    { id: 'in4', name: '输入D', type: 'input', position: { side: 'left', x: 0, y: 83 } },
    { id: 'out', name: '输出', type: 'output', position: { side: 'right', x: 100, y: 50 } },
  ],
  [CircuitElementType.DIGITAL_NOR3]: [
    { id: 'in1', name: '输入A', type: 'input', position: { side: 'left', x: 0, y: 22 } },
    { id: 'in2', name: '输入B', type: 'input', position: { side: 'left', x: 0, y: 50 } },
    { id: 'in3', name: '输入C', type: 'input', position: { side: 'left', x: 0, y: 78 } },
    { id: 'out', name: '输出', type: 'output', position: { side: 'right', x: 100, y: 50 } },
  ],
  [CircuitElementType.DIGITAL_NOR4]: [
    { id: 'in1', name: '输入A', type: 'input', position: { side: 'left', x: 0, y: 17 } },
    { id: 'in2', name: '输入B', type: 'input', position: { side: 'left', x: 0, y: 39 } },
    { id: 'in3', name: '输入C', type: 'input', position: { side: 'left', x: 0, y: 61 } },
    { id: 'in4', name: '输入D', type: 'input', position: { side: 'left', x: 0, y: 83 } },
    { id: 'out', name: '输出', type: 'output', position: { side: 'right', x: 100, y: 50 } },
  ],
  [CircuitElementType.DIGITAL_JKFF]: [
    { id: 'j', name: 'J', type: 'input', position: { side: 'left', x: 0, y: 22 } },
    { id: 'k', name: 'K', type: 'input', position: { side: 'left', x: 0, y: 78 } },
    { id: 'clk', name: 'CLK', type: 'input', position: { side: 'bottom', x: 50, y: 100 } },
    { id: 'q', name: 'Q', type: 'output', position: { side: 'right', x: 100, y: 25 } },
    { id: 'qn', name: 'Q̄', type: 'output', position: { side: 'right', x: 100, y: 75 } },
  ],
  [CircuitElementType.DIGITAL_TFF]: [
    { id: 't', name: 'T', type: 'input', position: { side: 'left', x: 0, y: 45 } },
    { id: 'clk', name: 'CLK', type: 'input', position: { side: 'bottom', x: 50, y: 100 } },
    { id: 'q', name: 'Q', type: 'output', position: { side: 'right', x: 100, y: 30 } },
    { id: 'qn', name: 'Q̄', type: 'output', position: { side: 'right', x: 100, y: 70 } },
  ],
  [CircuitElementType.DIGITAL_SRFF]: [
    { id: 's', name: 'S', type: 'input', position: { side: 'left', x: 0, y: 30 } },
    { id: 'r', name: 'R', type: 'input', position: { side: 'left', x: 0, y: 70 } },
    { id: 'clk', name: 'CLK', type: 'input', position: { side: 'bottom', x: 50, y: 100 } },
    { id: 'q', name: 'Q', type: 'output', position: { side: 'right', x: 100, y: 30 } },
    { id: 'qn', name: 'Q̄', type: 'output', position: { side: 'right', x: 100, y: 70 } },
  ],
});

// 为每种元件类型定义默认端口配置函数
const getDefaultPorts = (elementType: string): Port[] => {
  return defaultPorts[elementType] || defaultPorts[CircuitElementType.RESISTOR] || [];
};

// 为了解决没有SVG组件问题，直接内嵌SVG组件
const SVGComponents: Partial<Record<CircuitElementType, React.FC<React.SVGProps<SVGSVGElement>>>> = {
  [CircuitElementType.RESISTOR]: (props: React.SVGProps<SVGSVGElement>) => (
    <svg {...props} viewBox="0 0 60 20" fill="none" xmlns="http://www.w3.org/2000/svg">
      <path d="M5,10 H15 M45,10 H55" stroke="currentColor" strokeWidth="2" />
      <rect x="15" y="5" width="30" height="10" fill="#F0F9FF" rx="2" stroke="currentColor" strokeWidth="2" />
      <path d="M20,5 L20,15 M25,5 L25,15 M30,5 L30,15 M35,5 L35,15 M40,5 L40,15" stroke="currentColor" strokeWidth="1.5" strokeOpacity="0.7" />
    </svg>
  ),
  [CircuitElementType.CAPACITOR]: (props: React.SVGProps<SVGSVGElement>) => (
    <svg {...props} viewBox="0 0 40 40" fill="none" xmlns="http://www.w3.org/2000/svg">
      <path d="M5,20 L15,20" stroke="currentColor" strokeWidth="2" />
      <path d="M25,20 L35,20" stroke="currentColor" strokeWidth="2" />
      <path d="M15,5 L15,35" stroke="currentColor" strokeWidth="2" />
      <path d="M25,5 L25,35" stroke="currentColor" strokeWidth="2" />
      <path d="M15,5 L15,35" fill="none" />
      <path d="M16,5 L24,5 L24,35 L16,35 Z" fill="#F0F9FF" fillOpacity="0.5" />
    </svg>
  ),
  [CircuitElementType.INDUCTOR]: (props: React.SVGProps<SVGSVGElement>) => (
    <svg {...props} viewBox="0 0 60 30" fill="none" xmlns="http://www.w3.org/2000/svg">
      <path d="M5,15 L13,15" stroke="currentColor" strokeWidth="2" />
      <path d="M47,15 L55,15" stroke="currentColor" strokeWidth="2" />
      <path d="M13,15 C13,8 17,15 20,8 S27,22 30,15 S37,8 40,15 S47,22 47,15" 
        stroke="currentColor" strokeWidth="2" fill="none" />
      <path d="M20,8 C17,15 24,22 30,15 C37,8 40,15 47,22" 
        stroke="currentColor" strokeWidth="0.7" strokeOpacity="0.3" fill="none" />
    </svg>
  ),
  [CircuitElementType.VOLTAGE_SOURCE]: (props: React.SVGProps<SVGSVGElement>) => (
    <svg {...props} viewBox="0 0 40 40" fill="none" xmlns="http://www.w3.org/2000/svg">
      <circle cx="20" cy="20" r="15" stroke="currentColor" strokeWidth="2" fill="#F0F9FF" fillOpacity="0.7" />
      <path d="M13,20 L27,20" stroke="currentColor" strokeWidth="2" />
      <path d="M20,13 L20,27" stroke="currentColor" strokeWidth="2" />
      <text x="28" y="15" fontSize="8" fill="currentColor">+</text>
      <text x="12" y="15" fontSize="8" fill="currentColor">-</text>
    </svg>
  ),
  [CircuitElementType.CURRENT_SOURCE]: (props: React.SVGProps<SVGSVGElement>) => (
    <svg {...props} viewBox="0 0 40 40" fill="none" xmlns="http://www.w3.org/2000/svg">
      <circle cx="20" cy="20" r="15" stroke="currentColor" strokeWidth="2" fill="#F0F9FF" fillOpacity="0.7" />
      <path d="M12,20 L28,20" stroke="currentColor" strokeWidth="2" />
      <path d="M25,15 L28,20 L25,25" stroke="currentColor" strokeWidth="2" fill="none" />
      <text x="12" y="16" fontSize="7" fill="currentColor">I</text>
    </svg>
  ),
  [CircuitElementType.AC_SOURCE]: (props: React.SVGProps<SVGSVGElement>) => (
    <svg {...props} viewBox="0 0 40 40" fill="none" xmlns="http://www.w3.org/2000/svg">
      <circle cx="20" cy="20" r="15" stroke="currentColor" strokeWidth="2" fill="#F0F9FF" fillOpacity="0.7" />
      <path d="M8,20 C12,12 16,28 20,20 C24,12 28,28 32,20" stroke="currentColor" strokeWidth="2" fill="none" />
      <path d="M5,20 L8,20" stroke="currentColor" strokeWidth="2" />
      <path d="M32,20 L35,20" stroke="currentColor" strokeWidth="2" />
      <text x="14" y="12" fontSize="7" fill="currentColor">AC</text>
    </svg>
  ),
  [CircuitElementType.DIODE]: (props: React.SVGProps<SVGSVGElement>) => (
    <svg {...props} viewBox="0 0 40 40" fill="none" xmlns="http://www.w3.org/2000/svg">
      <path d="M5,20 L15,20" stroke="currentColor" strokeWidth="2" />
      <path d="M15,10 L15,30 L25,20 Z" stroke="currentColor" strokeWidth="2" fill="#F0F9FF" />
      <path d="M25,10 L25,30" stroke="currentColor" strokeWidth="2" />
      <path d="M25,20 L35,20" stroke="currentColor" strokeWidth="2" />
    </svg>
  ),
  [CircuitElementType.TRANSISTOR_NPN]: (props: React.SVGProps<SVGSVGElement>) => (
    <svg {...props} viewBox="0 0 60 60" fill="none" xmlns="http://www.w3.org/2000/svg">
      <circle cx="30" cy="30" r="15" stroke="currentColor" strokeWidth="2" fill="#F0F9FF" fillOpacity="0.5" />
      <path d="M30,15 L30,45" stroke="currentColor" strokeWidth="2" />
      <path d="M5,30 L15,30" stroke="currentColor" strokeWidth="2" />
      <path d="M30,20 L45,5" stroke="currentColor" strokeWidth="2" />
      <path d="M30,40 L45,55" stroke="currentColor" strokeWidth="2" />
      <text x="10" y="28" fontSize="7" fill="currentColor">B</text>
      <text x="40" y="8" fontSize="7" fill="currentColor">C</text>
      <text x="40" y="55" fontSize="7" fill="currentColor">E</text>
    </svg>
  ),
  [CircuitElementType.TRANSISTOR_PNP]: (props: React.SVGProps<SVGSVGElement>) => (
    <svg {...props} viewBox="0 0 60 60" fill="none" xmlns="http://www.w3.org/2000/svg">
      <circle cx="30" cy="30" r="15" stroke="currentColor" strokeWidth="2" fill="#F0F9FF" fillOpacity="0.5" />
      <path d="M30,15 L30,45" stroke="currentColor" strokeWidth="2" />
      <path d="M5,30 L15,30" stroke="currentColor" strokeWidth="2" />
      <path d="M30,20 L45,5" stroke="currentColor" strokeWidth="2" />
      <path d="M30,40 L45,55" stroke="currentColor" strokeWidth="2" />
      <path d="M30,20 L26,18" stroke="currentColor" strokeWidth="1.5" />
      <path d="M30,40 L26,42" stroke="currentColor" strokeWidth="1.5" />
      <text x="10" y="28" fontSize="7" fill="currentColor">B</text>
      <text x="40" y="8" fontSize="7" fill="currentColor">C</text>
      <text x="40" y="55" fontSize="7" fill="currentColor">E</text>
    </svg>
  ),
  [CircuitElementType.GROUND]: (props: React.SVGProps<SVGSVGElement>) => (
    <svg {...props} viewBox="0 0 40 40" fill="none" xmlns="http://www.w3.org/2000/svg">
      <path d="M20,5 L20,20" stroke="currentColor" strokeWidth="2" />
      <path d="M10,20 L30,20" stroke="currentColor" strokeWidth="2" />
      <path d="M13,25 L27,25" stroke="currentColor" strokeWidth="2" />
      <path d="M16,30 L24,30" stroke="currentColor" strokeWidth="2" />
    </svg>
  ),
  [CircuitElementType.OPAMP]: (props: React.SVGProps<SVGSVGElement>) => (
    <svg {...props} viewBox="0 0 60 40" fill="none" xmlns="http://www.w3.org/2000/svg">
      <path d="M10,5 L10,35 L50,20 Z" stroke="currentColor" strokeWidth="2" fill="#F0F9FF" fillOpacity="0.5" />
      <path d="M5,15 L10,15" stroke="currentColor" strokeWidth="2" />
      <path d="M5,25 L10,25" stroke="currentColor" strokeWidth="2" />
      <path d="M50,20 L55,20" stroke="currentColor" strokeWidth="2" />
      <text x="8" y="17" fontSize="8" fill="currentColor">+</text>
      <text x="8" y="27" fontSize="8" fill="currentColor">-</text>
    </svg>
  ),
  [CircuitElementType.WIRE]: (props: React.SVGProps<SVGSVGElement>) => (
    <svg {...props} viewBox="0 0 40 40" fill="none" xmlns="http://www.w3.org/2000/svg">
      <path d="M5,20 L35,20" stroke="currentColor" strokeWidth="2" strokeLinecap="round" />
    </svg>
  ),
  [CircuitElementType.JUNCTION]: (props: React.SVGProps<SVGSVGElement>) => (
    <svg {...props} viewBox="0 0 40 40" fill="none" xmlns="http://www.w3.org/2000/svg">
      <circle cx="20" cy="20" r="5" fill="currentColor" />
      <circle cx="20" cy="20" r="8" stroke="currentColor" strokeWidth="1" strokeDasharray="2 2" fill="none" />
    </svg>
  ),
  [CircuitElementType.AMMETER]: (props: React.SVGProps<SVGSVGElement>) => (
    <svg {...props} viewBox="0 0 60 60" fill="none" xmlns="http://www.w3.org/2000/svg">
      <circle cx="30" cy="30" r="20" stroke="currentColor" strokeWidth="2.5" fill="#F0F9FF" fillOpacity="0.6" />
      <path d="M24,37 L30,23 L36,37" stroke="currentColor" strokeWidth="2.2" fill="none" />
      <path d="M30,37 L30,41" stroke="currentColor" strokeWidth="2" />
      <text x="26" y="21" fontSize="8" fill="currentColor">A</text>
    </svg>
  ),
  [CircuitElementType.VOLTMETER]: (props: React.SVGProps<SVGSVGElement>) => (
    <svg {...props} viewBox="0 0 60 60" fill="none" xmlns="http://www.w3.org/2000/svg">
      <circle cx="30" cy="30" r="20" stroke="currentColor" strokeWidth="2.5" fill="#F0F9FF" fillOpacity="0.6" />
      <path d="M22,38 L30,22 L38,38" stroke="currentColor" strokeWidth="2.2" fill="none" />
      <text x="26" y="21" fontSize="8" fill="currentColor">V</text>
    </svg>
  ),
  [CircuitElementType.OSCILLOSCOPE]: (props: React.SVGProps<SVGSVGElement>) => (
    <svg {...props} viewBox="0 0 70 50" fill="none" xmlns="http://www.w3.org/2000/svg">
      <rect x="6" y="8" width="58" height="32" rx="4" stroke="currentColor" strokeWidth="2" fill="#F0F9FF" fillOpacity="0.5" />
      <path d="M12,25 L20,19 L26,30 L32,15 L38,33 L46,23 L54,27" stroke="currentColor" strokeWidth="2" fill="none" />
      <circle cx="56" cy="33" r="2" fill="currentColor" />
      <path d="M15,42 L25,42" stroke="currentColor" strokeWidth="2" />
      <path d="M45,42 L55,42" stroke="currentColor" strokeWidth="2" />
    </svg>
  ),
  [CircuitElementType.DIGITAL_INPUT]: (props: React.SVGProps<SVGSVGElement>) => (
    <svg {...props} viewBox="0 0 60 40" fill="none" xmlns="http://www.w3.org/2000/svg">
      <rect x="6" y="10" width="32" height="20" rx="4" stroke="currentColor" strokeWidth="2" fill="#EEF2FF" />
      <path d="M38,20 L55,20" stroke="currentColor" strokeWidth="2" />
      <path d="M50,15 L55,20 L50,25" stroke="currentColor" strokeWidth="2" fill="none" />
      <text x="12" y="23" fontSize="10" fill="currentColor">IN</text>
    </svg>
  ),
  [CircuitElementType.DIGITAL_OUTPUT]: (props: React.SVGProps<SVGSVGElement>) => (
    <svg {...props} viewBox="0 0 60 40" fill="none" xmlns="http://www.w3.org/2000/svg">
      <rect x="22" y="10" width="32" height="20" rx="4" stroke="currentColor" strokeWidth="2" fill="#FEF3C7" />
      <path d="M5,20 L22,20" stroke="currentColor" strokeWidth="2" />
      <path d="M10,15 L5,20 L10,25" stroke="currentColor" strokeWidth="2" fill="none" />
      <text x="30" y="23" fontSize="10" fill="currentColor">OUT</text>
    </svg>
  ),
  [CircuitElementType.DIGITAL_CLOCK]: (props: React.SVGProps<SVGSVGElement>) => (
    <svg {...props} viewBox="0 0 60 40" fill="none" xmlns="http://www.w3.org/2000/svg">
      <rect x="10" y="8" width="40" height="24" rx="6" stroke="currentColor" strokeWidth="2" fill="#E0F2FE" />
      <circle cx="30" cy="20" r="8" stroke="currentColor" strokeWidth="2" fill="none" />
      <path d="M30,20 L30,13" stroke="currentColor" strokeWidth="2" />
      <path d="M30,20 L36,23" stroke="currentColor" strokeWidth="2" />
      <text x="14" y="23" fontSize="8" fill="currentColor">CLK</text>
    </svg>
  ),
  [CircuitElementType.DIGITAL_AND]: (props: React.SVGProps<SVGSVGElement>) => (
    <svg {...props} viewBox="0 0 60 40" fill="none" xmlns="http://www.w3.org/2000/svg">
      <path d="M5,15 L20,15 M5,25 L20,25" stroke="currentColor" strokeWidth="2" />
      <path d="M20,8 H35 C45,8 50,13 50,20 C50,27 45,32 35,32 H20 Z" stroke="currentColor" strokeWidth="2" fill="#ECFDF5" />
      <path d="M50,20 L55,20" stroke="currentColor" strokeWidth="2" />
    </svg>
  ),
  [CircuitElementType.DIGITAL_OR]: (props: React.SVGProps<SVGSVGElement>) => (
    <svg {...props} viewBox="0 0 60 40" fill="none" xmlns="http://www.w3.org/2000/svg">
      <path d="M5,15 L20,15 M5,25 L20,25" stroke="currentColor" strokeWidth="2" />
      <path d="M18,8 C24,14 24,26 18,32 H38 C48,32 54,26 54,20 C54,14 48,8 38,8 H18 Z" stroke="currentColor" strokeWidth="2" fill="#F0F9FF" />
      <path d="M54,20 L59,20" stroke="currentColor" strokeWidth="2" />
    </svg>
  ),
  [CircuitElementType.DIGITAL_NOT]: (props: React.SVGProps<SVGSVGElement>) => (
    <svg {...props} viewBox="0 0 60 40" fill="none" xmlns="http://www.w3.org/2000/svg">
      <path d="M5,20 L20,20" stroke="currentColor" strokeWidth="2" />
      <path d="M20,10 L20,30 L40,20 Z" stroke="currentColor" strokeWidth="2" fill="#FEF3C7" />
      <circle cx="43" cy="20" r="3" stroke="currentColor" strokeWidth="2" fill="#fff" />
      <path d="M46,20 L55,20" stroke="currentColor" strokeWidth="2" />
    </svg>
  ),
  [CircuitElementType.DIGITAL_NAND]: (props: React.SVGProps<SVGSVGElement>) => (
    <svg {...props} viewBox="0 0 60 40" fill="none" xmlns="http://www.w3.org/2000/svg">
      <path d="M5,15 L20,15 M5,25 L20,25" stroke="currentColor" strokeWidth="2" />
      <path d="M20,8 H35 C45,8 50,13 50,20 C50,27 45,32 35,32 H20 Z" stroke="currentColor" strokeWidth="2" fill="#F5F3FF" />
      <circle cx="53" cy="20" r="3" stroke="currentColor" strokeWidth="2" fill="#fff" />
      <path d="M56,20 L60,20" stroke="currentColor" strokeWidth="2" />
    </svg>
  ),
  [CircuitElementType.DIGITAL_NOR]: (props: React.SVGProps<SVGSVGElement>) => (
    <svg {...props} viewBox="0 0 60 40" fill="none" xmlns="http://www.w3.org/2000/svg">
      <path d="M5,15 L22,15 M5,25 L22,25" stroke="currentColor" strokeWidth="2" />
      <path d="M20,8 C25,14 25,26 20,32 H36 C46,32 52,26 52,20 C52,14 46,8 36,8 H20 Z" stroke="currentColor" strokeWidth="2" fill="#F5F3FF" />
      <circle cx="55" cy="20" r="3" stroke="currentColor" strokeWidth="2" fill="#fff" />
      <path d="M58,20 L60,20" stroke="currentColor" strokeWidth="2" />
    </svg>
  ),
  [CircuitElementType.DIGITAL_XOR]: (props: React.SVGProps<SVGSVGElement>) => (
    <svg {...props} viewBox="0 0 60 40" fill="none" xmlns="http://www.w3.org/2000/svg">
      <path d="M10,8 C15,14 15,26 10,32" stroke="currentColor" strokeWidth="2" fill="none" />
      <path d="M15,8 C20,14 20,26 15,32 H34 C44,32 50,26 50,20 C50,14 44,8 34,8 H15 Z" stroke="currentColor" strokeWidth="2" fill="#ECFEFF" />
      <path d="M5,15 L18,15 M5,25 L18,25" stroke="currentColor" strokeWidth="2" />
      <path d="M50,20 L58,20" stroke="currentColor" strokeWidth="2" />
    </svg>
  ),
  [CircuitElementType.DIGITAL_XNOR]: (props: React.SVGProps<SVGSVGElement>) => (
    <svg {...props} viewBox="0 0 60 40" fill="none" xmlns="http://www.w3.org/2000/svg">
      <path d="M8,8 C13,14 13,26 8,32" stroke="currentColor" strokeWidth="2" fill="none" />
      <path d="M13,8 C18,14 18,26 13,32 H32 C42,32 48,26 48,20 C48,14 42,8 32,8 H13 Z" stroke="currentColor" strokeWidth="2" fill="#EEF2FF" />
      <circle cx="51" cy="20" r="3" stroke="currentColor" strokeWidth="2" fill="#fff" />
      <path d="M54,20 L58,20" stroke="currentColor" strokeWidth="2" />
      <path d="M3,15 L15,15 M3,25 L15,25" stroke="currentColor" strokeWidth="2" />
    </svg>
  ),
  [CircuitElementType.DIGITAL_DFF]: (props: React.SVGProps<SVGSVGElement>) => (
    <svg {...props} viewBox="0 0 60 40" fill="none" xmlns="http://www.w3.org/2000/svg">
      <rect x="12" y="8" width="36" height="24" rx="4" stroke="currentColor" strokeWidth="2" fill="#F0FDFA" />
      <text x="27" y="24" fontSize="12" fill="currentColor">D</text>
      <path d="M5,20 L12,20" stroke="currentColor" strokeWidth="2" />
      <path d="M48,20 L55,20" stroke="currentColor" strokeWidth="2" />
      <path d="M30,32 L30,38 M26,35 L34,35" stroke="currentColor" strokeWidth="2" />
    </svg>
  )
};

Object.assign(SVGComponents, {
  [CircuitElementType.PULSE_SOURCE]: SVGComponents[CircuitElementType.AC_SOURCE],
  [CircuitElementType.PWM_SOURCE]: SVGComponents[CircuitElementType.AC_SOURCE],
  [CircuitElementType.SINE_SOURCE]: SVGComponents[CircuitElementType.AC_SOURCE],
  [CircuitElementType.DIODE_ZENER]: SVGComponents[CircuitElementType.DIODE],
  [CircuitElementType.DIODE_LED]: SVGComponents[CircuitElementType.DIODE],
  [CircuitElementType.DIODE_SCHOTTKY]: SVGComponents[CircuitElementType.DIODE],
  [CircuitElementType.DIGITAL_AND3]: SVGComponents[CircuitElementType.DIGITAL_AND],
  [CircuitElementType.DIGITAL_AND4]: SVGComponents[CircuitElementType.DIGITAL_AND],
  [CircuitElementType.DIGITAL_OR3]: SVGComponents[CircuitElementType.DIGITAL_OR],
  [CircuitElementType.DIGITAL_OR4]: SVGComponents[CircuitElementType.DIGITAL_OR],
  [CircuitElementType.DIGITAL_BUF]: SVGComponents[CircuitElementType.DIGITAL_NOT],
  [CircuitElementType.DIGITAL_TRI]: SVGComponents[CircuitElementType.DIGITAL_NOT],
  [CircuitElementType.DIGITAL_SCHMITT_NOT]: SVGComponents[CircuitElementType.DIGITAL_NOT],
  [CircuitElementType.DIGITAL_NAND3]: SVGComponents[CircuitElementType.DIGITAL_NAND],
  [CircuitElementType.DIGITAL_NAND4]: SVGComponents[CircuitElementType.DIGITAL_NAND],
  [CircuitElementType.DIGITAL_NOR3]: SVGComponents[CircuitElementType.DIGITAL_NOR],
  [CircuitElementType.DIGITAL_NOR4]: SVGComponents[CircuitElementType.DIGITAL_NOR],
  [CircuitElementType.DIGITAL_JKFF]: SVGComponents[CircuitElementType.DIGITAL_DFF],
  [CircuitElementType.DIGITAL_TFF]: SVGComponents[CircuitElementType.DIGITAL_DFF],
  [CircuitElementType.DIGITAL_SRFF]: SVGComponents[CircuitElementType.DIGITAL_DFF],
});

// 使用React.memo包裹电路节点组件，避免不必要的重渲染
export const CircuitNode = memo(({ data, selected, id }: NodeProps<CircuitNodeData>) => {
  const [hovered, setHovered] = useState<boolean>(false);
  const [lastValues, setLastValues] = useState({
    label: data.label || "",
    value: data.value || ""
  });
  const rotation = Number(data.element?.rotation || 0);
  
  // 获取元件中的初始值，使用useMemo避免重复计算
  useEffect(() => {
    // 只有当元件的基本属性变化时才更新状态
    if (data.element && (
        data.label !== lastValues.label || 
        data.value !== lastValues.value
      )) {
      // 更新最后一次的值
      setLastValues({
        label: data.label || "",
        value: data.value || ""
      });
    }
  }, [data.element, data.label, data.value, lastValues]);
  
  // 使用useMemo缓存端口列表，避免每次渲染都重新计算
  const ports = useMemo(() => {
    if (data.ports && data.ports.length > 0) {
      return data.ports;
    } else if (data.element && data.element.ports && data.element.ports.length > 0) {
      return data.element.ports;
    } else {
      return getDefaultPorts(data.type);
    }
  }, [data.ports, data.element, data.type]);
  
  // 使用useMemo缓存SVG组件
  const SvgComponent = useMemo(() => {
    const validType = data.type || CircuitElementType.RESISTOR;
    return (SVGComponents[validType] || SVGComponents[CircuitElementType.RESISTOR] || (() => null)) as React.FC<React.SVGProps<SVGSVGElement>>;
  }, [data.type]);
  
  // 获取端口的位置样式
  const getPortStyle = useCallback((port: Port): React.CSSProperties => {
    const baseStyle: React.CSSProperties = {
      position: 'absolute',
      width: 8,
      height: 8,
      background: '#fff',
      border: '2px solid #3B82F6',
      borderRadius: '50%',
      zIndex: 10,
      transform: 'translate(-50%, -50%)',
    };

    // 处理初始位置（未旋转时）
    const { x, y, side } = port.position;
    const style = { ...baseStyle };
    
    // 根据端口所在的边设置位置
    switch(side) {
      case 'left':
        style.left = `${x}%`;
        style.top = `${y}%`;
        break;
      case 'right':
        style.left = `${x}%`;
        style.top = `${y}%`;
        break;
      case 'top':
        style.left = `${x}%`;
        style.top = '0%';
        break;
      case 'bottom':
        style.left = `${x}%`;
        style.top = '100%';
        break;
    }
    
    return style;
  }, []);
  
  // 特定元件的端口映射修正
  const getFixedPortStyle = useCallback((port: Port, portStyle: React.CSSProperties): React.CSSProperties => {
    const type = data.type;
    
    // 根据元件类型和旋转角度进行特殊的位置调整
    if (type === CircuitElementType.RESISTOR) {
      // 电阻器的端口位置修正
      if (rotation === 90 || rotation === 270) {
        // 90度和270度时，保持水平距离不变
        if (port.id === 'port1' || port.id === 'port2') {
          return {
            ...portStyle,
            // 微调定位，确保端点与SVG图形上的连接点对齐
            left: rotation === 90 ? 
              (port.id === 'port1' ? '50%' : '50%') :
              (port.id === 'port1' ? '50%' : '50%'),
            top: rotation === 90 ?
              (port.id === 'port1' ? '100%' : '0%') : 
              (port.id === 'port1' ? '0%' : '100%'),
          };
        }
      }
    } else if (type === CircuitElementType.CAPACITOR || type === CircuitElementType.INDUCTOR) {
      // 电容器和电感器端口位置修正
      if (rotation === 90 || rotation === 270) {
        return {
          ...portStyle,
          // 确保端口垂直对齐
          left: '50%', 
          top: port.id === 'port1' ? 
            (rotation === 90 ? '100%' : '0%') : 
            (rotation === 90 ? '0%' : '100%')
        };
      }
    } else if (type === CircuitElementType.VOLTAGE_SOURCE || type === CircuitElementType.CURRENT_SOURCE) {
      // 电源端口位置修正
      if (rotation === 90 || rotation === 270) {
        return {
          ...portStyle,
          // 确保端口垂直对齐
          left: '50%',
          top: port.id === 'positive' ? 
            (rotation === 90 ? '100%' : '0%') : 
            (rotation === 90 ? '0%' : '100%')
        };
      }
    } else if (type === CircuitElementType.DIODE) {
      // 二极管端口位置修正
      if (rotation === 90 || rotation === 270) {
        return {
          ...portStyle,
          // 确保端口垂直对齐
          left: '50%',
          top: port.id === 'anode' ? 
            (rotation === 90 ? '100%' : '0%') : 
            (rotation === 90 ? '0%' : '100%')
        };
      }
    }
    
    // 其他元件或旋转角度，使用默认位置
    return portStyle;
  }, [data.type, rotation]);
  
  // 优化双击处理函数的性能
  const handleDoubleClick = useCallback((event: React.MouseEvent) => {
    // 阻止冒泡，确保事件不向上传播
    event.stopPropagation();
    
    // 自定义双击事件
    const doubleClickEvent = new CustomEvent('circuit-node-double-clicked', {
      detail: { nodeId: id }
    });
    document.dispatchEvent(doubleClickEvent);
  }, [id]);
  
  // 获取元件主题样式，使用useMemo优化
  const elementTheme = useMemo(() => {
    const themes = {
      default: { bg: '#F0F9FF', border: '#3B82F6', text: '#1F2937' },
      warning: { bg: '#FEF3C7', border: '#F59E0B', text: '#92400E' },
      danger: { bg: '#FEE2E2', border: '#EF4444', text: '#B91C1C' },
      success: { bg: '#D1FAE5', border: '#10B981', text: '#065F46' },
    };
    return themes.default;
  }, []);
  
  // 获取元件类型名称，使用useMemo优化
  const elementTypeName = useMemo(() => {
    const typeNames: Partial<Record<CircuitElementType, string>> = {
      [CircuitElementType.RESISTOR]: '电阻',
      [CircuitElementType.CAPACITOR]: '电容',
      [CircuitElementType.INDUCTOR]: '电感',
      [CircuitElementType.VOLTAGE_SOURCE]: '电压源',
      [CircuitElementType.CURRENT_SOURCE]: '电流源',
      [CircuitElementType.AC_SOURCE]: '交流源',
      [CircuitElementType.PULSE_SOURCE]: '脉冲源',
      [CircuitElementType.PWM_SOURCE]: 'PWM源',
      [CircuitElementType.SINE_SOURCE]: '正弦源',
      [CircuitElementType.DIODE]: '二极管',
      [CircuitElementType.DIODE_ZENER]: '稳压二极管',
      [CircuitElementType.DIODE_LED]: 'LED',
      [CircuitElementType.DIODE_SCHOTTKY]: '肖特基',
      [CircuitElementType.TRANSISTOR_NPN]: 'NPN晶体管',
      [CircuitElementType.TRANSISTOR_PNP]: 'PNP晶体管',
      [CircuitElementType.GROUND]: '接地',
      [CircuitElementType.OPAMP]: '运放',
      [CircuitElementType.WIRE]: '导线',
      [CircuitElementType.JUNCTION]: '节点',
      [CircuitElementType.AMMETER]: '电流表',
      [CircuitElementType.VOLTMETER]: '电压表',
      [CircuitElementType.OSCILLOSCOPE]: '示波器',
      [CircuitElementType.DIGITAL_AND]: 'AND',
      [CircuitElementType.DIGITAL_AND3]: 'AND3',
      [CircuitElementType.DIGITAL_AND4]: 'AND4',
      [CircuitElementType.DIGITAL_OR]: 'OR',
      [CircuitElementType.DIGITAL_OR3]: 'OR3',
      [CircuitElementType.DIGITAL_OR4]: 'OR4',
      [CircuitElementType.DIGITAL_NOT]: 'NOT',
      [CircuitElementType.DIGITAL_BUF]: 'BUF',
      [CircuitElementType.DIGITAL_TRI]: 'TRI',
      [CircuitElementType.DIGITAL_SCHMITT_NOT]: 'S-NOT',
      [CircuitElementType.DIGITAL_NAND]: 'NAND',
      [CircuitElementType.DIGITAL_NAND3]: 'NAND3',
      [CircuitElementType.DIGITAL_NAND4]: 'NAND4',
      [CircuitElementType.DIGITAL_NOR]: 'NOR',
      [CircuitElementType.DIGITAL_NOR3]: 'NOR3',
      [CircuitElementType.DIGITAL_NOR4]: 'NOR4',
      [CircuitElementType.DIGITAL_XOR]: 'XOR',
      [CircuitElementType.DIGITAL_XNOR]: 'XNOR',
      [CircuitElementType.DIGITAL_DFF]: 'DFF',
      [CircuitElementType.DIGITAL_JKFF]: 'JK',
      [CircuitElementType.DIGITAL_TFF]: 'TFF',
      [CircuitElementType.DIGITAL_SRFF]: 'SR',
    };
    return typeNames[data.type as CircuitElementType] || '元件';
  }, [data.type]);

  // 考虑到元件的旋转，处理端口位置
  const getPortPosition = useCallback((side: 'left' | 'right' | 'top' | 'bottom', rotation: number): Position => {
    // 根据旋转角度确定端口的位置
    if (rotation === 0) {
      if (side === 'left') return Position.Left;
      if (side === 'right') return Position.Right;
      if (side === 'top') return Position.Top;
      if (side === 'bottom') return Position.Bottom;
    } else if (rotation === 90) {
      if (side === 'left') return Position.Top;
      if (side === 'right') return Position.Bottom;
      if (side === 'top') return Position.Right;
      if (side === 'bottom') return Position.Left;
    } else if (rotation === 180) {
      if (side === 'left') return Position.Right;
      if (side === 'right') return Position.Left;
      if (side === 'top') return Position.Bottom;
      if (side === 'bottom') return Position.Top;
    } else if (rotation === 270) {
      if (side === 'left') return Position.Bottom;
      if (side === 'right') return Position.Top;
      if (side === 'top') return Position.Left;
      if (side === 'bottom') return Position.Right;
    }
    return Position.Left; // 默认值
  }, []);
  
  // 渲染组件
  return (
    <div
      className={`relative p-2 ${
        selected ? 'outline outline-2 outline-blue-500' : 'outline-none'
      }`}
      style={{
        width: 'fit-content',
        height: 'fit-content',
        minWidth: '60px',
        minHeight: '60px',
        cursor: 'grab',
        transform: `rotate(${rotation}deg)`,
        transformOrigin: 'center center',
        transition: 'transform 0.2s ease',
        backgroundColor: hovered ? 'rgba(240, 249, 255, 0.9)' : 'rgba(240, 249, 255, 0.5)',
        borderRadius: '6px'
      }}
      onMouseEnter={() => setHovered(true)}
      onMouseLeave={() => setHovered(false)}
      onDoubleClick={handleDoubleClick}
    >
      {/* 元件SVG */}
      <div 
        className="element-svg-container"
        style={{ 
          width: '100%',
          height: '100%',
          position: 'relative',
          display: 'flex',
          alignItems: 'center',
          justifyContent: 'center',
          color: '#1F2937',
          padding: '4px'
        }}
      >
        <div 
          style={{ 
            width: '100%',
            height: '100%',
            display: 'flex',
            alignItems: 'center',
            justifyContent: 'center',
          }}
        >
          <SvgComponent width="40" height="40" style={{color: '#1F2937'}} />
        </div>
        {/* 内嵌标签，减少画布占用 */}
        <div
          className="absolute rounded-full transition-all duration-200"
          style={{
            bottom: '2px',
            left: '50%',
            transform: 'translateX(-50%)',
            padding: '0 4px',
            background: selected ? 'rgba(255,255,255,0.95)' : 'rgba(255,255,255,0.88)',
            border: `1px solid ${elementTheme.border}`,
            color: elementTheme.text,
            fontSize: '9px',
            opacity: selected ? 1 : 0.9,
            pointerEvents: 'none',
            zIndex: 6,
            minWidth: '22px',
            textAlign: 'center',
            lineHeight: 1.1,
            boxShadow: selected ? '0 1px 3px rgba(15, 23, 42, 0.2)' : 'none',
            whiteSpace: 'nowrap',
            overflow: 'hidden',
            textOverflow: 'ellipsis',
            maxWidth: '48px'
          }}
          title={lastValues.value ? `${data.label} (${lastValues.value})` : data.label}
        >
          {data.label}
        </div>
      </div>
      
      {/* 渲染所有端口 */}
      {ports.map((port: Port) => {
        // 获取基础端口样式
        const basePortStyle = getPortStyle(port);
        // 应用特定元件的端口位置修正
        const portStyle = getFixedPortStyle(port, basePortStyle);
        const portPosition = getPortPosition(port.position.side, rotation);
        const isInput = port.type === 'input' || port.type === 'bidirectional';
        const isOutput = port.type === 'output' || port.type === 'bidirectional';
        
        // 获取端口颜色 - 根据端口类型
        const getPortColor = () => {
          if (port.type === 'input') return '#3B82F6'; // 蓝色
          if (port.type === 'output') return '#10B981'; // 绿色
          return '#8B5CF6'; // 紫色 (双向)
        };
        
        return (
          <React.Fragment key={port.id}>
            {/* 渲染物理可见的端口标记点 */}
            <div
              className="circuit-port-marker"
              style={{
                ...portStyle,
                pointerEvents: 'none', // 不接收鼠标事件，避免干扰连线
                border: `2px solid ${getPortColor()}`,
                background: '#fff',
                transition: 'all 0.15s ease, transform 0.3s ease',
                width: 6, // 稍微减小端口尺寸
                height: 6,
              }}
              data-port-id={port.id}
              data-port-type={port.type}
              data-rotation={rotation}
            />
            
            {/* 输入端口句柄 */}
            {isInput && (
              <Handle
                type="target"
                position={portPosition}
                id={port.id}
                style={{
                  ...portStyle,
                  background: 'transparent', // 透明背景
                  width: 14, // 适当尺寸的点击区域
                  height: 14,
                  zIndex: 5,
                  border: '2px solid transparent',
                }}
                isConnectable={true}
                data-port-name={port.name}
                data-port-type={port.type}
              />
            )}
            
            {/* 输出端口句柄 */}
            {isOutput && (
              <Handle
                type="source"
                position={portPosition}
                id={port.id}
                style={{
                  ...portStyle,
                  background: 'transparent', // 透明背景
                  width: 14, // 适当尺寸的点击区域
                  height: 14,
                  zIndex: 5,
                  border: '2px solid transparent',
                }}
                isConnectable={true}
                data-port-name={port.name}
                data-port-type={port.type}
              />
            )}
          </React.Fragment>
        );
      })}
      
    </div>
  );
});

CircuitNode.displayName = 'CircuitNode';
