import { useCallback, useState, useRef, useEffect, useContext } from "react";
import { toast } from "sonner";
import { CubeTransparentIcon, ChevronDownIcon } from '@heroicons/react/24/outline';
import { BookOpenIcon } from 'lucide-react';
import { createAiTask } from "@/api/methods/flow.methods.ts";
import type { AiTaskType, CreateAiTaskDTO, NodeType } from '@/api/types/flow.types.ts';
import { FlowContext, FlowContextType } from "../../flow";
import { TempQueryNodeTask } from "../../hooks/useTempQueryNode";

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
  prompt: string;
  setPrompt: React.Dispatch<React.SetStateAction<string>>;
  canInput: boolean;
  canNotInputReason: string | null;
  addTempQueryNodeTask: (task: TempQueryNodeTask, sessionId?: string | null) => void;
  parentIdOfTempQueryNode: string | null;
}

export function FlowInputPanel({
  prompt,
  setPrompt,
  canInput, 
  canNotInputReason,
  addTempQueryNodeTask,
  parentIdOfTempQueryNode
}: FlowInputPanelProps) {
  const [isOpen, setIsOpen] = useState(false);
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
        addTempQueryNodeTask({type: 'create', text: newText});
      }
    } else if (newText.length > 0) {
      // 更新临时节点文本
      addTempQueryNodeTask({type: 'update', text: newText});
    } else if (newText.length === 0) {
      // 如果清空了输入，删除临时节点并重置输入框状态
      addTempQueryNodeTask({type: 'delete'});
      
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
    if (!canInput) {
      toast.error(`当前无法追问，${canNotInputReason as string}`);
      return;
    }
    if (prompt.trim() === "") {
      toast.error("请输入问题");
      return;
    }
    if (!parentIdOfTempQueryNode) {
      toast.error("无法确定追问的节点");
      return;
    }
    const createAiTaskDTO = {
      type: selectedType,
      prompt: prompt,
      promptParams: null,
      convId: convId,
      parentId: parseInt(parentIdOfTempQueryNode)
    } as CreateAiTaskDTO;
    
    createAiTask(createAiTaskDTO).then((response) => {
      toast.success("问题已发送");
      
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
        chat(response.taskId);
      }, 300);
    }).catch((error) => {
      toast.error(`请求失败, ${error.message}`);
    });
  }, [chat, convId, prompt, selectedType, addTempQueryNodeTask, parentIdOfTempQueryNode, canInput, canNotInputReason]);

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
    <div ref={containerRef} className="input-panel-container">
      {/* 模式选择按钮 */}
      <div className={`mode-selector-wrapper ${isOpen ? 'open' : 'closed'}`}>
        <button 
          ref={buttonRef}
          className="mode-selector-button"
          onClick={toggleDropdown}
        >
          <div className="mode-selector-icon-wrapper">
            {selectedMode.icon && <selectedMode.icon className="w-5 h-5" />}
          </div>
          <span className="mode-selector-text">{selectedMode.name}</span>
          <ChevronDownIcon 
            className={`mode-selector-chevron ${isOpen ? 'open' : ''}`}
          />
        </button>
      </div>

      {/* 输入框 */}
      <div className="relative flex items-center justify-center">
        <div 
          ref={inputContainerRef}
          className={`input-container ${
            isExpanded 
              ? isAnimating ? 'animate-expand-width expanded' : 'expanded' 
              : isAnimating ? 'animate-shrink-width collapsed' : 'collapsed'
          }`}
        >
          <textarea 
            id="question-input"
            ref={textareaRef}
            value={prompt}
            onChange={handlePromptChange}
            onKeyDown={handleKeyDown}
            className="input-textarea"
            enterKeyHint="send"
            placeholder={canInput ? "开启新的话题" : canNotInputReason as string}
            style={{ height: '20px' }}
            disabled={!canInput}
          />
          <button 
            onClick={handleSubmit}
            className={`input-send-button ${!canInput ? 'disabled' : ''}`}
            disabled={!canInput}
          >
            <svg xmlns="http://www.w3.org/2000/svg" width="24" height="24" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round" className="input-send-icon">
              <path d="M22 2 11 13"></path>
              <path d="m22 2-7 20-4-9-9-4 20-7z"></path>
            </svg>
          </button>
        </div>
        
        {/* 模式选择下拉菜单 - 直接在输入框上方渲染，不使用Portal */}
        {isOpen && (
          <div 
            ref={dropdownRef}
            className="mode-dropdown animate-slide-in-bottom"
            onClick={(e) => e.stopPropagation()} // 阻止事件冒泡
          >
            <div className="mode-dropdown-content">
              <div className="mode-dropdown-header">
                <h3 className="mode-dropdown-title">选择对话模式</h3>
              </div>
              <div className="mode-dropdown-body">
                {chatModes.map((mode) => (
                  <div
                    key={mode.type}
                    onClick={() => handleModeSelect(mode)}
                    className={`mode-option ${selectedType === mode.type ? 'selected' : ''}`}
                  >
                    <div className="mode-option-icon-wrapper">
                      {mode.icon && <mode.icon className="mode-option-icon" />}
                    </div>
                    <div className="mode-option-info">
                      <p className="mode-option-name">{mode.name}</p>
                      <p className="mode-option-description">{mode.description}</p>
                    </div>
                    {selectedType === mode.type && (
                      <div className="mode-option-check">
                        <div className="mode-option-check-wrapper">
                          <svg xmlns="http://www.w3.org/2000/svg" width="16" height="16" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round" className="mode-option-check-icon">
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