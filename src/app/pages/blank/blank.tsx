import {useCallback, useState} from "react";
import {createAiTask} from "@/api/methods/flow.methods.ts";
import {AiTaskType, CreateAiTaskDTO} from "@/api/types/flow.types.ts";
import {toast} from "sonner";
import { ArrowTurnDownLeftIcon } from '@heroicons/react/24/outline';
import { ModeSelector } from './components/ModeSelector';
import './styles/scrollbar.css';
import { useAppContext } from "@/app/contexts/AppContext";

function Blank() {
  const {handleBlankQuery} = useAppContext();

  interface QueryForm {
    type: AiTaskType;
    prompt: string;
    promptParams: Record<string, string>;
  }

  const [queryForm, setQueryForm] = useState<QueryForm>({
    type: "general",
    prompt: "",
    promptParams: {}
  });

  const handleQuery = useCallback(() => {
    if (queryForm.prompt.trim() === "") {
      toast.error("请输入问题");
      return;
    }
    const createAiTaskDTO = {
      type: queryForm.type,
      prompt: queryForm.prompt,
      promptParams: null,
      convId: null,
      parentId: null
    } as CreateAiTaskDTO;
    createAiTask(createAiTaskDTO).then((response) => {
      toast.success("问题已发送");
      handleBlankQuery(response);
    });
  }, [handleBlankQuery, queryForm]);

  const currentTime = new Date();
  const hours = currentTime.getHours();
  let greeting = "晚上好";
  if (hours < 12) {
    greeting = "早上好";
  } else if (hours < 18) {
    greeting = "下午好";
  }

  return (
    <div className="w-full h-full overflow-hidden bg-background flex flex-wrap content-start pt-10 md:content-center md:pt-0">
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
      <div className="relative z-10 w-full -translate-y-24">
        <div className="w-full animate-fade-in">
          <div className="max-w-[800px] mx-auto px-4">
            <div className="pl-4 mb-1 text-left">
              <h1 className="mb-2 text-2xl md:text-3xl font-bold tracking-tight text-transparent bg-clip-text bg-gradient-to-r from-neutral-900 to-neutral-600">{greeting}</h1>
              <p className="mb-4 text-sm md:text-base tracking-tight text-neutral-600">选择一个对话模式来开始对话吧！</p>
            </div>

            <div className="py-6 relative p-2 backdrop-blur-sm bg-white/50 border border-neutral-200/50 rounded-2xl transition-all duration-200 hover:border-neutral-300 group">
              {/* 输入区域，高度应该充满整个容器 */}
              <div className="relative flex min-h-32 items-stretch justify-between w-full overflow-hidden border rounded-t-lg rounded-xl border-neutral-300/50 bg-gradient-to-tr from-neutral-50 to-neutral-200">
                <div className="flex-1">
                  <textarea
                    value={queryForm.prompt}
                    onChange={(e) => setQueryForm({...queryForm, prompt: e.target.value})}
                    placeholder="问 AI 任何问题..."
                    className="w-full p-4 h-32 pr-0 text-xl bg-transparent outline-none resize-none"
                  />
                </div>
                
                {/* 底部按钮，需要和输入区域分开成左右两边 */}
                <div className="min-w-32">
                  <div className="absolute flex gap-2 bottom-2 right-2">
                    <button 
                      onClick={handleQuery}
                      className="cursor-pointer bg-neutral-400/20 text-[rgba(101,101,101,1)] rounded-md 
                      px-6 py-2 flex items-center gap-1 hover:scale-[0.95] hover:opacity-90 hover:ring-1 
                      hover:ring-indigo-500/50 transition-all duration-200 font-medium"
                    >
                      开始
                      <ArrowTurnDownLeftIcon className="h-4 w-4" />
                    </button>
                  </div>
                </div>
              </div>

              {/* 底部工具栏 */}
              <div className="flex flex-col w-full gap-2 translate-y-2">
                <div className="items-center justify-between block w-full md:flex">
                  <div className="mb-4 whitespace-nowrap md:mb-0">
                    <div className="flex">
                      <ModeSelector 
                        selectedType={queryForm.type} 
                        onTypeChange={(type) => setQueryForm((prev) => ({...prev, type}))} 
                      />
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