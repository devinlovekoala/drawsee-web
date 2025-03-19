import { createContext, useContext } from "react";
import { ConversationVO, CreateAiTaskVO } from "@/api/types/flow.types.ts";

export interface AppContextType {
  conversations: Array<ConversationVO>;
  isLogin: boolean;
  handleBlankQuery: (data: CreateAiTaskVO) => void;
  handleTitleUpdate: (convId: number, title: string) => void;
  handleNewChat: (convId: number) => void;
}

export const AppContext = createContext<AppContextType>({
  conversations: [],
  isLogin: false,
  handleBlankQuery: () => {},
  handleTitleUpdate: () => {},
  handleNewChat: () => {},
});

export const useAppContext = () => {
  const context = useContext(AppContext);
  if (!context) {
    throw new Error("useAppContext must be used within an AppContextProvider");
  }
  return context;
}; 