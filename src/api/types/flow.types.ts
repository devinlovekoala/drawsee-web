export type NodeType = "root" | "query" | "answer" | "knowledge-head" | "knowledge-detail" | "animation";

export interface ConversationVO {
  id: number;
  title: string;
  userId: number;
  createdAt: number;
  updatedAt: number;
}

export interface NodeVO {
  id: number;
  type: NodeType;
  data: MapObject;
  position: XYPosition;
  parentId: number;
  convId: number;
  userId: number;
  createdAt: number;
  updatedAt: number;
}

export interface nodeToUpdate {
  id: number;
  position: XYPosition;
}

export interface MapObject {
  text: string;
  key: { [key: string]: unknown };
}

export interface XYPosition {
  x: number;
  y: number;
}

export type AiTaskType = "general" | "knowledge" | "knowledge-detail";

export interface CreateAiTaskVO {
  taskId: number;
  conversation: ConversationVO;
}

export interface AiTaskVO {
  id: number;
  type: AiTaskType;
  status: string;
  userId: number;
  convId: number;
  createdAt: number;
  updatedAt: number;
}

export interface CreateAiTaskDTO {
  type: AiTaskType;
  prompt: string | null;
  promptParams: Record<string, string> | null;
  convId: number | null;
  parentId: number | null;
}