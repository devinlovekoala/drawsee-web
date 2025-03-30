import {useCallback, useState} from "react";
import {createAiTask} from "@/api/methods/flow.methods.ts";
import {AiTaskType, CreateAiTaskDTO} from "@/api/types/flow.types.ts";
import {toast} from "sonner";
import { ArrowTurnDownLeftIcon } from '@heroicons/react/24/outline';
import { ModeSelector } from './components/ModeSelector';
import './styles/scrollbar.css';
import { useAppContext } from "@/app/contexts/AppContext";
import { XIcon, CheckIcon, WandIcon, ImageUpIcon } from "lucide-react";
import ImageUploader from "@/app/components/ImageUploader";
import { getSolverWays } from '@/api/methods/tool.methods';
import { ModelSelector } from "./components/ModelSelector";
import { ModelType } from "../flow/components/input/FlowInputPanel";

function Blank() {
  const {handleBlankQuery, handleAiTaskCountPlus} = useAppContext();

  interface QueryForm {
    type: AiTaskType;
    prompt: string;
    promptParams: Record<string, string>;
    model: ModelType;
  }

  const [queryForm, setQueryForm] = useState<QueryForm>({
    type: "general",
    prompt: "",
    promptParams: {},
    model: "doubao"
  });

  const [showImageUploader, setShowImageUploader] = useState(false);
  const [solvingWays, setSolvingWays] = useState<string[]>([]);
  const [selectedWay, setSelectedWay] = useState<string>('');
  const [customWay, setCustomWay] = useState<string>('');
  const [isLoadingWays, setIsLoadingWays] = useState(false);
  const [isProcessing, setIsProcessing] = useState(false);

  const handleQuery = useCallback(() => {
    if (isProcessing) return;
    
    if (queryForm.prompt.trim() === "") {
      toast.error("请输入问题");
      return;
    }

    // 如果是解题模式，检查是否选择了解题方法
    if (queryForm.type === "solver-first" && !(selectedWay || customWay)) {
      toast.error("请选择或输入解题方法");
      return;
    }

    setIsProcessing(true);

    // 如果是解题模式且已选择解题方法，添加到promptParams
    const promptParams = {...queryForm.promptParams};
    if (queryForm.type === "solver-first") {
      promptParams.method = customWay.trim() || selectedWay;
    }

    let finalModel = null;
    if (queryForm.type === "general" || queryForm.type === "knowledge") {
      finalModel = queryForm.model;
    }

    const createAiTaskDTO = {
      type: queryForm.type,
      prompt: queryForm.prompt,
      promptParams,
      convId: null,
      parentId: null,
      model: finalModel
    } as CreateAiTaskDTO;
    createAiTask(createAiTaskDTO).then((response) => {
      toast.success("问题已发送");
      handleAiTaskCountPlus();
      handleBlankQuery(response);
    }).catch((error: Error) => {
      toast.error(error.message);
    }).finally(() => {
      setIsProcessing(false);
    });
  }, [isProcessing, queryForm.prompt, queryForm.type, queryForm.promptParams, queryForm.model, selectedWay, customWay, handleAiTaskCountPlus, handleBlankQuery]);

  // 处理模式变更
  const handleModeChange = (type: AiTaskType) => {
    setQueryForm(prev => ({...prev, type, prompt: "", promptParams: {}}));
    setIsLoadingWays(false);
    setSelectedWay('');
    setCustomWay('');
    setSolvingWays([]);
  };

  // 处理模型变更
  const handleModelChange = (model: ModelType) => {
    setQueryForm(prev => ({...prev, model}));
  };

  // 切换图片上传器显示状态
  const toggleImageUploader = () => {
    setShowImageUploader(prev => !prev);
  };

  // 处理图片识别文本
  const handleImageTextRecognized = (text: string) => {
    setQueryForm(prev => ({ ...prev, prompt: prev.prompt + "\n" + text }));
    setShowImageUploader(false);
    toast.success("图片文本已追加至prompt");
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
  const isSolverMode = queryForm.type === "solver-first";

  return (
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
            <div className="pl-4 mb-1 text-left mt-2">
              <h1 className="mb-2 text-2xl md:text-3xl font-bold tracking-tight text-transparent bg-clip-text bg-gradient-to-r from-neutral-900 to-neutral-600">{greeting}</h1>
              <p className="mb-4 text-sm md:text-base tracking-tight text-neutral-600">选择一个对话模式来开始对话吧！</p>
            </div>

            <div className="py-6 relative p-2 backdrop-blur-sm bg-white/50 border border-neutral-200/50 rounded-2xl transition-all duration-200 hover:border-neutral-300 group">
              {/* 输入区域 */}
              <div className="relative flex min-h-32 items-stretch justify-between w-full overflow-hidden border rounded-t-lg rounded-xl border-neutral-300/50 bg-gradient-to-tr from-neutral-50 to-neutral-200">
                <div className="flex-1">
                  <textarea
                    value={queryForm.prompt}
                    onChange={(e) => setQueryForm({...queryForm, prompt: e.target.value})}
                    placeholder={
                      queryForm.type === "general" ? "问 AI 任何问题..." : 
                      queryForm.type === "knowledge" ? "请输入知识性问题..." :
                      queryForm.type === "animation" ? "请输入你想制作动画的问题..." :
                      queryForm.type === "solver-first" ? "请输入需要解答的题目（可通过图片上传）..." :
                      queryForm.type === "planner" ? "请输入你想要达成的目标..." :
                      queryForm.type === "html-maker" ? "请输入你想要制作的网页内容..." :
                      "请输入问题"
                    }
                    className="w-full p-4 h-32 pr-0 text-xl bg-transparent outline-none resize-none scrollbar-hide"
                  />
                </div>
                
                {/* 底部按钮，需要和输入区域分开成左右两边 */}
                <div className="min-w-[165px]">
                  <div className="absolute flex gap-2 bottom-2 right-2">
                    {/* 图片上传按钮 */}
                    <button 
                      onClick={toggleImageUploader}
                      className="cursor-pointer bg-neutral-400/20 text-[rgba(101,101,101,1)] rounded-md 
                      px-3 py-2 flex items-center gap-1 hover:scale-[0.95] hover:opacity-90 hover:ring-1 
                      hover:ring-indigo-500/50 transition-all duration-200 font-medium"
                    >
                      <ImageUpIcon size={20} />
                    </button>
                    
                    {/* 提交按钮 */}
                    <button 
                      onClick={handleQuery}
                      className="cursor-pointer bg-neutral-400/20 text-[rgba(101,101,101,1)] rounded-md 
                      px-6 py-2 flex items-center gap-1 hover:scale-[0.95] hover:opacity-90 hover:ring-1 
                      hover:ring-indigo-500/50 transition-all duration-200 font-medium"
                      disabled={isProcessing}
                    >
                      {isProcessing ? (
                        <>
                          <div className="animate-spin h-4 w-4 border-2 border-neutral-500 rounded-full border-t-transparent"></div>
                          <span>处理中</span>
                        </>
                      ) : (
                        <>
                          开始
                          <ArrowTurnDownLeftIcon className="h-4 w-4" />
                        </>
                      )}
                    </button>
                  </div>
                </div>
              </div>

              {/* 图片上传组件 */}
              {showImageUploader && (
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
                      <ModeSelector 
                        selectedType={queryForm.type} 
                        onTypeChange={handleModeChange} 
                      />
                      {
                        (queryForm.type === "general" || queryForm.type === "knowledge") &&
                        <ModelSelector 
                          selectedModel={queryForm.model} 
                          onModelChange={handleModelChange} 
                        />
                      }
                    </div>
                  </div>
                </div>
              </div>
            </div>
          </div>
        </div>
      </div>
    </div>
  );
}

export default Blank;