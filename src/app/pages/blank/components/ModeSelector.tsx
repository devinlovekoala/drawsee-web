'use client';

import { useState, useRef, useEffect } from 'react';
import { createPortal } from 'react-dom';
import { AiTaskType } from '@/api/types/flow.types';
import {
  ChevronDownIcon,
} from '@heroicons/react/24/outline';
import { BookOpenIcon, CircuitBoardIcon, CodeXmlIcon, MessageCircleIcon, SparklesIcon, TargetIcon, TvMinimalPlayIcon } from 'lucide-react';
import { toast } from 'sonner';

interface ModeSelectorProps {
  selectedType: AiTaskType;
  onTypeChange: (type: AiTaskType) => void;
}

const modes = [
  {
    name: '常规问答模式',
    description: '最常规的 AI 生成模式，一问一答。',
    icon: MessageCircleIcon,
    type: 'general' satisfies AiTaskType
  },
  {
    name: '知识问答模式',
    description: '基于知识库的 AI 生成模式，能识别用户提问中的相关知识点。',
    icon: BookOpenIcon,
    type: 'knowledge' satisfies AiTaskType
  },
  {
    name: '推理解题模式',
    description: '基于解题引擎，能够基于用户提问生成解题过程。',
    icon: SparklesIcon,
    type: 'solver-first' satisfies AiTaskType
  },
  {
    name: '网页生成模式',
    description: '基于网页生成引擎，能够基于用户提问生成可预览的html网页。',
    icon: CodeXmlIcon,
    type: 'html-maker' as string,
    disabled: true
  },
  {
    name: '目标解析模式',
    description: '基于目标解析引擎，能够对用户目标进行有效拆解。',
    icon: TargetIcon,
    type: 'planner' as string,
    disabled: true
  },
  {
    name: '动画生成模式',
    description: '基于昭析动画生成引擎，能够基于用户提问生成生动的动画视频解析。',
    icon: TvMinimalPlayIcon,
    type: 'animation' satisfies AiTaskType,
  },
  {
    name: '电路分析模式',
    description: '基于电路分析引擎，能够基于用户输入的电路图，生成电路分析结果。',
    icon: CircuitBoardIcon,
    type: 'circuit-analyze' satisfies AiTaskType,
  },
];

export function ModeSelector({ selectedType, onTypeChange }: ModeSelectorProps) {
  const [isOpen, setIsOpen] = useState(false);
  const buttonRef = useRef<HTMLButtonElement>(null);
  const dropdownRef = useRef<HTMLDivElement>(null);
  const selectedMode = modes.find(mode => mode.type === selectedType) || modes[0];
  const [position, setPosition] = useState({ top: 0, left: 0, width: 0 });

  // 当按钮点击时更新位置
  useEffect(() => {
    if (isOpen && buttonRef.current) {
      const rect = buttonRef.current.getBoundingClientRect();
      const parentRect = buttonRef.current.closest('.py-6')?.getBoundingClientRect() || { 
        left: 0, 
        width: window.innerWidth 
      };

      // 计算下拉菜单的预估高度
      const estimatedDropdownHeight = 208; // 根据实际内容调整
      const viewportHeight = window.innerHeight;
      const availableSpaceBelow = viewportHeight - rect.bottom;
      const availableSpaceAbove = rect.top;

      // 判断是否需要在上面显示
      const shouldDisplayAbove = availableSpaceBelow < estimatedDropdownHeight + 20 && 
                                availableSpaceAbove > estimatedDropdownHeight + 20;

      setPosition({
        top: shouldDisplayAbove 
          ? rect.top - estimatedDropdownHeight - 25 // 在按钮上方显示
          : rect.bottom + 25, // 在按钮下方显示
        left: parentRect.left,
        width: parentRect.width
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
        <selectedMode.icon className="w-5 h-5 text-gray-600" />
        <span className="text-sm font-medium text-gray-800">{selectedMode.name}</span>
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
            width: `${position.width}px`,
            transform: 'translate(0, 0)',
            willChange: 'transform',
            minWidth: 'max-content',
          }}
          role="menu"
          aria-orientation="vertical"
          data-state="open"
        >
          <div 
            className="min-w-fit scrollbar-nice overflow-hidden text-neutral-800 shadow bg-white/90 backdrop-blur-xl rounded-xl mx-2 sm:mx-0 w-9/12 sm:w-[768px] p-2 ring-1 ring-neutral-200/50"
            tabIndex={-1}
            data-orientation="vertical"
            style={{ 
              outline: 'none',
              pointerEvents: 'auto'
            }}
          >
            <div className="block sm:grid sm:gap-2 sm:grid-cols-4">
              {modes.map((mode) => (
                <div
                  key={mode.type}
                  role="menuitem"
                  className={`relative flex select-none items-center rounded-lg text-sm outline-none transition-colors w-full p-0 focus:bg-transparent ${
                    mode.disabled ? 'opacity-60 cursor-not-allowed' : 'cursor-pointer'
                  }`}
                  tabIndex={-1}
                  data-orientation="vertical"
                  onClick={() => {
                    if (mode.disabled) {
                      toast.info(`${mode.name}功能即将上线，敬请期待！`);
                      return;
                    }
                    // 确保使用有效的AiTaskType
                    const validAiTaskType = ['general', 'knowledge', 'knowledge-detail', 'animation', 
                      'solver-first', 'solver-continue', 'solver-summary', 'circuit-analyze'].includes(mode.type) 
                      ? (mode.type as AiTaskType) 
                      : 'general';
                    onTypeChange(validAiTaskType);
                    setIsOpen(false);
                  }}
                >
                  {/* 移动端视图 */}
                  <div className="block w-full sm:hidden">
                    <div className={`flex items-center gap-2 px-3 py-2.5 rounded-lg transition-all duration-300 w-full ${
                      selectedType === mode.type 
                        ? 'bg-neutral-100 dark:bg-neutral-800 ring-1 ring-neutral-200 dark:ring-neutral-700' 
                        : 'hover:bg-neutral-100 dark:hover:bg-neutral-800 hover:ring-1 hover:ring-neutral-200 dark:hover:ring-neutral-700'
                    }`}>
                      <div className="flex items-center justify-center w-5 h-5 rounded-md ring-1 bg-neutral-100/80 dark:bg-neutral-800/80 ring-neutral-200/50 dark:ring-neutral-700/50">
                        <div className="transition-all duration-300 text-neutral-700 dark:text-neutral-400">
                          <mode.icon className="size-4" />
                        </div>
                      </div>
                      <div className="flex flex-col flex-1">
                        <p className="text-[13px] font-medium tracking-tight text-neutral-700 dark:text-neutral-300">
                          {mode.name}
                        </p>
                        <p className="text-[11px] leading-[14px] tracking-tight line-clamp-2 text-neutral-400 dark:text-neutral-400">
                          {mode.description}
                        </p>
                      </div>
                      {selectedType === mode.type && (
                        <div className="ml-2 shrink-0">
                          <div className="size-[14px] flex items-center justify-center rounded-full bg-neutral-200/80 dark:bg-neutral-700/80 ring-1 ring-neutral-300/60 dark:ring-neutral-600/60">
                            <svg xmlns="http://www.w3.org/2000/svg" width="24" height="24" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round" className="lucide lucide-check size-2.5 text-neutral-600 dark:text-neutral-300">
                              <path d="M20 6 9 17l-5-5"></path>
                            </svg>
                          </div>
                        </div>
                      )}
                    </div>
                  </div>
                  
                  {/* 桌面视图 - 卡片样式 */}
                  <div className="hidden sm:block w-full">
                    <div className={`flex flex-col gap-2 p-3 rounded-lg transition-all w-full h-full ${
                      selectedType === mode.type 
                        ? 'border border-neutral-200 bg-neutral-100 dark:border-neutral-700 dark:bg-neutral-800' 
                        : 'hover:border hover:border-neutral-200 hover:bg-neutral-100 dark:hover:border-neutral-700 dark:hover:bg-neutral-800'
                    }`}>
                      <div className="flex items-center gap-2">
                        <div className="flex items-center justify-center w-5 h-5 rounded-md ring-1 bg-neutral-100/80 dark:bg-neutral-800/80 ring-neutral-200/50 dark:ring-neutral-700/50">
                          <div className="transition-all duration-300 text-neutral-700 dark:text-neutral-400">
                            <mode.icon className="size-4" />
                          </div>
                        </div>
                        <p className="text-[13px] font-medium tracking-tight text-neutral-700 dark:text-neutral-300">
                          {mode.name}
                        </p>
                        
                        {selectedType === mode.type && (
                          <div className="ml-auto shrink-0">
                            <div className="size-[14px] flex items-center justify-center rounded-full bg-neutral-200/80 dark:bg-neutral-700/80 ring-1 ring-neutral-300/60 dark:ring-neutral-600/60">
                              <svg xmlns="http://www.w3.org/2000/svg" width="24" height="24" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round" className="lucide lucide-check size-2.5 text-neutral-600 dark:text-neutral-300">
                                <path d="M20 6 9 17l-5-5"></path>
                              </svg>
                            </div>
                          </div>
                        )}
                      </div>
                      
                      <p className="text-[11px] leading-[14px] tracking-tight line-clamp-2 text-neutral-400 dark:text-neutral-400">
                        {mode.description}
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