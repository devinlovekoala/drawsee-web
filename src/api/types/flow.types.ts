export interface ConversationVO {
  id: number;
  title: string;
  tokens: number;
  userId: number;
}

export interface NodeVO {
  id: number;
  type: string;
  data: string;
  position: string;
  parentId: number;
  userId: number;
  convId: number;
}

export interface UpdatePositionNode {
  id: number;
  position: string;
}

export interface CreateTaskVO {
  taskId: number;
  convId: number;
}

export interface TaskVO {
  id: number;
  type: string;
  message: string;
  result: string;
  status: number;
  convId: number;
  userId: number;
}
