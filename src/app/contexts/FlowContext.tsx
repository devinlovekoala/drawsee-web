import { createContext, useContext } from "react";

export type FlowLocationState = {
  convId: number;
  taskId?: number;
};

export type FlowContextType = {
  chat: (taskId: number) => void;
  convId: number;
}

export const FlowContext = createContext<FlowContextType>({
  chat: () => {},
  convId: -1,
});

export const useFlowContext = () => {
  const context = useContext(FlowContext);
  if (!context) {
    throw new Error("useFlowContext must be used within a FlowContextProvider");
  }
  return context;
}; 