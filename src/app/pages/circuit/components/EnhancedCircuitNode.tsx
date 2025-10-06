/**
 * 增强的电路节点组件
 * 集成了新的连接点系统，提供直观的点对点连接功能
 */

'use client';

import React, { memo, useMemo, useState, useCallback, useRef, Fragment } from 'react';
import { Handle, Position, NodeProps } from 'reactflow';
import { CircuitElement, CircuitElementType } from '@/api/types/circuit.types';
// 移除复杂的连接点系统，使用简化的连接点

// 节点数据接口
interface EnhancedCircuitNodeData {
  id?: string;
  type: CircuitElementType;
  label: string;
  value: string;
  element?: CircuitElement;
  onNodeClick?: (id: string) => void;
  description?: string;
  ports?: Array<{
    id: string;
    name: string;
    type: 'input' | 'output' | 'bidirectional';
    position: { side: 'left' | 'right' | 'top' | 'bottom'; x: number; y: number; align: 'center' };
  }>;
}

// SVG组件定义（保持原有的SVG组件）
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
      <path d="M16,5 L24,5 L24,35 L16,35 Z" fill="#F0F9FF" fillOpacity="0.5" />
    </svg>
  ),
  [CircuitElementType.INDUCTOR]: (props: React.SVGProps<SVGSVGElement>) => (
    <svg {...props} viewBox="0 0 60 30" fill="none" xmlns="http://www.w3.org/2000/svg">
      <path d="M5,15 L13,15" stroke="currentColor" strokeWidth="2" />
      <path d="M47,15 L55,15" stroke="currentColor" strokeWidth="2" />
      <path d="M13,15 C13,8 17,15 20,8 S27,22 30,15 S37,8 40,15 S47,22 47,15" 
        stroke="currentColor" strokeWidth="2" fill="none" />
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

// 增强的电路节点组件
export const EnhancedCircuitNode = memo(({ data, selected, id }: NodeProps<EnhancedCircuitNodeData>) => {
  const [rotation, setRotation] = useState<number>(0);
  const [hovered, setHovered] = useState<boolean>(false);
  const nodeRef = useRef<HTMLDivElement>(null);

  // 获取默认端口配置
  const defaultPorts = useMemo(() => {
    const ports = data.ports || [];
    if (ports.length > 0) return ports;
    
    // 如果没有提供端口，使用默认配置
    const defaultPortConfigs = {
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
    };
    
    return defaultPortConfigs[data.type as keyof typeof defaultPortConfigs] || [];
  }, [data.ports, data.type]);

  // 处理旋转
  const handleRotateClick = useCallback(() => {
    const newRotation = (rotation + 90) % 360;
    setRotation(newRotation);
    
    // 通知其他组件节点已旋转
    const rotationEvent = new CustomEvent('circuit-node-rotated', { 
      detail: { nodeId: id, rotation: newRotation }
    });
    document.dispatchEvent(rotationEvent);
  }, [id, rotation]);

  // 简化的连接处理 - 使用ReactFlow原生系统

  // 获取SVG组件
  const SvgComponent = useMemo(() => {
    const validType = data.type || CircuitElementType.RESISTOR;
    return SVGComponents[validType] || SVGComponents[CircuitElementType.RESISTOR];
  }, [data.type]);

  // 元件主题样式
  const elementTheme = useMemo(() => ({
    bg: selected ? 'rgba(240, 249, 255, 0.95)' : 'rgba(240, 249, 255, 0.8)',
    border: selected ? '#3B82F6' : '#E5E7EB',
    shadow: selected ? '0 0 20px rgba(59, 130, 246, 0.3)' : '0 2px 8px rgba(0, 0, 0, 0.1)'
  }), [selected]);

  // 双击处理
  const handleDoubleClick = useCallback((event: React.MouseEvent) => {
    event.stopPropagation();
    const doubleClickEvent = new CustomEvent('circuit-node-double-clicked', {
      detail: { nodeId: id }
    });
    document.dispatchEvent(doubleClickEvent);
  }, [id]);

  // 移除复杂的连接状态监听

  return (
    <div
      ref={nodeRef}
      className={`relative p-3 ${
        selected ? 'outline outline-2 outline-blue-500' : 'outline-none'
      }`}
      style={{
        width: 'fit-content',
        height: 'fit-content',
        minWidth: '80px',
        minHeight: '80px',
        cursor: 'grab',
        transform: `rotate(${rotation}deg)`,
        transformOrigin: 'center center',
        transition: 'transform 0.3s ease, box-shadow 0.2s ease',
        backgroundColor: elementTheme.bg,
        borderRadius: '8px',
        border: `1px solid ${elementTheme.border}`,
        boxShadow: elementTheme.shadow,
      }}
      onMouseEnter={() => setHovered(true)}
      onMouseLeave={() => setHovered(false)}
      onDoubleClick={handleDoubleClick}
      data-node-id={id}
      data-node-type={data.type}
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
          padding: '8px'
        }}
      >
        <SvgComponent width="50" height="50" style={{color: '#1F2937'}} />
      </div>

      {/* ReactFlow Handle组件 - 简化的连接点系统 */}
      {defaultPorts.map((port: any) => {
        // 根据旋转角度计算正确的Handle位置
        let handlePosition = Position.Left;
        const { side } = port.position;
        
        // 根据旋转调整Handle位置
        if (rotation === 0) {
          if (side === 'left') handlePosition = Position.Left;
          if (side === 'right') handlePosition = Position.Right;
          if (side === 'top') handlePosition = Position.Top;
          if (side === 'bottom') handlePosition = Position.Bottom;
        } else if (rotation === 90) {
          if (side === 'left') handlePosition = Position.Top;
          if (side === 'right') handlePosition = Position.Bottom;
          if (side === 'top') handlePosition = Position.Right;
          if (side === 'bottom') handlePosition = Position.Left;
        } else if (rotation === 180) {
          if (side === 'left') handlePosition = Position.Right;
          if (side === 'right') handlePosition = Position.Left;
          if (side === 'top') handlePosition = Position.Bottom;
          if (side === 'bottom') handlePosition = Position.Top;
        } else if (rotation === 270) {
          if (side === 'left') handlePosition = Position.Bottom;
          if (side === 'right') handlePosition = Position.Top;
          if (side === 'top') handlePosition = Position.Left;
          if (side === 'bottom') handlePosition = Position.Right;
        }

        // 为双向端口创建两个Handle，确保可以作为source或target
        const isBidirectional = port.type === 'bidirectional';

        if (isBidirectional) {
          return (
            <React.Fragment key={`handle-${port.id}`}>
              {/* Source handle */}
              <Handle
                type="source"
                position={handlePosition}
                id={port.id}
                style={{
                  opacity: (selected || hovered) ? 0.8 : 0.3,
                  width: 12,
                  height: 12,
                  border: '2px solid #3B82F6',
                  background: '#fff',
                  borderRadius: '50%',
                  transition: 'all 0.2s ease'
                }}
                isConnectable={true}
                title={port.name}
              />
              {/* Target handle - 叠加在同一位置 */}
              <Handle
                type="target"
                position={handlePosition}
                id={`${port.id}-target`}
                style={{
                  opacity: 0, // 隐藏，但保持功能
                  width: 12,
                  height: 12,
                  pointerEvents: 'all'
                }}
                isConnectable={true}
              />
            </React.Fragment>
          );
        }

        return (
          <Handle
            key={`handle-${port.id}`}
            type={port.type === 'output' ? 'source' : 'target'}
            position={handlePosition}
            id={port.id}
            style={{
              opacity: (selected || hovered) ? 0.8 : 0.3,
              width: 12,
              height: 12,
              border: '2px solid #3B82F6',
              background: '#fff',
              borderRadius: '50%',
              transition: 'all 0.2s ease'
            }}
            isConnectable={true}
            title={port.name}
          />
        );
      })}

      {/* 元件标签 */}
      <div 
        className="absolute transform -translate-x-1/2 px-2 py-1 rounded-md transition-all duration-200 bg-white border shadow-md"
        style={{
          left: '50%',
          top: selected ? '-45px' : '-40px',
          borderColor: elementTheme.border,
          color: '#1F2937',
          fontSize: selected ? '12px' : '11px',
          fontWeight: selected ? 600 : 500,
          pointerEvents: 'none',
          zIndex: 10,
          maxWidth: '140px',
          whiteSpace: 'nowrap',
          overflow: 'hidden',
          textOverflow: 'ellipsis'
        }}
      >
        <div>{data.label}</div>
        {data.value && (
          <div style={{fontSize: '10px', opacity: 0.7, marginTop: '2px'}}>
            {data.value}
          </div>
        )}
      </div>

      {/* 旋转按钮 */}
      {(selected || hovered) && (
        <button
          className="absolute top-1 right-1 w-6 h-6 bg-blue-500 hover:bg-blue-600 text-white rounded-full flex items-center justify-center text-xs transition-all duration-200"
          onClick={handleRotateClick}
          style={{ zIndex: 30 }}
          title="旋转元件"
        >
          ↻
        </button>
      )}

      {/* 连接状态指示器 - 简化版本 */}
      {(selected || hovered) && defaultPorts.length > 0 && (
        <div 
          className="absolute top-1 left-1 w-4 h-4 bg-blue-500 text-white rounded-full flex items-center justify-center text-xs"
          style={{ zIndex: 30 }}
          title={`${defaultPorts.length} 个连接点`}
        >
          {defaultPorts.length}
        </div>
      )}
    </div>
  );
});

EnhancedCircuitNode.displayName = 'EnhancedCircuitNode';