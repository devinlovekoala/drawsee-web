import React, { useMemo } from 'react';
import { BaseNode, ExtendedNodeProps } from './base/BaseNode';
import { CircuitNodeAnalysisData } from './types/circuitNode.types';

/**
 * 电路节点分析组件
 * 用于展示电路中特定节点的分析结果
 */
function CircuitNodeAnalysisNode({ data, ...props }: ExtendedNodeProps<'answer'>) {
  const nodeData = data as unknown as CircuitNodeAnalysisData;
  
  // 节点名称 - 处理nodeAnalysis可能是字符串的情况
  const nodeName = useMemo(() => {
    if (typeof nodeData.nodeAnalysis === 'object' && nodeData.nodeAnalysis !== null) {
      return nodeData.nodeAnalysis.nodeName || 'N/A';
    }
    return 'N/A';
  }, [nodeData.nodeAnalysis]);

  // 节点描述 - 确保返回字符串类型
  const nodeDescription = useMemo(() => {
    if (typeof nodeData.nodeDescription === 'string') {
      return nodeData.nodeDescription;
    }
    return '无节点描述';
  }, [nodeData.nodeDescription]);

  // 节点分析
  const nodeAnalysisText = useMemo(() => {
    if (typeof nodeData.nodeAnalysis === 'string') {
      return nodeData.nodeAnalysis;
    }
    
    // 如果是复杂对象，可以格式化显示
    if (nodeData.nodeAnalysis && typeof nodeData.nodeAnalysis === 'object') {
      const { voltage, connectedComponents, currentFlow } = nodeData.nodeAnalysis;
      let analysisText = '';
      
      if (voltage) {
        analysisText += `节点电压: ${voltage}\n\n`;
      }
      
      if (connectedComponents && connectedComponents.length > 0) {
        analysisText += `连接元件: ${connectedComponents.join(', ')}\n\n`;
      }
      
      if (currentFlow && currentFlow.length > 0) {
        analysisText += `电流流向: ${currentFlow.join(', ')}`;
      }
      
      return analysisText || '暂无详细分析信息';
    }
    
    return '暂无节点分析信息';
  }, [nodeData.nodeAnalysis]);

  // 自定义内容
  const customContent = useMemo(() => (
    <div className="w-full p-4">
      {/* 进度信息 */}
      {nodeData.progress && (
        <div className="flex items-center mb-3 text-blue-600">
          <div className="w-3 h-3 mr-2 rounded-full bg-blue-500 animate-pulse"></div>
          <span>{String(nodeData.progress)}</span>
        </div>
      )}
      
      {/* 节点信息 */}
      <div className="mt-3 mb-4">
        <div className="flex flex-col mb-2">
          <span className="text-sm text-gray-500">节点名称:</span>
          <span className="font-medium">{nodeName}</span>
        </div>
        
        <div className="flex flex-col">
          <span className="text-sm text-gray-500">节点描述:</span>
          <span className="font-medium">{nodeDescription}</span>
        </div>
      </div>
      
      {/* 节点分析内容 */}
      <div className="mt-3">
        <h3 className="text-lg font-medium text-gray-800 mb-2">节点分析</h3>
        <div className="text-gray-700 whitespace-pre-line">
          {nodeAnalysisText}
        </div>
      </div>
    </div>
  ), [nodeName, nodeDescription, nodeAnalysisText, nodeData.progress]);

  // 底部内容
  const footerContent = useMemo(() => (
    <div className="flex items-center justify-end p-2">
      <span className="px-2 py-1 text-xs rounded-full bg-blue-100 text-blue-800">节点分析 {nodeName}</span>
    </div>
  ), [nodeName]);

  return (
    <BaseNode
      {...props}
      data={data}
      customContent={customContent}
      footerContent={footerContent}
    />
  );
}

export default CircuitNodeAnalysisNode; 