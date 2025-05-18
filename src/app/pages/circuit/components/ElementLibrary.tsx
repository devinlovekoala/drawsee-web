import React, { useState } from 'react';
import { CircuitElementType } from '@/api/types/circuit.types';
import { Tabs, Tooltip } from 'antd';
import { 
  ExperimentOutlined, 
  ThunderboltOutlined, 
  ApartmentOutlined, 
  SettingOutlined
} from '@ant-design/icons';

// 元件类别分组
const elementCategories = [
  {
    key: 'passive',
    label: '无源元件',
    icon: <ExperimentOutlined />,
    elements: [
      { type: CircuitElementType.RESISTOR, name: '电阻器 (R)', shortcut: 'R' },
      { type: CircuitElementType.CAPACITOR, name: '电容器 (C)', shortcut: 'C' },
      { type: CircuitElementType.INDUCTOR, name: '电感器 (L)', shortcut: 'L' },
      { type: CircuitElementType.GROUND, name: '接地 (GND)', shortcut: 'G' }
    ]
  },
  {
    key: 'source',
    label: '电源元件',
    icon: <ThunderboltOutlined />,
    elements: [
      { type: CircuitElementType.VOLTAGE_SOURCE, name: '电压源 (V)', shortcut: 'V' },
      { type: CircuitElementType.CURRENT_SOURCE, name: '电流源 (I)', shortcut: 'I' }
    ]
  },
  {
    key: 'semiconductor',
    label: '半导体',
    icon: <ApartmentOutlined />,
    elements: [
      { type: CircuitElementType.DIODE, name: '二极管 (D)', shortcut: 'D' },
      { type: CircuitElementType.TRANSISTOR_NPN, name: 'NPN 晶体管', shortcut: 'N' },
      { type: CircuitElementType.TRANSISTOR_PNP, name: 'PNP 晶体管', shortcut: 'P' }
    ]
  },
  {
    key: 'other',
    label: '其他',
    icon: <SettingOutlined />,
    elements: [
      { type: CircuitElementType.OPAMP, name: '运算放大器', shortcut: 'O' },
      { type: CircuitElementType.WIRE, name: '导线', shortcut: 'W' },
      { type: CircuitElementType.JUNCTION, name: '连接点', shortcut: 'J' }
    ]
  }
];

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
    case CircuitElementType.DIODE:
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
    default:
      return null;
  }
};

// 元件库主组件
interface ElementLibraryProps {
  onSelectElement: (type: CircuitElementType) => void;
}

const ElementLibrary: React.FC<ElementLibraryProps> = ({ onSelectElement }) => {
  const [activeKey, setActiveKey] = useState('passive');
  
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
  const renderTabContent = (category: any) => {
    return (
      <div className="element-category-content p-2">
        {category.elements.map(renderElement)}
      </div>
    );
  };

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
        items={elementCategories.map(category => ({
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