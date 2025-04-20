import React, { useMemo } from 'react';
import { BaseNode, ExtendedNodeProps } from './base/BaseNode';
import { CircuitBasicAnalysisData } from './types/circuitNode.types';

/**
 * 电路基本分析节点组件
 * 用于展示电路的基本分析信息
 */
function CircuitBasicAnalysisNode({ data, ...props }: ExtendedNodeProps<'answer'>) {
  const nodeData = data as unknown as CircuitBasicAnalysisData;
  
  // 处理进度信息显示
  const progress = useMemo(() => {
    return typeof nodeData.progress === 'string' ? nodeData.progress : '电路分析已完成';
  }, [nodeData.progress]);

  // 处理基本分析内容
  const basicAnalysis = useMemo(() => {
    return typeof nodeData.basicAnalysis === 'string' ? nodeData.basicAnalysis : '暂无基本分析信息';
  }, [nodeData.basicAnalysis]);

  // 基础电路信息
  const circuitInfo = useMemo(() => {
    if (nodeData.circuitInfo) {
      return (
        <div className="mt-4 bg-blue-50 p-3 rounded-md">
          <div className="grid grid-cols-2 gap-2">
            {nodeData.circuitInfo.componentCount !== undefined && (
              <div>
                <span className="text-xs text-blue-500">元件数量</span>
                <p className="font-semibold">{nodeData.circuitInfo.componentCount}</p>
              </div>
            )}
            {nodeData.circuitInfo.nodeCount !== undefined && (
              <div>
                <span className="text-xs text-blue-500">节点数量</span>
                <p className="font-semibold">{nodeData.circuitInfo.nodeCount}</p>
              </div>
            )}
            {nodeData.circuitInfo.loopCount !== undefined && (
              <div>
                <span className="text-xs text-blue-500">回路数量</span>
                <p className="font-semibold">{nodeData.circuitInfo.loopCount}</p>
              </div>
            )}
          </div>
          {nodeData.circuitInfo.powerSources && nodeData.circuitInfo.powerSources.length > 0 && (
            <div className="mt-2">
              <span className="text-xs text-blue-500">电源</span>
              <p className="font-semibold">{nodeData.circuitInfo.powerSources.join(', ')}</p>
            </div>
          )}
        </div>
      );
    }
    return null;
  }, [nodeData.circuitInfo]);

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
      
      {/* 基本分析内容 */}
      <div className="mt-3">
        <h3 className="text-lg font-medium text-gray-800 mb-2">电路基本分析</h3>
        <div className="text-gray-700 whitespace-pre-line">
          {basicAnalysis}
        </div>
        {circuitInfo}
      </div>
    </div>
  ), [progress, basicAnalysis, circuitInfo, nodeData.progress]);

  // 底部内容
  const footerContent = useMemo(() => (
    <div className="flex items-center justify-end p-2">
      <span className="px-2 py-1 text-xs rounded-full bg-indigo-100 text-indigo-800">电路基本分析</span>
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

export default CircuitBasicAnalysisNode; 