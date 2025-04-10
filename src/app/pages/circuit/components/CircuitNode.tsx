'use client';

import React, { memo } from 'react';
import { Handle, Position, NodeProps } from 'reactflow';
import { Input } from 'antd';
import { CircuitElementType } from '@/api/types/circuit.types';

// SVG 组件映射
const CircuitElementSVG: Record<string, React.ReactNode> = {
  [CircuitElementType.RESISTOR]: (
    <svg width="100" height="50" viewBox="0 0 100 50" fill="none" xmlns="http://www.w3.org/2000/svg">
      <path d="M20,25 L30,25 L35,15 L45,35 L55,15 L65,35 L70,25 L80,25" stroke="black" strokeWidth="2" fill="none" />
    </svg>
  ),
  [CircuitElementType.CAPACITOR]: (
    <svg width="100" height="50" viewBox="0 0 100 50" fill="none" xmlns="http://www.w3.org/2000/svg">
      <path d="M20,25 L45,25" stroke="black" strokeWidth="2" />
      <path d="M45,10 L45,40" stroke="black" strokeWidth="2" />
      <path d="M55,10 L55,40" stroke="black" strokeWidth="2" />
      <path d="M55,25 L80,25" stroke="black" strokeWidth="2" />
    </svg>
  ),
  [CircuitElementType.INDUCTOR]: (
    <svg width="100" height="50" viewBox="0 0 100 50" fill="none" xmlns="http://www.w3.org/2000/svg">
      <path d="M20,25 L30,25" stroke="black" strokeWidth="2" />
      <path d="M30,25 C35,25 35,15 40,15 C45,15 45,25 50,25 C55,25 55,15 60,15 C65,15 65,25 70,25" stroke="black" strokeWidth="2" fill="none" />
      <path d="M70,25 L80,25" stroke="black" strokeWidth="2" />
    </svg>
  ),
  [CircuitElementType.VOLTAGE_SOURCE]: (
    <svg width="100" height="50" viewBox="0 0 100 50" fill="none" xmlns="http://www.w3.org/2000/svg">
      <circle cx="50" cy="25" r="15" stroke="black" strokeWidth="2" fill="none" />
      <path d="M42,25 L58,25" stroke="black" strokeWidth="2" />
      <path d="M50,17 L50,33" stroke="black" strokeWidth="2" />
      <path d="M20,25 L35,25" stroke="black" strokeWidth="2" />
      <path d="M65,25 L80,25" stroke="black" strokeWidth="2" />
    </svg>
  ),
  [CircuitElementType.CURRENT_SOURCE]: (
    <svg width="100" height="50" viewBox="0 0 100 50" fill="none" xmlns="http://www.w3.org/2000/svg">
      <circle cx="50" cy="25" r="15" stroke="black" strokeWidth="2" fill="none" />
      <path d="M50,10 L50,40" stroke="black" strokeWidth="2" />
      <path d="M50,10 L45,15" stroke="black" strokeWidth="2" />
      <path d="M50,10 L55,15" stroke="black" strokeWidth="2" />
      <path d="M20,25 L35,25" stroke="black" strokeWidth="2" />
      <path d="M65,25 L80,25" stroke="black" strokeWidth="2" />
    </svg>
  ),
  [CircuitElementType.DIODE]: (
    <svg width="100" height="50" viewBox="0 0 100 50" fill="none" xmlns="http://www.w3.org/2000/svg">
      <path d="M20,25 L40,25" stroke="black" strokeWidth="2" />
      <path d="M40,10 L40,40" stroke="black" strokeWidth="2" />
      <path d="M40,10 L60,25 L40,40 Z" stroke="black" strokeWidth="2" fill="none" />
      <path d="M60,10 L60,40" stroke="black" strokeWidth="2" />
      <path d="M60,25 L80,25" stroke="black" strokeWidth="2" />
    </svg>
  ),
  [CircuitElementType.TRANSISTOR_NPN]: (
    <svg width="100" height="50" viewBox="0 0 100 50" fill="none" xmlns="http://www.w3.org/2000/svg">
      <circle cx="50" cy="25" r="15" stroke="black" strokeWidth="2" fill="none" />
      <path d="M50,10 L50,40" stroke="black" strokeWidth="2" />
      <path d="M20,25 L35,25" stroke="black" strokeWidth="2" />
      <path d="M50,15 L70,5" stroke="black" strokeWidth="2" />
      <path d="M50,35 L70,45" stroke="black" strokeWidth="2" />
      <path d="M65,5 L75,5" stroke="black" strokeWidth="1" />
      <path d="M70,0 L70,10" stroke="black" strokeWidth="1" />
    </svg>
  ),
  [CircuitElementType.TRANSISTOR_PNP]: (
    <svg width="100" height="50" viewBox="0 0 100 50" fill="none" xmlns="http://www.w3.org/2000/svg">
      <circle cx="50" cy="25" r="15" stroke="black" strokeWidth="2" fill="none" />
      <path d="M50,10 L50,40" stroke="black" strokeWidth="2" />
      <path d="M20,25 L35,25" stroke="black" strokeWidth="2" />
      <path d="M50,15 L70,5" stroke="black" strokeWidth="2" />
      <path d="M50,35 L70,45" stroke="black" strokeWidth="2" />
      <path d="M65,45 L75,45" stroke="black" strokeWidth="1" />
    </svg>
  ),
  [CircuitElementType.GROUND]: (
    <svg width="100" height="50" viewBox="0 0 100 50" fill="none" xmlns="http://www.w3.org/2000/svg">
      <path d="M50,10 L50,25" stroke="black" strokeWidth="2" />
      <path d="M35,25 L65,25" stroke="black" strokeWidth="2" />
      <path d="M40,30 L60,30" stroke="black" strokeWidth="2" />
      <path d="M45,35 L55,35" stroke="black" strokeWidth="2" />
    </svg>
  ),
};

export const CircuitNode = memo(({ data, id }: NodeProps) => {
  const { type, label, value } = data;

  const handleValueChange = (e: React.ChangeEvent<HTMLInputElement>) => {
    data.value = e.target.value;
  };

  return (
    <div
      style={{
        width: 150,
        padding: 10,
        borderRadius: 5,
        background: 'white',
        border: '1px solid #ddd',
        display: 'flex',
        flexDirection: 'column',
        alignItems: 'center',
      }}
    >
      <div style={{ fontSize: 12, marginBottom: 5 }}>{label}</div>
      
      <div style={{ position: 'relative', width: 100, height: 50 }}>
        {CircuitElementSVG[type]}
        
        <Handle
          type="target"
          position={Position.Left}
          id="input"
          style={{ background: '#555', width: 10, height: 10 }}
        />
        
        <Handle
          type="source"
          position={Position.Right}
          id="output"
          style={{ background: '#555', width: 10, height: 10 }}
        />
      </div>
      
      {shouldShowValueInput(type) && (
        <Input
          size="small"
          placeholder="值"
          defaultValue={value}
          onChange={handleValueChange}
          style={{ marginTop: 5, width: '90%' }}
        />
      )}
    </div>
  );
});

// 判断是否需要显示值输入框
function shouldShowValueInput(type: CircuitElementType): boolean {
  return [
    CircuitElementType.RESISTOR,
    CircuitElementType.CAPACITOR,
    CircuitElementType.INDUCTOR,
    CircuitElementType.VOLTAGE_SOURCE,
    CircuitElementType.CURRENT_SOURCE
  ].includes(type);
}

CircuitNode.displayName = 'CircuitNode';