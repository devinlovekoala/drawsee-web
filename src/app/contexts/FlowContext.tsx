import { createContext, useContext, type PropsWithChildren, useState, useMemo } from "react";
import { ChatTask } from "../pages/flow/types/ChatTask.types";

export interface FlowLocationState {
  convId: number | null;
  taskId?: number | null;
  from?: string;
}

export interface FlowContextValue {
  isChatting: boolean;
  convId: number | null;
  chat: (taskId: number) => void;
  addChatTask: (
    convId: number, 
    parentId: number | null, 
    type: 'knowledge', 
    question?: string, 
    callback?: (taskId: number) => void
  ) => Promise<void>;
}

export const FlowContext = createContext<FlowContextValue>({
  isChatting: false,
  convId: null,
  chat: () => {},
  addChatTask: async () => {}
});

export const useFlowContext = () => useContext(FlowContext);

export interface FlowProviderProps extends PropsWithChildren {
}

export function FlowProvider({children}: FlowProviderProps) {
  const [isChatting, setIsChatting] = useState(false);
  
  const contextValue = useMemo<FlowContextValue>(() => {
    return {
      isChatting,
      convId: null,
      chat: () => {},
      addChatTask: async () => {}
    };
  }, [isChatting]);
  
  return (
    <FlowContext.Provider value={contextValue}>
      {children}
    </FlowContext.Provider>
  );
} 