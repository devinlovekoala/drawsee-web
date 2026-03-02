import React, { useState, useEffect, useCallback, useMemo } from 'react';
import { CircuitElementType } from '@/api/types/circuit.types';
import { CircuitNodeData } from '@/app/pages/circuit/types';
import { getElementUnit, getElementTypeName } from '../utils/element-utils';

type PropertyFieldType = 'text' | 'number' | 'select' | 'checkbox';

type PropertyField = {
  key: string;
  label: string;
  type: PropertyFieldType;
  placeholder?: string;
  step?: string;
  min?: number;
  max?: number;
  options?: Array<{ label: string; value: string }>;
  help?: string;
};

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

const DIGITAL_GATE_TYPES = new Set<CircuitElementType>([
  CircuitElementType.DIGITAL_AND,
  CircuitElementType.DIGITAL_AND3,
  CircuitElementType.DIGITAL_AND4,
  CircuitElementType.DIGITAL_OR,
  CircuitElementType.DIGITAL_OR3,
  CircuitElementType.DIGITAL_OR4,
  CircuitElementType.DIGITAL_NOT,
  CircuitElementType.DIGITAL_BUF,
  CircuitElementType.DIGITAL_TRI,
  CircuitElementType.DIGITAL_SCHMITT_NOT,
  CircuitElementType.DIGITAL_NAND,
  CircuitElementType.DIGITAL_NAND3,
  CircuitElementType.DIGITAL_NAND4,
  CircuitElementType.DIGITAL_NOR,
  CircuitElementType.DIGITAL_NOR3,
  CircuitElementType.DIGITAL_NOR4,
  CircuitElementType.DIGITAL_XOR,
  CircuitElementType.DIGITAL_XNOR,
]);

const getPropertyFields = (type?: CircuitElementType): PropertyField[] => {
  if (!type) return [];
  if (DIGITAL_GATE_TYPES.has(type)) {
    const base: PropertyField[] = [
      { key: 'tpdNs', label: '传播延迟 TPD (ns)', type: 'number', step: '0.1', min: 0, placeholder: '5' },
    ];
    if (type === CircuitElementType.DIGITAL_TRI) {
      base.unshift({ key: 'oeActiveHigh', label: 'OE高电平使能', type: 'checkbox' });
    }
    return base;
  }

  switch (type) {
    case CircuitElementType.PULSE_SOURCE:
      return [
        { key: 'v1', label: '低电平 V1', type: 'text', placeholder: '0' },
        { key: 'v2', label: '高电平 V2', type: 'text', placeholder: '5' },
        { key: 'td', label: '延迟 TD', type: 'text', placeholder: '1ns' },
        { key: 'tr', label: '上升时间 TR', type: 'text', placeholder: '1ns' },
        { key: 'tf', label: '下降时间 TF', type: 'text', placeholder: '1ns' },
        { key: 'pw', label: '脉宽 PW', type: 'text', placeholder: '5ns' },
        { key: 'per', label: '周期 PER', type: 'text', placeholder: '10ns' },
      ];
    case CircuitElementType.PWM_SOURCE:
      return [
        { key: 'freqHz', label: '频率 FREQ (Hz)', type: 'number', step: 'any', min: 0.0001, placeholder: '1000' },
        { key: 'duty', label: '占空比 DUTY (0~1)', type: 'number', step: '0.01', min: 0, max: 1, placeholder: '0.5' },
        { key: 'vlow', label: '低电平 VLOW', type: 'text', placeholder: '0' },
        { key: 'vhigh', label: '高电平 VHIGH', type: 'text', placeholder: '5' },
      ];
    case CircuitElementType.SINE_SOURCE:
    case CircuitElementType.AC_SOURCE:
      return [
        { key: 'vo', label: '直流偏置 VO', type: 'text', placeholder: '0' },
        { key: 'va', label: '幅值 VA', type: 'text', placeholder: '1' },
        { key: 'freq', label: '频率 FREQ', type: 'text', placeholder: '1k' },
        { key: 'td', label: '延迟 TD', type: 'text', placeholder: '0' },
        { key: 'df', label: '阻尼 DF', type: 'text', placeholder: '0' },
      ];
    case CircuitElementType.DIODE_ZENER:
      return [
        { key: 'vz', label: '击穿电压 VZ (V)', type: 'number', step: '0.1', min: 0.1, placeholder: '5.1' },
        { key: 'izt', label: '膝点电流 IZT (A)', type: 'text', placeholder: '5m' },
      ];
    case CircuitElementType.DIODE_LED:
      return [
        { key: 'vf', label: '正向压降 VF (V)', type: 'number', step: '0.1', min: 0.1, placeholder: '2' },
        {
          key: 'color',
          label: '颜色',
          type: 'select',
          options: [
            { label: '红', value: 'red' },
            { label: '绿', value: 'green' },
            { label: '黄', value: 'yellow' },
            { label: '蓝', value: 'blue' },
            { label: '白', value: 'white' },
          ],
        },
      ];
    case CircuitElementType.DIODE_SCHOTTKY:
      return [
        { key: 'vf', label: '正向压降 VF (V)', type: 'number', step: '0.05', min: 0.1, placeholder: '0.3' },
        { key: 'bv', label: '反向击穿 BV (V)', type: 'number', step: '0.1', min: 0.1, placeholder: '40' },
      ];
    case CircuitElementType.TRANSISTOR_NPN:
    case CircuitElementType.TRANSISTOR_PNP:
      return [
        {
          key: 'modelPrecision',
          label: '模型精度',
          type: 'select',
          options: [
            { label: '简化', value: 'simple' },
            { label: '标准（推荐）', value: 'standard' },
            { label: '精确', value: 'accurate' },
          ],
        },
        { key: 'beta', label: 'β / BF', type: 'number', step: '1', min: 1, placeholder: '100' },
      ];
    case CircuitElementType.OPAMP:
      return [
        {
          key: 'modelLevel',
          label: '模型等级',
          type: 'select',
          options: [
            { label: 'Level1 理想', value: 'ideal' },
            { label: 'Level2 宏模型（默认）', value: 'macro' },
            { label: 'Level3 芯片型号', value: 'chip' },
          ],
        },
        {
          key: 'chipModel',
          label: '芯片型号',
          type: 'select',
          options: [
            { label: 'μA741', value: 'ua741' },
            { label: 'LM358', value: 'lm358' },
            { label: 'LM324', value: 'lm324' },
            { label: 'TL071', value: 'tl071' },
            { label: 'LM318', value: 'lm318' },
            { label: 'OP07', value: 'op07' },
          ],
        },
        { key: 'gbw', label: 'GBW (Hz)', type: 'text', placeholder: '1e6' },
        { key: 'sr', label: 'SR (V/us)', type: 'number', step: '0.1', min: 0.01, placeholder: '0.5' },
        { key: 'vos', label: 'VOS (V)', type: 'text', placeholder: '1m' },
        { key: 'vsatMargin', label: 'VSAT裕量 (V)', type: 'number', step: '0.1', min: 0, placeholder: '1.5' },
        { key: 'ioutMax', label: '最大输出电流 (A)', type: 'text', placeholder: '25m' },
      ];
    case CircuitElementType.DIGITAL_DFF:
      return [
        {
          key: 'edge',
          label: '触发边沿',
          type: 'select',
          options: [
            { label: '上升沿', value: 'posedge' },
            { label: '下降沿', value: 'negedge' },
          ],
        },
        { key: 'tpdNs', label: '传播延迟 TPD (ns)', type: 'number', step: '0.1', min: 0, placeholder: '5' },
        { key: 'tsetupNs', label: '建立时间 TSETUP (ns)', type: 'number', step: '0.1', min: 0, placeholder: '3' },
        { key: 'tholdNs', label: '保持时间 THOLD (ns)', type: 'number', step: '0.1', min: 0, placeholder: '1' },
      ];
    case CircuitElementType.DIGITAL_JKFF:
      return [{ key: 'tpdNs', label: '传播延迟 TPD (ns)', type: 'number', step: '0.1', min: 0, placeholder: '5' }];
    case CircuitElementType.DIGITAL_TFF:
      return [{ key: 'tpdNs', label: '传播延迟 TPD (ns)', type: 'number', step: '0.1', min: 0, placeholder: '5' }];
    case CircuitElementType.DIGITAL_SRFF:
      return [{ key: 'tpdNs', label: '传播延迟 TPD (ns)', type: 'number', step: '0.1', min: 0, placeholder: '5' }];
    case CircuitElementType.RESISTOR:
      return [
        { key: 'parasiticLs', label: '寄生电感 LS (nH)', type: 'number', step: 'any', min: 0, placeholder: '0' },
        { key: 'parasiticCp', label: '寄生电容 CP (pF)', type: 'number', step: 'any', min: 0, placeholder: '0' },
      ];
    case CircuitElementType.CAPACITOR:
      return [
        { key: 'esr', label: 'ESR (Ω)', type: 'number', step: 'any', min: 0, placeholder: '0' },
        { key: 'esl', label: 'ESL (nH)', type: 'number', step: 'any', min: 0, placeholder: '0' },
      ];
    case CircuitElementType.INDUCTOR:
      return [
        { key: 'dcr', label: 'DCR (Ω)', type: 'number', step: 'any', min: 0, placeholder: '0' },
        { key: 'srf', label: 'SRF (Hz)', type: 'text', placeholder: '' },
      ];
    default:
      return [];
  }
};

const DEFAULT_PROP_VALUES: Record<string, string | number | boolean> = {
  tpdNs: 5,
  edge: 'posedge',
  tsetupNs: 3,
  tholdNs: 1,
  modelPrecision: 'standard',
  modelLevel: 'macro',
  chipModel: 'lm358',
  gbw: '1e6',
  sr: 0.5,
  vos: '1m',
  vsatMargin: 1.5,
  ioutMax: '25m',
  beta: 100,
  vz: 5.1,
  izt: '5m',
  vf: 2,
  bv: 40,
  color: 'red',
  v1: '0',
  v2: '5',
  td: '1ns',
  tr: '1ns',
  tf: '1ns',
  pw: '5ns',
  per: '10ns',
  freqHz: 1000,
  duty: 0.5,
  vlow: '0',
  vhigh: '5',
  vo: '0',
  va: '1',
  freq: '1k',
  df: '0',
  oeActiveHigh: true,
  parasiticLs: 0,
  parasiticCp: 0,
  esr: 0,
  esl: 0,
  dcr: 0,
  srf: '',
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
};

const ComponentConfig: React.FC<ComponentConfigProps> = ({
  element,
  visible,
  onClose,
  onUpdate,
}) => {
  const [labelInput, setLabelInput] = useState('');
  const [valueNumberInput, setValueNumberInput] = useState('');
  const [valueUnitInput, setValueUnitInput] = useState('');
  const [rawValueInput, setRawValueInput] = useState('');
  const [propertyInputs, setPropertyInputs] = useState<Record<string, string | number | boolean>>({});

  const elementType = element?.element?.type as CircuitElementType | undefined;
  const unitOptions = useMemo(() => (elementType ? UNIT_OPTIONS_MAP[elementType] || [] : []), [elementType]);
  const propertyFields = useMemo(() => getPropertyFields(elementType), [elementType]);

  const isDigitalInput = elementType === CircuitElementType.DIGITAL_INPUT;
  const isDigitalOutput = elementType === CircuitElementType.DIGITAL_OUTPUT;
  const isDigitalClock = elementType === CircuitElementType.DIGITAL_CLOCK;

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
    if (!element) return;
    setLabelInput(element.label || (element.element?.properties?.label as string) || element.element?.label || '');
    const resolvedValue = resolveElementValue();
    setRawValueInput(isDigitalInput ? resolvedValue.replace(/[^01]/g, '') : resolvedValue);

    if (unitOptions.length > 0 && !isDigitalInput && !isDigitalClock) {
      const parsed = splitValueAndUnit(resolvedValue);
      setValueNumberInput(parsed?.numeric || '');
      setValueUnitInput(getMatchingUnit(parsed?.unit, unitOptions));
    } else {
      setValueNumberInput('');
      setValueUnitInput('');
    }

    const props = (element.element?.properties || {}) as Record<string, unknown>;
    const nextPropInputs: Record<string, string | number | boolean> = {};
    propertyFields.forEach((field) => {
      const candidate = props[field.key];
      if (candidate !== undefined && candidate !== null) {
        nextPropInputs[field.key] = candidate as string | number | boolean;
      } else {
        nextPropInputs[field.key] = DEFAULT_PROP_VALUES[field.key] ?? '';
      }
    });
    setPropertyInputs(nextPropInputs);
  }, [element, unitOptions, resolveElementValue, isDigitalInput, isDigitalClock, propertyFields]);

  const handleSubmit = useCallback((e: React.FormEvent) => {
    e.preventDefault();
    if (!element?.id) return;

    let structuredValue = '';
    if (isDigitalOutput) {
      structuredValue = '';
    } else if (unitOptions.length > 0 && !isDigitalInput && !isDigitalClock) {
      structuredValue = valueNumberInput
        ? `${valueNumberInput}${valueUnitInput || ''}`
        : (element.value || (element.element?.properties?.value as string) || '');
    } else {
      structuredValue = rawValueInput;
    }

    const mergedProperties: Record<string, unknown> = {
      ...(element.element?.properties || {}),
      ...propertyInputs,
      label: labelInput,
      value: structuredValue,
    };

    onUpdate(element.id, {
      label: labelInput,
      value: structuredValue,
      element: element.element
        ? {
            ...element.element,
            label: labelInput,
            value: structuredValue,
            properties: mergedProperties,
          }
        : element.element,
    });

    onClose();
  }, [
    element,
    isDigitalOutput,
    unitOptions,
    isDigitalInput,
    isDigitalClock,
    valueNumberInput,
    valueUnitInput,
    rawValueInput,
    propertyInputs,
    labelInput,
    onUpdate,
    onClose,
  ]);

  if (!visible || !element) return null;

  const elementTypeName = elementType ? getElementTypeName(elementType) : '元件';
  const elementUnit = elementType ? getElementUnit(elementType) : '';

  const renderValueSection = () => {
    if (isDigitalOutput) {
      return (
        <div className="rounded-md border border-dashed border-gray-200 bg-gray-50 px-3 py-2 text-sm text-gray-600">
          数字输出无需设置固定值，标签会用于波形通道名称。
        </div>
      );
    }
    if (isDigitalInput) {
      return (
        <input
          type="text"
          value={rawValueInput}
          onChange={(e) => setRawValueInput(e.target.value.replace(/[^01]/g, ''))}
          className="w-full px-3 py-2 border border-gray-300 rounded-md focus:outline-none focus:ring-2 focus:ring-blue-500"
          style={{ borderColor: theme.border }}
          placeholder="例如：0011（留空自动真值表）"
        />
      );
    }
    if (isDigitalClock) {
      return (
        <input
          type="text"
          value={rawValueInput}
          onChange={(e) => setRawValueInput(e.target.value)}
          className="w-full px-3 py-2 border border-gray-300 rounded-md focus:outline-none focus:ring-2 focus:ring-blue-500"
          style={{ borderColor: theme.border }}
          placeholder="例如：10ns"
        />
      );
    }
    if (unitOptions.length > 0) {
      return (
        <div className="flex gap-2">
          <input
            type="number"
            step="any"
            value={valueNumberInput}
            onChange={(e) => setValueNumberInput(e.target.value)}
            className="flex-1 px-3 py-2 border border-gray-300 rounded-md focus:outline-none focus:ring-2 focus:ring-blue-500"
            style={{ borderColor: theme.border }}
            placeholder="请输入数值"
          />
          <select
            value={valueUnitInput || unitOptions[0]}
            onChange={(e) => setValueUnitInput(e.target.value)}
            className="px-3 py-2 border border-gray-300 rounded-md bg-white focus:outline-none focus:ring-2 focus:ring-blue-500"
            style={{ borderColor: theme.border }}
          >
            {unitOptions.map((option) => (
              <option key={option} value={option}>{option}</option>
            ))}
          </select>
        </div>
      );
    }

    return (
      <input
        type="text"
        value={rawValueInput}
        onChange={(e) => setRawValueInput(e.target.value)}
        className="w-full px-3 py-2 border border-gray-300 rounded-md focus:outline-none focus:ring-2 focus:ring-blue-500"
        style={{ borderColor: theme.border }}
        placeholder={elementUnit ? `例如: 1k${elementUnit}` : '输入值'}
      />
    );
  };

  const renderPropertyField = (field: PropertyField) => {
    const currentValue = propertyInputs[field.key];
    const commonClass = 'w-full px-3 py-2 border border-gray-300 rounded-md focus:outline-none focus:ring-2 focus:ring-blue-500';

    if (field.type === 'select') {
      return (
        <select
          value={(currentValue as string) || ''}
          onChange={(e) => setPropertyInputs((prev) => ({ ...prev, [field.key]: e.target.value }))}
          className={commonClass}
          style={{ borderColor: theme.border }}
        >
          {(field.options || []).map((option) => (
            <option key={option.value} value={option.value}>{option.label}</option>
          ))}
        </select>
      );
    }

    if (field.type === 'checkbox') {
      return (
        <label className="inline-flex items-center gap-2 text-sm text-gray-700">
          <input
            type="checkbox"
            checked={Boolean(currentValue)}
            onChange={(e) => setPropertyInputs((prev) => ({ ...prev, [field.key]: e.target.checked }))}
          />
          启用
        </label>
      );
    }

    return (
      <input
        type={field.type === 'number' ? 'number' : 'text'}
        step={field.step}
        min={field.min}
        max={field.max}
        value={currentValue === undefined || currentValue === null ? '' : String(currentValue)}
        onChange={(e) => setPropertyInputs((prev) => ({ ...prev, [field.key]: e.target.value }))}
        className={commonClass}
        style={{ borderColor: theme.border }}
        placeholder={field.placeholder}
      />
    );
  };

  return (
    <div className="fixed inset-0 bg-black bg-opacity-30 flex items-center justify-center z-[9999]" onClick={onClose}>
      <div className="bg-white rounded-lg shadow-xl w-[420px] max-h-[85vh] overflow-hidden" onClick={(e) => e.stopPropagation()}>
        <div className="px-6 py-4 border-b border-gray-200 flex justify-between items-center">
          <h3 className="text-lg font-medium" style={{ color: theme.text }}>{elementTypeName} 配置</h3>
          <button className="text-gray-400 hover:text-gray-600" onClick={onClose}>✕</button>
        </div>

        <form onSubmit={handleSubmit} className="p-6 overflow-y-auto max-h-[calc(85vh-72px)]">
          <div className="mb-4">
            <label className="block text-sm font-medium text-gray-700 mb-1">元件标签</label>
            <input
              type="text"
              value={labelInput}
              onChange={(e) => setLabelInput(e.target.value)}
              className="w-full px-3 py-2 border border-gray-300 rounded-md focus:outline-none focus:ring-2 focus:ring-blue-500"
              style={{ borderColor: theme.border }}
              placeholder="例如: R1 / CLK / U1"
            />
          </div>

          <div className="mb-4">
            <label className="block text-sm font-medium text-gray-700 mb-1">元件值 {elementUnit && `(${elementUnit})`}</label>
            {renderValueSection()}
          </div>

          {propertyFields.length > 0 && (
            <div className="mb-6">
              <div className="text-sm font-medium text-gray-800 mb-3">属性参数</div>
              <div className="space-y-3">
                {propertyFields.map((field) => (
                  <div key={field.key}>
                    <label className="block text-sm font-medium text-gray-700 mb-1">{field.label}</label>
                    {renderPropertyField(field)}
                    {field.help && <p className="mt-1 text-xs text-gray-500">{field.help}</p>}
                  </div>
                ))}
              </div>
            </div>
          )}

          <div className="flex justify-end gap-3">
            <button
              type="button"
              className="px-4 py-2 text-sm font-medium text-gray-700 bg-gray-100 rounded-md hover:bg-gray-200"
              onClick={onClose}
            >
              取消
            </button>
            <button
              type="submit"
              className="px-4 py-2 text-sm font-medium text-white rounded-md"
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
