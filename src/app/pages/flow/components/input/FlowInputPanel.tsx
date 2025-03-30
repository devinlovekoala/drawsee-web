import { useCallback, useState, useRef, useEffect, useMemo } from "react";
import { toast } from "sonner";
import { XMarkIcon } from '@heroicons/react/24/outline';
import { BookOpenIcon, CircuitBoardIcon, CodeXmlIcon, MessageCircleIcon, TargetIcon } from 'lucide-react';
import { createAiTask } from "@/api/methods/flow.methods.ts";
import type { AiTaskType, CreateAiTaskDTO } from '@/api/types/flow.types.ts';
import { TempQueryNodeTask } from "../../hooks/useTempQueryNode";
import { useFlowContext } from "@/app/contexts/FlowContext";
import { useAppContext } from "@/app/contexts/AppContext";
import '@/app/components/text-selection/TextSelectionToolbar.css';
import { Node as FlowNode } from "@xyflow/react";
import { DeepSeek, Doubao } from "./ModelIcons";
import { DropdownOption, SelectDropdown } from "./SelectDropdown";
import CircuitAnalysisModal from "@/components/circuit/modal/CircuitAnalysisModal";

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
  selectedNode,
  prompt,
  setPrompt,
  canInput, 
  canNotInputReason,
  addTempQueryNodeTask,
  parentIdOfTempQueryNode
}: FlowInputPanelProps) {

  const chatModes = useMemo(() => {
    const defaultModes = [
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
        name: '目标解析模式',
        description: '基于目标解析引擎，能够对用户目标进行有效拆解。',
        icon: TargetIcon,
        type: 'planner' satisfies AiTaskType
      },
      {
        name: '网页生成模式',
        description: '基于网页生成引擎，能够基于用户提问生成可预览的html网页。',
        icon: CodeXmlIcon,
        type: 'html-maker' satisfies AiTaskType
      },
      {
        name: '电路分析模式',
        description: '基于电路分析引擎，能够基于用户输入的电路图，生成电路分析结果。',
        icon: CircuitBoardIcon,
        type: 'circuit-analyze' satisfies AiTaskType
      }
    ];
    if (selectedNode?.data.subtype === 'planner-split') {
      // 把planner模式排在第一位
      const plannerMode = defaultModes.find(mode => mode.type === 'planner');
      if (plannerMode) {
        return [
          plannerMode,
          ...defaultModes.filter(mode => mode.type !== 'planner')
        ];
      }
    }
    if (selectedNode?.data.subtype === 'html-maker') {
      // 把html-maker模式排在第一位
      const htmlMakerMode = defaultModes.find(mode => mode.type === 'html-maker');
      if (htmlMakerMode) {
        return [
          htmlMakerMode,
          ...defaultModes.filter(mode => mode.type !== 'html-maker')
        ];
      }
    }
    if (selectedNode?.data.subtype === 'circuit-analyze') {
      // 把circuit-analyze模式排在第一位
      const circuitAnalyzeMode = defaultModes.find(mode => mode.type === 'circuit-analyze');
      if (circuitAnalyzeMode) {
        return [
          circuitAnalyzeMode,
          ...defaultModes.filter(mode => mode.type !== 'circuit-analyze')
        ];
      }
    }
    return defaultModes;
  }, [selectedNode]);

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
  const [selectedType, setSelectedType] = useState<AiTaskType>(chatModes[0].type as AiTaskType);
  const [selectedModel, setSelectedModel] = useState<ModelType>('doubao');
  const containerRef = useRef<HTMLDivElement>(null);
  const textareaRef = useRef<HTMLTextAreaElement>(null);
  const inputContainerRef = useRef<HTMLDivElement>(null);
  
  // 电路分析模态框状态
  const [isCircuitModalOpen, setIsCircuitModalOpen] = useState(false);

  const {chat, convId} = useFlowContext();
  const {handleNewChat, quoteText, setQuoteText, handleAiTaskCountPlus} = useAppContext();
  
  const [isProcessing, setIsProcessing] = useState(false);
  
  // 当selectedNode发生变化时，更新selectedType
  useEffect(() => {
    if (selectedNode?.data.subtype === 'planner-split') {
      setSelectedType('planner');
    } else if (selectedNode?.data.subtype === 'html-maker') {
      setSelectedType('html-maker');
    } else if (selectedNode?.data.subtype === 'circuit-analyze') {
      setSelectedType('circuit-analyze');
    } else {
      setSelectedType('general');
    }
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
        addTempQueryNodeTask({type: 'create', text: newText, mode: selectedType});
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
    
    // 如果是电路分析模式，打开电路分析模态框
    if (selectedType === 'circuit-analyze') {
      setIsCircuitModalOpen(true);
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
    // 最终选择的模型
    let finalModel = null;
    if (selectedType === 'general' || selectedType === 'knowledge') {
      finalModel = selectedModel;
    }

    const createAiTaskDTO = {
      type: selectedType,
      prompt: finalPrompt,
      promptParams: null,
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
        if (convId) {
          handleNewChat(convId);
          chat(response.taskId);
        } else {
          toast.error('会话ID不存在');
        }
      }, 300);
    }).catch((error) => {
      toast.error(`请求失败, ${error.message}`);
    }).finally(() => {
      setIsProcessing(false);
    });
  }, [canInput, prompt, parentIdOfTempQueryNode, selectedType, selectedModel, convId, canNotInputReason, quoteText, setQuoteText, setPrompt, handleNewChat, chat, isProcessing, isCircuitModalOpen]);

  const handleKeyDown = (e: React.KeyboardEvent) => {
    if (e.key === 'Enter' && !e.shiftKey) {
      e.preventDefault();
      handleSubmit();
    }
  };

  // 处理模式选择
  const handleModeSelect = (option: DropdownOption) => {
    setSelectedType(option.type as AiTaskType);
  };

  // 处理模型选择
  const handleModelSelect = (option: DropdownOption) => {
    setSelectedModel(option.type as ModelType);
  };
  
  // 处理电路分析提交
  const handleCircuitSubmit = useCallback((circuitId: string, circuitPrompt: string) => {
    if (!canInput) {
      toast.error(`当前无法追问，${canNotInputReason as string}`);
      return;
    }
    if (!parentIdOfTempQueryNode) {
      toast.error("无法确定追问的节点");
      return;
    }

    setIsProcessing(true);
    
    const createAiTaskDTO = {
      type: 'circuit-analyze',
      prompt: circuitPrompt,
      promptParams: {
        circuit_id: circuitId
      },
      convId: convId,
      parentId: parseInt(parentIdOfTempQueryNode),
      model: null
    } as CreateAiTaskDTO;
    
    createAiTask(createAiTaskDTO).then((response) => {
      toast.success("电路分析请求已发送");
      handleAiTaskCountPlus();
      
      // 发送聊天请求
      setTimeout(() => {
        if (convId) {
          handleNewChat(convId);
          chat(response.taskId);
        } else {
          toast.error('会话ID不存在');
        }
      }, 300);
    }).catch((error) => {
      toast.error(`请求失败, ${error.message}`);
    }).finally(() => {
      setIsProcessing(false);
    });
  }, [canInput, parentIdOfTempQueryNode, convId, canNotInputReason, handleNewChat, chat, handleAiTaskCountPlus]);

  // 确定提交按钮文本
  const getSubmitButtonText = () => {
    if (isProcessing) return "处理中...";
    if (selectedType === 'circuit-analyze') return "打开电路绘图工具";
    return "发送";
  };

  return (
    <>
      <div ref={containerRef} className={`flow-input-panel ${isAnimating ? 'animating' : ''} ${isExpanded ? 'expanded' : ''}`}>
        <div ref={inputContainerRef} className="px-4 py-3 relative bg-white/80 backdrop-blur-xl min-h-[60px] shadow-md rounded-2xl border border-neutral-300/60 overflow-visible">
          <div className="flex items-start gap-3">
            {/* 模式选择器下拉菜单 */}
            <div className="mode-selector-wrapper">
              <SelectDropdown 
                options={chatModes}
                selectedOption={chatModes.find(mode => mode.type === selectedType) || chatModes[0]}
                onSelect={handleModeSelect}
              />
            </div>

            {/* 输入框 */}
            <div className="flex-1 min-w-0">
              <textarea
                ref={textareaRef}
                className="w-full bg-transparent outline-none resize-none overflow-hidden text-sm text-neutral-700 placeholder:text-neutral-400"
                placeholder={selectedType === 'circuit-analyze' ? "点击右侧按钮打开电路绘图工具" : "有问题尽管问我..."}
                value={prompt}
                onChange={handlePromptChange}
                onKeyDown={handleKeyDown}
                rows={1}
                disabled={isProcessing || selectedType === 'circuit-analyze'}
              />

              {quoteText && (
                <div className="quote-indicator mt-1 flex items-center gap-1">
                  <div className="flex-1 text-xs text-neutral-500 truncate max-w-[300px]">
                    引用：{quoteText}
                  </div>
                  <button 
                    className="text-neutral-400 hover:text-neutral-600"
                    onClick={() => setQuoteText(null)}
                  >
                    <XMarkIcon className="w-3 h-3" />
                  </button>
                </div>
              )}
            </div>

            {/* 模型选择器 - 仅对于general和knowledge模式显示 */}
            {(selectedType === 'general' || selectedType === 'knowledge') && (
              <div className="flex-none model-selector">
                <SelectDropdown 
                  options={modelOptions}
                  selectedOption={modelOptions.find(model => model.type === selectedModel) || modelOptions[0]}
                  onSelect={handleModelSelect}
                  smaller
                />
              </div>
            )}

            {/* 发送按钮 */}
            <button
              className={`send-button ${isProcessing ? 'processing' : ''} ${prompt.trim() === '' && selectedType !== 'circuit-analyze' ? 'disabled' : ''}`}
              onClick={handleSubmit}
              disabled={isProcessing || (prompt.trim() === '' && selectedType !== 'circuit-analyze')}
            >
              {getSubmitButtonText()}
            </button>
          </div>
        </div>
      </div>
      
      {/* 电路分析模态框 */}
      <CircuitAnalysisModal 
        isOpen={isCircuitModalOpen} 
        onClose={() => setIsCircuitModalOpen(false)}
        onSubmit={handleCircuitSubmit}
      />
    </>
  );
} 