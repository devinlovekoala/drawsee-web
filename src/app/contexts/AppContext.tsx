import { createContext, useContext } from "react";
import { ConversationVO, CreateAiTaskVO } from "@/api/types/flow.types.ts";
import { NODE_WIDTH } from "../pages/flow/constants";
import { UserInfo } from "../app";

// 删除会话和节点的对话框状态类型
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