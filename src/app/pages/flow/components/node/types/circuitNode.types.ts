import { AnswerNodeData } from './node.types';

/**
 * 电路基本分析节点数据类型
 */
export interface CircuitBasicAnalysisData extends AnswerNodeData {
  subtype: 'CIRCUIT_BASIC';
  // 基础分析信息
  progress?: string;
  basicAnalysis?: string;
  circuitInfo?: {
    componentCount?: number;
    nodeCount?: number;
    loopCount?: number;
    powerSources?: string[];
  };
}

/**
 * 电路节点分析数据类型
 */
export interface CircuitNodeAnalysisData extends AnswerNodeData {
  subtype: 'CIRCUIT_NODE_ANALYSIS';
  // 节点分析信息
  progress?: string;
  nodeDescription?: string;
  nodeAnalysis?: {
    nodeName?: string;
    voltage?: string;
    connectedComponents?: string[];
    currentFlow?: string[];
  } | string;
}

/**
 * 电路功能分析数据类型
 */
export interface CircuitFunctionData extends AnswerNodeData {
  subtype: 'CIRCUIT_FUNCTION';
  // 功能分析信息
  progress?: string;
  functionAnalysis?: {
    mainFunction?: string;
    subFunctions?: string[];
    operatingPrinciple?: string;
  } | string;
}

/**
 * 电路优化建议数据类型
 */
export interface CircuitOptimizationData extends AnswerNodeData {
  subtype: 'CIRCUIT_OPTIMIZATION';
  // 优化建议信息
  progress?: string;
  optimizationResult?: string;
  optimizationSuggestions?: {
    efficiencyImprovements?: string[];
    componentReplacements?: string[];
    designChanges?: string[];
  };
} 