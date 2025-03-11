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
import {Dialog} from "radix-ui";
import "@/app/dialog.css";

export interface AppContext {
  handleBlankQuery: (data: CreateAiTaskVO) => void;
  handleTitleUpdate: (convId: number, title: string) => void;
}

function App() {

  const navigate = useNavigate();

  useEffect(() => {
    const loginFlag = sessionStorage.getItem(LOGIN_FLAG_KEY);
    if (!loginFlag) {
      checkLogin()
        .then(() => {
          // token有效，登录成功
          toast.info("欢迎回来");
          sessionStorage.setItem(LOGIN_FLAG_KEY, JSON.stringify(true));
          setIsLogin(true);
        })
        .catch(() => {
          // 无token或token失效，需要登录
          toast.error("未登录，请先登录");
          setIsLogin(false);
        });
    }
  }, [navigate]);

  const [conversations, setConversations] = useState<Array<ConversationVO>>([]);
  const [isLogin, setIsLogin] = useState<boolean>(false);

  const {send} = useRequest(getConversations(), {immediate: false});

  const handleLoginSuccess = useCallback((token?: string) => {
    setIsLogin(true);
    if (token) {
      localStorage.setItem(TOKEN_KEY, token);
    }
    sessionStorage.setItem(LOGIN_FLAG_KEY, JSON.stringify(true));
    navigate("/blank");
    send().then((data) => {
      setConversations(data);
    }).catch((error: Error) => {
      toast.error(`获取会话数据失败，${error.message}`);
    });
  }, [navigate, send]);

  const handleTitleUpdate = useCallback((convId: number, title: string) => {
    setConversations((prev) =>
      // 更新id为指定id的conversation的title
      prev.map((conversation) =>
        conversation.id === convId
          ? { ...conversation, title }
          : conversation
      )
    );
  }, []);

  const handleBlankQuery = useCallback((data: CreateAiTaskVO) => {

  }, []);

  const [appContext] = useState<AppContext>({
    handleTitleUpdate, handleBlankQuery
  });

  return (
  <>
    {/* 主页面 */}
    <SidebarProvider>
      {/* 左边 */}
      <Sidebar className="pr-4" variant="inset">
        {/* 头部标志 */}
        <SidebarHeader>
          <div className="cursor-pointer relative m-3 mb-3 hidden transition-all md:flex justify-start items-center shrink-0">
            <div className="pointer-events-none select-none relative flex items-center gap-1 h-5">
              <img className="h-[28px]" src={DrawSeeIcon} alt="DrawSee" />
              <div className="ml-2 text-[28px] font-bold overflow-hidden whitespace-nowrap">
                昭析
              </div>
            </div>
          </div>
        </SidebarHeader>
        {/* 中间内容 */}
        <SidebarContent>
          <div className="pl-4 pr-1.5 mt-6">
            <button
              onClick={() => {}}
              className="px-[12px] text-[14px] select-none h-8 items-center leading-5 tracking-normal gap-2 flex w-full cursor-pointer justify-between rounded-md bg-neutral-100 py-4 text-left font-medium text-neutral-900 ring-2 ring-neutral-200 transition duration-200 hover:scale-[0.97] hover:ring-neutral-300">
              <span>新建对话</span>
              <MessageCirclePlus size="18px" />
            </button>

            <Collapsible>
              <div className="flex items-center gap-1.5 mb-0 mt-10">
                <CollapsibleTrigger className="" asChild>
                  <button className="flex items-center gap-1 group select-none hover:text-neutral-900">
                    <span className="text-[15px] hover:text-black opacity-60">历史会话</span>
                    <ChevronRight size="18px" className="group-data-[state=open]:rotate-90 transition duration-200"/>
                  </button>
                </CollapsibleTrigger>
              </div>
              <CollapsibleContent className="mt-2.5">
                {conversations.map((conversation) => (
                    <div
                        key={conversation.id}
                        className="
                          my-1.5 group relative flex select-none items-center justify-between gap-1 rounded-lg px-1.5 py-2 text-sm
                          opacity-80 duration-200 hover:bg-neutral-200 dark:hover:bg-neutral-600/80 dark:text-neutral-300 cursor-pointer
                        "
                    >
                      <div className="flex items-center gap-1">
                        <Sparkles size="18px"/>
                        <span className="select-none truncate group-hover:font-medium pl-1 max-w-52">{conversation.title}</span>
                      </div>
                    </div>
                ))}
              </CollapsibleContent>
            </Collapsible>
          </div>
        </SidebarContent>
        {/* 底部用户 */}
        <SidebarFooter>
          <Dialog.Root>
            {
              isLogin ?
              <NavUser user={{name: 'Jason', avatar: 'https://avatars.githubusercontent.com/u/10216806?v=4'}}/>
              :
              <Dialog.Trigger asChild>
                <button className="border-2 border-black bg-white text-black text-3xl rounded-md">
                  点击登录
                </button>
              </Dialog.Trigger>
            }
            <Dialog.Portal>
              <Dialog.Overlay className="dialog-overlay" />
              <Dialog.Content className="dialog-content">
                <AuthForm onSuccess={handleLoginSuccess}/>
              </Dialog.Content>
            </Dialog.Portal>
          </Dialog.Root>
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