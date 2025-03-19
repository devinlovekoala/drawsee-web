import { Node } from '@xyflow/react';
import { AiTaskType, NodeType } from '@/api/types/flow.types';

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
  mode: AiTaskType;
  [key: string]: unknown;
}

export interface AnswerNodeData extends BaseNodeData {
  [key: string]: unknown;
}

export interface KnowledgeHeadNodeData extends BaseNodeData {
  [key: string]: unknown;
}

export interface KnowledgeDetailNodeData extends BaseNodeData {
  media?: {
    bilibiliUrls?: string[];
    animationObjectNames?: string[];
  };
  [key: string]: unknown;
}

export interface AnimationNodeData extends BaseNodeData {
  [key: string]: unknown;
}

export type NodeData<T extends string> = 
  T extends 'root' ? RootNodeData :
  T extends 'query' ? QueryNodeData :
  T extends 'answer' ? AnswerNodeData :
  T extends 'knowledge-head' ? KnowledgeHeadNodeData :
  T extends 'knowledge-detail' ? KnowledgeDetailNodeData :
  T extends 'animation' ? AnimationNodeData :
  BaseNodeData;

export type FlowNode<T extends NodeType> = Node<NodeData<T>>;
export type QueryNode = FlowNode<'query'>;
export type AnswerNode = FlowNode<'answer'>;
export type KnowledgeHeadNode = FlowNode<'knowledge-head'>;
export type KnowledgeDetailNode = FlowNode<'knowledge-detail'>; 