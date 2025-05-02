export type NodeType = "root" | "query" | "answer" | "answer-point" | "answer-detail" | "ANSWER_POINT" | "ANSWER_DETAIL" | "knowledge-head" | "knowledge-detail" | "resource" | "circuit-canvas" | "circuit-point" | "circuit-detail";

export interface ConversationVO {
  id: number;
  title: string;
  userId: number;
  createdAt: number;
  updatedAt: number;
}

interface BaseNodeData {
  title: string;
  text: string;
  parentId: number | null;
  convId: number;
  userId: number;
  createdAt: number;
  updatedAt: number;
  [key: string]: unknown;
}

type RootNodeData = Omit<BaseNodeData, 'title' | 'text'>;

interface QueryNodeData extends BaseNodeData {
  mode: AiTaskType;
}

interface AnswerNodeData extends BaseNodeData {
  subtype?: string;
  isDone?: boolean;
};

type KnowledgeHeadNodeData = BaseNodeData;

type KnowledgeDetailNodeData = BaseNodeData;

type AnimationNodeData = BaseNodeData;

// 新版电路节点数据类型
interface CircuitCanvasNodeData extends BaseNodeData {
  subtype: 'circuit-canvas';
  circuitDesign?: any; // 电路设计数据
  mode?: string;
}

interface CircuitPointNodeData extends BaseNodeData {
  subtype: 'circuit-point';
}

interface CircuitDetailNodeData extends BaseNodeData {
  subtype: 'circuit-detail';
  angle?: string; // 分析角度
}

export type ResourceSubType = "bilibili" | "animation" | "generated-animation";

interface BilibiliResourceNodeData extends BaseNodeData {
  subtype: "bilibili";
  urls: string[];
  [key: string]: unknown;
}

interface AnimationResourceNodeData extends BaseNodeData {
  subtype: "animation";
  objectNames: string[];
  [key: string]: unknown;
}

interface GeneratedAnimationResourceNodeData extends BaseNodeData {
  subtype: "generated-animation";
  frame?: Uint8Array;
  objectName?: string;
  progress?: string;
  [key: string]: unknown;
}

export type ResourceNodeData = BilibiliResourceNodeData | AnimationResourceNodeData | GeneratedAnimationResourceNodeData;

export type NodeData = {
  root: RootNodeData;
  query: QueryNodeData;
  answer: AnswerNodeData;
  'answer-point': AnswerNodeData;
  'answer-detail': AnswerNodeData;
  'ANSWER_POINT': AnswerNodeData;
  'ANSWER_DETAIL': AnswerNodeData;
  'knowledge-head': KnowledgeHeadNodeData;
  'knowledge-detail': KnowledgeDetailNodeData;
  'animation': AnimationNodeData;
  'resource': ResourceNodeData;
  'circuit-canvas': CircuitCanvasNodeData;
  'circuit-point': CircuitPointNodeData;
  'circuit-detail': CircuitDetailNodeData;
}

export interface NodeVO {
  id: number;
  type: NodeType;
  data: NodeData[keyof NodeData];
  position: XYPosition;
  height: number;
  parentId: number | null;
  convId: number;
  userId: number;
  createdAt: number;
  updatedAt: number;
}

export interface NodeToUpdate {
  id: number;
  position: XYPosition;
  height: number;
}

export interface XYPosition {
  x: number;
  y: number;
}

export type AiTaskType = 
  | "GENERAL" 
  | "GENERAL_CONTINUE" 
  | "GENERAL_DETAIL" 
  | "KNOWLEDGE" 
  | "KNOWLEDGE_DETAIL" 
  | "ANIMATION" 
  | "ANIMATION_DETAIL"
  | "SOLVER_FIRST" 
  | "SOLVER_CONTINUE" 
  | "SOLVER_SUMMARY" 
  | "CIRCUIT_ANALYSIS"
  | "CIRCUIT_DETAIL";

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
  model: string | null;
  classId: string | null;
}