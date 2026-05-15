import {Outlet, useLocation, useNavigate} from "react-router-dom";
import { Toaster } from "@/common/components/ui/sonner.tsx";
import {
  SidebarInset,
  SidebarProvider,
} from "@/app/components/ui/sidebar.tsx";
import {useCallback, useEffect, useRef, useState} from "react";
import {FIRST_ENTER_KEY, LOGIN_FLAG_KEY, TOKEN_KEY, SHARE_CONTINUE_TOKEN_KEY} from "@/common/constant/storage-key.constant.ts";
import {checkLogin} from "@/api/methods/auth.methods.ts";
import {toast} from "sonner";
import {ConversationVO, CreateAiTaskVO} from "@/api/types/flow.types.ts";
import {useRequest} from "alova/client";
import {getConversations, deleteNode, deleteConversation, forkSharedConversation} from "@/api/methods/flow.methods.ts";
import AuthForm from "@/app/components/form/auth-form.tsx";
import { FlowLocationState } from "@/app/contexts/FlowContext";
import AppSideBar from "./components/AppSideBar";
import { AppContext, DeleteDialogState } from "@/app/contexts/AppContext";
import { NODE_WIDTH } from "./pages/flow/constants";
import HtmlPreviewModal from "./pages/flow/components/markdown/HtmlPreviewModal";
import Dialog from "@/common/components/ui/dialog";
import TextSelectionToolbar from "./components/text-selection/TextSelectionToolbar";
import { LoginVO } from "@/api/types/auth.types";
import About from "@/about/about";

export interface UserInfo {
  username: string;
  aiTaskCount: number;
  aiTaskLimit: number;
}

function App() {
  const navigate = useNavigate();

  // 会话列表
  const [conversations, setConversations] = useState<Array<ConversationVO>>([]);
  // 当前激活的会话ID
  const [activeConversationId, setActiveConversationId] = useState<number | null>(null);
  // 是否登录
  const [isLogin, setIsLogin] = useState<boolean>(
    sessionStorage.getItem(LOGIN_FLAG_KEY) === 'true'
  );
  const [showAuthModal, setShowAuthModal] = useState<boolean>(!isLogin);
  const [hasDismissedAuthModal, setHasDismissedAuthModal] = useState<boolean>(false);
  // 节点宽度
  const [nodeWidth, setNodeWidth] = useState<number>(NODE_WIDTH);
  
  // 用户信息
  const [userInfo, setUserInfo] = useState<UserInfo | null>(null);

  // HTML预览相关状态
  const [isHtmlPreviewOpen, setIsHtmlPreviewOpen] = useState<boolean>(false);
  const [previewHtmlContent, setPreviewHtmlContent] = useState<string>('');
  
  // 文本引用相关状态
  const [quoteText, setQuoteText] = useState<string | null>(null);
  
  // 删除对话框相关状态
  const [deleteDialogState, setDeleteDialogState] = useState<DeleteDialogState>({
    isOpen: false,
    isLoading: false,
    entityType: null,
    entityId: null,
    title: '',
    description: ''
  });

  const location = useLocation();
  const isShareRoute = location.pathname.startsWith('/share/');
  const lastRequireLoginLocationKeyRef = useRef<string | null>(null);
  
  // 数据获取接口，初始化时不会自动发送请求，需要手动调用send()方法，force: true表示不使用缓存
  const {send} = useRequest(getConversations(), {immediate: false, force: true});

  // 获取conversation数据
  const getConvData = useCallback(() => {
    send().then((data) => {
      setConversations(data);
      //console.log('getConvData, conversations', data);
    }).catch((error: Error) => {
      toast.error(`获取会话数据失败，${error.message}`);
    });
  }, [send]);

  const handleShareContinue = useCallback(async () => {
    if (!isLogin) return;
    const shareToken = sessionStorage.getItem(SHARE_CONTINUE_TOKEN_KEY);
    if (!shareToken) return;
    sessionStorage.removeItem(SHARE_CONTINUE_TOKEN_KEY);
    try {
      const data = await forkSharedConversation(shareToken);
      getConvData();
      navigate('/flow', { state: { convId: data.conversation.id } as FlowLocationState });
    } catch (error: any) {
      console.error('继续分享会话失败:', error);
      toast.error('继续分享会话失败，请稍后重试');
    }
  }, [getConvData, isLogin, navigate]);

  // 页面刷新或前进后退时，重新获取conversation数据和用户信息
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
      checkLogin().then((data) => {
        setUserInfo({
          username: data.username,
          aiTaskCount: data.aiTaskCount,
          aiTaskLimit: data.aiTaskLimit
        });
      });
      getConvData(); // 刷新后执行 getConvData
    }
    return () => {
      window.removeEventListener('beforeunload', handleBeforeUnload);
      window.removeEventListener('popstate', handlePopState);
    };
  }, [getConvData, location.pathname]);

  useEffect(() => {
    handleShareContinue();
  }, [handleShareContinue]);

  useEffect(() => {
    // 如果是第一次进入本网页，那么跳转到about页面
    const firstEnter = localStorage.getItem(FIRST_ENTER_KEY);
    if (!firstEnter) {
      localStorage.setItem(FIRST_ENTER_KEY, JSON.stringify(true));
      sessionStorage.removeItem(LOGIN_FLAG_KEY);
      setIsLogin(false);
      setShowAuthModal(true);
      setHasDismissedAuthModal(false);
    }

    // 如果已经登录，就不需要处理其他逻辑了
    const loginFlag = sessionStorage.getItem(LOGIN_FLAG_KEY);
    if (loginFlag === 'true') {
      // 已登录状态下，如果有requireLogin参数，清除它
      if (location.state && (location.state as any).requireLogin) {
        window.history.replaceState({}, document.title, window.location.pathname);
      }
      return;
    }

    // 检查是否要求显示登录表单
    const locationState = location.state as { requireLogin?: boolean; loginRequestId?: number } | null;
    if (locationState?.requireLogin) {
      setIsLogin(false);
      const isNewRequireLoginRequest = lastRequireLoginLocationKeyRef.current !== location.key;

      if (isNewRequireLoginRequest) {
        lastRequireLoginLocationKeyRef.current = location.key;
        setHasDismissedAuthModal(false);
        setShowAuthModal(true);
      } else if (!hasDismissedAuthModal && !showAuthModal) {
        setShowAuthModal(true);
      }
      return;
    }

    // 检查是否已经登出
    const hasLoggedOut = localStorage.getItem('Auth:LoggedOut') === 'true';
    
    // 如果用户已经主动登出，则不执行自动登录，而是显示登录界面
    if (hasLoggedOut) {
      setIsLogin(false);
      if (!hasDismissedAuthModal) {
        setShowAuthModal(true);
      }
      return;
    }
    
    // 尝试自动登录
    checkLogin()
      .then((data) => {
        toast.info("欢迎回来");
        sessionStorage.setItem(LOGIN_FLAG_KEY, JSON.stringify(true));
        // 清除登出标志
        localStorage.removeItem('Auth:LoggedOut');
        setIsLogin(true);
        setShowAuthModal(false);
        setHasDismissedAuthModal(false);
        setUserInfo({
          username: data.username,
          aiTaskCount: data.aiTaskCount,
          aiTaskLimit: data.aiTaskLimit
        });
        getConvData();
        navigate("/circuit", { replace: true });
      })
      .catch(() => {
        toast.error("未登录，请先登录");
        setIsLogin(false);
        if (!hasDismissedAuthModal) {
          setShowAuthModal(true);
        }
      });
  }, [getConvData, navigate, location.pathname, location.state, hasDismissedAuthModal]);

  // 登录成功后的操作
  const handleLoginSuccess = useCallback((data: LoginVO) => {
    // 防止重复处理，如果已经登录则不执行后续操作
    if (isLogin) return;
    
    // 立即更新登录状态，避免重复显示登录表单
    setIsLogin(true);
    setShowAuthModal(false);
    setHasDismissedAuthModal(false);
    
    if (data.token) {
      localStorage.setItem(TOKEN_KEY, data.token);
    }
    // 清除登出标志
    localStorage.removeItem('Auth:LoggedOut');
    
    // 更新用户信息
    setUserInfo({
      username: data.username,
      aiTaskCount: data.aiTaskCount,
      aiTaskLimit: data.aiTaskLimit
    });
    
    // 设置登录标志
    sessionStorage.setItem(LOGIN_FLAG_KEY, JSON.stringify(true));
    
    // 清除URL中的state参数，避免在跳转后仍然保留requireLogin标志
    window.history.replaceState({}, document.title, window.location.pathname);
    
    // 跳转到电路分析页面
    navigate("/circuit", { replace: true });
    
    // 获取会话数据
    getConvData();
  }, [isLogin, getConvData, navigate]);

  // 删除对话框相关函数
  const openDeleteNodeDialog = useCallback((nodeId: string) => {
    setDeleteDialogState({
      isOpen: true,
      isLoading: false,
      entityType: 'node',
      entityId: nodeId,
      title: '删除节点',
      description: '你确定要删除这个节点吗？删除该节点代表删除该节点及其所有后代节点，此操作不可撤销。'
    });
  }, []);

  // 打开删除会话对话框
  const openDeleteConversationDialog = useCallback((convId: string) => {
    setDeleteDialogState({
      isOpen: true,
      isLoading: false,
      entityType: 'conversation',
      entityId: convId,
      title: '删除会话',
      description: '你确定要删除整个会话吗？此操作将删除会话中的所有节点，且不可撤销。'
    });
  }, []);

  // 关闭删除对话框
  const closeDeleteDialog = useCallback(() => {
    setDeleteDialogState(prev => ({
      ...prev,
      isOpen: false
    }));
  }, []);

  // 删除节点或会话
  const confirmDelete = useCallback(() => {
    if (!deleteDialogState.entityId || !deleteDialogState.entityType) return;
    
    // 设置加载状态
    setDeleteDialogState(prev => ({
      ...prev,
      isLoading: true
    }));
    
    if (deleteDialogState.entityType === 'node') {
      deleteNode(deleteDialogState.entityId)
        .then(() => {
          toast.success('节点已成功删除');
          // 触发自定义事件通知组件更新
          window.dispatchEvent(new CustomEvent('node-deleted', { detail: { nodeId: deleteDialogState.entityId } }));
          closeDeleteDialog();
        })
        .catch((error) => {
          toast.error(`删除节点失败: ${error.message}`);
          setDeleteDialogState(prev => ({
            ...prev,
            isLoading: false
          }));
        });
    } else if (deleteDialogState.entityType === 'conversation') {
      deleteConversation(deleteDialogState.entityId)
        .then(() => {
          toast.success('会话已成功删除');
          // 更新会话列表
          setConversations(prev => 
            prev.filter(conv => conv.id.toString() !== deleteDialogState.entityId)
          );
          // 跳转到空白页
          navigate('/blank', { state: { from: '/flow' } });
          closeDeleteDialog();
        })
        .catch((error) => {
          toast.error(`删除会话失败: ${error.message}`);
          setDeleteDialogState(prev => ({
            ...prev,
            isLoading: false
          }));
        });
    }
  }, [deleteDialogState.entityId, deleteDialogState.entityType, closeDeleteDialog, navigate]);

  // 更新conversation的标题
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

  // /blank页面触发对话
  const handleBlankQuery = useCallback((data: CreateAiTaskVO, classId?: string | null) => {
    setConversations((prev) => {
      const newConversations = [{...data.conversation}, ...prev];
      console.log('handleBlankQuery, newConversations', newConversations);
      return newConversations;
    });
    setActiveConversationId(data.conversation.id);
    if (classId) {
      sessionStorage.setItem(`flow_class_id_${data.conversation.id}`, classId);
    }
    navigate('/flow', {
      state: {
        convId: data.conversation.id,
        taskId: data.taskId,
        classId: classId ?? null
      } as FlowLocationState
    });
  }, [navigate, setActiveConversationId]);

  // 触发新对话时，把对应的conversation移动到最前面
  const handleNewChat = useCallback((convId: number) => {
    // 把convId对应的conversation移动到最前面
    setConversations((prev) => {
      const conversationToMove = prev.find(conversation => conversation.id === convId);
      console.log('handleNewChat, conversationToMove, prev', conversationToMove, prev);
      if (!conversationToMove) return prev;
      return [conversationToMove, ...prev.filter(conversation => conversation.id !== convId)];
    });
  }, []);

  // 退出登录
  const handleLogout = useCallback(() => {
    // 清除会话存储
    sessionStorage.clear();
    // 只清除身份验证相关的localStorage，保留其他设置
    localStorage.removeItem(TOKEN_KEY);
    // 设置一个显式的登出标志，以便区分首次访问和已登出状态
    localStorage.setItem('Auth:LoggedOut', 'true');
    // 更新状态
    setIsLogin(false);
    setShowAuthModal(true);
    setHasDismissedAuthModal(false);
  }, []);

  // HTML预览相关函数
  const openHtmlPreview = useCallback((htmlContent: string) => {
    setPreviewHtmlContent(htmlContent);
    setIsHtmlPreviewOpen(true);
  }, []);

  // 关闭HTML预览
  const closeHtmlPreview = useCallback(() => {
    setIsHtmlPreviewOpen(false);
    setPreviewHtmlContent('');
  }, []);

  // 侧边栏相关状态
  const [openSideBar, setOpenSideBar] = useState<boolean>(true);
  
  // 收起/展开侧边栏
  const toggleSideBar = useCallback(() => {
    setOpenSideBar(prev => !prev);
  }, []);

  // 增加AI任务计数
  const handleAiTaskCountPlus = useCallback(() => {
    setUserInfo(prev => {
      if (!prev) return null;
      return {
        ...prev,
        aiTaskCount: prev.aiTaskCount + 1
      };
    });
  }, []);
  

  return (
    <AppContext.Provider value={{
      conversations, 
      isLogin, 
      nodeWidth, 
      setNodeWidth, 
      isHtmlPreviewOpen,
      previewHtmlContent,
      openHtmlPreview,
      closeHtmlPreview,
      // 文本引用相关
      quoteText,
      setQuoteText,
      // 删除对话框相关
      deleteDialogState,
      openDeleteNodeDialog,
      openDeleteConversationDialog,
      closeDeleteDialog,
      confirmDelete,
      // 其他函数
      handleBlankQuery, 
      handleTitleUpdate, 
      handleNewChat, 
      handleLogout,
      // 侧边栏相关
      toggleSideBar,
      openSideBar,
      // 用户信息
      userInfo,
      handleAiTaskCountPlus
    }}>
      {/* 登录模态框 */}
      {!isLogin && !isShareRoute && (
        <>
          <About />
          {showAuthModal && (
            <div
              className="fixed inset-0 z-50 bg-black/50 backdrop-blur-sm"
            >
              <div
                className="fixed left-1/2 top-1/2 -translate-x-1/2 -translate-y-1/2 w-[420px] bg-white rounded-xl shadow-2xl p-6 animate-in fade-in-0 zoom-in-95 relative"
                onClick={(event) => event.stopPropagation()}
              >
                <button
                  type="button"
                  aria-label="关闭登录弹窗"
                  onClick={() => {
                    setShowAuthModal(false);
                    setHasDismissedAuthModal(true);
                  }}
                  className="absolute right-3 top-3 inline-flex h-8 w-8 items-center justify-center rounded-full text-gray-400 hover:bg-gray-100 hover:text-gray-600 transition-colors"
                >
                  <svg xmlns="http://www.w3.org/2000/svg" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round" className="h-4 w-4">
                    <line x1="18" y1="6" x2="6" y2="18" />
                    <line x1="6" y1="6" x2="18" y2="18" />
                  </svg>
                </button>
                <AuthForm onSuccess={handleLoginSuccess} />
              </div>
            </div>
          )}
        </>
      )}

      {/* 主页面 */}
      {(isLogin || isShareRoute) && (
        <SidebarProvider>
          {/* 侧边栏 */}
          <div className="relative">
            <AppSideBar
              activeConversationId={activeConversationId}
              setActiveConversationId={setActiveConversationId}
              className={!isLogin && isShareRoute ? 'pointer-events-none opacity-75' : undefined}
            />
            {!isLogin && isShareRoute && (
              <div className="pointer-events-none absolute inset-0 flex items-center justify-center bg-gradient-to-b from-white/40 to-white/80 text-xs text-neutral-600">
                登录后解锁侧边栏功能
              </div>
            )}
          </div>

          {/* 主内容区 */}
          <SidebarInset className="max-h-screen overflow-y-auto scrollbar-hide">
            <div className="flex flex-1 flex-col gap-4 p-2 select-none items-center justify-center">
              <div className="" style={{ width: "100%", height: "100%" }}>
                <Outlet/>
              </div>
            </div>
          </SidebarInset>
        </SidebarProvider>
      )}

      {/* 文本选择工具栏 */}
      <TextSelectionToolbar target=".markdown-container" />

      {/* HTML预览模态框 */}
      <HtmlPreviewModal
        isOpen={isHtmlPreviewOpen}
        onClose={closeHtmlPreview}
        htmlContent={previewHtmlContent}
      />

      {/* 删除确认对话框 */}
      <Dialog
        isOpen={deleteDialogState.isOpen}
        title={deleteDialogState.title}
        description={deleteDialogState.description}
        confirmText="删除"
        isLoading={deleteDialogState.isLoading}
        variant="danger"
        onConfirm={confirmDelete}
        onCancel={closeDeleteDialog}
      />

      {/* 通知组件 */}
      <Toaster/>
    </AppContext.Provider>
  );
}

export default App;
