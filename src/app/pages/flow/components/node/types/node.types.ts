import { Node } from '@xyflow/react';
import { NodeType, ResourceNodeData } from '@/api/types/flow.types';

export interface BaseNodeData {
  title?: string;
  text?: string;
  parentId: number | null;
  convId: number;
  userId: number;
  createdAt: number;
  updatedAt: number;
  height?: number;
  [key: string]: unknown;
}

export interface RootNodeData extends Omit<BaseNodeData, 'title' | 'text'> {
  [key: string]: unknown;
}

export interface QueryNodeData extends BaseNodeData {
  mode: 'general' | 'knowledge' | 'animation' | 'solver-first';
  [key: string]: unknown;
}

type AnswerSubType = 'solver-first' | 'solver-continue' | 'solver-summary' | 'html-maker' | 'planner-first' | 'planner-split' | 'animation' | 'ANSWER_POINT' | 'ANSWER_DETAIL';

export interface AnswerNodeData extends BaseNodeData {
  subtype?: AnswerSubType;
  isDone?: boolean;
  isGenerated?: boolean;
  angle?: string;
  [key: string]: unknown;
}

export interface KnowledgeHeadNodeData extends BaseNodeData {
  [key: string]: unknown;
  isGenerated: boolean;
}

export interface KnowledgeDetailNodeData extends BaseNodeData {
  media?: {
    bilibiliUrls?: string[];
    animationObjectNames?: string[];
  };
  [key: string]: unknown;
}

export type NodeData<T extends string> = 
  T extends 'root' ? RootNodeData :
  T extends 'query' ? QueryNodeData :
  T extends 'answer' ? AnswerNodeData :
  T extends 'answer-point' | 'ANSWER_POINT' ? AnswerNodeData :
  T extends 'answer-detail' | 'ANSWER_DETAIL' ? AnswerNodeData :
  T extends 'knowledge-head' ? KnowledgeHeadNodeData :
  T extends 'knowledge-detail' ? KnowledgeDetailNodeData :
  T extends 'resource' ? ResourceNodeData :
  BaseNodeData;

export type FlowNode<T extends NodeType> = Node<NodeData<T>>;
export type RootNode = FlowNode<'root'>;
export type QueryNode = FlowNode<'query'>;
export type AnswerNode = FlowNode<'answer'>;
export type AnswerPointNode = FlowNode<'answer-point' | 'ANSWER_POINT'>;
export type AnswerDetailNode = FlowNode<'answer-detail' | 'ANSWER_DETAIL'>;
export type KnowledgeHeadNode = FlowNode<'knowledge-head'>;
export type KnowledgeDetailNode = FlowNode<'knowledge-detail'>;
export type ResourceNode = FlowNode<'resource'>;
