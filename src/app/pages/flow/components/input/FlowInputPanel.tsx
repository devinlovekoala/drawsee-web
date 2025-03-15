import { useCallback, useState, useRef, useEffect, useContext } from "react";
import { createPortal } from 'react-dom';
import { toast } from "sonner";
import { CubeTransparentIcon, ChevronDownIcon } from '@heroicons/react/24/outline';
import { BookOpenIcon } from 'lucide-react';
import { createAiTask } from "@/api/methods/flow.methods.ts";
import type { AiTaskType, CreateAiTaskDTO, NodeType } from '@/api/types/flow.types.ts';
import { FlowContext, FlowContextType } from "../../flow";

// 定义动画样式
const animationStyles = `
@keyframes slideInFromTop {
  from {
    transform: translateY(-10px);
    opacity: 0;
  }
  to {
    transform: translateY(0);
    opacity: 1;
  }
}

@keyframes slideInFromBottom {
  from {
    transform: translateY(10px);
    opacity: 0;
  }
  to {
    transform: translateY(0);
    opacity: 1;
  }
}

@keyframes fadeIn {
  from {
    opacity: 0;
  }
  to {
    opacity: 1;
  }
}

@keyframes expandWidth {
  from {
    width: 60%;
  }
  to {
    width: 100%;
  }
}

@keyframes shrinkWidth {
  from {
    width: 100%;
  }
  to {
    width: 60%;
  }
}

.animate-slide-in-top {
  animation: slideInFromTop 0.2s ease-in-out, fadeIn 0.2s ease-in-out;
}

.animate-slide-in-bottom {
  animation: slideInFromBottom 0.2s ease-in-out, fadeIn 0.2s ease-in-out;
}

.animate-expand-width {
  animation: expandWidth 0.3s ease-out forwards;
}

.animate-shrink-width {
  animation: shrinkWidth 0.3s ease-out forwards;
}
`;

// 定义可用的对话模式，与 ModeSelector.tsx 保持一致
const chatModes = [
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

interface FlowInputPanelProps {
  canInput: boolean;
  createTempQueryNode: (text: string) => void;
  updateTempQueryNodeText: (text: string) => void;
  removeTempQueryNode: () => void;
  getParentNodeId: () => string | null;
}

export function FlowInputPanel({ 
  canInput, 
  createTempQueryNode, 
  updateTempQueryNodeText, 
  removeTempQueryNode,
  getParentNodeId
}: FlowInputPanelProps) {
  const [isOpen, setIsOpen] = useState(false);
  const [prompt, setPrompt] = useState('');
  const [selectedType, setSelectedType] = useState<AiTaskType>('general');
  const [isExpanded, setIsExpanded] = useState(false);
  const [isAnimating, setIsAnimating] = useState(false);
  const containerRef = useRef<HTMLDivElement>(null);
  const buttonRef = useRef<HTMLButtonElement>(null);
  const dropdownRef = useRef<HTMLDivElement>(null);
  const textareaRef = useRef<HTMLTextAreaElement>(null);
  const inputContainerRef = useRef<HTMLDivElement>(null);
  const selectedMode = chatModes.find(mode => mode.type === selectedType) || chatModes[0];

  const {chat, convId} = useContext<FlowContextType>(FlowContext);
  
  // 处理输入变化
  const handlePromptChange = (e: React.ChangeEvent<HTMLTextAreaElement>) => {
    const newText = e.target.value;
    setPrompt(newText);
    
    // 如果是第一次输入，触发输入框扩展动画
    if (newText.length === 1 && prompt.length === 0) {
      setIsExpanded(true);
      
      // 创建临时查询节点
      if (canInput) {
        createTempQueryNode(newText);
      }
    } else if (newText.length > 0) {
      // 更新临时节点文本
      updateTempQueryNodeText(newText);
    } else if (newText.length === 0) {
      // 如果清空了输入，删除临时节点并重置输入框状态
      removeTempQueryNode();
      
      // 添加收缩动画
      setIsAnimating(true);
      setTimeout(() => {
        setIsExpanded(false);
        setTimeout(() => {
          setIsAnimating(false);
        }, 300); // 动画持续时间
      }, 10);
    }
  };

  // 自动调整文本框高度
  useEffect(() => {
    if (textareaRef.current) {
      textareaRef.current.style.height = '20px';
      const scrollHeight = textareaRef.current.scrollHeight;
      textareaRef.current.style.height = scrollHeight + 'px';
    }
  }, [prompt]);

  // 全局点击事件监听，用于关闭下拉菜单
  useEffect(() => {
    function handleGlobalClick(event: MouseEvent) {
      if (
        isOpen && 
        dropdownRef.current && 
        !dropdownRef.current.contains(event.target as Node) &&
        buttonRef.current && 
        !buttonRef.current.contains(event.target as Node)
      ) {
        setIsOpen(false);
      }
    }
    
    // 使用捕获阶段监听，确保在事件冒泡被阻止前捕获到事件
    window.addEventListener('click', handleGlobalClick, true);
    return () => {
      window.removeEventListener('click', handleGlobalClick, true);
    };
  }, [isOpen]);

  const handleSubmit = useCallback(() => {
    if (prompt.trim() === "") {
      toast.error("请输入问题");
      return;
    }
    
    // 获取父节点ID
    const parentId = getParentNodeId();
    if (!parentId) {
      toast.error("无法确定追问的节点");
      return;
    }
    
    const createAiTaskDTO = {
      type: selectedType,
      prompt: prompt,
      promptParams: null,
      convId: convId,
      parentId: parseInt(parentId)
    } as CreateAiTaskDTO;
    
    createAiTask(createAiTaskDTO).then((response) => {
      toast.success("问题已发送");
      
      // 删除临时节点
      removeTempQueryNode();
      
      // 重置状态并添加收缩动画
      setPrompt('');
      setIsAnimating(true);
      setTimeout(() => {
        setIsExpanded(false);
        setTimeout(() => {
          setIsAnimating(false);
        }, 300); // 动画持续时间
      }, 10);
      
      // 发送聊天请求
      setTimeout(() => {
        chat(convId, response.taskId);
      }, 300);
    });
  }, [chat, convId, prompt, selectedType, removeTempQueryNode, getParentNodeId]);

  const handleKeyDown = (e: React.KeyboardEvent) => {
    if (e.key === 'Enter' && !e.shiftKey) {
      e.preventDefault();
      handleSubmit();
    }
  };

  const handleModeSelect = (mode: typeof chatModes[0]) => {
    setSelectedType(mode.type);
    setIsOpen(false);
  };

  const toggleDropdown = (e: React.MouseEvent) => {
    e.stopPropagation(); // 阻止事件冒泡
    setIsOpen(!isOpen);
  };

  return (
    <div ref={containerRef} className="sm:w-96 fixed z-50 overflow-visible m-0 w-full will-change-content duration-200 bottom-safe sm:absolute sm:mx-0 sm:mb-2 bottom center -translate-y-full -translate-x-1/2" style={{ pointerEvents: 'all' }}>
      <style>{animationStyles}</style>
      
      {/* 模式选择按钮 */}
      <div className={`absolute -top-12 left-0 flex w-full justify-center transition-transform duration-200 ${isOpen ? '-translate-y-4' : 'translate-y-0'}`}>
        <button 
          ref={buttonRef}
          className="mode-selector-button flex items-center space-x-2 px-3 py-2 rounded-xl bg-neutral-100 hover:bg-neutral-200 transition-colors focus:outline-none ring-1 ring-neutral-200"
          onClick={toggleDropdown}
        >
          <div className="flex items-center justify-center w-5 h-5 text-gray-600">
            {selectedMode.icon && <selectedMode.icon className="w-5 h-5" />}
          </div>
          <span className="text-xs text-gray-700">{selectedMode.name}</span>
          <ChevronDownIcon 
            className={`w-4 h-4 text-gray-500 transition-transform duration-200 ${isOpen ? 'transform rotate-180' : ''}`}
          />
        </button>
      </div>

      {/* 输入框 */}
      <div className="relative flex items-center justify-center">
        <div 
          ref={inputContainerRef}
          className={`border border-neutral-200/40 bg-white text-neutral-950 flex gap-1 items-center relative ${
            isExpanded 
              ? isAnimating ? 'animate-expand-width w-full' : 'w-full' 
              : isAnimating ? 'animate-shrink-width w-3/5' : 'w-3/5'
          } py-2 px-2.5 duration-200 rounded-xl`} 
          style={{ 
            transform: 'none', 
            boxShadow: 'rgba(99, 102, 241, 0) 0px 0px 0px 1px', 
            opacity: 1
          }}
        >
          <textarea 
            id="question-input"
            ref={textareaRef}
            value={prompt}
            onChange={handlePromptChange}
            onKeyDown={handleKeyDown}
            className="ml-2 placeholder:text-neutral-400 text-neutral-900 bg-transparent placeholder:text-sm text-sm w-full resize-none outline-none"
            enterKeyHint="send"
            placeholder={canInput ? "开启新的话题" : "当前节点不支持追问"}
            style={{ height: '20px' }}
            disabled={!canInput}
          />
          <button 
            onClick={handleSubmit}
            className={`group relative flex items-center justify-center h-8 aspect-square ${!canInput ? 'opacity-50 cursor-not-allowed' : ''}`}
            disabled={!canInput}
          >
            <svg xmlns="http://www.w3.org/2000/svg" width="24" height="24" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round" className="size-5 text-neutral-400 group-hover:text-indigo-500 transition-colors">
              <path d="M22 2 11 13"></path>
              <path d="m22 2-7 20-4-9-9-4 20-7z"></path>
            </svg>
          </button>
        </div>
        
        {/* 模式选择下拉菜单 - 直接在输入框上方渲染，不使用Portal */}
        {isOpen && (
          <div 
            ref={dropdownRef}
            className="absolute bottom-full mb-2 left-0 w-full animate-slide-in-bottom z-10"
            onClick={(e) => e.stopPropagation()} // 阻止事件冒泡
          >
            <div className="bg-white rounded-xl shadow-lg ring-1 ring-neutral-200 overflow-hidden">
              <div className="p-2 border-b border-neutral-100">
                <h3 className="text-sm font-medium text-center text-neutral-800">选择对话模式</h3>
              </div>
              <div className="p-2">
                {chatModes.map((mode) => (
                  <div
                    key={mode.type}
                    onClick={() => handleModeSelect(mode)}
                    className={`flex items-center gap-3 p-3 rounded-lg cursor-pointer transition-colors ${
                      selectedType === mode.type 
                        ? 'bg-neutral-100' 
                        : 'hover:bg-neutral-50'
                    }`}
                  >
                    <div className="flex items-center justify-center w-8 h-8 rounded-full bg-neutral-200">
                      {mode.icon && <mode.icon className="w-5 h-5 text-neutral-700" />}
                    </div>
                    <div>
                      <p className="text-sm font-medium text-neutral-800">{mode.name}</p>
                      <p className="text-xs text-neutral-500">{mode.description}</p>
                    </div>
                    {selectedType === mode.type && (
                      <div className="ml-auto">
                        <div className="w-5 h-5 flex items-center justify-center rounded-full bg-indigo-100">
                          <svg xmlns="http://www.w3.org/2000/svg" width="16" height="16" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round" className="text-indigo-600">
                            <path d="M20 6 9 17l-5-5"></path>
                          </svg>
                        </div>
                      </div>
                    )}
                  </div>
                ))}
              </div>
            </div>
          </div>
        )}
      </div>
    </div>
  );
} 