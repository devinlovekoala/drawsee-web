import { useCallback, useState, useRef, useEffect, useMemo, forwardRef, useImperativeHandle } from "react";
import { toast } from "sonner";
import { XMarkIcon } from '@heroicons/react/24/outline';
import { createAiTask } from "@/api/methods/flow.methods.ts";
import type { AiTaskType, CreateAiTaskDTO } from '@/api/types/flow.types.ts';
import { TempQueryNodeTask } from "../../hooks/useTempQueryNode";
import { useFlowContext } from "@/app/contexts/FlowContext";
import { useAppContext } from "@/app/contexts/AppContext";
import type { CircuitDesign } from '@/api/types/circuit.types';
import '@/app/components/text-selection/TextSelectionToolbar.css';
import { Node as FlowNode } from "@xyflow/react";
import { DeepSeek, Qwen } from "./ModelIcons";
import { DropdownOption, SelectDropdown } from "./SelectDropdown";
import { useLocation } from 'react-router-dom';

interface FlowInputPanelProps {
  prompt: string;
  setPrompt: React.Dispatch<React.SetStateAction<string>>;
  canInput: boolean;
  canNotInputReason: string | null;
  addTempQueryNodeTask: (task: TempQueryNodeTask, sessionId?: string | null) => void;
  parentIdOfTempQueryNode: string | null;
  selectedNode: FlowNode | null;
}

export type ModelType = 'deepseekV3' | 'qwen';

export interface FlowInputPanelHandle {
  applySuggestion: (text: string) => void;
}

export const FlowInputPanel = forwardRef<FlowInputPanelHandle, FlowInputPanelProps>(function FlowInputPanel(
{
  prompt,
  setPrompt,
  canInput, 
  canNotInputReason,
  addTempQueryNodeTask,
  parentIdOfTempQueryNode,
  selectedNode
}: FlowInputPanelProps,
ref) {

  // 新增模型选项
  const modelOptions = useMemo<DropdownOption[]>(() => [
    {
      name: 'Qwen',
      description: 'Qwen 大语言模型',
      icon: Qwen.Color,
      type: 'qwen' satisfies ModelType
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
  const [selectedModel, setSelectedModel] = useState<ModelType>('deepseekV3');
  const containerRef = useRef<HTMLDivElement>(null);
  const textareaRef = useRef<HTMLTextAreaElement>(null);
  const inputContainerRef = useRef<HTMLDivElement>(null);

  const {chat, convId} = useFlowContext();
  
  const {handleNewChat, quoteText, setQuoteText, handleAiTaskCountPlus} = useAppContext();
  
  const location = useLocation();
  const classId = location.state?.classId as string || null;
  
  const [isProcessing, setIsProcessing] = useState(false);
  const [pendingSubmit, setPendingSubmit] = useState(false);
  
  const determineTaskType = useCallback((): AiTaskType => {
    if (!selectedNode) return 'GENERAL';
    const nodeType = selectedNode.type as string | undefined;
    const nodeSubtype = (selectedNode.data as Record<string, unknown> | undefined)?.subtype as string | undefined;

    const isCircuitNode = (nodeType === 'answer' && nodeSubtype === 'circuit-analyze') ||
      nodeSubtype === 'circuit-canvas' ||
      nodeSubtype === 'circuit-analyze' ||
      nodeType === 'circuit-canvas' ||
      nodeType === 'circuit-analyze';

    if (isCircuitNode) {
      return 'CIRCUIT_DETAIL';
    }

    const isPdfNode = nodeType === 'PDF_ANALYSIS_POINT' ||
      nodeType === 'PDF_ANALYSIS_DETAIL' ||
      nodeType === 'pdf-circuit-point' ||
      nodeType === 'pdf-circuit-detail' ||
      nodeSubtype === 'PDF_ANALYSIS_POINT' ||
      nodeSubtype === 'PDF_ANALYSIS_DETAIL' ||
      nodeSubtype === 'pdf-circuit-point' ||
      nodeSubtype === 'pdf-circuit-detail';

    if (isPdfNode) {
      return 'PDF_CIRCUIT_ANALYSIS_DETAIL';
    }

    return 'GENERAL';
  }, [selectedNode]);

  const buildPromptWithNodeContext = useCallback((basePrompt: string): string => {
    if (!selectedNode) return basePrompt;
    const nodeType = selectedNode.type as string | undefined;
    const nodeData = selectedNode.data as Record<string, unknown> | undefined;
    const rawText = typeof nodeData?.text === 'string' ? nodeData.text.trim() : '';
    const nodeTitle = typeof nodeData?.title === 'string' ? nodeData.title.trim() : '';
    const rawSubtype = typeof nodeData?.subtype === 'string' ? nodeData.subtype : undefined;
    const displayTitle = nodeTitle || (rawText ? rawText.slice(0, 30) : '');
    const circuitDesign = nodeData?.circuitDesign as CircuitDesign | undefined;
    const isCircuitCanvas = nodeType === 'circuit-canvas' || rawSubtype === 'circuit-canvas';

    const isPdfPoint = nodeType === 'PDF_ANALYSIS_POINT' || nodeType === 'pdf-circuit-point' ||
      rawSubtype === 'PDF_ANALYSIS_POINT' || rawSubtype === 'pdf-circuit-point';
    const isPdfDetail = nodeType === 'PDF_ANALYSIS_DETAIL' || nodeType === 'pdf-circuit-detail' ||
      rawSubtype === 'PDF_ANALYSIS_DETAIL' || rawSubtype === 'pdf-circuit-detail';

    if (isCircuitCanvas && circuitDesign) {
      const elementCount = circuitDesign.elements?.length ?? 0;
      const connectionCount = circuitDesign.connections?.length ?? 0;
      const metaTitle = circuitDesign.metadata?.title || displayTitle || '当前电路图';
      return `请基于以下电路设计回答追问：\n电路名称：${metaTitle}\n元件/连线：${elementCount} / ${connectionCount}\n问题：${basePrompt}`;
    }

    if ((isPdfPoint || isPdfDetail) && rawText) {
      return `请基于以下PDF分析分点继续回答用户问题：\n分点标题：${displayTitle || '未命名分点'}\n分点内容：${rawText}\n\n用户追问：${basePrompt}`;
    }

    return basePrompt;
  }, [selectedNode]);
  
  // 处理输入变化
  const handlePromptChange = (e: React.ChangeEvent<HTMLTextAreaElement>) => {
    const newText = e.target.value;
    setPrompt(newText);
    // 如果是第一次输入，触发输入框扩展动画
    if (newText.length > 0 && prompt.length === 0) {
      setIsExpanded(true);
      
      // 创建临时查询节点
      if (canInput) {
        addTempQueryNodeTask({type: 'create', text: newText, mode: determineTaskType()});
      }
    } else if (newText.length > 0) {
      // 更新临时节点文本
      addTempQueryNodeTask({type: 'update', text: newText, mode: determineTaskType()});
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

  const submitWithParentId = useCallback((parentId: string) => {
    setIsProcessing(true);
    
    // 构建最终提交的问题文本，如果有引用则包含引用内容，并叠加节点上下文
    let finalPrompt = prompt;
    if (quoteText) {
      finalPrompt = `对于之前内容中的：\n\n>${quoteText.replace(/\n/g, ' ')}\n\n我的问题是：${prompt}`;
    }
    finalPrompt = buildPromptWithNodeContext(finalPrompt);
    
    const taskType: AiTaskType = determineTaskType();
    
    // 最终选择的模型
    const finalModel = selectedModel; // 所有模式都使用选择的模型

    const createAiTaskDTO = {
      type: taskType,
      prompt: finalPrompt,
      promptParams: {},
      convId: convId,
      parentId: parseInt(parentId, 10),
      model: finalModel, // 使用选择的模型
      classId: classId // 传递班级ID
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
        if (convId != null) {
          handleNewChat(convId);
        }
        chat(response.taskId);
      }, 300);
    }).catch((error) => {
      toast.error(`请求失败, ${error.message}`);
    }).finally(() => {
      setIsProcessing(false);
    });
  }, [
    prompt, quoteText, selectedModel, convId, classId, buildPromptWithNodeContext,
    determineTaskType, handleAiTaskCountPlus, setQuoteText, setPrompt, setIsExpanded,
    setIsAnimating, handleNewChat, chat
  ]);

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
      // 新建会话后parentId可能稍后才可用，自动挂起后在可用时发送
      setPendingSubmit(true);
      addTempQueryNodeTask({type: 'create', text: prompt, mode: determineTaskType()});
      return;
    }
    submitWithParentId(parentIdOfTempQueryNode);
  }, [isProcessing, canInput, canNotInputReason, prompt, parentIdOfTempQueryNode, addTempQueryNodeTask, determineTaskType, submitWithParentId]);

  useEffect(() => {
    if (!pendingSubmit || isProcessing) return;
    if (!canInput || prompt.trim() === '') {
      setPendingSubmit(false);
      return;
    }
    if (!parentIdOfTempQueryNode) return;
    setPendingSubmit(false);
    submitWithParentId(parentIdOfTempQueryNode);
  }, [pendingSubmit, isProcessing, canInput, prompt, parentIdOfTempQueryNode, submitWithParentId]);

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

  useImperativeHandle(ref, () => ({
    applySuggestion: (text: string) => {
      const trimmed = text.trim();
      if (!trimmed) return;
      const hadText = prompt.trim().length > 0;
      setPrompt(trimmed);
      setIsExpanded(true);
      requestAnimationFrame(() => {
        textareaRef.current?.focus();
      });
      if (!canInput) {
        return;
      }
      const taskType = determineTaskType();
      if (hadText) {
        addTempQueryNodeTask({type: 'update', text: trimmed, mode: taskType});
      } else {
        addTempQueryNodeTask({type: 'create', text: trimmed, mode: taskType});
      }
    }
  }), [addTempQueryNodeTask, canInput, determineTaskType, prompt, setPrompt]);

  return (
    <div ref={containerRef} className="input-panel-container"
      style={quoteText ? {
        transform: "translateY(15%) translateX(-50%)"
      } : {}}
    >
      {/* 选择器按钮区域 */}
      <div className={`selectors-container flex flex-row justify-center gap-2`}>
        {/* 移除知识问答模式开关 */}
        
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
});
