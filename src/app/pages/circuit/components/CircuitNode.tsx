'use client';

import React, { memo, useMemo, useEffect, useState, useCallback } from 'react';
import { Handle, Position, NodeProps } from 'reactflow';
import { CircuitElement, CircuitElementType, ComponentVisualConfig } from '@/api/types/circuit.types';

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
  type: CircuitElementType;
  label: string;
  value: string;
  element?: CircuitElement; // 添加完整的元件数据
  onNodeClick?: (id: string) => void;
  onNodeDoubleClick?: (id: string) => void;
  onRotate?: (id: string, rotation: number) => void;
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
};

// 为每种元件类型定义默认端口配置函数
const getDefaultPorts = (elementType: string): Port[] => {
  return defaultPorts[elementType] || defaultPorts[CircuitElementType.RESISTOR] || [];
};

// 为了解决没有SVG组件问题，直接内嵌SVG组件
const SVGComponents: Record<CircuitElementType, React.FC<React.SVGProps<SVGSVGElement>>> = {
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
  )
};

export const CircuitNode = memo(({ data, id, selected }: NodeProps<CircuitNodeData>) => {
  const { type, label } = data;
  
  // 获取元件配置
  const config = ComponentVisualConfig[type];
  
  // 获取元件当前的旋转角度
  const rotation = data.element?.rotation || 0;
  
  // 获取元件值，并执行格式化
  const value = useMemo(() => {
    return data.value || data.element?.value || '';
  }, [data.value, data.element?.value]);

  // 获取当前元件的端口配置
  const ports = useMemo(() => {
    const elementType = data.element?.type || '';
    // 根据元件类型获取默认端口配置
    return getDefaultPorts(elementType);
  }, [data.element?.type]);
  
  useEffect(() => {
    // 当旋转角度变化时，触发DOM更新以便ReactFlow重新计算边的位置
    // 这一步很重要，因为ReactFlow需要检测到DOM变化才能重新计算边
    const handles = document.querySelectorAll(`[data-nodeid="${id}"] .react-flow__handle`);
    handles.forEach(handle => {
      // 触发一个无害的DOM变化
      handle.setAttribute('data-rotation', `${rotation}`);
      
      // 明确设置handle的数据属性，帮助调试和查找
      const portId = handle.getAttribute('data-handleid');
      if (portId) {
        // 查找对应的端口
        const port = ports.find(p => p.id === portId);
        if (port) {
          // 设置明确的数据属性
          handle.setAttribute('data-port-type', port.type);
          handle.setAttribute('data-port-side', port.position.side);
        }
      }
    });
    
    // 添加50ms后的边缘更新，确保连线跟随端口
    setTimeout(() => {
      // 触发ReactFlow实例的节点更新
      const event = new CustomEvent('circuit-node-rotated', { 
        detail: { nodeId: id, rotation } 
      });
      document.dispatchEvent(event);
    }, 50);
  }, [rotation, id, ports]);

  // 获取元件的颜色主题
  const getElementTheme = () => {
    switch(type) {
      case CircuitElementType.RESISTOR:
      case CircuitElementType.CAPACITOR:
      case CircuitElementType.INDUCTOR:
        return {
          primary: '#3B82F6', // 蓝色
          secondary: '#EFF6FF',
          border: '#93C5FD',
          text: '#1E40AF'
        };
      case CircuitElementType.VOLTAGE_SOURCE:
      case CircuitElementType.CURRENT_SOURCE:
        return {
          primary: '#10B981', // 绿色
          secondary: '#ECFDF5',
          border: '#6EE7B7',
          text: '#065F46'
        };
      case CircuitElementType.DIODE:
      case CircuitElementType.TRANSISTOR_NPN:
      case CircuitElementType.TRANSISTOR_PNP:
        return {
          primary: '#F59E0B', // 橙色
          secondary: '#FEF3C7',
          border: '#FCD34D',
          text: '#B45309'
        };
      case CircuitElementType.GROUND:
        return {
          primary: '#6B7280', // 灰色
          secondary: '#F3F4F6',
          border: '#D1D5DB',
          text: '#374151'
        };
      case CircuitElementType.OPAMP:
        return {
          primary: '#8B5CF6', // 紫色
          secondary: '#F5F3FF',
          border: '#C4B5FD',
          text: '#5B21B6'
        };
      default:
        return {
          primary: '#3B82F6',
          secondary: '#EFF6FF',
          border: '#93C5FD',
          text: '#1E40AF'
        };
    }
  };
  
  const theme = getElementTheme();
  
  // 获取元件类型的文本描述
  const getElementTypeName = () => {
    switch(type) {
      case CircuitElementType.RESISTOR: return '电阻器';
      case CircuitElementType.CAPACITOR: return '电容器';
      case CircuitElementType.INDUCTOR: return '电感器';
      case CircuitElementType.VOLTAGE_SOURCE: return '电压源';
      case CircuitElementType.CURRENT_SOURCE: return '电流源';
      case CircuitElementType.DIODE: return '二极管';
      case CircuitElementType.TRANSISTOR_NPN: return 'NPN晶体管';
      case CircuitElementType.TRANSISTOR_PNP: return 'PNP晶体管';
      case CircuitElementType.GROUND: return '接地';
      case CircuitElementType.OPAMP: return '运算放大器';
      default: return '元件';
    }
  };
  
  // 获取元件单位
  const getElementUnit = () => {
    switch(type) {
      case CircuitElementType.RESISTOR: return 'Ω';
      case CircuitElementType.CAPACITOR: return 'F';
      case CircuitElementType.INDUCTOR: return 'H';
      case CircuitElementType.VOLTAGE_SOURCE: return 'V';
      case CircuitElementType.CURRENT_SOURCE: return 'A';
      default: return '';
    }
  };
  
  // 计算合适的元件尺寸
  const elementSize = {
    width: config.width + 20, // 增加边距
    height: config.height + 20
  };
  
  // 处理双击事件 - 显示属性面板
  const handleDoubleClick = useCallback((e: React.MouseEvent<HTMLDivElement>) => {
    e.stopPropagation();
    
    // 触发外部的双击回调
    if (data.onNodeDoubleClick) {
      data.onNodeDoubleClick(id);
    }
  }, [id, data]);

  // 获取端口的位置样式
  const getPortStyle = (port: Port): React.CSSProperties => {
    const baseStyle: React.CSSProperties = {
      position: 'absolute',
      width: 8,  // 调整端口大小
      height: 8,
      background: '#fff',
      border: '2px solid #3B82F6',
      borderRadius: '50%',
      zIndex: 10,
      transform: 'translate(-50%, -50%)',
    };

    // 获取当前旋转角度
    const currentRotation = data.element?.rotation || 0;
    const normalizedRotation = currentRotation % 360;
    
    // 处理初始位置（未旋转时）
    const { x, y, side } = port.position;
    const style = { ...baseStyle };

    // 根据旋转角度计算端口位置
    switch(normalizedRotation) {
      case 0: // 0度旋转
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
        break;
      
      case 90: // 90度旋转
        switch(side) {
          case 'left': // 左边变成了底部
            style.left = `${y}%`;
            style.top = '100%';
            break;
          case 'right': // 右边变成了顶部
            style.left = `${y}%`;
            style.top = '0%';
            break;
          case 'top': // 顶部变成了右边
            style.left = '100%';
            style.top = `${100-x}%`;
            break;
          case 'bottom': // 底部变成了左边
            style.left = '0%';
            style.top = `${100-x}%`;
            break;
        }
        break;
      
      case 180: // 180度旋转
        switch(side) {
          case 'left': // 左边变成了右边
            style.left = '100%';
            style.top = `${100-y}%`;
            break;
          case 'right': // 右边变成了左边
            style.left = '0%';
            style.top = `${100-y}%`;
            break;
          case 'top': // 顶部变成了底部
            style.left = `${100-x}%`;
            style.top = '100%';
            break;
          case 'bottom': // 底部变成了顶部
            style.left = `${100-x}%`;
            style.top = '0%';
            break;
        }
        break;
      
      case 270: // 270度旋转
        switch(side) {
          case 'left': // 左边变成了顶部
            style.left = `${100-y}%`;
            style.top = '0%';
            break;
          case 'right': // 右边变成了底部
            style.left = `${100-y}%`;
            style.top = '100%';
            break;
          case 'top': // 顶部变成了左边
            style.left = '0%';
            style.top = `${x}%`;
            break;
          case 'bottom': // 底部变成了右边
            style.left = '100%';
            style.top = `${x}%`;
            break;
        }
        break;
    }

    return style;
  };

  // 根据旋转角度计算端口位置
  const getPortPosition = (side: 'left' | 'right' | 'top' | 'bottom', rotation: number): Position => {
    // 规范化旋转角度
    const normalizedRotation = rotation % 360;
    
    // 根据旋转角度映射端口位置
    switch(normalizedRotation) {
      case 0:
        switch(side) {
          case 'left': return Position.Left;
          case 'right': return Position.Right;
          case 'top': return Position.Top;
          case 'bottom': return Position.Bottom;
          default: return Position.Left;
        }
      case 90:
        switch(side) {
          case 'left': return Position.Bottom;
          case 'right': return Position.Top;
          case 'top': return Position.Right;
          case 'bottom': return Position.Left;
          default: return Position.Left;
        }
      case 180:
        switch(side) {
          case 'left': return Position.Right;
          case 'right': return Position.Left;
          case 'top': return Position.Bottom;
          case 'bottom': return Position.Top;
          default: return Position.Left;
        }
      case 270:
        switch(side) {
          case 'left': return Position.Top;
          case 'right': return Position.Bottom;
          case 'top': return Position.Left;
          case 'bottom': return Position.Right;
          default: return Position.Left;
        }
      default:
        return Position.Left;
    }
  };

  const renderSvgComponent = () => {
    const type = data.element?.type;
    if (!type) return null;

    const SvgComponent = SVGComponents[type] || null;
    if (!SvgComponent) return null;

    // 获取元件主题色
    const color = theme.text;

    return (
      <div style={{ 
        width: '100%', 
        height: '100%', 
        display: 'flex', 
        alignItems: 'center', 
        justifyContent: 'center',
        color: color,
      }}>
        <SvgComponent />
      </div>
    );
  };

  // 特定元件的端口映射修正
  // 这个函数用于对特定元件在旋转时保持端口与实际SVG图形中的连接点对齐
  const getFixedPortStyle = (port: Port, portStyle: React.CSSProperties): React.CSSProperties => {
    const { type } = data.element || { type: CircuitElementType.RESISTOR };
    const normalizedRotation = rotation % 360;
    
    // 根据元件类型和旋转角度进行特殊的位置调整
    if (type === CircuitElementType.RESISTOR) {
      // 电阻器的端口位置修正
      if (normalizedRotation === 0 || normalizedRotation === 180) {
        return portStyle; // 0度和180度不需要特殊调整
      } else if (normalizedRotation === 90 || normalizedRotation === 270) {
        // 90度和270度时，保持水平距离不变
        if (port.id === 'port1' || port.id === 'port2') {
          return {
            ...portStyle,
            // 微调定位，确保端点与SVG图形上的连接点对齐
            left: normalizedRotation === 90 ? 
              (port.id === 'port1' ? '50%' : '50%') :
              (port.id === 'port1' ? '50%' : '50%'),
            top: normalizedRotation === 90 ?
              (port.id === 'port1' ? '100%' : '0%') : 
              (port.id === 'port1' ? '0%' : '100%'),
          };
        }
      }
    } else if (type === CircuitElementType.CAPACITOR || type === CircuitElementType.INDUCTOR) {
      // 电容器和电感器端口位置修正
      if (normalizedRotation === 90 || normalizedRotation === 270) {
        return {
          ...portStyle,
          // 确保端口垂直对齐
          left: '50%', 
          top: port.id === 'port1' ? 
            (normalizedRotation === 90 ? '100%' : '0%') : 
            (normalizedRotation === 90 ? '0%' : '100%')
        };
      }
    } else if (type === CircuitElementType.VOLTAGE_SOURCE || type === CircuitElementType.CURRENT_SOURCE) {
      // 电源端口位置修正
      if (normalizedRotation === 90 || normalizedRotation === 270) {
        return {
          ...portStyle,
          // 确保端口垂直对齐
          left: '50%',
          top: port.id === 'positive' ? 
            (normalizedRotation === 90 ? '100%' : '0%') : 
            (normalizedRotation === 90 ? '0%' : '100%')
        };
      }
    } else if (type === CircuitElementType.DIODE) {
      // 二极管端口位置修正
      if (normalizedRotation === 90 || normalizedRotation === 270) {
        return {
          ...portStyle,
          // 确保端口垂直对齐
          left: '50%',
          top: port.id === 'anode' ? 
            (normalizedRotation === 90 ? '100%' : '0%') : 
            (normalizedRotation === 90 ? '0%' : '100%')
        };
      }
    }
    
    // 其他元件或旋转角度，使用默认位置
    return portStyle;
  };

  return (
    <div 
      className="relative circuit-node-container" 
      style={{ 
        width: elementSize.width, 
        height: elementSize.height,
        transition: 'all 0.2s ease',
        boxShadow: selected ? `0 0 0 2px ${theme.primary}, 0 3px 7px rgba(0,0,0,0.1)` : 'none',
        background: 'transparent', // 改为透明背景
        overflow: 'visible',
      }}
      data-rotation={rotation}
      data-element-type={data.element?.type}
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
        }}
      >
        <div 
          style={{ 
            transform: `rotate(${rotation}deg)`,
            transition: 'transform 0.3s ease',
            width: '100%',
            height: '100%',
            display: 'flex',
            alignItems: 'center',
            justifyContent: 'center',
          }}
        >
          {renderSvgComponent()}
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
      
      {/* 只在选中状态显示标签信息 */}
      {selected && (
        <div 
          className="absolute -bottom-5 left-1/2 transform -translate-x-1/2 px-1 py-0.5 bg-white text-xs rounded shadow-sm border"
          style={{
            borderColor: theme.border,
            color: theme.text,
            fontSize: '9px',
            pointerEvents: 'none', // 不阻止点击事件
            zIndex: 5,
          }}
        >
          {label}
          {value && ` (${value})`}
        </div>
      )}
    </div>
  );
});

CircuitNode.displayName = 'CircuitNode';