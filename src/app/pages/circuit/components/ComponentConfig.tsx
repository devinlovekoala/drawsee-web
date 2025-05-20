import React, { useState, useEffect, useCallback } from 'react';
import { CircuitElementType } from '@/api/types/circuit.types';
import { CircuitNodeData } from '@/app/pages/circuit/types';
import { getElementUnit, getElementTypeName } from '../utils/element-utils';

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
  // 添加一个状态来跟踪组件是否已经初始化
  const [initialized, setInitialized] = useState(false);

  // 记录接收到的数据 - 只在开发模式下记录日志
  useEffect(() => {
    if (process.env.NODE_ENV === 'development') {
      if (visible && element && !initialized) {
        console.log('ComponentConfig 接收到元素数据:', element);
        setInitialized(true);
      }
    }
  }, [visible, element, initialized]);

  // 当模态框关闭时重置初始化状态
  useEffect(() => {
    if (!visible) {
      setInitialized(false);
    }
  }, [visible]);

  useEffect(() => {
    if (element) {
      setLabelInput(element.label || '');
      setValueInput(element.value || '');
    }
  }, [element]);

  const handleSubmit = useCallback((e: React.FormEvent) => {
    e.preventDefault();
    
    if (!element) {
      console.error('无法提交更新：element 为空');
      return;
    }
    
    if (!element.id) {
      console.error('无法提交更新：element.id 为空');
      return;
    }
    
    const updates: Partial<CircuitNodeData> = {
      label: labelInput,
      value: valueInput,
    };
    
    onUpdate(element.id, updates);
    onClose();
  }, [element, labelInput, valueInput, onUpdate, onClose]);

  if (!visible) {
    return null;
  }
  
  if (!element) {
    return null;
  }

  const elementTypeName = element.element?.type ? getElementTypeName(element.element.type) : '元件';
  const elementUnit = element.element?.type ? getElementUnit(element.element.type) : '';

  return (
    <div className="fixed inset-0 bg-black bg-opacity-30 flex items-center justify-center z-[9999]" onClick={onClose}>
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