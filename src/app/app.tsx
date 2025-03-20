import {Outlet, useLocation, useNavigate} from "react-router-dom";
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
import { NODE_WIDTH } from "./pages/flow/constants";

function App() {
  const navigate = useNavigate();
  
  const [conversations, setConversations] = useState<Array<ConversationVO>>([]);
  const [activeConversationId, setActiveConversationId] = useState<number | null>(null);
  const [isLogin, setIsLogin] = useState<boolean>(true);
  const [nodeWidth, setNodeWidth] = useState<number>(NODE_WIDTH);

  const location = useLocation();
  
  const {send} = useRequest(getConversations(), {immediate: false, force: true});

  const getConvData = useCallback(() => {
    send().then((data) => {
      setConversations(data);
      //console.log('getConvData, conversations', data);
    }).catch((error: Error) => {
      toast.error(`获取会话数据失败，${error.message}`);
    });
  }, [send]);

  useEffect(() => {
    const handleBeforeUnload = () => {
      // 设置一个标志，表示页面正在被刷新
      sessionStorage.setItem('isRefreshing', 'true');
    };
    const handlePopState = () => {
      // 当用户进行前进或后退导航时，清除刷新标志
      sessionStorage.removeItem('isRefreshing');
      getConvData(); // 在前进或后退时执行 getConvData
    };
    window.addEventListener('beforeunload', handleBeforeUnload);
    window.addEventListener('popstate', handlePopState);
    // 检查页面是否被刷新
    const isRefreshing = sessionStorage.getItem('isRefreshing') === 'true';
    if (isRefreshing) {
      // 处理刷新情况
      console.log('页面被刷新');
      sessionStorage.removeItem('isRefreshing'); // 检查后清除标志
      getConvData(); // 刷新后执行 getConvData
    }
    return () => {
      window.removeEventListener('beforeunload', handleBeforeUnload);
      window.removeEventListener('popstate', handlePopState);
    };
  }, [getConvData, location.pathname]);

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
    console.log('handleTitleUpdate', convId, title);
    setConversations((prev) => {
      const newConversations = prev.map((conversation) =>
        conversation.id === convId
          ? { ...conversation, title }
          : conversation
      );
      console.log('handleTitleUpdate, newConversations', newConversations);
      return newConversations;
    });
  }, []);

  const handleBlankQuery = useCallback((data: CreateAiTaskVO) => {
    setConversations((prev) => {
      const newConversations = [{...data.conversation}, ...prev];
      console.log('handleBlankQuery, newConversations', newConversations);
      return newConversations;
    });
    setActiveConversationId(data.conversation.id);
    navigate('/flow', {state: {convId: data.conversation.id, taskId: data.taskId} as FlowLocationState});
  }, [navigate, setActiveConversationId]);

  const handleNewChat = useCallback((convId: number) => {
    // 把convId对应的conversation移动到最前面
    setConversations((prev) => {
      const conversationToMove = prev.find(conversation => conversation.id === convId);
      console.log('handleNewChat, conversationToMove, prev', conversationToMove, prev);
      if (!conversationToMove) return prev;
      return [conversationToMove, ...prev.filter(conversation => conversation.id !== convId)];
    });
  }, []);

  const handleLogout = useCallback(() => {
    sessionStorage.clear();
    localStorage.clear();
    setIsLogin(false);
    navigate('/');
  }, [navigate]);

  return (
    <AppContext.Provider value={{conversations, isLogin, nodeWidth, setNodeWidth, handleBlankQuery, handleTitleUpdate, handleNewChat, handleLogout}}>
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
        <AppSideBar
          activeConversationId={activeConversationId}
          setActiveConversationId={setActiveConversationId}
        />

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