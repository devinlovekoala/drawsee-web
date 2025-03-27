import { createContext, useContext } from "react";
import { ChatTask } from "../pages/flow/types/ChatTask.types";

export type FlowLocationState = {
  convId: number;
  taskId?: number;
  from?: string;
};

export type FlowContextType = {
  chat: (taskId: number) => void;
  convId: number;
  isChatting: boolean;
  addChatTask: (task: ChatTask) => void;
}

export const FlowContext = createContext<FlowContextType>({
  chat: () => {},
  convId: -1,
  isChatting: false,
  addChatTask: () => {},
});

export const useFlowContext = () => {
  const context = useContext(FlowContext);
  if (!context) {
    throw new Error("useFlowContext must be used within a FlowContextProvider");
  }
  return context;
}; 