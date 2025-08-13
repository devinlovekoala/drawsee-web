export type NodeType = "root" | "query" | "answer" | "answer-point" | "answer-detail" | "ANSWER_POINT" | "ANSWER_DETAIL" | "knowledge-head" | "knowledge-detail" | "resource" | "circuit-canvas" | "circuit-point" | "circuit-detail" | "PDF_DOCUMENT" | "PDF_ANALYSIS_POINT" | "PDF_ANALYSIS_DETAIL";

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

// PDF相关节点数据类型
interface PdfDocumentNodeData extends BaseNodeData {
  fileUrl: string;
  fileType: string;
}

interface PdfAnalysisPointNodeData extends BaseNodeData {
  subtype: 'pdf-analysis-point';
}

interface PdfAnalysisDetailNodeData extends BaseNodeData {
  subtype: 'pdf-analysis-detail';
  angle?: string; // 分析角度
}

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
  'PDF_DOCUMENT': PdfDocumentNodeData;
  'PDF_ANALYSIS_POINT': PdfAnalysisPointNodeData;
  'PDF_ANALYSIS_DETAIL': PdfAnalysisDetailNodeData;
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
  | "CIRCUIT_DETAIL"
  | "PDF_CIRCUIT_ANALYSIS"        // 第一阶段：PDF电路实验文档分析生成分析点
  | "PDF_CIRCUIT_ANALYSIS_DETAIL" // 第二阶段：展开PDF电路实验分析点的详情
  | "PDF_CIRCUIT_DESIGN";         // 保留：通过电路实验pdf任务文档获取电路分析图AI任务

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