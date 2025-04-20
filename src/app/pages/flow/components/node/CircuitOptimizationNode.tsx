import React, { useMemo } from 'react';
import { BaseNode, ExtendedNodeProps } from './base/BaseNode';
import { CircuitOptimizationData } from './types/circuitNode.types';

/**
 * 电路优化建议节点组件
 * 用于展示电路的优化建议
 */
function CircuitOptimizationNode({ data, ...props }: ExtendedNodeProps<'answer'>) {
  const nodeData = data as unknown as CircuitOptimizationData;
  
  // 处理进度信息
  const progress = useMemo(() => {
    return typeof nodeData.progress === 'string' ? nodeData.progress : '电路优化分析中';
  }, [nodeData.progress]);
  
  // 优化建议
  const optimizationText = useMemo(() => {
    // 优先使用字符串格式的优化结果
    if (typeof nodeData.optimizationResult === 'string') {
      return nodeData.optimizationResult;
    }
    
    // 如果是复杂对象，可以格式化显示
    if (nodeData.optimizationSuggestions && typeof nodeData.optimizationSuggestions === 'object') {
      const { efficiencyImprovements, componentReplacements, designChanges } = nodeData.optimizationSuggestions;
      let suggestionsText = '';
      
      if (efficiencyImprovements && efficiencyImprovements.length > 0) {
        suggestionsText += `效率提升建议:\n${efficiencyImprovements.map(item => `• ${item}`).join('\n')}\n\n`;
      }
      
      if (componentReplacements && componentReplacements.length > 0) {
        suggestionsText += `元件替换建议:\n${componentReplacements.map(item => `• ${item}`).join('\n')}\n\n`;
      }
      
      if (designChanges && designChanges.length > 0) {
        suggestionsText += `设计变更建议:\n${designChanges.map(item => `• ${item}`).join('\n')}`;
      }
      
      return suggestionsText || '暂无详细优化建议';
    }
    
    return '暂无优化建议';
  }, [nodeData.optimizationResult, nodeData.optimizationSuggestions]);

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
      
      {/* 优化建议内容 */}
      <div className="mt-3">
        <h3 className="text-lg font-medium text-gray-800 mb-2">电路优化建议</h3>
        <div className="text-gray-700 whitespace-pre-line">
          {optimizationText}
        </div>
      </div>
    </div>
  ), [optimizationText, progress, nodeData.progress]);

  // 底部内容
  const footerContent = useMemo(() => (
    <div className="flex items-center justify-end p-2">
      <span className="px-2 py-1 text-xs rounded-full bg-green-100 text-green-800">优化建议</span>
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

export default CircuitOptimizationNode; 