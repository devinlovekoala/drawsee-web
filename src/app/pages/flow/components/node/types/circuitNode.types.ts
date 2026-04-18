import { AnswerNodeData } from './node.types';
import type { FollowUpSuggestionData } from '@/api/types/flow.types';
import { CircuitDesign } from '@/api/types/circuit.types';

/**
 * 电路画布节点数据类型
 * 用于展示电路设计图
 */
export interface CircuitCanvasData extends AnswerNodeData {
  subtype: 'circuit-canvas';
  circuitDesign?: CircuitDesign; // 电路设计数据
  mode?: string;
}

export interface CircuitAnalyzeData extends AnswerNodeData {
  subtype: 'circuit-analyze';
  contextTitle?: string;
  followUp?: string;
  followUps?: FollowUpSuggestionData[];
}

export interface CircuitDetailData extends AnswerNodeData {
  subtype: 'circuit-detail';
  angle?: string;
  detailContent?: string;
  parentPointId?: string;
}
