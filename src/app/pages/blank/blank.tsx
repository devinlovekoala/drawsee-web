import {AppContext, AppContextType} from "@/app/app.tsx";
import {useCallback, useContext, useState} from "react";
import {createAiTask} from "@/api/methods/flow.methods.ts";
import {AiTaskType, CreateAiTaskDTO} from "@/api/types/flow.types.ts";
import {toast} from "sonner";
import { ArrowTurnDownLeftIcon } from '@heroicons/react/24/outline';
import ModeSelector from '@/app/components/ui/mode-selector';

function Blank() {
  const {handleBlankQuery} = useContext<AppContextType>(AppContext);

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
        <div className="absolute inset-0 z-0">
          <div className="size-full transition-opacity duration-150 [mask-image:radial-gradient(500px_circle_at_center,white,transparent)]">
            <div className="absolute inset-0 bg-[radial-gradient(#e5e7eb_1px,transparent_1px)] bg-[length:20px_20px] opacity-40"></div>

            {/* 背景波纹 */}
            <div className="absolute left-1/2 top-1/2 -translate-x-1/2 -translate-y-1/2 h-[500px] w-[500px]">
              {[...Array(8)].map((_, i) => (
                  <div
                      key={i}
                      className="absolute rounded-full border border-gray-200/20 animate-ripple"
                      style={{
                        height: `${(i + 1) * 50}px`,
                        width: `${(i + 1) * 50}px`,
                        left: '50%',
                        top: '50%',
                        transform: 'translate(-50%, -50%)',
                        animationDelay: `${i * 0.5}s`,
                        opacity: 0.3 - i * 0.03
                      }}
                  />
              ))}
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

                  {/* 深度思考模式 */}
                  {/* <div className="flex flex-col items-start justify-between h-24 p-2">
                  <div className="flex items-center">
                    <label className="pr-[10px] font-mono text-[0.9em] text-[rgba(90,93,100,0.5)]">深度思考模式</label>
                    <button className="relative flex h-[20px] w-[40px] cursor-pointer items-center rounded-full bg-white ring-1 ring-neutral-400/30 hover:scale-[0.95] hover:opacity-90" type="button">
                      <div className="block size-[17px] rounded-full transition-transform duration-200 translate-x-[2px] bg-[rgba(90,93,100,0.5)]"></div>
                    </button>
                  </div>
                </div> */}
                  {/* 底部按钮，需要和输入区域分开成左右两边 */}
                  <div className="min-w-32">
                    <div className="absolute flex gap-2 bottom-2 right-2">
                      {/* <button className="bg-neutral-400/20 text-[rgba(101,101,101,1)] rounded-full p-2 hover:scale-[0.95] hover:opacity-90 hover:ring-1 hover:ring-indigo-500/50 transition-all duration-200">
                      <MicrophoneIcon className="size-4" />
                    </button> */}
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
                            options={[
                              { label: "通用对话", value: "general" },
                              { label: "图像生成", value: "image" }
                            ]}
                            value={queryForm.type}
                            onChange={(type) => setQueryForm((prev) => ({...prev, type: type as AiTaskType}))}
                        />

                        {/* 模型选择 */}
                        {/* <button className="ml-2 flex items-center gap-1 px-2.5 py-2 bg-neutral-200 rounded-xl hover:scale-[0.95] hover:opacity-90 hover:ring-1 hover:ring-indigo-500/50 transition-all duration-200">
                        <span className="flex items-center justify-center size-4">
                          <svg className="size-4" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round">
                            <path d="M2.7 10.3a2.41 2.41 0 0 0 0 3.41l7.59 7.59a2.41 2.41 0 0 0 3.41 0l7.59-7.59a2.41 2.41 0 0 0 0-3.41l-7.59-7.59a2.41 2.41 0 0 0-3.41 0Z"></path>
                          </svg>
                        </span>
                        <span className="text-xs font-medium text-neutral-600">GPT-4o mini</span>
                        <ChevronDownIcon className="size-3.5 text-neutral-500" />
                      </button> */}
                      </div>
                    </div>

                    {/* 知识库 */}
                    {/* <div className="flex items-center">
                    <label className="pr-[10px] text-sm font-medium text-left text-[rgba(90,93,100,0.5)]">KNOWLEDGE BASE</label>
                    <button className="relative flex h-[20px] w-[40px] cursor-pointer items-center rounded-full bg-white ring-1 ring-neutral-400/30 hover:scale-[0.95] hover:opacity-90" type="button">
                      <div className="block size-[17px] rounded-full transition-transform duration-200 translate-x-[2px] bg-[rgba(90,93,100,0.5)]"></div>
                    </button>
                  </div> */}

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