import React, { useState, useMemo } from 'react';
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
  const [searchTerm, setSearchTerm] = useState('');
  const [showTutorial, setShowTutorial] = useState(true);
  
  // 过滤元件
  const filteredCategories = useMemo(() => {
    if (!searchTerm) return elementCategories;
    
    return elementCategories.map(category => ({
      ...category,
      elements: category.elements.filter(element => 
        element.name.toLowerCase().includes(searchTerm.toLowerCase()) ||
        element.shortcut.toLowerCase().includes(searchTerm.toLowerCase())
      )
    })).filter(category => category.elements.length > 0);
  }, [searchTerm]);
  
  // 渲染元件项
  const renderElement = (element: { type: CircuitElementType, name: string, shortcut: string }) => {
    return (
      <Tooltip 
        key={element.type} 
        title={`${element.name} (快捷键: ${element.shortcut})`} 
        placement="right"
      >
        <div 
          className="element-item group py-3 px-3 mb-2 flex items-center cursor-pointer hover:bg-blue-50 rounded-lg transition-all duration-200 border border-transparent hover:border-blue-200 hover:shadow-sm transform hover:-translate-y-0.5"
          onClick={() => onSelectElement(element.type)}
        >
          <div className="element-icon mr-3 text-blue-600 flex-shrink-0 bg-blue-100 p-2 rounded-lg group-hover:bg-blue-200 group-hover:scale-110 transition-all duration-200">
            {getElementIcon(element.type)}
          </div>
          <div className="element-info">
            <div className="element-name text-sm font-medium text-gray-800 group-hover:text-blue-700">{element.name}</div>
            <div className="element-shortcut text-xs text-blue-600 font-medium group-hover:text-blue-800">快捷键: {element.shortcut}</div>
          </div>
        </div>
      </Tooltip>
    );
  };

  // 渲染选项卡内容
  const renderTabContent = (category: any) => {
    return (
      <div className="element-category-content p-2">
        {category.elements.length === 0 ? (
          <div className="text-center py-8 text-gray-400">
            <div className="w-12 h-12 mx-auto mb-2 text-gray-300">
              <svg fill="none" stroke="currentColor" viewBox="0 0 24 24">
                <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={1.5} d="M21 21l-6-6m2-5a7 7 0 11-14 0 7 7 0 0114 0z" />
              </svg>
            </div>
            <p className="text-sm">未找到匹配的元件</p>
          </div>
        ) : (
          category.elements.map(renderElement)
        )}
      </div>
    );
  };

  return (
    <div className="element-library-container h-full bg-gradient-to-b from-gray-50 to-white border-r border-gray-200 overflow-y-auto shadow-sm">
      <div className="element-library-header border-b border-gray-200 py-4 px-4 bg-white">
        <div className="flex items-center justify-between mb-2">
          <h3 className="text-base font-semibold text-gray-800 flex items-center gap-2">
            <svg className="w-5 h-5 text-blue-600" fill="none" stroke="currentColor" viewBox="0 0 24 24">
              <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M13 10V3L4 14h7v7l9-11h-7z" />
            </svg>
            智能电路元件库
          </h3>
          <button
            onClick={() => setShowTutorial(!showTutorial)}
            className="text-gray-400 hover:text-blue-600 transition-colors"
            title={showTutorial ? "隐藏引导" : "显示引导"}
          >
            <svg className="w-4 h-4" fill="none" stroke="currentColor" viewBox="0 0 24 24">
              <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M13 16h-1v-4h-1m1-4h.01M21 12a9 9 0 11-18 0 9 9 0 0118 0z" />
            </svg>
          </button>
        </div>
        
        {/* 搜索框 */}
        <div className="relative mb-2">
          <input
            type="text"
            placeholder="搜索元件..."
            value={searchTerm}
            onChange={(e) => setSearchTerm(e.target.value)}
            className="w-full pl-8 pr-4 py-2 text-sm border border-gray-300 rounded-lg focus:ring-2 focus:ring-blue-500 focus:border-blue-500 outline-none"
          />
          <svg className="absolute left-2 top-2.5 w-4 h-4 text-gray-400" fill="none" stroke="currentColor" viewBox="0 0 24 24">
            <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M21 21l-6-6m2-5a7 7 0 11-14 0 7 7 0 0114 0z" />
          </svg>
        </div>
        
        {showTutorial && (
          <div className="bg-blue-50 border border-blue-200 rounded-lg p-2 mt-2">
            <p className="text-xs text-blue-700">
              💡 <strong>新手提示：</strong>点击元件添加到画布，使用快捷键快速操作
            </p>
          </div>
        )}
      </div>
      
      <Tabs
        activeKey={activeKey}
        onChange={setActiveKey}
        tabPosition="left"
        items={filteredCategories.map(category => ({
          key: category.key,
          label: (
            <div className="flex flex-col items-center py-2 px-1">
              <div className="text-blue-600">{category.icon}</div>
              <span className="text-xs mt-1 text-gray-700 font-medium">{category.label}</span>
            </div>
          ),
          children: renderTabContent(category)
        }))}
        style={{ height: 'calc(100% - 140px)' }}
        className="element-tabs"
      />
    </div>
  );
};

export default ElementLibrary; 