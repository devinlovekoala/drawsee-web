import { useState, useRef, useEffect } from 'react';
import { createPortal } from 'react-dom';
import { AiTaskType } from '@/api/types/flow.types';
import {
  CubeTransparentIcon,
  ChevronDownIcon,
} from '@heroicons/react/24/outline';
import { BookOpenIcon } from 'lucide-react';

interface ModeSelectorProps {
  selectedType: AiTaskType;
  onTypeChange: (type: AiTaskType) => void;
}

const modes = [
  {
    name: '常规问答模式',
    description: '最常规的 AI 生成模式，一问一答。',
    icon: CubeTransparentIcon,
    type: 'general' as AiTaskType
  },
  {
    name: '知识问答模式',
    description: '基于知识库的 AI 生成模式，能识别用户提问中的相关知识点。',
    icon: BookOpenIcon,
    type: 'knowledge' as AiTaskType
  }
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
      
      setPosition({
        top: rect.bottom + window.scrollY + 25,
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
        className="flex items-center space-x-2 px-3 py-2 rounded-xl bg-neutral-200 hover:bg-neutral-300 transition-colors focus:outline-none"
        aria-expanded={isOpen}
        aria-haspopup="true"
      >
        <selectedMode.icon className="w-5 h-5 text-gray-600" />
        <span className="text-xs text-gray-700">{selectedMode.name}</span>
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
                  className="relative flex cursor-pointer select-none items-center rounded-lg text-sm outline-none transition-colors w-full p-0 focus:bg-transparent"
                  tabIndex={-1}
                  data-orientation="vertical"
                  onClick={() => {
                    onTypeChange(mode.type);
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
                  
                  {/* 桌面端视图 */}
                  <div className={`hidden sm:flex relative flex-col rounded-lg border transition-all duration-300 cursor-pointer group bg-gradient-to-br from-white to-neutral-50/80 dark:from-neutral-900 dark:to-neutral-900/95 h-[100px] p-2 ${
                    selectedType === mode.type 
                      ? 'border-neutral-300/80 dark:border-neutral-600/80' 
                      : 'border-neutral-200/60 dark:border-neutral-800/60 hover:border-neutral-300/80 dark:hover:border-neutral-700/80'
                  }`}>
                    <div className={`absolute inset-0 transition-all duration-300 rounded-lg bg-gradient-to-br ${
                      selectedType === mode.type 
                        ? 'from-neutral-100/50 to-neutral-50/30 dark:from-neutral-700/[0.08] dark:to-neutral-800/[0.03]' 
                        : 'from-neutral-400/0 to-neutral-400/0 dark:from-neutral-700/0 dark:to-neutral-700/0 group-hover:from-neutral-400/[0.02] group-hover:to-neutral-400/[0.08] dark:group-hover:from-neutral-600/[0.02] dark:group-hover:to-neutral-600/[0.08]'
                    }`}></div>
                    
                    <div className="relative flex items-center gap-1.5 mb-1 p-1">
                      <div className={`flex items-center justify-center rounded-md ring-1 w-5 h-5 ${
                        selectedType === mode.type 
                          ? 'bg-neutral-100 dark:bg-neutral-800 ring-neutral-300/80 dark:ring-neutral-700' 
                          : 'bg-neutral-100/80 dark:bg-neutral-800/80 ring-neutral-200/50 dark:ring-neutral-700/50 group-hover:bg-neutral-200/90 dark:group-hover:bg-neutral-700/90 group-hover:ring-neutral-300/80 dark:group-hover:ring-neutral-600/80'
                      }`}>
                        <div className={`transition-all duration-300 ${
                          selectedType === mode.type 
                            ? 'text-neutral-800 dark:text-neutral-200 scale-[1.15]' 
                            : 'scale-100 text-neutral-700 dark:text-neutral-400 group-hover:text-neutral-700 dark:group-hover:text-neutral-200 group-hover:scale-[1.15]'
                        }`}>
                          <mode.icon className="size-4" />
                        </div>
                      </div>
                      
                      <p className={`font-medium tracking-tight transition-colors duration-300 truncate max-w-[120px] text-[13px] ${
                        selectedType === mode.type 
                          ? 'text-neutral-800 dark:text-neutral-100' 
                          : 'text-neutral-700 dark:text-neutral-300 group-hover:text-neutral-900 dark:group-hover:text-neutral-50'
                      }`}>
                        {mode.name}
                      </p>
                      
                      {selectedType === mode.type && (
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
                        selectedType === mode.type 
                          ? 'text-neutral-600 dark:text-neutral-300' 
                          : 'text-neutral-400 dark:text-neutral-400 group-hover:text-neutral-600 dark:group-hover:text-neutral-300'
                      }`}>
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