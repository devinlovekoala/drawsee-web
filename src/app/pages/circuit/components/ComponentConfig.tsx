import React, { useState, useEffect, useCallback, useMemo } from 'react';
import { CircuitElementType } from '@/api/types/circuit.types';
import { CircuitNodeData } from '@/app/pages/circuit/types';
import { getElementUnit, getElementTypeName } from '../utils/element-utils';

const UNIT_OPTIONS_MAP: Partial<Record<CircuitElementType, string[]>> = {
  [CircuitElementType.RESISTOR]: ['Ω', 'kΩ', 'MΩ'],
  [CircuitElementType.CAPACITOR]: ['F', 'mF', 'μF', 'nF', 'pF'],
  [CircuitElementType.INDUCTOR]: ['H', 'mH', 'μH'],
  [CircuitElementType.VOLTAGE_SOURCE]: ['V', 'mV'],
  [CircuitElementType.CURRENT_SOURCE]: ['A', 'mA', 'μA'],
};

const VALUE_WITH_UNIT_REGEX = /^([-+]?\d*\.?\d+(?:[eE][-+]?\d+)?)([A-Za-zμµΩ]*)$/;

const splitValueAndUnit = (value?: string) => {
  if (!value) return null;
  const trimmed = value.trim();
  const match = trimmed.match(VALUE_WITH_UNIT_REGEX);
  if (!match) return null;
  return {
    numeric: match[1],
    unit: match[2] || '',
  };
};

const normalizeUnitToken = (unit: string) =>
  unit
    .trim()
    .replace(/ohms?/gi, 'ohm')
    .replace(/[ωΩ]/gi, 'ohm')
    .replace(/[μµ]/gi, 'u')
    .toLowerCase();

const getMatchingUnit = (unit: string | undefined, options: string[]): string => {
  if (!options.length) return '';
  if (!unit) return options[0];
  if (options.includes(unit)) return unit;

  const normalizedInput = normalizeUnitToken(unit);
  const normalizedOptionMap = options.reduce<Record<string, string>>((acc, option) => {
    const normalized = normalizeUnitToken(option);
    if (!acc[normalized]) {
      acc[normalized] = option;
    }
    return acc;
  }, {});

  return (
    normalizedOptionMap[normalizedInput] ||
    options.find((option) => option.toLowerCase() === unit.toLowerCase()) ||
    options[0]
  );
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
  const [valueNumberInput, setValueNumberInput] = useState('');
  const [valueUnitInput, setValueUnitInput] = useState('');
  const [rawValueInput, setRawValueInput] = useState('');
  // 添加一个状态来跟踪组件是否已经初始化
  const [initialized, setInitialized] = useState(false);
  const elementType = element?.element?.type as CircuitElementType | undefined;
  const isDigitalInput = elementType === CircuitElementType.DIGITAL_INPUT;
  const isDigitalOutput = elementType === CircuitElementType.DIGITAL_OUTPUT;
  const isDigitalClock = elementType === CircuitElementType.DIGITAL_CLOCK;

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

  const unitOptions = useMemo(() => {
    if (!elementType) return [];
    return UNIT_OPTIONS_MAP[elementType] || [];
  }, [elementType]);

  const resolveElementValue = useCallback(() => {
    if (!element) return '';
    const elementValue =
      (element.element?.properties?.value as string | undefined) ??
      element.element?.value ??
      element.value ??
      '';
    return elementValue;
  }, [element]);

  useEffect(() => {
    if (element) {
      setLabelInput(element.label || element.element?.properties?.label || element.element?.label || '');
      const resolvedValue = resolveElementValue();
      if (isDigitalInput) {
        setRawValueInput(resolvedValue.replace(/[^01]/g, ''));
      } else {
        setRawValueInput(resolvedValue);
      }
      if (unitOptions.length > 0 && !isDigitalInput && !isDigitalClock) {
        const parsed = splitValueAndUnit(resolvedValue);
        setValueNumberInput(parsed?.numeric || '');
        setValueUnitInput(getMatchingUnit(parsed?.unit, unitOptions));
      } else {
        setValueNumberInput('');
        setValueUnitInput('');
      }
    }
  }, [element, unitOptions, resolveElementValue, isDigitalInput, isDigitalClock]);

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

    let structuredValue = '';
    if (isDigitalOutput) {
      structuredValue = '';
    } else if (unitOptions.length > 0 && !isDigitalInput && !isDigitalClock) {
      structuredValue = valueNumberInput
        ? `${valueNumberInput}${valueUnitInput || ''}`
        : (element.value || element.element?.properties?.value || '');
    } else {
      structuredValue = rawValueInput;
    }
    
    const updates: Partial<CircuitNodeData> = {
      label: labelInput,
      value: structuredValue,
    };
    
    onUpdate(element.id, updates);
    onClose();
  }, [element, labelInput, valueNumberInput, valueUnitInput, rawValueInput, unitOptions, onUpdate, onClose]);

  if (!visible) {
    return null;
  }
  
  if (!element) {
    return null;
  }

  const elementTypeName = elementType ? getElementTypeName(elementType) : '元件';
  const elementUnit = elementType ? getElementUnit(elementType) : '';
  const labelPlaceholder = (isDigitalInput || isDigitalOutput || isDigitalClock)
    ? '例如：IN_A'
    : '例如: R1, C1';
  const labelFieldLabel = (isDigitalInput || isDigitalOutput || isDigitalClock)
    ? '通道/元件标签'
    : '元件标签';
  const labelHelperText = isDigitalInput
    ? '标签将作为输入端名称显示在波形中'
    : isDigitalOutput
      ? '标签会出现在波形与观测表格中，便于区分多个输出'
      : isDigitalClock
        ? '用于在波形列表中识别时钟信号'
        : '';

  const renderValueSection = () => {
    if (!element) return null;
    if (isDigitalOutput) {
      return (
        <>
          <label className="block text-sm font-medium text-gray-700 mb-1">输出说明</label>
          <div className="rounded-md border border-dashed border-gray-200 bg-gray-50 px-3 py-2 text-sm text-gray-600">
            数字输出无需设置固定值。双击仿真波形时将以该输出标签作为通道名称。
          </div>
        </>
      );
    }
    if (isDigitalInput) {
      return (
        <>
          <label className="block text-sm font-medium text-gray-700 mb-1">输入波形/序列</label>
          <input
            type="text"
            value={rawValueInput}
            onChange={(e) => setRawValueInput(e.target.value.replace(/[^01]/g, ''))}
            className="w-full px-3 py-2 border border-gray-300 rounded-md focus:outline-none focus:ring-2 focus:ring-blue-500 focus:border-transparent"
            style={{ borderColor: theme.border }}
            placeholder="例如：0011（留空代表自动真值表）"
          />
          <p className="mt-1 text-xs text-gray-500">
            仅输入 0/1，系统会以 10ns 步长依次施加；留空时仿真会自动遍历所有输入组合。
          </p>
        </>
      );
    }
    if (isDigitalClock) {
      return (
        <>
          <label className="block text-sm font-medium text-gray-700 mb-1">时钟周期</label>
          <input
            type="text"
            value={rawValueInput}
            onChange={(e) => setRawValueInput(e.target.value)}
            className="w-full px-3 py-2 border border-gray-300 rounded-md focus:outline-none focus:ring-2 focus:ring-blue-500 focus:border-transparent"
            style={{ borderColor: theme.border }}
            placeholder="例如：10ns、50 或 0.5us"
          />
          <p className="mt-1 text-xs text-gray-500">
            支持 ns / μs / ms 等单位，仿真会按照填写的周期自动翻转高低电平。
          </p>
        </>
      );
    }
    if (unitOptions.length > 0) {
      return (
        <>
          <label className="block text-sm font-medium text-gray-700 mb-1">
            元件值 {elementUnit && `(${elementUnit})`}
          </label>
          <div className="flex gap-2">
            <input
              type="number"
              step="any"
              value={valueNumberInput}
              onChange={(e) => setValueNumberInput(e.target.value)}
              className="flex-1 px-3 py-2 border border-gray-300 rounded-md focus:outline-none focus:ring-2 focus:ring-blue-500 focus:border-transparent"
              style={{ borderColor: theme.border }}
              placeholder="请输入数值"
            />
            <select
              value={valueUnitInput || unitOptions[0]}
              onChange={(e) => setValueUnitInput(e.target.value)}
              className="px-3 py-2 border border-gray-300 rounded-md bg-white focus:outline-none focus:ring-2 focus:ring-blue-500 focus:border-transparent"
              style={{ borderColor: theme.border }}
            >
              {unitOptions.map((option) => (
                <option key={option} value={option}>{option}</option>
              ))}
            </select>
          </div>
        </>
      );
    }
    return (
      <>
        <label className="block text-sm font-medium text-gray-700 mb-1">
          元件值 {elementUnit && `(${elementUnit})`}
        </label>
        <input
          type="text"
          value={rawValueInput}
          onChange={(e) => setRawValueInput(e.target.value)}
          className="w-full px-3 py-2 border border-gray-300 rounded-md focus:outline-none focus:ring-2 focus:ring-blue-500 focus:border-transparent"
          style={{ borderColor: theme.border }}
          placeholder={elementUnit ? `例如: 1k${elementUnit}` : '输入值'}
        />
      </>
    );
  };

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
            <label className="block text-sm font-medium text-gray-700 mb-1">{labelFieldLabel}</label>
            <input 
              type="text" 
              value={labelInput} 
              onChange={(e) => setLabelInput(e.target.value)}
              className="w-full px-3 py-2 border border-gray-300 rounded-md focus:outline-none focus:ring-2 focus:ring-blue-500 focus:border-transparent"
              style={{ borderColor: theme.border }}
              placeholder={labelPlaceholder}
            />
            {labelHelperText && (
              <p className="mt-1 text-xs text-gray-500">{labelHelperText}</p>
            )}
          </div>
          
          <div className="mb-6 space-y-2">
            {renderValueSection()}
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
