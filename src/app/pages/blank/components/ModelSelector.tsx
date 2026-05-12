import { useState, useRef, useEffect } from 'react';
import { createPortal } from 'react-dom';
import {
  ChevronDownIcon,
} from '@heroicons/react/24/outline';
import { ModelType } from '../../flow/components/input/FlowInputPanel';
import { DeepSeek, Qwen } from '@lobehub/icons';

interface ModelSelectorProps {
  selectedModel: ModelType;
  onModelChange: (model: ModelType) => void;
}

// 模型选项
const modelOptions = [
  {
    name: 'DeepSeekV4',
    description: 'DeepSeekV4大语言模型',
    icon: DeepSeek.Color,
    type: 'deepseekV3' satisfies ModelType
  },
  {
    name: 'Qwen',
    description: 'Qwen 大语言模型',
    icon: Qwen.Color,
    type: 'qwen' satisfies ModelType
  }
];

export function ModelSelector({ selectedModel, onModelChange }: ModelSelectorProps) {
  const [isOpen, setIsOpen] = useState(false);
  const buttonRef = useRef<HTMLButtonElement>(null);
  const dropdownRef = useRef<HTMLDivElement>(null);
  const selectedModelOption = modelOptions.find(mode => mode.type === selectedModel) || modelOptions[0];
  const [position, setPosition] = useState({ top: 0, left: 0, width: 0 });

  // 当按钮点击时更新位置
  useEffect(() => {
    if (isOpen && buttonRef.current) {
      const rect = buttonRef.current.getBoundingClientRect();
      
      // 计算下拉菜单的预估高度
      const estimatedDropdownHeight = 106; // 根据实际内容调整
      const viewportHeight = window.innerHeight;
      const availableSpaceBelow = viewportHeight - rect.bottom;
      const availableSpaceAbove = rect.top;

      // 判断是否需要在上面显示
      const shouldDisplayAbove = availableSpaceBelow < estimatedDropdownHeight + 5 && 
                                availableSpaceAbove > estimatedDropdownHeight + 5;

      setPosition({
        top: shouldDisplayAbove 
          ? rect.top - estimatedDropdownHeight - 5 // 在按钮上方显示，减小间距
          : rect.bottom + 5, // 在按钮下方显示，减小间距
        left: rect.left, // 按钮的左侧对齐
        width: Math.max(rect.width, 250) // 设定最小宽度，确保能够容纳两个模型选项
      });
    }
  }, [isOpen]);

  // 点击外部关闭下拉菜单
  useEffect(() => {
    function handleClickOutside(event: MouseEvent) {
      if (
        dropdownRef.current && 
        !dropdownRef.current.contains(event.target as Node) &&
        buttonRef.current && 
        !buttonRef.current.contains(event.target as Node)
      ) {
        setIsOpen(false);
      }
    }
    
    document.addEventListener('mousedown', handleClickOutside);
    return () => {
      document.removeEventListener('mousedown', handleClickOutside);
    };
  }, []);

  return (
    <div className="inline-flex">
      {/* 触发按钮 */}
      <button 
        ref={buttonRef}
        onClick={() => setIsOpen(!isOpen)}
        className="flex items-center space-x-3 px-4 py-2 rounded-lg bg-white shadow-[0_0_2px_0_rgba(0,0,0,0.35)] hover:bg-gray-100 transition-all duration-300 focus:outline-none focus:ring-2 focus:ring-gray-300"
        aria-expanded={isOpen}
        aria-haspopup="true"
      >
        <selectedModelOption.icon className='w-5 h-5' />
        <span className="text-sm font-medium text-gray-800">{selectedModelOption.name}</span>
        <ChevronDownIcon 
          className={`w-4 h-4 text-gray-500 transition-transform duration-200 ${isOpen ? 'transform rotate-180' : ''}`}
        />
      </button>

      {/* 下拉菜单 - 使用 Portal */}
      {isOpen && typeof document !== 'undefined' && createPortal(
        <div 
          ref={dropdownRef}
          className="fixed z-[111] data-[state=open]:animate-[slideInFromBottom_200ms_ease-in,fadeIn_200ms_ease-in]"
          style={{ 
            top: `${position.top}px`, 
            left: `${position.left}px`,
            width: 'auto', // 自适应宽度
            transform: 'translate(0, 0)',
            willChange: 'transform',
            minWidth: 'max-content',
          }}
          role="menu"
          aria-orientation="vertical"
          data-state="open"
        >
          <div 
            className="min-w-fit scrollbar-nice overflow-hidden text-neutral-800 shadow bg-white/90 backdrop-blur-xl rounded-xl p-2 ring-1 ring-neutral-200/50 mx-0"
            tabIndex={-1}
            data-orientation="vertical"
            style={{ 
              outline: 'none',
              pointerEvents: 'auto'
            }}
          >
            <div className="grid gap-2 grid-cols-2">
              {modelOptions.map((model) => (
                <div
                  key={model.type}
                  role="menuitem"
                  className="relative flex cursor-pointer select-none items-center rounded-lg text-sm outline-none transition-colors w-full p-0 focus:bg-transparent"
                  tabIndex={-1}
                  data-orientation="vertical"
                  onClick={() => {
                    onModelChange(model.type as ModelType);
                    setIsOpen(false);
                  }}
                >
                  {/* 卡片式模型选项 */}
                  <div className="flex w-full relative flex-col rounded-lg border transition-all duration-300 cursor-pointer group bg-gradient-to-br from-white to-neutral-50/80 dark:from-neutral-900 dark:to-neutral-900/95 h-[100px] p-2 ${
                    selectedModel === model.type 
                      ? 'border-neutral-300/80 dark:border-neutral-600/80' 
                      : 'border-neutral-200/60 dark:border-neutral-800/60 hover:border-neutral-300/80 dark:hover:border-neutral-700/80'
                  }">
                    <div className={`absolute inset-0 transition-all duration-300 rounded-lg bg-gradient-to-br ${
                      selectedModel === model.type 
                        ? 'from-neutral-100/50 to-neutral-50/30 dark:from-neutral-700/[0.08] dark:to-neutral-800/[0.03]' 
                        : 'from-neutral-400/0 to-neutral-400/0 dark:from-neutral-700/0 dark:to-neutral-700/0 group-hover:from-neutral-400/[0.02] group-hover:to-neutral-400/[0.08] dark:group-hover:from-neutral-600/[0.02] dark:group-hover:to-neutral-600/[0.08]'
                    }`}></div>
                    
                    <div className="relative flex items-center gap-1.5 mb-1 p-1">
                      <div className={`flex items-center justify-center rounded-md ring-1 w-5 h-5 ${
                        selectedModel === model.type 
                          ? 'bg-neutral-100 dark:bg-neutral-800 ring-neutral-300/80 dark:ring-neutral-700' 
                          : 'bg-neutral-100/80 dark:bg-neutral-800/80 ring-neutral-200/50 dark:ring-neutral-700/50 group-hover:bg-neutral-200/90 dark:group-hover:bg-neutral-700/90 group-hover:ring-neutral-300/80 dark:group-hover:ring-neutral-600/80'
                      }`}>
                        <div className={`transition-all duration-300 ${
                          selectedModel === model.type 
                            ? 'text-neutral-800 dark:text-neutral-200 scale-[1.15]' 
                            : 'scale-100 text-neutral-700 dark:text-neutral-400 group-hover:text-neutral-700 dark:group-hover:text-neutral-200 group-hover:scale-[1.15]'
                        }`}>
                          <model.icon className='w-5 h-5' />
                        </div>
                      </div>
                      
                      <p className={`font-medium tracking-tight transition-colors duration-300 truncate max-w-[120px] text-[13px] ${
                        selectedModel === model.type 
                          ? 'text-neutral-800 dark:text-neutral-100' 
                          : 'text-neutral-700 dark:text-neutral-300 group-hover:text-neutral-900 dark:group-hover:text-neutral-50'
                      }`}>
                        {model.name}
                      </p>
                      
                      {selectedModel === model.type && (
                        <div className="ml-auto">
                          <div className="flex items-center justify-center rounded-full bg-neutral-200/80 dark:bg-neutral-700/80 ring-1 ring-neutral-300/60 dark:ring-neutral-600/60 size-[14px]">
                            <svg xmlns="http://www.w3.org/2000/svg" width="24" height="24" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round" className="lucide lucide-check text-neutral-600 dark:text-neutral-300 size-2.5">
                              <path d="M20 6 9 17l-5-5"></path>
                            </svg>
                          </div>
                        </div>
                      )}
                    </div>
                    
                    <div className="relative p-1 overflow-y-hidden">
                      <p className={`tracking-tight transition-colors duration-300 line-clamp-2 text-[11px] leading-[12px] ${
                        selectedModel === model.type 
                          ? 'text-neutral-600 dark:text-neutral-300' 
                          : 'text-neutral-400 dark:text-neutral-400 group-hover:text-neutral-600 dark:group-hover:text-neutral-300'
                      }`}>
                        {model.description}
                      </p>
                    </div>
                  </div>
                </div>
              ))}
            </div>
          </div>
        </div>,
        document.body
      )}
    </div>
  );
}
