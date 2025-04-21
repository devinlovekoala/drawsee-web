import React, { useMemo, useEffect } from 'react';
import { BaseNode, ExtendedNodeProps } from './base/BaseNode';
import { CircuitDetailData } from './types/circuitNode.types';
import { useFlowContext } from '@/app/contexts/FlowContext';

/**
 * 电路分析详情节点组件
 * 用于展示电路分析的详细内容
 */
function CircuitDetailNode({ data, ...props }: ExtendedNodeProps<'circuit-detail'>) {
  const nodeData = data as unknown as CircuitDetailData;
  const { addChatTask } = useFlowContext();
  
  // 添加日志显示接收到的数据
  useEffect(() => {
    console.log('CircuitDetailNode接收数据，ID:', props.id);
    
    // 如果有父节点ID，更新父节点的isGenerated状态
    if (nodeData.parentPointId) {
      // 仅在组件首次加载时更新父节点状态，避免重复更新导致布局变形
      const parentId = parseInt(nodeData.parentPointId);
      console.log('更新父节点状态:', parentId);
      
      // 使用一个小延时确保父节点已存在
      setTimeout(() => {
        addChatTask({
          type: 'data',
          data: {
            nodeId: parentId,
            isGenerated: true
          }
        });
      }, 100);
    }
    // 只在组件挂载时执行一次
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, []);
  
  // 添加角度信息到标题
  const headerContent = useMemo(() => {
    if (nodeData.angle) {
      return (
        <div className="angle-badge px-2 py-1 text-xs rounded-full bg-blue-100 text-blue-800 inline-flex items-center">
          <svg className="w-3 h-3 mr-1" fill="none" stroke="currentColor" viewBox="0 0 24 24" xmlns="http://www.w3.org/2000/svg">
            <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M13 16h-1v-4h-1m1-4h.01M21 12a9 9 0 11-18 0 9 9 0 0118 0z" />
          </svg>
          角度: {nodeData.angle}
        </div>
      );
    }
    return undefined;
  }, [nodeData.angle]);
  
  // 添加详细内容
  const detailContent = useMemo(() => {
    // 首先检查是否有详细内容
    if (nodeData.detailContent) {
      return (
        <div className="detail-content mt-3 text-sm text-gray-700">
          {nodeData.detailContent}
        </div>
      );
    }
    
    // 如果没有详细内容但有文本，显示节点文本
    if (nodeData.text) {
      return (
        <div className="detail-content mt-3 text-sm text-gray-700">
          {nodeData.text}
        </div>
      );
    }
    
    // 如果既没有详细内容也没有文本，显示加载中
    return (
      <div className="flex justify-center items-center py-4">
        <div className="animate-pulse text-blue-500">
          加载详细内容中...
        </div>
      </div>
    );
  }, [nodeData.detailContent, nodeData.text]);

  return (
    <BaseNode
      {...props}
      data={nodeData}
      headerContent={headerContent}
      customContent={detailContent}
    />
  );
}

export default CircuitDetailNode; 