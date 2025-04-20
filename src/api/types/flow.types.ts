export type NodeType = "root" | "query" | "answer" | "answer-point" | "answer-detail" | "ANSWER_POINT" | "ANSWER_DETAIL" | "knowledge-head" | "knowledge-detail" | "resource" | "CIRCUIT_BASIC" | "CIRCUIT_NODE_ANALYSIS" | "CIRCUIT_FUNCTION" | "CIRCUIT_OPTIMIZATION";

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

// 电路节点数据类型
interface CircuitBasicNodeData extends BaseNodeData {
  subtype: 'CIRCUIT_BASIC';
}

interface CircuitNodeAnalysisNodeData extends BaseNodeData {
  subtype: 'CIRCUIT_NODE_ANALYSIS';
}

interface CircuitFunctionNodeData extends BaseNodeData {
  subtype: 'CIRCUIT_FUNCTION';
}

interface CircuitOptimizationNodeData extends BaseNodeData {
  subtype: 'CIRCUIT_OPTIMIZATION';
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
  'CIRCUIT_BASIC': CircuitBasicNodeData;
  'CIRCUIT_NODE_ANALYSIS': CircuitNodeAnalysisNodeData;
  'CIRCUIT_FUNCTION': CircuitFunctionNodeData;
  'CIRCUIT_OPTIMIZATION': CircuitOptimizationNodeData;
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
  | 'GENERAL'      // 常规问答模式
  | 'GENERAL_DETAIL' // 通用详情模式
  | 'KNOWLEDGE'    // 知识问答模式
  | 'KNOWLEDGE_DETAIL' // 知识详情模式
  | 'ANIMATION'    // 动画生成模式
  | 'SOLVER_FIRST'     // 开始解题模式
  | 'SOLVER_CONTINUE'      // 继续解题模式
  | 'SOLVER_SUMMARY'      // 总结解题模式
  | 'PLANNER'       // 目标解析模式
  | 'HTML_MAKER'    // 网页生成模式
  | 'CIRCUIT_ANALYSIS' // 电路分析模式

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
}