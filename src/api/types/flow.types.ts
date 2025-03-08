export interface ConversationVO {
  createdAt: number;
  id: number;
  title: string;
  updatedAt: number;
  userId: number;
}

export interface NodeVO {
  convId: number;
  createdAt: number;
  data: MapObject;
  id: number;
  parentId: number;
  position: XYPosition;
  type: string;
  updatedAt: number;
  userId: number;
}

export interface UpdatePositionNode {
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

export interface CreateAiTaskVO {
  convId: number;
  taskId: number;
}

export interface AiTaskVO {
  convId: number;
  createdAt: number;
  id: number;
  status: string;
  type: string;
  updatedAt: number;
  userId: number;
}

export interface CreateAiTaskDTO {
  convI: number;
  parentId: number;
  prompt: string;
  promptParams: MapString;
  type: string;
}

export interface MapString {
  key: string;
}