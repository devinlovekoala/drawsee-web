import { useMemo, useEffect } from 'react';
import { BaseNode, ExtendedNodeProps } from './base/BaseNode';
import { CircuitCanvasData } from './types/circuitNode.types';
import { CircuitFlowWithProvider } from '@/app/pages/circuit/components/CircuitFlow';

/**
 * 电路画布节点组件
 * 用于展示电路设计在流程图中的节点，显示一个完整的电路设计图
 */
function CircuitCanvasNode({ data, ...props }: ExtendedNodeProps<'circuit-canvas'>) {
  const nodeData = data as unknown as CircuitCanvasData;
  
  // 添加日志显示接收到的数据
  useEffect(() => {
    console.log('CircuitCanvasNode received data:', nodeData);
    if (nodeData.circuitDesign) {
      console.log('Circuit design data available with elements:', 
        nodeData.circuitDesign.elements?.length || 0,
        'connections:', nodeData.circuitDesign.connections?.length || 0);
    } else {
      console.warn('No circuit design data available for node:', props.id);
    }
  }, [nodeData, props.id]);
  
  // 电路设计数据
  const circuitDesign = useMemo(() => {
    return nodeData.circuitDesign || null;
  }, [nodeData.circuitDesign]);
  
  const circuitContent = useMemo(() => {
    if (circuitDesign) {
      // 检查设计数据完整性
      if (!circuitDesign.elements || circuitDesign.elements.length === 0) {
        return (
          <div className="text-center py-4 text-red-500">
            电路设计数据不完整，无法渲染电路图
          </div>
        );
      }
      
      return (
        <div className="circuit-canvas-container" style={{ width: '100%', height: '300px' }}>
          <CircuitFlowWithProvider 
            selectedModel={nodeData.mode === 'qwen' ? 'qwen' : 'deepseekV3'}
            initialCircuitDesign={circuitDesign}
            isReadOnly={true}
          />
        </div>
      );
    }
    
    // 如果没有设计数据，显示占位提示
    return (
      <div className="text-center py-4 text-gray-500">
        暂无电路设计数据
      </div>
    );
  }, [circuitDesign, nodeData.mode]);

  return (
    <BaseNode
      {...props}
      data={nodeData}
      customContent={circuitContent}
    />
  );
}

export default CircuitCanvasNode; 
