import { createContext, useContext } from "react";
import { ConversationVO, CreateAiTaskVO } from "@/api/types/flow.types.ts";
import { NODE_WIDTH } from "../pages/flow/constants";

export interface AppContextType {
  conversations: Array<ConversationVO>;
  isLogin: boolean;
  nodeWidth: number;
  setNodeWidth: (width: number) => void;
  handleBlankQuery: (data: CreateAiTaskVO) => void;
  handleTitleUpdate: (convId: number, title: string) => void;
  handleNewChat: (convId: number) => void;
  handleLogout: () => void;
}

export const AppContext = createContext<AppContextType>({
  conversations: [],
  isLogin: false,
  nodeWidth: NODE_WIDTH,
  setNodeWidth: () => {},
  handleBlankQuery: () => {},
  handleTitleUpdate: () => {},
  handleNewChat: () => {},
  handleLogout: () => {},
});

export const useAppContext = () => {
  const context = useContext(AppContext);
  if (!context) {
    throw new Error("useAppContext must be used within an AppContextProvider");
  }
  return context;
}; 