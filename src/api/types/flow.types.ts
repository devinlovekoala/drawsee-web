import { NodeData as FlowNodeData } from "@/app/pages/flow/components/node/types/node.types";

export type NodeType = "root" | "query" | "answer" | "knowledge-head" | "knowledge-detail" | "resource";

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

export type ResourceSubType = "bilibili" | "animation" | "generated-animation" | "word" | "pdf";

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

interface WordDocResourceNodeData extends BaseNodeData {
  subtype: "word";
  urls: string[];
  [key: string]: unknown;
}

interface PdfDocResourceNodeData extends BaseNodeData {
  subtype: "pdf";
  urls: string[];
  [key: string]: unknown;
}

export type ResourceNodeData = 
  | BilibiliResourceNodeData 
  | AnimationResourceNodeData 
  | GeneratedAnimationResourceNodeData
  | WordDocResourceNodeData
  | PdfDocResourceNodeData;

export type NodeData = {
  root: RootNodeData;
  query: QueryNodeData;
  answer: AnswerNodeData;
  'knowledge-head': KnowledgeHeadNodeData;
  'knowledge-detail': KnowledgeDetailNodeData;
  'animation': AnimationNodeData;
  'resource': ResourceNodeData;
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
  | 'general'      // 常规问答模式
  | 'knowledge'    // 知识问答模式
  | 'knowledge-detail' // 知识详情
  | 'animation'    // 动画模式
  | 'solver-first'     // 开始解题模式
  | 'solver-continue'      // 继续解题模式
  | 'solver-summary'      // 总结解题模式
  | 'planner' // 目标解析模式
  | 'html-maker' // 网页生成模式
  | 'circuit-analyze' // 电路分析模式

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