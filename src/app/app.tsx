import {Outlet, useNavigate} from "react-router-dom";
import { Toaster } from "@/common/components/ui/sonner.tsx";
import {
  Sidebar,
  SidebarContent, SidebarFooter,
  SidebarHeader,
  SidebarInset,
  SidebarProvider,
} from "@/app/components/ui/sidebar.tsx";
import {NavUser} from "@/app/components/nav-user.tsx";
import {
  ChevronRight,
  MessageCirclePlus, Sparkles
} from "lucide-react";
import {
  Collapsible,
  CollapsibleContent,
  CollapsibleTrigger,
} from "@/app/components/ui/collapsible.tsx";
import DrawSeeIcon from '@/assets/svg/昭析.svg';
import {useCallback, useEffect, useState} from "react";
import {LOGIN_FLAG_KEY, TOKEN_KEY} from "@/common/constant/storage-key.constant.ts";
import {checkLogin} from "@/api/methods/auth.methods.ts";
import {toast} from "sonner";
import {ConversationVO, CreateAiTaskVO} from "@/api/types/flow.types.ts";
import {useRequest} from "alova/client";
import {getConversations} from "@/api/methods/flow.methods.ts";
import AuthForm from "@/app/components/form/auth-form.tsx";
import { FlowLocationState } from "./pages/flow/flow";

export interface AppContext {
  handleBlankQuery: (data: CreateAiTaskVO) => void;
  handleTitleUpdate: (convId: number, title: string) => void;
}

function App() {
  const navigate = useNavigate();
  
  const [conversations, setConversations] = useState<Array<ConversationVO>>([]);
  const [isLogin, setIsLogin] = useState<boolean>(true);

  const {send} = useRequest(getConversations(), {immediate: false});

  const getConvData = useCallback(() => {
    send().then((data) => {
      setConversations(data);
    }).catch((error: Error) => {
      toast.error(`获取会话数据失败，${error.message}`);
    });
  }, [send]);

  useEffect(() => {
    const loginFlag = sessionStorage.getItem(LOGIN_FLAG_KEY);
    if (!loginFlag) {
      checkLogin()
        .then(() => {
          toast.info("欢迎回来");
          sessionStorage.setItem(LOGIN_FLAG_KEY, JSON.stringify(true));
          setIsLogin(true);
          getConvData();
          navigate("/blank");
        })
        .catch(() => {
          toast.error("未登录，请先登录");
          setIsLogin(false);
        });
    } else {
      getConvData();
    }
  }, [navigate]);

  const handleLoginSuccess = useCallback((token?: string) => {
    setIsLogin(true);
    if (token) {
      localStorage.setItem(TOKEN_KEY, token);
    }
    sessionStorage.setItem(LOGIN_FLAG_KEY, JSON.stringify(true));
    navigate("/blank");
    getConvData();
  }, [navigate, send]);

  const handleTitleUpdate = useCallback((convId: number, title: string) => {
    setConversations((prev) =>
      prev.map((conversation) =>
        conversation.id === convId
          ? { ...conversation, title }
          : conversation
      )
    );
  }, []);

  const handleBlankQuery = useCallback((data: CreateAiTaskVO) => {
    setConversations((prev) => [data.conversation, ...prev]);
    navigate('/flow', {state: {convId: data.conversation.id, taskId: data.taskId} as FlowLocationState});
  }, [navigate]);

  const handleConversationClick = useCallback((convId: number) => {
    navigate('/flow', {state: {convId} as FlowLocationState});
  }, [navigate]);

  const [appContext] = useState<AppContext>({
    handleTitleUpdate, handleBlankQuery
  });

  return (
    <>
      {/* 登录模态框 */}
      {!isLogin && (
        <div className="fixed inset-0 z-50 bg-black/50 backdrop-blur-sm">
          <div className="fixed left-1/2 top-1/2 -translate-x-1/2 -translate-y-1/2 w-[420px] bg-white rounded-xl shadow-2xl p-6 animate-in fade-in-0 zoom-in-95">
            <AuthForm onSuccess={handleLoginSuccess} />
          </div>
        </div>
      )}

      {/* 主页面 */}
      <SidebarProvider>
        {/* 左边 */}
        <Sidebar className="pr-4 bg-gradient-to-b from-neutral-50 to-neutral-100" variant="inset">
          {/* 头部标志 */}
          <SidebarHeader className="border-b border-neutral-200">
            <div className="cursor-pointer relative m-3 mb-3 hidden transition-all md:flex justify-start items-center shrink-0">
              <div className="pointer-events-none select-none relative flex items-center gap-1">
                <img className="h-[32px] transition-transform hover:scale-110" src={DrawSeeIcon} alt="DrawSee" />
                <div className="ml-2 text-[32px] font-bold overflow-hidden whitespace-nowrap bg-gradient-to-r from-neutral-950 to-neutral-500 bg-clip-text text-transparent">
                  昭析
                </div>
              </div>
            </div>
          </SidebarHeader>

          {/* 中间内容 */}
          <SidebarContent className="overflow-y-auto max-h-[calc(100vh-100px)] scrollbar-hide">
            <div className="pl-4 pr-1.5 mt-6">
              <button
                onClick={() => navigate('/blank')}
                className="group px-[12px] text-[14px] select-none h-12 items-center leading-5 tracking-normal gap-2 flex w-full cursor-pointer justify-between rounded-lg bg-white py-4 text-left font-medium text-neutral-900 shadow-sm ring-1 ring-neutral-200 transition duration-200 hover:shadow-md hover:ring-neutral-300">
                <span className="transition-colors group-hover:text-neutral-700">新建对话</span>
                <MessageCirclePlus size="18px" className="transition-transform group-hover:scale-110" />
              </button>

              <Collapsible defaultOpen={true}>
                <div className="flex items-center gap-1.5 mb-0 mt-10">
                  <CollapsibleTrigger className="w-full" asChild>
                    <button className="flex items-center gap-1 group select-none hover:text-neutral-900 w-full">
                      <span className="text-[15px] font-medium hover:text-black opacity-80">历史会话</span>
                      <ChevronRight size="18px" className="group-data-[state=open]:rotate-90 transition duration-200"/>
                    </button>
                  </CollapsibleTrigger>
                </div>
                <CollapsibleContent className="mt-2.5 space-y-1 overflow-y-auto max-h-[calc(100vh-300px)] scrollbar-hide">
                  {conversations.map((conversation) => (
                    <div
                      key={conversation.id}
                      onClick={() => handleConversationClick(conversation.id)}
                      className="
                        group relative flex select-none items-center justify-between gap-1 rounded-lg px-3 py-2.5 text-sm
                        text-neutral-700 transition-all duration-200 hover:bg-white hover:shadow-sm hover:ring-1 hover:ring-neutral-200
                        cursor-pointer
                      "
                    >
                      <div className="flex items-center gap-2">
                        <Sparkles size="16px" className="text-neutral-500 transition-colors group-hover:text-neutral-700"/>
                        <span className="select-none truncate group-hover:font-medium pl-1 max-w-52 transition-colors">
                          {conversation.title}
                        </span>
                      </div>
                    </div>
                  ))}
                  {/* 占位 */}
                  <div className="h-12" />
                </CollapsibleContent>
              </Collapsible>
            </div>
          </SidebarContent>

          {/* 底部用户 */}
          <SidebarFooter className="border-t border-neutral-200">
            {isLogin && (
              <NavUser user={{name: 'Jason', avatar: 'https://avatars.githubusercontent.com/u/10216806?v=4'}}/>
            )}
          </SidebarFooter>
        </Sidebar>

        {/* 右边 */}
        <SidebarInset>
          <div className="flex flex-1 flex-col gap-4 p-4 pt-0 select-none">
            <div style={{ width: "100%", height: "100%" }}>
              <Outlet context={appContext} />
            </div>
          </div>
        </SidebarInset>
      </SidebarProvider>

      {/* 通知组件 */}
      <Toaster/>
    </>
  );
}

export default App;