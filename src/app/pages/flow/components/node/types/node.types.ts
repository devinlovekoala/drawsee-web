import { Node } from '@xyflow/react';
import { NodeType, NodeData as ApiNodeData } from '@/api/types/flow.types';

export type NodeData<T extends NodeType> = ApiNodeData[T] & { [key: string]: unknown };

export type FlowNode<T extends NodeType> = Node<NodeData<T>>;
export type QueryNode = FlowNode<'query'>;
export type AnswerNode = FlowNode<'answer'>;
export type KnowledgeHeadNode = FlowNode<'knowledge-head'>;
export type KnowledgeDetailNode = FlowNode<'knowledge-detail'>; 