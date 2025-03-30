import { useState, useEffect } from 'react';
import { ElementType, CircuitElement } from '../../../api/types/element.types';
import { createElementTemplate } from './palette-item';
import { useCircuitStore } from '../../../stores/useCircuitStore';

interface ComponentFormProps {
  type: ElementType;
  onClose: () => void;
  element?: CircuitElement;
}

// 元件类型的中文名称映射
const typeNameMap: Record<ElementType, string> = {
  resistor: '电阻',
  capacitor: '电容',
  inductor: '电感',
  ground: '接地',
  wire: '导线',
  diode: '二极管',
  bjt: '三极管',
  mosfet: 'MOSFET',
  opamp: '运放',
  dc_source: '直流源',
  ac_source: '交流源'
};

const ComponentForm = ({ type, onClose, element }: ComponentFormProps) => {
  const { actions } = useCircuitStore();
  const template = createElementTemplate(type);
  const [properties, setProperties] = useState(element ? element.properties : template.properties);
  
  useEffect(() => {
    if (element) {
      setProperties(element.properties);
    }
  }, [element]);

  const handleSubmit = (e: React.FormEvent) => {
    e.preventDefault();
    
    if (element) {
      actions.updateElementProperties(element.id, properties);
    } else {
      const newElement = {
        ...template,
        id: `element-${Date.now()}`,
        position: { x: window.innerWidth / 3, y: window.innerHeight / 3 },
        properties
      };
      
      actions.addElement(newElement);
    }
    
    onClose();
  };

  const renderFormFields = () => {
    switch (type) {
      case 'resistor':
        return (
          <>
            <div className="mb-4">
              <label className="block text-sm font-medium text-gray-700 mb-1">电阻值 (Ω)</label>
              <div className="flex items-center">
                <input
                  type="number"
                  className="w-full px-3 py-2 border border-gray-300 rounded-md shadow-sm focus:outline-none focus:ring-2 focus:ring-blue-500 focus:border-blue-500"
                  value={properties.resistance}
                  onChange={(e) => setProperties({ ...properties, resistance: Number(e.target.value) })}
                />
                <select 
                  className="ml-2 w-24 px-3 py-2 border border-gray-300 rounded-md shadow-sm focus:outline-none focus:ring-2 focus:ring-blue-500 focus:border-blue-500"
                  onChange={(e) => {
                    const multiplier = Number(e.target.value);
                    setProperties({ 
                      ...properties, 
                      resistance: properties.resistance * multiplier 
                    });
                  }}
                >
                  <option value="1">Ω</option>
                  <option value="1000">kΩ</option>
                  <option value="1000000">MΩ</option>
                </select>
              </div>
            </div>
            <div className="mb-4">
              <label className="block text-sm font-medium text-gray-700 mb-1">容差 (%)</label>
              <input
                type="number"
                className="w-full px-3 py-2 border border-gray-300 rounded-md shadow-sm focus:outline-none focus:ring-2 focus:ring-blue-500 focus:border-blue-500"
                value={properties.tolerance}
                onChange={(e) => setProperties({ ...properties, tolerance: Number(e.target.value) })}
              />
            </div>
          </>
        );
        
      case 'capacitor':
        return (
          <>
            <div className="mb-4">
              <label className="block text-sm font-medium text-gray-700 mb-1">电容值 (F)</label>
              <div className="flex items-center">
                <input
                  type="number"
                  step="0.000001"
                  className="w-full px-3 py-2 border border-gray-300 rounded-md shadow-sm focus:outline-none focus:ring-2 focus:ring-blue-500 focus:border-blue-500"
                  value={properties.capacitance}
                  onChange={(e) => setProperties({ ...properties, capacitance: Number(e.target.value) })}
                />
                <select 
                  className="ml-2 w-24 px-3 py-2 border border-gray-300 rounded-md shadow-sm focus:outline-none focus:ring-2 focus:ring-blue-500 focus:border-blue-500"
                  onChange={(e) => {
                    const multiplier = Number(e.target.value);
                    setProperties({ 
                      ...properties, 
                      capacitance: properties.capacitance * multiplier 
                    });
                  }}
                >
                  <option value="0.000000001">nF</option>
                  <option value="0.000001">μF</option>
                  <option value="0.001">mF</option>
                  <option value="1">F</option>
                </select>
              </div>
            </div>
            <div className="mb-4">
              <label className="block text-sm font-medium text-gray-700 mb-1">耐压值 (V)</label>
              <input
                type="number"
                className="w-full px-3 py-2 border border-gray-300 rounded-md shadow-sm focus:outline-none focus:ring-2 focus:ring-blue-500 focus:border-blue-500"
                value={properties.voltageRating}
                onChange={(e) => setProperties({ ...properties, voltageRating: Number(e.target.value) })}
              />
            </div>
          </>
        );
        
      case 'dc_source':
        return (
          <div className="mb-4">
            <label className="block text-sm font-medium text-gray-700 mb-1">电压 (V)</label>
            <input
              type="number"
              className="w-full px-3 py-2 border border-gray-300 rounded-md shadow-sm focus:outline-none focus:ring-2 focus:ring-blue-500 focus:border-blue-500"
              value={properties.voltage}
              onChange={(e) => setProperties({ ...properties, voltage: Number(e.target.value) })}
            />
          </div>
        );
        
      case 'ac_source':
        return (
          <>
            <div className="mb-4">
              <label className="block text-sm font-medium text-gray-700 mb-1">波形类型</label>
              <select
                className="w-full px-3 py-2 border border-gray-300 rounded-md shadow-sm focus:outline-none focus:ring-2 focus:ring-blue-500 focus:border-blue-500"
                value={properties.waveform.type}
                onChange={(e) => setProperties({
                  ...properties,
                  waveform: { ...properties.waveform, type: e.target.value }
                })}
              >
                <option value="sine">正弦波</option>
                <option value="square">方波</option>
              </select>
            </div>
            <div className="mb-4">
              <label className="block text-sm font-medium text-gray-700 mb-1">振幅 (V)</label>
              <input
                type="number"
                className="w-full px-3 py-2 border border-gray-300 rounded-md shadow-sm focus:outline-none focus:ring-2 focus:ring-blue-500 focus:border-blue-500"
                value={properties.waveform.amplitude}
                onChange={(e) => setProperties({
                  ...properties,
                  waveform: { ...properties.waveform, amplitude: Number(e.target.value) }
                })}
              />
            </div>
            <div className="mb-4">
              <label className="block text-sm font-medium text-gray-700 mb-1">频率 (Hz)</label>
              <div className="flex items-center">
                <input
                  type="number"
                  className="w-full px-3 py-2 border border-gray-300 rounded-md shadow-sm focus:outline-none focus:ring-2 focus:ring-blue-500 focus:border-blue-500"
                  value={properties.waveform.frequency}
                  onChange={(e) => setProperties({
                    ...properties,
                    waveform: { ...properties.waveform, frequency: Number(e.target.value) }
                  })}
                />
                <select 
                  className="ml-2 w-24 px-3 py-2 border border-gray-300 rounded-md shadow-sm focus:outline-none focus:ring-2 focus:ring-blue-500 focus:border-blue-500"
                  onChange={(e) => {
                    const multiplier = Number(e.target.value);
                    setProperties({
                      ...properties,
                      waveform: { 
                        ...properties.waveform, 
                        frequency: properties.waveform.frequency * multiplier 
                      }
                    });
                  }}
                >
                  <option value="1">Hz</option>
                  <option value="1000">kHz</option>
                  <option value="1000000">MHz</option>
                </select>
              </div>
            </div>
          </>
        );
        
      // 其他元件类型的表单...
      default:
        return <p>此元件类型无需配置属性</p>;
    }
  };

  return (
    <div className="fixed inset-0 bg-black bg-opacity-50 flex items-center justify-center z-50">
      <div className="bg-white rounded-lg shadow-xl p-6 w-96 max-w-full">
        <div className="flex items-center justify-between mb-4">
          <h2 className="text-xl font-bold text-gray-800">
            {element ? `编辑${typeNameMap[type] || type}属性` : `${typeNameMap[type] || type}属性配置`}
          </h2>
          <button 
            className="text-gray-500 hover:text-gray-700"
            onClick={onClose}
          >
            <svg xmlns="http://www.w3.org/2000/svg" className="h-6 w-6" fill="none" viewBox="0 0 24 24" stroke="currentColor">
              <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M6 18L18 6M6 6l12 12" />
            </svg>
          </button>
        </div>
        <form onSubmit={handleSubmit}>
          {renderFormFields()}
          <div className="flex justify-end gap-2 mt-6">
            <button
              type="button"
              className="px-4 py-2 rounded bg-gray-200 hover:bg-gray-300 text-gray-800 transition-colors"
              onClick={onClose}
            >
              取消
            </button>
            <button
              type="submit"
              className="px-4 py-2 rounded bg-blue-600 hover:bg-blue-700 text-white transition-colors"
            >
              {element ? '更新' : '确认'}
            </button>
          </div>
        </form>
      </div>
    </div>
  );
};

export default ComponentForm;