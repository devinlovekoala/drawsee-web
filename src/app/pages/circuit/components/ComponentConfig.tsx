import React, { useState, useEffect, useCallback } from 'react';
import { Modal, Tabs, Form, Input, Select, Slider, Button, Space, Tooltip } from 'antd';
import { 
  SettingOutlined, 
  EditOutlined, 
  RotateRightOutlined, 
  InfoCircleOutlined 
} from '@ant-design/icons';
import { CircuitElement, CircuitElementType } from '@/api/types/circuit.types';
import { CircuitNodeData } from '@/app/pages/circuit/types';
import { getElementUnit, getElementTypeName } from '../utils/element-utils';
import { message } from 'antd';

const { TabPane } = Tabs;

// 单位选项
interface UnitOptions {
  resistance: string[];
  capacitance: string[];
  inductance: string[];
  voltage: string[];
  current: string[];
  frequency: string[];
  resistance_default: string;
  capacitance_default: string;
  inductance_default: string;
  voltage_default: string;
  current_default: string;
  frequency_default: string;
}

const UNITS: UnitOptions = {
  resistance: ['Ω', 'kΩ', 'MΩ'],
  capacitance: ['pF', 'nF', 'μF', 'mF', 'F'],
  inductance: ['nH', 'μH', 'mH', 'H'],
  voltage: ['mV', 'V', 'kV'],
  current: ['μA', 'mA', 'A'],
  frequency: ['Hz', 'kHz', 'MHz', 'GHz'],
  resistance_default: 'kΩ',
  capacitance_default: 'μF',
  inductance_default: 'mH',
  voltage_default: 'V',
  current_default: 'mA',
  frequency_default: 'kHz',
};

// 获取元件单位类别
const getElementUnitType = (elementType: CircuitElementType): string => {
  switch (elementType) {
    case CircuitElementType.RESISTOR:
      return 'resistance';
    case CircuitElementType.CAPACITOR:
      return 'capacitance';
    case CircuitElementType.INDUCTOR:
      return 'inductance';
    case CircuitElementType.VOLTAGE_SOURCE:
      return 'voltage';
    case CircuitElementType.CURRENT_SOURCE:
      return 'current';
    default:
      return '';
  }
};

// 解析值和单位
const parseValueAndUnit = (value: string, unitType: string): { value: number, unit: string } => {
  // 默认值和单位
  let defaultUnit = '';
  
  // 根据单位类型获取默认单位
  switch(unitType) {
    case 'resistance':
      defaultUnit = UNITS.resistance_default;
      break;
    case 'capacitance':
      defaultUnit = UNITS.capacitance_default;
      break;
    case 'inductance':
      defaultUnit = UNITS.inductance_default;
      break;
    case 'voltage':
      defaultUnit = UNITS.voltage_default;
      break;
    case 'current':
      defaultUnit = UNITS.current_default;
      break;
    case 'frequency':
      defaultUnit = UNITS.frequency_default;
      break;
    default:
      defaultUnit = '';
  }
  
  let numValue = 1;
  let unit = defaultUnit;
  
  // 正则表达式匹配数值和单位
  const regex = /^([0-9.]+)\s*([a-zA-ZΩμ]*)$/;
  const match = value.match(regex);
  
  if (match) {
    numValue = parseFloat(match[1]);
    unit = match[2] || defaultUnit;
  }
  
  return { value: numValue, unit };
};

// 格式化值和单位
const formatValueAndUnit = (value: number, unit: string): string => {
  if (value === 0) return '0';
  if (value < 0.001) return value.toExponential(2) + unit;
  if (value < 1) return value.toFixed(3) + unit;
  if (value < 10) return value.toFixed(2) + unit;
  if (value < 100) return value.toFixed(1) + unit;
  return Math.round(value) + unit;
};

interface ComponentConfigProps {
  element: CircuitNodeData | null;
  visible: boolean;
  onClose: () => void;
  onUpdate: (id: string, updates: Partial<CircuitNodeData>) => void;
}

const theme = {
  primary: '#1677ff',
  border: '#d9d9d9',
  text: '#333333',
  background: '#ffffff',
}

const ComponentConfig: React.FC<ComponentConfigProps> = ({
  element,
  visible,
  onClose,
  onUpdate
}) => {
  const [labelInput, setLabelInput] = useState('');
  const [valueInput, setValueInput] = useState('');

  useEffect(() => {
    if (element) {
      setLabelInput(element.label || '');
      setValueInput(element.value || '');
    }
  }, [element]);

  const handleSubmit = useCallback((e: React.FormEvent) => {
    e.preventDefault();
    
    if (!element) return;
    
    const updates: Partial<CircuitNodeData> = {
      label: labelInput,
      value: valueInput,
    };
    
    onUpdate(element.id, updates);
  }, [element, labelInput, valueInput, onUpdate]);

  if (!visible || !element) return null;

  const elementTypeName = element.element?.type ? getElementTypeName(element.element.type) : '元件';
  const elementUnit = element.element?.type ? getElementUnit(element.element.type) : '';

  return (
    <div className="fixed inset-0 bg-black bg-opacity-30 flex items-center justify-center z-50" onClick={onClose}>
      <div 
        className="bg-white rounded-lg shadow-xl w-96 overflow-hidden" 
        onClick={(e) => e.stopPropagation()}
      >
        <div className="px-6 py-4 border-b border-gray-200 flex justify-between items-center">
          <h3 className="text-lg font-medium" style={{ color: theme.text }}>
            {elementTypeName} 配置
          </h3>
          <button 
            className="text-gray-400 hover:text-gray-600"
            onClick={onClose}
          >
            <svg xmlns="http://www.w3.org/2000/svg" className="h-5 w-5" viewBox="0 0 20 20" fill="currentColor">
              <path fillRule="evenodd" d="M4.293 4.293a1 1 0 011.414 0L10 8.586l4.293-4.293a1 1 0 111.414 1.414L11.414 10l4.293 4.293a1 1 0 01-1.414 1.414L10 11.414l-4.293 4.293a1 1 0 01-1.414-1.414L8.586 10 4.293 5.707a1 1 0 010-1.414z" clipRule="evenodd" />
            </svg>
          </button>
        </div>
        
        <form onSubmit={handleSubmit} className="p-6">
          <div className="mb-4">
            <label className="block text-sm font-medium text-gray-700 mb-1">元件标签</label>
            <input 
              type="text" 
              value={labelInput} 
              onChange={(e) => setLabelInput(e.target.value)}
              className="w-full px-3 py-2 border border-gray-300 rounded-md focus:outline-none focus:ring-2 focus:ring-blue-500 focus:border-transparent"
              style={{ borderColor: theme.border }}
              placeholder="例如: R1, C1"
            />
          </div>
          
          <div className="mb-6">
            <label className="block text-sm font-medium text-gray-700 mb-1">
              元件值 {elementUnit && `(${elementUnit})`}
            </label>
            <input 
              type="text" 
              value={valueInput} 
              onChange={(e) => setValueInput(e.target.value)}
              className="w-full px-3 py-2 border border-gray-300 rounded-md focus:outline-none focus:ring-2 focus:ring-blue-500 focus:border-transparent"
              style={{ borderColor: theme.border }}
              placeholder={elementUnit ? `例如: 1k${elementUnit}` : '输入值'}
            />
          </div>
          
          <div className="flex justify-end space-x-3">
            <button 
              type="button"
              className="px-4 py-2 text-sm font-medium text-gray-700 bg-gray-100 rounded-md hover:bg-gray-200 focus:outline-none focus:ring-2 focus:ring-gray-400"
              onClick={onClose}
            >
              取消
            </button>
            <button 
              type="submit"
              className="px-4 py-2 text-sm font-medium text-white rounded-md focus:outline-none focus:ring-2 focus:ring-blue-400"
              style={{ backgroundColor: theme.primary }}
            >
              确定
            </button>
          </div>
        </form>
      </div>
    </div>
  );
};

export default ComponentConfig; 