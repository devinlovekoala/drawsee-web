import React, { useEffect, useState } from 'react';
import { CircuitElementType } from '@/api/types/circuit.types';
import { Tabs, Tooltip } from 'antd';

// 元件图标渲染
const getElementIcon = (type: CircuitElementType) => {
  const svgProps = {
    width: 32,
    height: 32,
    viewBox: "0 0 40 40",
    fill: "none",
    stroke: "currentColor",
    strokeWidth: 2
  };
  
  switch(type) {
    case CircuitElementType.RESISTOR:
      return (
        <svg {...svgProps} viewBox="0 0 60 20">
          <path d="M10,10 L15,10 L20,5 L25,15 L30,5 L35,15 L40,5 L45,15 L50,10 L55,10" strokeWidth="2" fill="none" />
        </svg>
      );
    case CircuitElementType.CAPACITOR:
      return (
        <svg {...svgProps}>
          <path d="M10,20 L18,20" strokeWidth="2" />
          <path d="M18,5 L18,35" strokeWidth="2" />
          <path d="M22,5 L22,35" strokeWidth="2" />
          <path d="M22,20 L30,20" strokeWidth="2" />
        </svg>
      );
    case CircuitElementType.INDUCTOR:
      return (
        <svg {...svgProps}>
          <path d="M5,20 L10,20" strokeWidth="2" />
          <path d="M10,20 C12,20 12,15 15,15 C18,15 18,25 21,25 C24,25 24,15 27,15 C30,15 30,20 32,20" strokeWidth="2" fill="none" />
          <path d="M32,20 L37,20" strokeWidth="2" />
        </svg>
      );
    case CircuitElementType.VOLTAGE_SOURCE:
      return (
        <svg {...svgProps}>
          <circle cx="20" cy="20" r="15" strokeWidth="2" fill="none" />
          <path d="M15,20 L25,20" strokeWidth="2" />
          <path d="M20,15 L20,25" strokeWidth="2" />
        </svg>
      );
    case CircuitElementType.CURRENT_SOURCE:
      return (
        <svg {...svgProps}>
          <circle cx="20" cy="20" r="15" strokeWidth="2" fill="none" />
          <path d="M5,20 L35,20" strokeWidth="2" />
          <path d="M35,20 L30,15" strokeWidth="2" />
          <path d="M35,20 L30,25" strokeWidth="2" />
        </svg>
      );
    case CircuitElementType.AC_SOURCE:
    case CircuitElementType.PULSE_SOURCE:
    case CircuitElementType.PWM_SOURCE:
    case CircuitElementType.SINE_SOURCE:
      return (
        <svg {...svgProps}>
          <circle cx="20" cy="20" r="15" strokeWidth="2" fill="none" />
          <path d="M8,20 C12,12 16,28 20,20 C24,12 28,28 32,20" strokeWidth="2" fill="none" />
          <path d="M5,20 L8,20" strokeWidth="2" />
          <path d="M32,20 L35,20" strokeWidth="2" />
        </svg>
      );
    case CircuitElementType.DIODE:
    case CircuitElementType.DIODE_ZENER:
    case CircuitElementType.DIODE_LED:
    case CircuitElementType.DIODE_SCHOTTKY:
      return (
        <svg {...svgProps}>
          <path d="M5,20 L15,20" strokeWidth="2" />
          <path d="M15,10 L15,30" strokeWidth="2" />
          <path d="M15,10 L25,20 L15,30 Z" strokeWidth="2" fill="none" />
          <path d="M25,10 L25,30" strokeWidth="2" />
          <path d="M25,20 L35,20" strokeWidth="2" />
        </svg>
      );
    case CircuitElementType.TRANSISTOR_NPN:
      return (
        <svg {...svgProps} viewBox="0 0 60 60">
          <circle cx="30" cy="30" r="15" strokeWidth="2" fill="none" />
          <path d="M30,15 L30,45" strokeWidth="2" />
          <path d="M5,30 L15,30" strokeWidth="2" />
          <path d="M30,20 L45,5" strokeWidth="2" />
          <path d="M30,40 L45,55" strokeWidth="2" />
        </svg>
      );
    case CircuitElementType.TRANSISTOR_PNP:
      return (
        <svg {...svgProps} viewBox="0 0 60 60">
          <circle cx="30" cy="30" r="15" strokeWidth="2" fill="none" />
          <path d="M30,15 L30,45" strokeWidth="2" />
          <path d="M5,30 L15,30" strokeWidth="2" />
          <path d="M30,20 L45,5" strokeWidth="2" />
          <path d="M30,40 L45,55" strokeWidth="2" />
        </svg>
      );
    case CircuitElementType.GROUND:
      return (
        <svg {...svgProps}>
          <path d="M20,5 L20,20" strokeWidth="2" />
          <path d="M10,20 L30,20" strokeWidth="2" />
          <path d="M13,25 L27,25" strokeWidth="2" />
          <path d="M16,30 L24,30" strokeWidth="2" />
        </svg>
      );
    case CircuitElementType.OPAMP:
      return (
        <svg {...svgProps} viewBox="0 0 60 40">
          <path d="M10,5 L10,35 L50,20 L10,5 Z" strokeWidth="2" fill="none" />
          <path d="M5,15 L10,15" strokeWidth="2" />
          <path d="M5,25 L10,25" strokeWidth="2" />
          <path d="M50,20 L55,20" strokeWidth="2" />
        </svg>
      );
    case CircuitElementType.WIRE:
      return (
        <svg {...svgProps}>
          <path d="M5,20 L35,20" strokeWidth="2" />
        </svg>
      );
    case CircuitElementType.JUNCTION:
      return (
        <svg {...svgProps}>
          <circle cx="20" cy="20" r="5" fill="currentColor" />
        </svg>
      );
    case CircuitElementType.AMMETER:
      return (
        <svg {...svgProps}>
          <circle cx="20" cy="20" r="15" strokeWidth="2" fill="none" />
          <path d="M12,24 L18,14 L22,24" strokeWidth="2" fill="none" />
          <path d="M20,24 L20,28" strokeWidth="2" />
        </svg>
      );
    case CircuitElementType.VOLTMETER:
      return (
        <svg {...svgProps}>
          <circle cx="20" cy="20" r="15" strokeWidth="2" fill="none" />
          <path d="M12,26 L20,12 L28,26" strokeWidth="2" fill="none" />
        </svg>
      );
    case CircuitElementType.OSCILLOSCOPE:
      return (
        <svg {...svgProps} viewBox="0 0 60 40">
          <rect x="5" y="5" width="50" height="30" rx="4" strokeWidth="2" fill="none" />
          <path d="M10,20 L20,15 L25,25 L30,10 L35,28 L45,18 L50,22" strokeWidth="2" fill="none" />
          <path d="M5,35 L15,35" strokeWidth="2" />
          <path d="M45,35 L55,35" strokeWidth="2" />
        </svg>
      );
    case CircuitElementType.DIGITAL_INPUT:
      return (
        <svg {...svgProps} viewBox="0 0 60 40">
          <rect x="8" y="10" width="30" height="20" rx="4" strokeWidth="2" fill="none" />
          <path d="M38,20 L54,20" strokeWidth="2" />
          <path d="M49,15 L54,20 L49,25" strokeWidth="2" fill="none" />
        </svg>
      );
    case CircuitElementType.DIGITAL_OUTPUT:
      return (
        <svg {...svgProps} viewBox="0 0 60 40">
          <rect x="22" y="10" width="30" height="20" rx="4" strokeWidth="2" fill="none" />
          <path d="M6,20 L22,20" strokeWidth="2" />
          <path d="M11,15 L6,20 L11,25" strokeWidth="2" fill="none" />
        </svg>
      );
    case CircuitElementType.DIGITAL_CLOCK:
      return (
        <svg {...svgProps} viewBox="0 0 40 40">
          <circle cx="20" cy="20" r="12" strokeWidth="2" fill="none" />
          <path d="M20,20 L20,12" strokeWidth="2" />
          <path d="M20,20 L26,23" strokeWidth="2" />
        </svg>
      );
    case CircuitElementType.DIGITAL_AND:
    case CircuitElementType.DIGITAL_AND3:
    case CircuitElementType.DIGITAL_AND4:
    case CircuitElementType.DIGITAL_NAND3:
    case CircuitElementType.DIGITAL_NAND4:
    case CircuitElementType.DIGITAL_NAND:
      return (
        <svg {...svgProps} viewBox="0 0 60 40">
          <path d="M5,15 L20,15 M5,25 L20,25" strokeWidth="2" />
          <path d="M20,8 H35 C45,8 50,13 50,20 C50,27 45,32 35,32 H20 Z" strokeWidth="2" fill="none" />
          {type === CircuitElementType.DIGITAL_NAND && <circle cx="53" cy="20" r="3" strokeWidth="2" fill="none" />}
        </svg>
      );
    case CircuitElementType.DIGITAL_OR:
    case CircuitElementType.DIGITAL_OR3:
    case CircuitElementType.DIGITAL_OR4:
    case CircuitElementType.DIGITAL_NOR3:
    case CircuitElementType.DIGITAL_NOR4:
    case CircuitElementType.DIGITAL_NOR:
      return (
        <svg {...svgProps} viewBox="0 0 60 40">
          <path d="M5,15 L22,15 M5,25 L22,25" strokeWidth="2" />
          <path d="M20,8 C25,14 25,26 20,32 H36 C46,32 52,26 52,20 C52,14 46,8 36,8 H20 Z" strokeWidth="2" fill="none" />
          {type === CircuitElementType.DIGITAL_NOR && <circle cx="55" cy="20" r="3" strokeWidth="2" fill="none" />}
        </svg>
      );
    case CircuitElementType.DIGITAL_NOT:
    case CircuitElementType.DIGITAL_BUF:
    case CircuitElementType.DIGITAL_TRI:
    case CircuitElementType.DIGITAL_SCHMITT_NOT:
      return (
        <svg {...svgProps} viewBox="0 0 40 40">
          <path d="M5,20 L15,20" strokeWidth="2" />
          <path d="M15,12 L15,28 L30,20 Z" strokeWidth="2" fill="none" />
          <circle cx="33" cy="20" r="2.5" strokeWidth="2" fill="none" />
        </svg>
      );
    case CircuitElementType.DIGITAL_XOR:
    case CircuitElementType.DIGITAL_XNOR:
      return (
        <svg {...svgProps} viewBox="0 0 60 40">
          <path d="M10,8 C15,14 15,26 10,32" strokeWidth="2" fill="none" />
          <path d="M15,8 C20,14 20,26 15,32 H34 C44,32 50,26 50,20 C50,14 44,8 34,8 H15 Z" strokeWidth="2" fill="none" />
          {type === CircuitElementType.DIGITAL_XNOR && <circle cx="53" cy="20" r="3" strokeWidth="2" fill="none" />}
        </svg>
      );
    case CircuitElementType.DIGITAL_DFF:
    case CircuitElementType.DIGITAL_JKFF:
    case CircuitElementType.DIGITAL_TFF:
    case CircuitElementType.DIGITAL_SRFF:
      return (
        <svg {...svgProps} viewBox="0 0 50 40">
          <rect x="10" y="10" width="30" height="20" rx="4" strokeWidth="2" fill="none" />
          <path d="M5,20 L10,20" strokeWidth="2" />
          <path d="M40,20 L45,20" strokeWidth="2" />
        </svg>
      );
    default:
      return (
        <svg {...svgProps}>
          <rect x="8" y="8" width="24" height="24" rx="4" strokeWidth="2" fill="none" />
        </svg>
      );
  }
};

// 元件库主组件
export interface ElementCategory {
  key: string;
  label: string;
  icon: React.ReactNode;
  elements: Array<{ type: CircuitElementType; name: string; shortcut: string }>;
}

interface ElementLibraryProps {
  onSelectElement: (type: CircuitElementType) => void;
  categories: ElementCategory[];
}

const ElementLibrary: React.FC<ElementLibraryProps> = ({ onSelectElement, categories }) => {
  const [activeKey, setActiveKey] = useState(() => categories[0]?.key ?? '');

  useEffect(() => {
    setActiveKey(categories[0]?.key ?? '');
  }, [categories]);
  
  // 渲染元件项
  const renderElement = (element: { type: CircuitElementType, name: string, shortcut: string }) => {
    return (
      <Tooltip 
        key={element.type} 
        title={`${element.name} (快捷键: ${element.shortcut})`} 
        placement="right"
      >
        <div 
          className="element-item py-2 px-3 mb-2 flex items-center cursor-pointer hover:bg-gray-100 rounded-md transition-colors"
          onClick={() => onSelectElement(element.type)}
        >
          <div className="element-icon mr-3 text-blue-600 flex-shrink-0">
            {getElementIcon(element.type)}
          </div>
          <div className="element-info">
            <div className="element-name text-sm font-medium text-gray-700">{element.name}</div>
            <div className="element-shortcut text-xs text-gray-500">快捷键: {element.shortcut}</div>
          </div>
        </div>
      </Tooltip>
    );
  };

  // 渲染选项卡内容
  const renderTabContent = (category: ElementCategory) => {
    return (
      <div className="element-category-content p-2">
        {category.elements.map(renderElement)}
      </div>
    );
  };

  if (!categories.length) {
    return (
      <div className="element-library-container flex h-full items-center justify-center border-r border-gray-200 bg-white text-sm text-gray-500">
        暂无可用元件
      </div>
    );
  }

  return (
    <div className="element-library-container h-full bg-white border-r border-gray-200 overflow-y-auto">
      <div className="element-library-header border-b border-gray-200 py-3 px-4">
        <h3 className="text-base font-semibold text-gray-800">电路元件库</h3>
        <p className="text-xs text-gray-500 mt-1">点击添加元件或使用快捷键</p>
      </div>
      
      <Tabs
        activeKey={activeKey}
        onChange={setActiveKey}
        tabPosition="left"
        items={categories.map(category => ({
          key: category.key,
          label: (
            <div className="flex flex-col items-center">
              {category.icon}
              <span className="text-xs mt-1">{category.label}</span>
            </div>
          ),
          children: renderTabContent(category)
        }))}
        style={{ height: 'calc(100% - 60px)' }}
        className="element-tabs"
      />
    </div>
  );
};

export default ElementLibrary; 
