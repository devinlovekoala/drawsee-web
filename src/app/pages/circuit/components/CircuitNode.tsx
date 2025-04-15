'use client';

import React, { memo, useMemo } from 'react';
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
    { id: 'port1', name: '左端口', type: 'bidirectional',       position: { 
        side: 'right', 
        x: 20, 
        y: 50,
        rotatedOffset: {
          90: { bottom: '-25px' },
          180: { top: '17px',left: '100%' },
          270: { top: '35px' }
        }
      }  
    },
    { id: 'port2', name: '右端口', type: 'bidirectional',       position: { 
        side: 'right', 
        x: 122, 
        y: 50,
        rotatedOffset: {
          '90': { top: '36px' },
          '180': { top: '15px',left: '0%' },
          '270': { top: '-5px' }
        }
      } }
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
      type: 'output', 
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
      type: 'input', 
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
  const SVGComponent = SVGComponents[type] || SVGComponents[CircuitElementType.RESISTOR]; // 提供默认值
  
  // 获取元件当前的旋转角度
  const rotation = data.element?.rotation || 0;

  // 根据旋转角度计算端口位置
  const getPortPosition = (side: 'left' | 'right' | 'top' | 'bottom', rotation: number): Position => {
    // 根据旋转角度映射端口位置
    const rotationMap: Record<number, Record<string, Position>> = {
      0: { 
        'left': Position.Left, 
        'right': Position.Right, 
        'top': Position.Top, 
        'bottom': Position.Bottom 
      },
      90: { 
        'left': Position.Bottom, 
        'right': Position.Top, 
        'top': Position.Right, 
        'bottom': Position.Left 
      },
      180: { 
        'left': Position.Right, 
        'right': Position.Left, 
        'top': Position.Bottom, 
        'bottom': Position.Top 
      },
      270: { 
        'left': Position.Top, 
        'right': Position.Bottom, 
        'top': Position.Left, 
        'bottom': Position.Right 
      },
    };
    
    // 使用规范化的旋转角度索引
    const normalizedRotation = rotation % 360;
    return rotationMap[normalizedRotation]?.[side] || Position.Left;
  };

  // 获取当前元件的端口配置
  const ports = useMemo(() => {
    const elementType = data.element?.type || '';
    // 根据元件类型获取默认端口配置
    return getDefaultPorts(elementType);
  }, [data.element?.type]);

  // 获取端口的位置样式
  const getPortStyle = (port: Port): React.CSSProperties => {
    const baseStyle: React.CSSProperties = {
      position: 'absolute',
      width: 8,
      height: 8,
      background: '#fff',
      border: '2px solid #3B82F6',
      borderRadius: '50%',
      zIndex: 10,
    };

    // 获取当前旋转角度
    const currentRotation = data.element?.rotation || 0;
    const normalizedRotation = currentRotation % 360;
    
    // 使用配置的旋转偏移
    const rotatedOffset = port.position.rotatedOffset?.[normalizedRotation.toString() as '90' | '180' | '270'];
    if (rotatedOffset) {
      return {
        ...baseStyle,
        ...rotatedOffset,
        left: rotatedOffset.left || '50%',
        transform: 'translate(-50%, 0)'
      };
    }

    // 处理初始位置（未旋转时）
    const { x, y, side } = port.position;
    const style = { ...baseStyle };

    // 根据不同的side设置位置
    switch (side) {
      case 'left':
        style.left = `${x}%`;
        style.top = `${y}%`;
        break;
      case 'right':
        style.right = `${100 - x}%`;
        style.top = `${y}%`;
        break;
      case 'top':
        style.left = `${x}%`;
        style.top = `${y}%`;
        break;
      case 'bottom':
        style.left = `${x}%`;
        style.bottom = `${100 - y}%`;
        break;
    }

    style.transform = 'translate(-50%, -50%)';
    return style;
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
    >
      <div 
        className="absolute inset-0"
        onDoubleClick={handleDoubleClick}
      >
        {/* 渲染所有端口作为源和目标 */}
        {ports.map((port: Port) => (
          <React.Fragment key={port.id}>
            {/* 源端口 - 可以开始连接的端口 */}
            <Handle
              type="source"
              position={getPortPosition(port.position.side, rotation)}
              id={port.id}
              style={{
                ...getPortStyle(port),
                background: '#3B82F6',
              }}
            />
            
            {/* 目标端口 - 可以接收连接的端口 */}
            <Handle
              type="target"
              position={getPortPosition(port.position.side, rotation)}
              id={port.id}
              style={{
                ...getPortStyle(port),
                background: 'transparent', // 透明背景，只有边框可见
                pointerEvents: 'all', // 确保可以接收鼠标事件
              }}
            />
          </React.Fragment>
        ))}

        <div className="absolute inset-0 flex items-center justify-center">
          {renderSvgComponent()}
        </div>
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