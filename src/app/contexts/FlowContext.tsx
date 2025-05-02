import React, { createContext, useContext } from "react";
import { ChatTask } from "../pages/flow/types/ChatTask.types";

export interface FlowLocationState {
  convId: number;
  taskId?: number;
  from?: string;
  classId?: string | null;
}

export interface FlowContextType {
  chat: (taskId: number) => void;
  convId: number | null;
  isChatting: boolean;
  addChatTask: (task: ChatTask) => void;
}

export const FlowContext = createContext<FlowContextType>({
  chat: () => {},
  convId: null,
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