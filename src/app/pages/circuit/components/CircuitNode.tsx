'use client';

import React, { memo, useMemo, useEffect } from 'react';
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

// 为了解决没有SVG组件问题，直接内嵌SVG组件
const SVGComponents: Record<CircuitElementType, React.FC<React.SVGProps<SVGSVGElement>>> = {
  [CircuitElementType.RESISTOR]: (props: React.SVGProps<SVGSVGElement>) => (
    <svg {...props} viewBox="0 0 60 20" fill="none" xmlns="http://www.w3.org/2000/svg">
      <path d="M10,10 L15,10 L20,5 L25,15 L30,5 L35,15 L40,5 L45,15 L50,10 L55,10" stroke="#334155" strokeWidth="2" fill="none" />
    </svg>
  ),
  [CircuitElementType.CAPACITOR]: (props: React.SVGProps<SVGSVGElement>) => (
    <svg {...props} viewBox="0 0 40 40" fill="none" xmlns="http://www.w3.org/2000/svg">
      <path d="M10,20 L18,20" stroke="#334155" strokeWidth="2" />
      <path d="M18,5 L18,35" stroke="#334155" strokeWidth="2" />
      <path d="M22,5 L22,35" stroke="#334155" strokeWidth="2" />
      <path d="M22,20 L30,20" stroke="#334155" strokeWidth="2" />
    </svg>
  ),
  [CircuitElementType.INDUCTOR]: (props: React.SVGProps<SVGSVGElement>) => (
    <svg {...props} viewBox="0 0 40 40" fill="none" xmlns="http://www.w3.org/2000/svg">
      <path d="M5,20 L10,20" stroke="#334155" strokeWidth="2" />
      <path d="M10,20 C12,20 12,15 15,15 C18,15 18,25 21,25 C24,25 24,15 27,15 C30,15 30,20 32,20" stroke="#334155" strokeWidth="2" fill="none" />
      <path d="M32,20 L37,20" stroke="#334155" strokeWidth="2" />
    </svg>
  ),
  [CircuitElementType.VOLTAGE_SOURCE]: (props: React.SVGProps<SVGSVGElement>) => (
    <svg {...props} viewBox="0 0 40 40" fill="none" xmlns="http://www.w3.org/2000/svg">
      <circle cx="20" cy="20" r="15" stroke="#334155" strokeWidth="2" fill="none" />
      <path d="M15,20 L25,20" stroke="#334155" strokeWidth="2" />
      <path d="M20,15 L20,25" stroke="#334155" strokeWidth="2" />
    </svg>
  ),
  [CircuitElementType.CURRENT_SOURCE]: (props: React.SVGProps<SVGSVGElement>) => (
    <svg {...props} viewBox="0 0 40 40" fill="none" xmlns="http://www.w3.org/2000/svg">
      <circle cx="20" cy="20" r="15" stroke="#334155" strokeWidth="2" fill="none" />
      <path d="M5,20 L35,20" stroke="#334155" strokeWidth="2" />
      <path d="M35,20 L30,15" stroke="#334155" strokeWidth="2" />
      <path d="M35,20 L30,25" stroke="#334155" strokeWidth="2" />
    </svg>
  ),
  [CircuitElementType.DIODE]: (props: React.SVGProps<SVGSVGElement>) => (
    <svg {...props} viewBox="0 0 40 40" fill="none" xmlns="http://www.w3.org/2000/svg">
      <path d="M5,20 L15,20" stroke="#334155" strokeWidth="2" />
      <path d="M15,10 L15,30" stroke="#334155" strokeWidth="2" />
      <path d="M15,10 L25,20 L15,30 Z" stroke="#334155" strokeWidth="2" fill="none" />
      <path d="M25,10 L25,30" stroke="#334155" strokeWidth="2" />
      <path d="M25,20 L35,20" stroke="#334155" strokeWidth="2" />
    </svg>
  ),
  [CircuitElementType.TRANSISTOR_NPN]: (props: React.SVGProps<SVGSVGElement>) => (
    <svg {...props} viewBox="0 0 60 60" fill="none" xmlns="http://www.w3.org/2000/svg">
      <circle cx="30" cy="30" r="15" stroke="#334155" strokeWidth="2" fill="none" />
      <path d="M30,15 L30,45" stroke="#334155" strokeWidth="2" />
      <path d="M5,30 L15,30" stroke="#334155" strokeWidth="2" />
      <path d="M30,20 L45,5" stroke="#334155" strokeWidth="2" />
      <path d="M30,40 L45,55" stroke="#334155" strokeWidth="2" />
      <path d="M45,5 L50,5" stroke="#334155" strokeWidth="1" />
      <path d="M47,3 R47,7" stroke="#334155" strokeWidth="1" />
    </svg>
  ),
  [CircuitElementType.TRANSISTOR_PNP]: (props: React.SVGProps<SVGSVGElement>) => (
    <svg {...props} viewBox="0 0 60 60" fill="none" xmlns="http://www.w3.org/2000/svg">
      <circle cx="30" cy="30" r="15" stroke="#334155" strokeWidth="2" fill="none" />
      <path d="M30,15 L30,45" stroke="#334155" strokeWidth="2" />
      <path d="M5,30 L15,30" stroke="#334155" strokeWidth="2" />
      <path d="M30,20 L45,5" stroke="#334155" strokeWidth="2" />
      <path d="M30,40 L45,55" stroke="#334155" strokeWidth="2" />
      <path d="M45,55 L50,55" stroke="#334155" strokeWidth="1" />
    </svg>
  ),
  [CircuitElementType.GROUND]: (props: React.SVGProps<SVGSVGElement>) => (
    <svg {...props} viewBox="0 0 40 40" fill="none" xmlns="http://www.w3.org/2000/svg">
      <path d="M20,5 L20,20" stroke="#334155" strokeWidth="2" />
      <path d="M10,20 L30,20" stroke="#334155" strokeWidth="2" />
      <path d="M13,25 L27,25" stroke="#334155" strokeWidth="2" />
      <path d="M16,30 L24,30" stroke="#334155" strokeWidth="2" />
    </svg>
  ),
  [CircuitElementType.OPAMP]: (props: React.SVGProps<SVGSVGElement>) => (
    <svg {...props} viewBox="0 0 60 40" fill="none" xmlns="http://www.w3.org/2000/svg">
      <path d="M10,5 L10,35 L50,20 L10,5 Z" stroke="#334155" strokeWidth="2" fill="none" />
      <path d="M5,15 L10,15" stroke="#334155" strokeWidth="2" />
      <path d="M5,25 L10,25" stroke="#334155" strokeWidth="2" />
      <path d="M50,20 L55,20" stroke="#334155" strokeWidth="2" />
    </svg>
  ),
  [CircuitElementType.WIRE]: (props: React.SVGProps<SVGSVGElement>) => (
    <svg {...props} viewBox="0 0 40 40" fill="none" xmlns="http://www.w3.org/2000/svg">
      <path d="M5,20 L35,20" stroke="#334155" strokeWidth="2" />
    </svg>
  ),
  [CircuitElementType.JUNCTION]: (props: React.SVGProps<SVGSVGElement>) => (
    <svg {...props} viewBox="0 0 40 40" fill="none" xmlns="http://www.w3.org/2000/svg">
      <circle cx="20" cy="20" r="5" fill="#334155" />
    </svg>
  )
};

// 为每种元件类型定义默认端口
const defaultPorts: Record<string, Port[]> = {
  [CircuitElementType.RESISTOR]: [
    { 
      id: 'port1', 
      name: '左端口', 
      type: 'bidirectional', 
      position: { 
        side: 'left', 
        x: 10, 
        y: 50,
        rotatedOffset: {
          90: { top: '-17px' },
          180: { top: '5px',left: '90%' },
          270: { top: '30px' }
        }
      } 
    },
    { 
      id: 'port2', 
      name: '右端口', 
      type: 'bidirectional', 
      position: { 
        side: 'right', 
        x: 100, 
        y: 50,
        rotatedOffset: {
          90: { top: '35px' },
          180: { top: '5px',left: '5%' },
          270: { top: '-23px' }
        }
      } 
    }
  ],
  [CircuitElementType.CAPACITOR]: [
    { 
      id: 'port1', 
      name: '左端口', 
      type: 'bidirectional', 
      position: { 
        side: 'left', 
        x: 20, 
        y: 50,
        rotatedOffset: {
          90: { bottom: '25px' },
          180: { top: '15px',left: '80%' },
          270: { top: '30px' }
        }
      } 
    },
    { 
      id: 'port2', 
      name: '右端口', 
      type: 'bidirectional', 
      position: { 
        side: 'right', 
        x: 100, 
        y: 50,
        rotatedOffset: {
          '90': { top: '25px' },
          '180': { top: '15px',left: '20%' },
          '270': { top: '5px' }
        }
      } 
    }
  ],
  [CircuitElementType.INDUCTOR]: [
    { 
      id: 'port1', 
      name: '左端口', 
      type: 'bidirectional',       
      position: { 
        side: 'left',  // 修改为左侧
        x: 0, 
        y: 50,
        rotatedOffset: {
          '90': { top: '0px' },
          '180': { top: '50%', left: '100%' },
          '270': { top: '100%' }
        }
      }  
    },
    { 
      id: 'port2', 
      name: '右端口', 
      type: 'bidirectional',       
      position: { 
        side: 'right', 
        x: 100,  // 修正为100%
        y: 50,
        rotatedOffset: {
          '90': { top: '100%' },
          '180': { top: '50%', left: '0%' },
          '270': { top: '0%' }
        }
      } 
    }
  ],
  [CircuitElementType.VOLTAGE_SOURCE]: [
    { id: 'positive', name: '正极', type: 'output',       position: { 
        side: 'left', 
        x: 0, 
        y: 50,
        rotatedOffset: {
          90: { bottom: '35px' },
          180: { top: '16px',left: '100%' },
          270: { top: '37px' }
        }
      }   },
    { id: 'negative', name: '负极', type: 'input',       position: { 
        side: 'right', 
        x: 120, 
        y: 50,
        rotatedOffset: {
          '90': { top: '35px' },
          '180': { top: '16px',left: '0%' },
          '270': { top: '-5px' }
        }
      }  }
  ],
  [CircuitElementType.CURRENT_SOURCE]: [
    { id: 'positive', name: '正极', type: 'output', position: { 
        side: 'left', 
        x: 0, 
        y: 50,
        rotatedOffset: {
          90: { bottom: '35px' },
          180: { top: '16px',left: '100%' },
          270: { top: '37px' }
        }
      }   },
    { id: 'negative', name: '负极', type: 'input', position: { 
        side: 'right', 
        x: 120, 
        y: 50,
        rotatedOffset: {
          '90': { top: '35px' },
          '180': { top: '16px',left: '0%' },
          '270': { top: '-5px' }
        }
      } }
  ],
  [CircuitElementType.DIODE]: [
    { id: 'anode', name: '阳极', type: 'input', position: { 
      side: 'left', 
      x: 0, 
      y: 50,
      rotatedOffset: {
        90: { bottom: '35px' },
        180: { top: '16px',left: '100%' },
        270: { top: '37px' }
      }
    } },
    { id: 'cathode', name: '阴极', type: 'output', position: { 
      side: 'right', 
      x: 120, 
      y: 50,
      rotatedOffset: {
        '90': { top: '35px' },
        '180': { top: '16px',left: '0%' },
        '270': { top: '-5px' }
      }
    }
  }
  ],
  [CircuitElementType.TRANSISTOR_NPN]: [
    { 
      id: 'base', 
      name: '基极', 
      type: 'input', 
      position: { 
        side: 'left', 
        x: 5,  // 调整基极的横坐标
        y: 50,
        rotatedOffset: {
          '90': { top: '50%', left: '30%' },
          '180': { top: '50%', left: '100%' },
          '270': { top: '50%', left: '70%' }
        }
      } 
    },
    { 
      id: 'collector', 
      name: '集电极', 
      type: 'input', 
      position: { 
        side: 'right', 
        x: 95,  // 调整集电极的横坐标
        y: 10,
        rotatedOffset: {
          '90': { top: '10%', left: '50%' },
          '180': { top: '10%', left: '0%' },
          '270': { top: '90%', left: '50%' }
        }
      } 
    },
    { 
      id: 'emitter', 
      name: '发射极', 
      type: 'output', 
      position: { 
        side: 'right', 
        x: 95,  // 调整发射极的横坐标
        y: 90,
        rotatedOffset: {
          '90': { top: '90%', left: '50%' },
          '180': { top: '90%', left: '0%' },
          '270': { top: '10%', left: '50%' }
        }
      } 
    }
  ],
  [CircuitElementType.TRANSISTOR_PNP]: [
    { 
      id: 'base', 
      name: '基极', 
      type: 'input', 
      position: { 
        side: 'left', 
        x: 0, 
        y: 50,
        rotatedOffset: {
          '90': { top: '0px' },
          '180': { top: '26px',left: '90%' },
          '270': { top: '50px',left:'50' }
        }
      } 
    },
    { 
      id: 'emitter', 
      name: '发射极', 
      type: 'input', 
      position: { 
        side: 'left', 
        x: 80, 
        y: 0,
        rotatedOffset: {
          '90': { top: '40px',left: '10%' },
          '180': { top: '0px',left: '20%' },
          '270': { top: '10px',left: '10%' }
        }
      } 
    },
    { 
      id: 'collector', 
      name: '集电极', 
      type: 'output', 
      position: { 
        side: 'right', 
        x: 100, 
        y: 100,
        rotatedOffset: {
          '90': { top: '40px',left: '90%' },
          '180': { top: '50px',left: '25%' },
          '270': { top: '10px',left: '90%' }
        }
      } 
    }
  ],
  [CircuitElementType.GROUND]: [
    { id: 'ground', name: '接地点', type: 'input', 
      position: { 
        side: 'top', 
        x: 50, 
        y: 10 ,
        rotatedOffset: {
          '90': { top: '16px',left: '90%' },
          '180': { top: '32px',left: '50%' },
          '270': { top: '16px',left:'5%' }
        }
      } }
  ],
  [CircuitElementType.OPAMP]: [
    { id: 'input1', name: '输入1', type: 'input',       position: { 
      side: 'left', 
      x: 0, 
      y: 40,
      rotatedOffset: {
        '90': { top: '-10px',left: '40%' },
        '180': { top: '20px',left: '95%' },
        '270': { top: '45px',left:'40%' }
      }
    }  },
    { id: 'input2', name: '输入2', type: 'input',       position: { 
      side: 'left', 
      x: 0, 
      y: 65,
      rotatedOffset: {
        '90': { top: '-10px',left: '60%' },
        '180': { top: '10px',left: '95%' },
        '270': { top: '45px',left: '60%' }
      }
    }  },
    { id: 'output', name: '输出', type: 'output',       position: { 
      side: 'right', 
      x: 110, 
      y: 50,
      rotatedOffset: {
        '90': { top: '40px',left: '50%' },
        '180': { top: '15px',left: '10%' },
        '270': { top: '-10px',left: '50%' }
      }
    }  }
  ],
};

// 获取元件类型的默认端口配置函数
const getDefaultPorts = (elementType: string): Port[] => {
  return defaultPorts[elementType] || defaultPorts[CircuitElementType.RESISTOR] || [];
};

export const CircuitNode = memo(({ data, id }: NodeProps<CircuitNodeData>) => {
  const { type, label } = data;
  
  // 获取元件配置
  const config = ComponentVisualConfig[type];
  
  // 获取元件当前的旋转角度
  const rotation = data.element?.rotation || 0;

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

    return (
      <div style={{ 
        width: '100%', 
        height: '100%', 
        display: 'flex', 
        alignItems: 'center', 
        justifyContent: 'center',
        transform: `rotate(${rotation}deg)`,
        transition: 'transform 0.3s ease' 
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

  const handleDoubleClick = (e: React.MouseEvent<HTMLDivElement>) => {
    e.stopPropagation();
    if (data.onNodeDoubleClick) {
      data.onNodeDoubleClick(id);
    }
  };

  return (
    <div 
      className="relative" 
      style={{ width: config.width, height: config.height }}
      data-rotation={rotation}
      data-element-type={data.element?.type}
    >
      <div 
        className="absolute inset-0"
        onDoubleClick={handleDoubleClick}
      >
        {/* 先渲染SVG元件，确保它在端口下方 */}
        <div className="absolute inset-0 flex items-center justify-center">
          {renderSvgComponent()}
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
          
          return (
            <React.Fragment key={port.id}>
              {/* 渲染物理可见的端口标记点 */}
              <div
                className="circuit-port-marker"
                style={{
                  ...portStyle,
                  pointerEvents: 'none', // 不接收鼠标事件，避免干扰连线
                  // 突出显示端口
                  border: '2px solid #3B82F6',
                  background: '#fff',
                }}
                data-port-id={port.id}
                data-port-type={port.type}
                data-rotation={rotation}
              />
              
              {/* 输入端口句柄 - 只有输入类型的端口才能接收连线 */}
              {isInput && (
                <Handle
                  type="target"
                  position={portPosition}
                  id={port.id}
                  style={{
                    ...portStyle,
                    background: 'transparent', // 透明背景
                    width: 16, // 增大点击区域，但保持视觉上不变
                    height: 16,
                    zIndex: 5,
                    border: '2px solid transparent',
                  }}
                  isConnectable={true}
                />
              )}
              
              {/* 输出端口句柄 - 只有输出类型的端口才能发起连线 */}
              {isOutput && (
                <Handle
                  type="source"
                  position={portPosition}
                  id={port.id}
                  style={{
                    ...portStyle,
                    background: 'transparent', // 透明背景
                    width: 16, // 增大点击区域，但保持视觉上不变
                    height: 16,
                    zIndex: 5,
                    border: '2px solid transparent',
                  }}
                  isConnectable={true}
                />
              )}
            </React.Fragment>
          );
        })}
      </div>

      <div className="absolute -bottom-6 left-1/2 transform -translate-x-1/2">
        <span className="text-xs text-gray-600 font-medium whitespace-nowrap">
          {label}
        </span>
      </div>
    </div>
  );
});

CircuitNode.displayName = 'CircuitNode';