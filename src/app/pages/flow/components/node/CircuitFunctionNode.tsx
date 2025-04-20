import React, { useMemo } from 'react';
import { BaseNode, ExtendedNodeProps } from './base/BaseNode';
import { CircuitFunctionData } from './types/circuitNode.types';

/**
 * 电路功能分析节点组件
 * 用于展示电路的功能分析结果
 */
function CircuitFunctionNode({ data, ...props }: ExtendedNodeProps<'answer'>) {
  const nodeData = data as unknown as CircuitFunctionData;
  
  // 处理进度信息
  const progress = useMemo(() => {
    return typeof nodeData.progress === 'string' ? nodeData.progress : '电路功能分析中';
  }, [nodeData.progress]);
  
  // 功能分析
  const functionAnalysisText = useMemo(() => {
    if (typeof nodeData.functionAnalysis === 'string') {
      return nodeData.functionAnalysis;
    }
    
    // 如果是复杂对象，可以格式化显示
    if (nodeData.functionAnalysis && typeof nodeData.functionAnalysis === 'object') {
      const { mainFunction, subFunctions, operatingPrinciple } = nodeData.functionAnalysis;
      let analysisText = '';
      
      if (mainFunction) {
        analysisText += `主要功能: ${mainFunction}\n\n`;
      }
      
      if (subFunctions && subFunctions.length > 0) {
        analysisText += `次要功能:\n${subFunctions.map(func => `• ${func}`).join('\n')}\n\n`;
      }
      
      if (operatingPrinciple) {
        analysisText += `工作原理: ${operatingPrinciple}`;
      }
      
      return analysisText || '暂无详细功能分析';
    }
    
    return '暂无功能分析信息';
  }, [nodeData.functionAnalysis]);

  // 自定义内容
  const customContent = useMemo(() => (
    <div className="w-full p-4">
      {/* 进度信息 */}
      {nodeData.progress && (
        <div className="flex items-center mb-3 text-blue-600">
          <div className="w-3 h-3 mr-2 rounded-full bg-blue-500 animate-pulse"></div>
          <span>{progress}</span>
        </div>
      )}
      
      {/* 功能分析内容 */}
      <div className="mt-3">
        <h3 className="text-lg font-medium text-gray-800 mb-2">电路功能分析</h3>
        <div className="text-gray-700 whitespace-pre-line">
          {functionAnalysisText}
        </div>
      </div>
    </div>
  ), [functionAnalysisText, progress, nodeData.progress]);

  // 底部内容
  const footerContent = useMemo(() => (
    <div className="flex items-center justify-end p-2">
      <span className="px-2 py-1 text-xs rounded-full bg-purple-100 text-purple-800">功能分析</span>
    </div>
  ), []);

  return (
    <BaseNode
      {...props}
      data={data}
      customContent={customContent}
      footerContent={footerContent}
    />
  );
}

export default CircuitFunctionNode; 