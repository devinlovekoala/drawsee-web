import React, { createContext, useState, useCallback, useContext, useMemo } from "react";
import { NODE_WIDTH } from "../pages/flow/constants";
import { CreateAiTaskVO, ConversationVO } from "@/api/types/flow.types.ts";

export interface UserInfo {
  username: string;
  aiTaskCount: number;
  aiTaskLimit: number;
}

export interface DeleteDialogState {
  isOpen: boolean;
  isLoading: boolean;
  entityType: 'node' | 'conversation' | null;
  entityId: string | null;
  title: string;
  description: string;
}

export interface AppContextType {
  conversations: Array<ConversationVO>;
  isLogin: boolean;
  nodeWidth: number;
  setNodeWidth: (width: number) => void;
  isHtmlPreviewOpen: boolean;
  previewHtmlContent: string;
  openHtmlPreview: (htmlContent: string) => void;
  closeHtmlPreview: () => void;
  
  // 文本引用相关
  quoteText: string | null;
  setQuoteText: (text: string | null) => void;
  
  // 删除对话框相关
  deleteDialogState: DeleteDialogState;
  openDeleteNodeDialog: (nodeId: string) => void;
  openDeleteConversationDialog: (convId: string) => void;
  closeDeleteDialog: () => void;
  confirmDelete: () => void;
  
  handleBlankQuery: (data: CreateAiTaskVO) => void;
  handleTitleUpdate: (convId: number, title: string) => void;
  handleNewChat: (convId: number) => void;
  handleLogout: () => void;

  toggleSideBar: () => void;
  openSideBar: boolean;

  userInfo: UserInfo | null;
  handleAiTaskCountPlus: () => void;
}

export const AppContext = createContext<AppContextType>({
  conversations: [],
  isLogin: false,
  nodeWidth: NODE_WIDTH,
  setNodeWidth: () => {},
  isHtmlPreviewOpen: false,
  previewHtmlContent: '',
  openHtmlPreview: () => {},
  closeHtmlPreview: () => {},
  
  // 文本引用相关
  quoteText: null,
  setQuoteText: () => {},
  
  // 删除对话框相关
  deleteDialogState: {
    isOpen: false,
    isLoading: false,
    entityType: null,
    entityId: null,
    title: '',
    description: ''
  },
  openDeleteNodeDialog: () => {},
  openDeleteConversationDialog: () => {},
  closeDeleteDialog: () => {},
  confirmDelete: () => {},
  
  handleBlankQuery: () => {},
  handleTitleUpdate: () => {},
  handleNewChat: () => {},
  handleLogout: () => {},

  toggleSideBar: () => {},
  openSideBar: true,

  userInfo: null,
  handleAiTaskCountPlus: () => {},
});

export const useAppContext = () => {
  const context = useContext(AppContext);
  if (!context) {
    throw new Error("useAppContext must be used within an AppContextProvider");
  }
  return context;
};

export interface AppProviderProps {
  children: React.ReactNode;
}

export const AppProvider: React.FC<AppProviderProps> = ({ children }) => {
  // 会话列表
  const [conversations, setConversations] = useState<Array<ConversationVO>>([]);
  // 是否登录
  const [isLogin, setIsLogin] = useState<boolean>(true);
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

  // 确认删除
  const confirmDelete = useCallback(() => {
    // 简化版，实际应调用相应API
    closeDeleteDialog();
  }, [closeDeleteDialog]);

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

  // 更新conversation的标题
  const handleTitleUpdate = useCallback((convId: number, title: string) => {
    setConversations((prev) => {
      const newConversations = prev.map((conversation) =>
        conversation.id === convId
          ? { ...conversation, title }
          : conversation
      );
      return newConversations;
    });
  }, []);

  // 处理新建对话
  const handleNewChat = useCallback((convId: number) => {
    // 把convId对应的conversation移动到最前面
    setConversations((prev) => {
      const conversationToMove = prev.find(conversation => conversation.id === convId);
      if (!conversationToMove) return prev;
      return [conversationToMove, ...prev.filter(conversation => conversation.id !== convId)];
    });
  }, []);

  // /blank页面触发对话
  const handleBlankQuery = useCallback((data: CreateAiTaskVO) => {
    setConversations((prev) => {
      const newConversations = [{...data.conversation}, ...prev];
      return newConversations;
    });
  }, []);

  // 退出登录
  const handleLogout = useCallback(() => {
    setIsLogin(false);
  }, []);

  const contextValue = useMemo<AppContextType>(() => ({
    conversations, 
    isLogin, 
    nodeWidth, 
    setNodeWidth, 
    isHtmlPreviewOpen,
    previewHtmlContent,
    openHtmlPreview,
    closeHtmlPreview,
    quoteText,
    setQuoteText,
    deleteDialogState,
    openDeleteNodeDialog,
    openDeleteConversationDialog,
    closeDeleteDialog,
    confirmDelete,
    handleBlankQuery, 
    handleTitleUpdate, 
    handleNewChat, 
    handleLogout,
    toggleSideBar,
    openSideBar,
    userInfo,
    handleAiTaskCountPlus
  }), [
    conversations, 
    isLogin, 
    nodeWidth, 
    setNodeWidth, 
    isHtmlPreviewOpen,
    previewHtmlContent,
    openHtmlPreview,
    closeHtmlPreview,
    quoteText,
    setQuoteText,
    deleteDialogState,
    openDeleteNodeDialog,
    openDeleteConversationDialog,
    closeDeleteDialog,
    confirmDelete,
    handleBlankQuery, 
    handleTitleUpdate, 
    handleNewChat, 
    handleLogout,
    toggleSideBar,
    openSideBar,
    userInfo,
    handleAiTaskCountPlus
  ]);

  return (
    <AppContext.Provider value={contextValue}>
      {children}
    </AppContext.Provider>
  );
};