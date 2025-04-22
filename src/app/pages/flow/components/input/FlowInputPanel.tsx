import { useCallback, useState, useRef, useEffect, useMemo } from "react";
import { toast } from "sonner";
import { XMarkIcon } from '@heroicons/react/24/outline';
import { createAiTask } from "@/api/methods/flow.methods.ts";
import type { AiTaskType, CreateAiTaskDTO } from '@/api/types/flow.types.ts';
import { TempQueryNodeTask } from "../../hooks/useTempQueryNode";
import { useFlowContext } from "@/app/contexts/FlowContext";
import { useAppContext } from "@/app/contexts/AppContext";
import '@/app/components/text-selection/TextSelectionToolbar.css';
import { Node as FlowNode } from "@xyflow/react";
import { DeepSeek, Doubao } from "./ModelIcons";
import { DropdownOption, SelectDropdown } from "./SelectDropdown";
import { Switch } from "@/app/components/ui/switch";

interface FlowInputPanelProps {
  prompt: string;
  setPrompt: React.Dispatch<React.SetStateAction<string>>;
  canInput: boolean;
  canNotInputReason: string | null;
  addTempQueryNodeTask: (task: TempQueryNodeTask, sessionId?: string | null) => void;
  parentIdOfTempQueryNode: string | null;
  selectedNode: FlowNode | null;
}

export type ModelType = 'deepseekV3' | 'doubao';

export function FlowInputPanel({
  prompt,
  setPrompt,
  canInput, 
  canNotInputReason,
  addTempQueryNodeTask,
  parentIdOfTempQueryNode
}: FlowInputPanelProps) {

  // 新增模型选项
  const modelOptions = useMemo<DropdownOption[]>(() => [
    {
      name: '豆包',
      description: '豆包大语言模型',
      icon: Doubao.Color,
      type: 'doubao' satisfies ModelType
    },
    {
      name: 'DeepSeekV3',
      description: 'DeepSeekV3大语言模型',
      icon: DeepSeek.Color,
      type: 'deepseekV3' satisfies ModelType
    }
  ], []);

  const [isExpanded, setIsExpanded] = useState(false);
  const [isAnimating, setIsAnimating] = useState(false);
  const [isKnowledgeMode, setIsKnowledgeMode] = useState(false);
  const [selectedModel, setSelectedModel] = useState<ModelType>('doubao');
  const containerRef = useRef<HTMLDivElement>(null);
  const textareaRef = useRef<HTMLTextAreaElement>(null);
  const inputContainerRef = useRef<HTMLDivElement>(null);

  const {chat, convId} = useFlowContext();
  
  const {handleNewChat, quoteText, setQuoteText, handleAiTaskCountPlus} = useAppContext();
  
  const [isProcessing, setIsProcessing] = useState(false);
  
  // 处理输入变化
  const handlePromptChange = (e: React.ChangeEvent<HTMLTextAreaElement>) => {
    const newText = e.target.value;
    setPrompt(newText);
    // 如果是第一次输入，触发输入框扩展动画
    if (newText.length > 0 && prompt.length === 0) {
      setIsExpanded(true);
      
      // 创建临时查询节点
      if (canInput) {
        addTempQueryNodeTask({type: 'create', text: newText, mode: 'GENERAL'});
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

  const handleSubmit = useCallback(() => {
    if (isProcessing) return;
    
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

    setIsProcessing(true);
    
    // 构建最终提交的问题文本，如果有引用则包含引用内容
    let finalPrompt = prompt;
    if (quoteText) {
      finalPrompt = `对于之前内容中的：\n\n>${quoteText.replace(/\n/g, ' ')}\n\n我的问题是：${prompt}`;
    }
    
    // 根据知识问答模式开关决定任务类型
    const taskType: AiTaskType = isKnowledgeMode ? 'KNOWLEDGE' : 'GENERAL';
    
    // 最终选择的模型
    let finalModel = selectedModel; // 所有模式都使用选择的模型

    const createAiTaskDTO = {
      type: taskType,
      prompt: finalPrompt,
      promptParams: {},
      convId: convId,
      parentId: parseInt(parentIdOfTempQueryNode),
      model: finalModel // 使用选择的模型
    } as CreateAiTaskDTO;
    
    createAiTask(createAiTaskDTO).then((response) => {
      toast.success("问题已发送");
      handleAiTaskCountPlus();

      // 清空引用文本
      if (quoteText) {
        setQuoteText(null);
      }
      
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
        handleNewChat(convId);
        chat(response.taskId);
      }, 300);
    }).catch((error) => {
      toast.error(`请求失败, ${error.message}`);
    }).finally(() => {
      setIsProcessing(false);
    });
  }, [canInput, prompt, parentIdOfTempQueryNode, isKnowledgeMode, selectedModel, convId, canNotInputReason, quoteText, setQuoteText, setPrompt, handleNewChat, chat, isProcessing, handleAiTaskCountPlus]);

  const handleKeyDown = (e: React.KeyboardEvent) => {
    if (e.key === 'Enter' && !e.shiftKey) {
      e.preventDefault();
      handleSubmit();
    }
  };

  // 处理模型选择
  const handleModelSelect = (option: DropdownOption) => {
    setSelectedModel(option.type as ModelType);
  };

  // 处理引用文本显示，超过15个字符显示省略号
  const displayQuoteText = useCallback((text: string) => {
    if (!text) return '';
    return text.length <= 15 ? text : text.substring(0, 15) + '...';
  }, []);

  // 清除引用文本
  const clearQuoteText = useCallback(() => {
    setQuoteText(null);
  }, [setQuoteText]);

  return (
    <div ref={containerRef} className="input-panel-container"
      style={quoteText ? {
        transform: "translateY(15%) translateX(-50%)"
      } : {}}
    >
      {/* 选择器按钮区域 */}
      <div className={`selectors-container flex flex-row justify-center gap-2`}>
        {/* 知识问答模式开关 */}
        <Switch
          label="知识问答模式"
          checked={isKnowledgeMode}
          onChange={setIsKnowledgeMode}
        />
        
        {/* 模型选择器 */}
        <SelectDropdown
          options={modelOptions}
          selectedType={selectedModel}
          onSelect={handleModelSelect}
          buttonLabel={modelOptions.find(model => model.type === selectedModel)?.name || '默认模型'}
          dropdownTitle="选择使用模型"
        />
      </div>

      {/* 输入框 */}
      <div className="relative flex flex-col items-center justify-center">
        {/* 引用文本区域 */}
        {quoteText && (
          <div className={`quote-container ${
              isExpanded 
                ? isAnimating ? 'animate-expand-width expanded' : 'expanded' 
                : isAnimating ? 'animate-shrink-width collapsed' : 'collapsed'
              }`}
          >
            <div className="quote-bar"></div>
            <div className="quote-text-wrapper">
              <div className="quote-text text-ellipsis">
                引用：{displayQuoteText(quoteText)}
              </div>
              <button 
                onClick={clearQuoteText}
                className="quote-close"
                title="清除引用"
              >
                <XMarkIcon className="w-5 h-5" />
              </button>
            </div>
          </div>
        )}
        
        <div 
          ref={inputContainerRef}
          className={`input-container ${
            isExpanded 
              ? isAnimating ? 'animate-expand-width expanded' : 'expanded' 
              : isAnimating ? 'animate-shrink-width collapsed' : 'collapsed'
          } shadow-[0_0_0_1px_rgba(0,0,0,0.1)]`}
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
            disabled={!canInput || isProcessing}
          >
            {isProcessing ? (
              <div className="animate-spin h-4 w-4 border-2 border-neutral-500 rounded-full border-t-transparent"></div>
            ) : (
              <svg xmlns="http://www.w3.org/2000/svg" width="24" height="24" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round" className="input-send-icon">
                <path d="M22 2 11 13"></path>
                <path d="m22 2-7 20-4-9-9-4 20-7z"></path>
              </svg>
            )}
          </button>
        </div>
      </div>
    </div>
  );
} 