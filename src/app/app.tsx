import {Outlet, useNavigate} from "react-router-dom";
import { Toaster } from "@/common/components/ui/sonner.tsx";
import {
  SidebarInset,
  SidebarProvider,
} from "@/app/components/ui/sidebar.tsx";
import {useCallback, useEffect, useState} from "react";
import {LOGIN_FLAG_KEY, TOKEN_KEY} from "@/common/constant/storage-key.constant.ts";
import {checkLogin} from "@/api/methods/auth.methods.ts";
import {toast} from "sonner";
import {ConversationVO, CreateAiTaskVO} from "@/api/types/flow.types.ts";
import {useRequest} from "alova/client";
import {getConversations} from "@/api/methods/flow.methods.ts";
import AuthForm from "@/app/components/form/auth-form.tsx";
import { FlowLocationState } from "@/app/contexts/FlowContext";
import AppSideBar from "./components/AppSideBar";
import { AppContext } from "@/app/contexts/AppContext";

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
  }, [getConvData, navigate]);

  const handleLoginSuccess = useCallback((token?: string) => {
    setIsLogin(true);
    if (token) {
      localStorage.setItem(TOKEN_KEY, token);
    }
    sessionStorage.setItem(LOGIN_FLAG_KEY, JSON.stringify(true));
    navigate("/blank");
    getConvData();
  }, [getConvData, navigate]);

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

  const handleNewChat = useCallback((convId: number) => {
    // 把convId对应的conversation移动到最前面
    setConversations((prev) => [prev.find((c) => c.id === convId) as ConversationVO, ...prev.filter((c) => c.id !== convId)]);
  }, []);

  return (
    <AppContext.Provider value={{conversations, isLogin, handleBlankQuery, handleTitleUpdate, handleNewChat}}>
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
        <AppSideBar/>

        {/* 右边 */}
        <SidebarInset>
          <div className="flex flex-1 flex-col gap-4 p-2 select-none items-center justify-center">
            <div style={{ width: "100%", height: "100%" }}>
              <Outlet/>
            </div>
          </div>
        </SidebarInset>
      </SidebarProvider>

      {/* 通知组件 */}
      <Toaster/>
    </AppContext.Provider>
  );
}

export default App;