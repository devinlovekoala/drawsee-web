import {useCallback, useState, useEffect} from "react";
import {createAiTask} from "@/api/methods/flow.methods.ts";
import {AiTaskType, CreateAiTaskDTO} from "@/api/types/flow.types.ts";
import {toast} from "sonner";
import './styles/scrollbar.css';
import { useAppContext } from "@/app/contexts/AppContext";
import { XIcon, CheckIcon, WandIcon, ImageUpIcon, FunctionSquareIcon } from "lucide-react";
import ImageUploader from "@/app/components/ImageUploader";
import { getSolverWays } from '@/api/methods/tool.methods';
import { ModelSelector } from "./components/ModelSelector";
import { ModelType } from "../flow/components/input/FlowInputPanel";
import { useLocation, useNavigate } from "react-router-dom";
import { Switch } from "@/app/components/ui/switch";
import MathKeyboard from "@/app/components/ui/math-keyboard";
import LaTeXRenderer from "@/app/components/ui/latex-renderer";

function Blank() {
  const {handleBlankQuery, handleAiTaskCountPlus} = useAppContext();
  const location = useLocation();
  const navigate = useNavigate();

  interface QueryForm {
    type: AiTaskType;
    prompt: string;
    promptParams: Record<string, string>;
    model: ModelType;
  }

  // 从location中获取agent类型和班级ID
  const agentType = location.state?.agentType as AiTaskType || 'GENERAL';
  const agentName = location.state?.agentName as string;
  const classId = location.state?.classId as string || null;

  const [queryForm, setQueryForm] = useState<QueryForm>({
    type: agentType,
    prompt: "",
    promptParams: {},
    model: "doubao"
  });
  
  // 确保类型值的大写格式
  useEffect(() => {
    if (queryForm.type) {
      // 将小写连字符格式的类型转换为大写下划线格式
      const typeMap: {[key: string]: AiTaskType} = {
        'general': 'GENERAL',
        'knowledge': 'KNOWLEDGE',
        'knowledge-detail': 'KNOWLEDGE_DETAIL',
        'animation': 'ANIMATION',
        'solver-first': 'SOLVER_FIRST',
        'solver-continue': 'SOLVER_CONTINUE',
        'solver-summary': 'SOLVER_SUMMARY',
        'circuit-analyze': 'CIRCUIT_ANALYSIS'
      };
      
      // 检查是否需要进行类型转换（只有当类型是字符串且为小写格式时）
      if (typeof queryForm.type === 'string' && 
          queryForm.type !== queryForm.type.toUpperCase() && 
          typeMap[queryForm.type as string]) {
        setQueryForm(prev => ({ ...prev, type: typeMap[queryForm.type as string] }));
      }
    }
  }, [queryForm.type]);

  // 当location变化时，更新queryForm的type字段
  useEffect(() => {
    if (location.state?.agentType) {
      // 直接使用提供的类型，无需转换，因为AgentMenu组件已经提供了正确的大写格式
      setQueryForm(prev => ({
        ...prev,
        type: location.state.agentType as AiTaskType,
        prompt: "",
        promptParams: {}
      }));
      
      // 如果是解题模式，重置解题相关状态
      if (location.state.agentType === 'SOLVER_FIRST') {
        setSelectedWay('');
        setCustomWay('');
        setSolvingWays([]);
      } else {
        // 如果不是解题模式，确保关闭图片上传器
        setShowImageUploader(false);
      }

      // 电路分析模式可以在这个页面直接输入问题或者点击按钮跳转到电路设计页面
      if (location.state.agentType === 'CIRCUIT_ANALYSIS') {
        // 保持在当前页面，使用户可以选择输入问题或跳转
      }
      
      // 输出调试信息到控制台
      console.log('功能切换:', {
        from: queryForm.type,
        to: location.state.agentType,
        agent: location.state.agentName
      });
    }
  }, [location.state]);

  // 当进入页面时，打印调试信息
  useEffect(() => {
    console.log('Blank页面加载，参数:', {
      agentType,
      agentName,
      classId
    });
  }, [agentType, agentName, classId]);

  const [showImageUploader, setShowImageUploader] = useState(false);
  const [solvingWays, setSolvingWays] = useState<string[]>([]);
  const [selectedWay, setSelectedWay] = useState<string>('');
  const [customWay, setCustomWay] = useState<string>('');
  const [isLoadingWays, setIsLoadingWays] = useState(false);
  const [isProcessing, setIsProcessing] = useState(false);
  const [showMathKeyboard, setShowMathKeyboard] = useState(false);
  const [cursorPosition, setCursorPosition] = useState<number | null>(null);

  const handleQuery = useCallback(() => {
    if (isProcessing) return;
    
    if (queryForm.prompt.trim() === "") {
      // 对于电路分析模式，如果没有输入，用户可能想直接设计电路
      if (queryForm.type === "CIRCUIT_ANALYSIS") {
        const goToCircuitPage = window.confirm('您是否要跳转到电路设计页面？');
        if (goToCircuitPage) {
          navigate('/circuit');
          return;
        } else {
          toast.info('请输入电路相关的问题进行分析');
          return;
        }
      }
      
      toast.error("请输入问题");
      return;
    }

    // 对于电路分析模式，用户可以选择直接提问或者跳转到设计页面
    if (queryForm.type === "CIRCUIT_ANALYSIS" && queryForm.prompt.includes('设计')) {
      const goToCircuitPage = window.confirm('您的问题提到了电路设计，是否要跳转到电路设计页面？');
      if (goToCircuitPage) {
        navigate('/circuit');
        return;
      }
      // 用户选择不跳转，继续正常发送查询
    }

    // 如果是解题模式，检查是否选择了解题方法
    if (queryForm.type === "SOLVER_FIRST" && !(selectedWay || customWay)) {
      toast.error("请选择或输入解题方法");
      return;
    }

    setIsProcessing(true);

    try {
      // 确保任务类型是有效的
      const validTaskTypes = ['GENERAL', 'KNOWLEDGE', 'KNOWLEDGE_DETAIL', 'ANIMATION', 
        'SOLVER_FIRST', 'SOLVER_CONTINUE', 'SOLVER_SUMMARY', 'PLANNER', 'HTML_MAKER', 'CIRCUIT_ANALYSIS'];
      
      if (!validTaskTypes.includes(queryForm.type)) {
        throw new Error(`不支持的任务类型: ${queryForm.type}`);
      }

      // 准备promptParams - 为了兼容后端API，使用空对象而不是null
      let promptParams = {};
      if (queryForm.type === "SOLVER_FIRST" && (selectedWay || customWay.trim())) {
        promptParams = {
          method: customWay.trim() || selectedWay
        };
      } else if (Object.keys(queryForm.promptParams).length > 0) {
        promptParams = {...queryForm.promptParams};
      }

      // 为不同模式准备相应的参数 - 确保格式一致
      const createAiTaskDTO: CreateAiTaskDTO = {
        type: queryForm.type,
        prompt: queryForm.prompt.trim(),
        promptParams: promptParams,
        convId: null,
        parentId: null,
        model: ["GENERAL", "KNOWLEDGE", "ANIMATION", "SOLVER_FIRST", "CIRCUIT_ANALYSIS"].includes(queryForm.type) ? queryForm.model : null,
        classId: classId // 添加班级ID
      };

      console.log('发送AI任务', createAiTaskDTO);
      
      createAiTask(createAiTaskDTO)
        .then((response) => {
          console.log('AI任务响应', response);
          toast.success("问题已发送");
          handleAiTaskCountPlus();
          handleBlankQuery(response);
        })
        .catch((error: Error) => {
          console.error('AI任务失败', error);
          let errorMessage = error.message || "参数错误，请重试";
          // 尝试给出更具体的错误信息
          if (errorMessage.includes('参数错误')) {
            errorMessage = "创建会话参数错误，请联系管理员或稍后重试";
          }
          toast.error(errorMessage);
        });
    } catch (error: any) {
      console.error('请求准备错误', error);
      toast.error(error.message || "参数准备错误");
    } finally {
      setIsProcessing(false);
    }
  }, [isProcessing, queryForm.prompt, queryForm.type, queryForm.promptParams, queryForm.model, selectedWay, customWay, handleAiTaskCountPlus, handleBlankQuery, navigate, classId]);

  // 处理模型变更
  const handleModelChange = (model: ModelType) => {
    setQueryForm(prev => ({...prev, model}));
  };

  // 切换图片上传器显示状态
  const toggleImageUploader = () => {
    setShowImageUploader(prev => !prev);
  };

  // 函数：切换数学公式软键盘显示状态
  const toggleMathKeyboard = () => {
    setShowMathKeyboard(!showMathKeyboard);
    // 记住当前光标位置
    if (!showMathKeyboard && document.activeElement instanceof HTMLTextAreaElement) {
      setCursorPosition(document.activeElement.selectionStart);
    }
  };

  // 函数：处理数学符号插入
  const handleMathSymbolInsert = (symbol: string) => {
    if (cursorPosition !== null) {
      const newText = 
        queryForm.prompt.substring(0, cursorPosition) + 
        symbol + 
        queryForm.prompt.substring(cursorPosition);
      
      setQueryForm({...queryForm, prompt: newText});
      
      // 更新光标位置到插入符号之后
      const newPosition = cursorPosition + symbol.length;
      setCursorPosition(newPosition);
      
      // 在下一个渲染周期后聚焦并设置光标位置
      setTimeout(() => {
        const textarea = document.querySelector('textarea') as HTMLTextAreaElement;
        if (textarea) {
          textarea.focus();
          textarea.setSelectionRange(newPosition, newPosition);
        }
      }, 0);
    }
  };

  // 捕获textarea的光标位置变化
  const handleTextareaSelect = (e: React.MouseEvent<HTMLTextAreaElement> | React.KeyboardEvent<HTMLTextAreaElement>) => {
    setCursorPosition(e.currentTarget.selectionStart);
  };

  // 修改现有的handleImageTextRecognized函数来支持预览LaTeX
  const handleImageTextRecognized = (text: string) => {
    // 将识别的文本添加到当前prompt中
    const newPrompt = queryForm.prompt + "\n\n" + text;
    setQueryForm({ ...queryForm, prompt: newPrompt });
    
    // 如果检测到可能是数学公式，提示用户可以使用公式键盘
    if (text.includes('\\') || text.includes('^') || text.includes('_') || text.includes('sqrt')) {
      toast.info("检测到数学公式，您可以使用公式键盘进行编辑");
    }
  };

  // 根据输入文本获取解题方法
  const fetchSolvingWays = async (text: string) => {
    if (!text || text.trim() === '') return;
    
    setIsLoadingWays(true);
    
    try {
      const response = await getSolverWays(text.trim());
      setSolvingWays(response);
      // 默认选择第一个解题方法
      if (response && response.length > 0) {
        setSelectedWay(response[0]);
        setCustomWay('');
      }
    } catch (error) {
      console.error('获取解题方法失败:', error);
      setSolvingWays([]);
    } finally {
      setIsLoadingWays(false);
    }
  };

  const currentTime = new Date();
  const hours = currentTime.getHours();
  let greeting = "晚上好";
  if (hours < 12) {
    greeting = "早上好";
  } else if (hours < 18) {
    greeting = "下午好";
  }

  // 判断是否为数学公式输入模式
  const isSolverMode = queryForm.type === "SOLVER_FIRST";
  // 判断是否为动画生成模式
  const isAnimationMode = queryForm.type === "ANIMATION";
  
  // 开发调试：监控queryForm.type变化
  useEffect(() => {
    console.log('当前功能类型变更:', queryForm.type);
  }, [queryForm.type]);

  // 根据模式获取页面标题和描述
  const getPageInfo = () => {
    if (isSolverMode) {
      return {
        title: "AI推理解题",
        description: "上传题目图片或输入题目，让AI为您提供详细解题过程"
      };
    } else if (isAnimationMode) {
      return {
        title: "AI动画生成",
        description: "描述您想要制作的动画内容，AI将为您创建生动的动画展示"
      };
    } else if (queryForm.type === "CIRCUIT_ANALYSIS") {
      return {
        title: "AI电子电路分析",
        description: "点击'开始分析'按钮进入电路设计页面，设计并分析您的电路"
      };
    } else {
      return {
        title: greeting,
        description: "有什么可以帮助您的？"
      };
    }
  };

  const pageInfo = getPageInfo();

  // 渲染电路分析模式指南
  const renderCircuitAnalysisGuide = () => {
    if (queryForm.type !== "CIRCUIT_ANALYSIS") {
      return null;
    }
    
    return (
      <div className="mb-4 p-4 bg-blue-50 border border-blue-200 rounded-lg">
        <div className="flex items-start">
          <div className="flex-shrink-0 pt-0.5">
            <svg xmlns="http://www.w3.org/2000/svg" width="24" height="24" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round" className="text-blue-500">
              <circle cx="12" cy="12" r="10"/>
              <path d="M12 16v-4"/>
              <path d="M12 8h.01"/>
            </svg>
          </div>
          <div className="ml-3">
            <h3 className="text-sm font-medium text-blue-800">电路分析模式</h3>
            <div className="mt-2 text-sm text-blue-700">
              <p>在这个模式下，您可以：</p>
              <ol className="mt-1 list-decimal list-inside">
                <li><strong>直接提问：</strong> 输入电路相关的问题进行分析</li>
                <li><strong>设计电路：</strong> 点击"开始设计"按钮进入可视化电路设计页面</li>
                <li>在设计页面可以添加元件、连接并分析电路</li>
                <li>分析结果将以常规对话节点的形式显示</li>
              </ol>
            </div>
          </div>
        </div>
      </div>
    );
  };

  return (
    <div className="flex flex-col h-screen bg-white overflow-hidden">
      {/* 顶部导航 */}
      <div className="flex justify-between items-center px-6 py-4 border-b border-neutral-100">
        <div className="flex items-center">
          <h1 className="text-xl font-semibold text-neutral-800">
            {queryForm.type === 'GENERAL' ? '通用对话' : 
             queryForm.type === 'KNOWLEDGE' ? '知识问答' :
             queryForm.type === 'ANIMATION' ? '动画生成' :
             queryForm.type === 'SOLVER_FIRST' ? '解题推理' :
             queryForm.type === 'CIRCUIT_ANALYSIS' ? '电路分析' :
             agentName || '智能助手'}
          </h1>
        </div>
      </div>

      {/* 页面主体内容 */}
      <div className="flex-1 overflow-y-auto">
        <div className="w-full h-full bg-background flex flex-col flex-wrap content-start md:content-center md:pt-0">
          {/* 动态背景 */}
          <div className="absolute inset-0 z-0 overflow-hidden">
            <div className="size-full transition-opacity duration-150 [mask-image:radial-gradient(600px_circle_at_center,white,transparent)]">
              <div className="absolute inset-0 bg-[radial-gradient(#e5e7eb_1px,transparent_1px)] bg-[length:20px_20px] opacity-40"></div>
              
              {/* 背景波纹 - 增强版 */}
              <div className="absolute left-1/2 top-1/2 -translate-x-1/2 -translate-y-1/2 h-[800px] w-[800px]">
                {/* 主波纹圈 */}
                {[...Array(6)].map((_, i) => (
                  <div
                    key={`ripple-${i}`}
                    className="absolute rounded-full border-2 animate-ripple animate-pulse-glow"
                    style={{
                      height: `${(i + 1) * 100}px`,
                      width: `${(i + 1) * 100}px`,
                      left: '50%',
                      top: '50%',
                      borderColor: `rgba(99, 102, 241, ${0.3 - i * 0.04})`,
                      animationDelay: `${i * 0.8}s`,
                    }}
                  />
                ))}
                
                {/* 浮动装饰元素 */}
                <div className="absolute left-1/2 top-1/2 w-[400px] h-[400px] animate-float">
                  <div className="absolute w-20 h-20 rounded-full bg-indigo-100/20 blur-md"
                       style={{ left: '20%', top: '10%', animationDelay: '0.5s' }}></div>
                  <div className="absolute w-16 h-16 rounded-full bg-purple-100/20 blur-md"
                       style={{ left: '70%', top: '20%', animationDelay: '1.2s' }}></div>
                  <div className="absolute w-24 h-24 rounded-full bg-blue-100/20 blur-md"
                       style={{ left: '30%', top: '70%', animationDelay: '0.8s' }}></div>
                </div>
                
                {/* 旋转装饰元素 */}
                <div className="absolute left-1/2 top-1/2 w-[500px] h-[500px] animate-rotate opacity-20">
                  <svg viewBox="0 0 100 100" className="absolute w-full h-full">
                    <defs>
                      <linearGradient id="gradient" x1="0%" y1="0%" x2="100%" y2="100%">
                        <stop offset="0%" stopColor="rgba(99, 102, 241, 0.6)" />
                        <stop offset="100%" stopColor="rgba(168, 85, 247, 0.6)" />
                      </linearGradient>
                    </defs>
                    <circle cx="50" cy="50" r="40" stroke="url(#gradient)" strokeWidth="0.5" fill="none" />
                    <path d="M50,10 L50,90 M10,50 L90,50" stroke="url(#gradient)" strokeWidth="0.3" />
                    <circle cx="50" cy="10" r="2" fill="rgba(99, 102, 241, 0.8)" />
                    <circle cx="50" cy="90" r="2" fill="rgba(168, 85, 247, 0.8)" />
                    <circle cx="10" cy="50" r="2" fill="rgba(99, 102, 241, 0.8)" />
                    <circle cx="90" cy="50" r="2" fill="rgba(168, 85, 247, 0.8)" />
                  </svg>
                </div>
              </div>
            </div>
          </div>

          {/* 主要内容 */}
          <div className="relative z-10 w-full mt-14 mb-16">
            <div className="w-full animate-fade-in">
              <div className="max-w-[800px] mx-auto px-4">
                <div className="pl-4 mb-1 text-left mt-2 flex items-center justify-between">
                  <div>
                    <h1 className="mb-2 text-2xl md:text-3xl font-bold tracking-tight text-transparent bg-clip-text bg-gradient-to-r from-neutral-900 to-neutral-600">{pageInfo.title}</h1>
                    <p className="mb-4 text-sm md:text-base tracking-tight text-neutral-600">{pageInfo.description}</p>
                  </div>
                </div>

                <div className="py-6 relative p-2 backdrop-blur-sm bg-white/50 border border-neutral-200/50 rounded-2xl transition-all duration-200 hover:border-neutral-300 group">
                  {/* 输入区域 */}
                  <div className="relative flex min-h-32 items-stretch justify-between w-full overflow-hidden border rounded-t-lg rounded-xl border-neutral-300/50 bg-gradient-to-tr from-neutral-50 to-neutral-200">
                    <div className="flex-1">
                      <textarea
                        value={queryForm.prompt}
                        onChange={(e) => setQueryForm({...queryForm, prompt: e.target.value})}
                        onClick={handleTextareaSelect}
                        onKeyUp={handleTextareaSelect}
                        placeholder={
                          queryForm.type === "GENERAL" ? "问 AI 任何问题..." : 
                          queryForm.type === "KNOWLEDGE" ? "请输入知识性问题..." :
                          queryForm.type === "ANIMATION" ? "请输入你想制作动画的问题..." :
                          queryForm.type === "SOLVER_FIRST" ? "请输入需要解答的题目（可通过图片上传）..." :
                          queryForm.type === "CIRCUIT_ANALYSIS" ? "请上传电路图或描述电路问题..." :
                          "请输入问题"
                        }
                        className="w-full p-4 h-32 pr-0 text-xl bg-transparent outline-none resize-none scrollbar-hide"
                      />
                    </div>
                    
                    {/* 底部按钮，需要和输入区域分开成左右两边 */}
                    <div className="min-w-[165px]">
                      <div className="absolute flex gap-2 bottom-2 right-2">
                        {/* 图片上传按钮 - 仅在解题模式下显示 */}
                        {queryForm.type === "SOLVER_FIRST" && (
                          <>
                            <button 
                              onClick={toggleImageUploader}
                              className="cursor-pointer bg-neutral-400/20 text-[rgba(101,101,101,1)] rounded-md 
                              px-3 py-2 flex items-center gap-1 hover:scale-[0.95] hover:opacity-90 hover:ring-1 
                              hover:ring-indigo-500/50 transition-all duration-200 font-medium"
                              title="上传图片识别文字"
                            >
                              <ImageUpIcon size={20} />
                            </button>
                            
                            {/* 数学公式键盘按钮 - 仅在解题模式下显示 */}
                            <button 
                              onClick={toggleMathKeyboard}
                              className="cursor-pointer bg-neutral-400/20 text-[rgba(101,101,101,1)] rounded-md 
                              px-3 py-2 flex items-center gap-1 hover:scale-[0.95] hover:opacity-90 hover:ring-1 
                              hover:ring-indigo-500/50 transition-all duration-200 font-medium"
                              title="数学公式键盘"
                            >
                              <FunctionSquareIcon size={20} />
                            </button>
                          </>
                        )}
                        
                        {/* 提问按钮 */}
                        <div className="w-full flex justify-end gap-2">
                          <button
                            type="button"
                            onClick={handleQuery}
                            disabled={isProcessing}
                            className={`px-4 py-2 rounded-md font-medium transition-all ${
                              isProcessing
                                ? "bg-neutral-200 text-neutral-400 cursor-not-allowed"
                                : "bg-neutral-900 text-white hover:bg-neutral-800"
                            }`}
                          >
                            {isProcessing ? (
                              <div className="flex items-center">
                                <span className="animate-spin mr-2">
                                  <svg width="16" height="16" viewBox="0 0 16 16" fill="none">
                                    <circle
                                      className="opacity-25"
                                      cx="8"
                                      cy="8"
                                      r="7"
                                      stroke="currentColor"
                                      strokeWidth="2"
                                    ></circle>
                                    <path
                                      className="opacity-75"
                                      fill="currentColor"
                                      d="M16 8a8 8 0 01-14.93 3.88l1.47-.87A6.5 6.5 0 004 14.5V16H1v-3h2v.67a8 8 0 1013-7.61l.47-1.53A9.97 9.97 0 0116 8z"
                                    ></path>
                                  </svg>
                                </span>
                                处理中...
                              </div>
                            ) : queryForm.type === "CIRCUIT_ANALYSIS" ? (
                              "开始设计"
                            ) : (
                              "发送"
                            )}
                          </button>
                        </div>
                      </div>
                    </div>
                  </div>

                  {/* 图片上传组件 - 仅在解题模式下显示 */}
                  {showImageUploader && queryForm.type === "SOLVER_FIRST" && (
                    <div className="mt-3 animate-fade-down animate-duration-300">
                      <div className="relative px-2 py-3 rounded-xl border border-neutral-200 bg-white/80">
                        <button 
                          onClick={toggleImageUploader} 
                          className="absolute right-2 top-2 rounded-full p-1 bg-neutral-100 hover:bg-neutral-200 transition-colors"
                        >
                          <XIcon className="h-4 w-4 text-neutral-500" />
                        </button>
                        <h3 className="mb-2 text-sm font-medium text-neutral-500 px-2">上传图片识别文字</h3>
                        <div className="px-2">
                          <ImageUploader onTextRecognized={handleImageTextRecognized} />
                        </div>
                      </div>
                    </div>
                  )}

                  {/* 数学公式预览 - 仅在解题模式下显示 */}
                  {queryForm.type === "SOLVER_FIRST" && queryForm.prompt && (
                    <div className="mt-3">
                      <div className="px-4 py-3 rounded-xl border border-blue-100 bg-blue-50/30">
                        <h3 className="mb-2 text-sm font-medium text-blue-700">公式预览</h3>
                        <div className="bg-white rounded-lg p-3 border border-blue-100">
                          <LaTeXRenderer 
                            latex={queryForm.prompt} 
                            className="text-gray-800"
                          />
                        </div>
                      </div>
                    </div>
                  )}
                  
                  {/* 数学公式键盘 - 仅在解题模式下显示且键盘开启时 */}
                  {showMathKeyboard && (
                    <MathKeyboard
                      onInsert={handleMathSymbolInsert}
                      onClose={() => setShowMathKeyboard(false)}
                    />
                  )}

                  {/* 解题方法选择器 - 仅在解题模式时显示 */}
                  {isSolverMode && (
                    <div className="mt-3 animate-fade-up animate-duration-300 rounded-xl border border-neutral-200/70 backdrop-blur-sm bg-white/30 p-4">
                      <div className="flex justify-between items-center mb-3">
                        <h3 className="text-sm font-medium text-neutral-700">解题方法</h3>
                        
                        {/* 生成解题方法按钮 - 移到这里 */}
                        <button 
                          onClick={() => fetchSolvingWays(queryForm.prompt)}
                          className="cursor-pointer bg-indigo-100/60 text-indigo-600 rounded-md 
                          px-3 py-2 flex items-center gap-1 hover:scale-[0.95] hover:opacity-90 hover:ring-1 
                          hover:ring-indigo-500/50 transition-all duration-200 font-medium"
                          disabled={isLoadingWays || !queryForm.prompt.trim()}
                        >
                          {isLoadingWays ? (
                            <div className="animate-spin h-4 w-4 border-2 border-indigo-500 rounded-full border-t-transparent"></div>
                          ) : (
                            <WandIcon className="h-4 w-4" />
                          )}
                          <span>生成解题方法</span>
                        </button>
                      </div>
                      
                      {isLoadingWays ? (
                        <div className="flex items-center justify-center py-4">
                          <div className="animate-spin h-5 w-5 border-2 border-indigo-500 rounded-full border-t-transparent"></div>
                          <span className="ml-2 text-sm text-neutral-600">加载中...</span>
                        </div>
                      ) : solvingWays.length > 0 ? (
                        <>
                          {/* 解题方法选项 */}
                          <div className="grid grid-cols-1 md:grid-cols-2 gap-2 mb-3">
                            {solvingWays.map((way) => (
                              <button
                                key={way}
                                onClick={() => {
                                  setSelectedWay(way);
                                  setCustomWay('');
                                }}
                                className={`flex items-center justify-between px-3 py-2 rounded-lg text-left text-sm transition-all duration-200 ${
                                  selectedWay === way && !customWay
                                    ? 'bg-indigo-100/70 text-indigo-700 ring-1 ring-indigo-300/50'
                                    : 'bg-neutral-100/50 text-neutral-700 hover:bg-indigo-50/50 hover:text-indigo-600'
                                }`}
                              >
                                <span>{way}</span>
                                {selectedWay === way && !customWay && (
                                  <CheckIcon className="h-4 w-4 text-indigo-600" />
                                )}
                              </button>
                            ))}
                          </div>
                          
                          {/* 自定义解题方法输入 */}
                          <div className="mt-3 relative">
                            <input
                              type="text"
                              value={customWay}
                              onChange={(e) => {
                                setCustomWay(e.target.value);
                                if (e.target.value.trim()) {
                                  setSelectedWay('');
                                }
                              }}
                              placeholder="自定义解题方法..."
                              className={`w-full px-3 py-2 rounded-lg text-sm transition-all duration-200 outline-none ${
                                customWay
                                  ? 'bg-indigo-50/70 text-indigo-700 ring-1 ring-indigo-300/50'
                                  : 'bg-neutral-100/50 text-neutral-600 focus:ring-1 focus:ring-indigo-300/50'
                              }`}
                            />
                            {customWay && (
                              <CheckIcon className="absolute right-3 top-1/2 transform -translate-y-1/2 h-4 w-4 text-indigo-600" />
                            )}
                          </div>
                        </>
                      ) : (
                        <div className="p-4 text-center bg-neutral-50/50 rounded-lg border border-neutral-200/50">
                          <p className="text-sm text-neutral-600">请先输入题目，然后点击"生成解题方法"按钮</p>
                          {!queryForm.prompt.trim() && (
                            <p className="text-xs text-neutral-500 mt-1">题目输入框不能为空</p>
                          )}
                        </div>
                      )}
                    </div>
                  )}

                  {/* 底部工具栏 */}
                  <div className="flex flex-col w-full gap-2 translate-y-2">
                    <div className="items-center justify-between block w-full md:flex">
                      <div className="mb-4 whitespace-nowrap md:mb-0">
                        <div className="flex gap-3">
                          {/* 在通用、知识、解题、动画和电路分析模式下显示模型选择器 */}
                          {['GENERAL', 'ANIMATION', 'SOLVER_FIRST', 'CIRCUIT_ANALYSIS'].includes(queryForm.type) && (
                            <ModelSelector 
                              selectedModel={queryForm.model} 
                              onModelChange={handleModelChange} 
                            />
                          )}
                        </div>
                      </div>
                    </div>
                  </div>
                </div>
              </div>
            </div>
          </div>
        </div>

        {/* 电路分析模式指南 */}
        {renderCircuitAnalysisGuide()}
      </div>
    </div>
  );
}

export default Blank;