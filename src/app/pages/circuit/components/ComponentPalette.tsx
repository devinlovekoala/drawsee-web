import { useCallback } from 'react';
import { CircuitElementType } from '@/api/types/circuit.types';

// 组件面板配置
const components = [
  { type: CircuitElementType.RESISTOR, name: '电阻' },
  { type: CircuitElementType.CAPACITOR, name: '电容' },
  { type: CircuitElementType.INDUCTOR, name: '电感' },
  { type: CircuitElementType.VOLTAGE_SOURCE, name: '电压源' },
  { type: CircuitElementType.CURRENT_SOURCE, name: '电流源' },
  { type: CircuitElementType.DIODE, name: '二极管' },
  { type: CircuitElementType.TRANSISTOR_NPN, name: 'NPN三极管' },
  { type: CircuitElementType.TRANSISTOR_PNP, name: 'PNP三极管' },
  { type: CircuitElementType.OPAMP, name: '运放' },
  { type: CircuitElementType.GROUND, name: '地' },
];

// 组件面板组件
const ComponentPalette = () => {
  // 处理拖动开始
  const onDragStart = useCallback((event: React.DragEvent<HTMLDivElement>, nodeType: string) => {
    event.dataTransfer.setData('application/reactflow', nodeType);
    event.dataTransfer.effectAllowed = 'move';
  }, []);

  return (
    <div className="p-4">
      <h3 className="text-lg font-semibold text-neutral-800 mb-4">电路元件</h3>
      
      <div className="space-y-2">
        {components.map((component) => (
          <div
            key={component.type}
            className="p-3 bg-white border border-neutral-200 rounded-lg shadow-sm hover:shadow-md transition-shadow cursor-grab flex items-center"
            draggable
            onDragStart={(e) => onDragStart(e, component.type)}
          >
            <div className="w-8 h-8 mr-3 flex items-center justify-center text-blue-600">
              {getComponentIcon(component.type)}
            </div>
            <span className="text-sm font-medium text-neutral-700">{component.name}</span>
          </div>
        ))}
      </div>
    </div>
  );
};

// 获取组件图标
function getComponentIcon(type: CircuitElementType) {
  switch(type) {
    case CircuitElementType.RESISTOR:
      return (
        <svg viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" className="w-6 h-6">
          <path d="M2,12 H6 M18,12 H22 M6,12 L7,9 L9,15 L11,9 L13,15 L15,9 L16,12 L18,12" />
        </svg>
      );
      
    case CircuitElementType.CAPACITOR:
      return (
        <svg viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" className="w-6 h-6">
          <path d="M2,12 H9 M15,12 H22" />
          <path d="M9,6 L9,18" />
          <path d="M15,6 L15,18" />
        </svg>
      );
      
    case CircuitElementType.INDUCTOR:
      return (
        <svg viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" className="w-6 h-6">
          <path d="M2,12 H4 M20,12 H22" />
          <path d="M4,12 C5,8 7,8 7,12 C7,16 9,16 9,12 C9,8 11,8 11,12 C11,16 13,16 13,12 C13,8 15,8 15,12 C15,16 17,16 17,12 C17,8 19,8 19,12 L20,12" />
        </svg>
      );
      
    case CircuitElementType.VOLTAGE_SOURCE:
      return (
        <svg viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" className="w-6 h-6">
          <circle cx="12" cy="12" r="6" />
          <path d="M9,12 H15" />
          <path d="M12,9 V15" />
        </svg>
      );
      
    case CircuitElementType.CURRENT_SOURCE:
      return (
        <svg viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" className="w-6 h-6">
          <circle cx="12" cy="12" r="6" />
          <path d="M12,8 L12,16" />
          <path d="M10,14 L12,16 L14,14" />
        </svg>
      );
      
    case CircuitElementType.DIODE:
      return (
        <svg viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" className="w-6 h-6">
          <path d="M2,12 H8 M16,12 H22" />
          <polygon points="8,6 16,12 8,18" fill="none" />
          <path d="M16,6 L16,18" />
        </svg>
      );
      
    case CircuitElementType.TRANSISTOR_NPN:
      return (
        <svg viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" className="w-6 h-6">
          <circle cx="12" cy="12" r="4" />
          <path d="M12,8 L12,2" />
          <path d="M12,16 L12,22" />
          <path d="M12,10 L20,5" />
          <path d="M12,14 L20,19" />
        </svg>
      );
      
    case CircuitElementType.TRANSISTOR_PNP:
      return (
        <svg viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" className="w-6 h-6">
          <circle cx="12" cy="12" r="4" />
          <path d="M12,8 L12,2" />
          <path d="M12,16 L12,22" />
          <path d="M12,10 L20,5" />
          <path d="M20,5 L17,5" />
          <path d="M12,14 L20,19" />
          <path d="M20,19 L17,19" />
        </svg>
      );
      
    case CircuitElementType.OPAMP:
      return (
        <svg viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" className="w-6 h-6">
          <polygon points="2,4 2,20 20,12" fill="none" />
          <path d="M5,8 L7,8" />
          <path d="M5,16 L7,16" />
          <path d="M6,8 L6,16" />
          <path d="M20,12 L22,12" />
        </svg>
      );
      
    case CircuitElementType.GROUND:
      return (
        <svg viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" className="w-6 h-6">
          <path d="M12,2 L12,12" />
          <path d="M6,12 L18,12" />
          <path d="M8,16 L16,16" />
          <path d="M10,20 L14,20" />
        </svg>
      );
      
    case CircuitElementType.WIRE:
      return (
        <svg viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" className="w-6 h-6">
          <path d="M2,12 L22,12" />
        </svg>
      );
      
    case CircuitElementType.JUNCTION:
      return (
        <svg viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" className="w-6 h-6">
          <circle cx="12" cy="12" r="4" fill="currentColor" />
        </svg>
      );
      
    default:
      return (
        <svg viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" className="w-6 h-6">
          <rect x="4" y="6" width="16" height="12" rx="2" />
          <path d="M12,6 L12,18" />
        </svg>
      );
  }
}

export default ComponentPalette;
