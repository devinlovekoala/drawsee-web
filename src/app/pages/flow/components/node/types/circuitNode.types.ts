import { AnswerNodeData } from './node.types';
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

/**
 * 电路分析点数据类型
 * 用于显示电路分析的不同角度或重点
 */
export interface CircuitPointData extends AnswerNodeData {
  subtype: 'circuit-point';
  // 角度或重点描述，例如: 电路类型、工作原理、技术参数等
  pointType?: string; // 分析点类型
  pointDescription?: string; // 分析点描述
  isGenerated?: boolean; // 是否已生成详情
}

/**
 * 电路分析详情数据类型
 * 用于详细展示某个分析点的内容
 */
export interface CircuitDetailData extends AnswerNodeData {
  subtype: 'circuit-detail';
  angle?: string; // 分析角度
  detailContent?: string; // 详细内容
  parentPointId?: string; // 父分析点ID
}
