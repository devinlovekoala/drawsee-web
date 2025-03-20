import { createContext, useContext } from "react";

export type FlowLocationState = {
  convId: number;
  taskId?: number;
};

export type FlowContextType = {
  chat: (taskId: number) => void;
  convId: number;
  isChatting: boolean;
}

export const FlowContext = createContext<FlowContextType>({
  chat: () => {},
  convId: -1,
  isChatting: false,
});

export const useFlowContext = () => {
  const context = useContext(FlowContext);
  if (!context) {
    throw new Error("useFlowContext must be used within a FlowContextProvider");
  }
  return context;
}; 