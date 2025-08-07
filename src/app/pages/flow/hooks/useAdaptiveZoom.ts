import { useCallback } from 'react';
import { useReactFlow, Node } from '@xyflow/react';

/**
 * 自适应缩放Hook
 * 根据节点数量、类型和屏幕尺寸智能计算最佳缩放比例
 */
export function useAdaptiveZoom() {
  const { fitView } = useReactFlow();

  /**
   * 计算最佳缩放比例
   */
  const calculateOptimalZoom = useCallback((nodes: Node[], targetNodeType?: string) => {
    const nodeCount = nodes.length;
    const screenWidth = window.innerWidth;
    const screenHeight = window.innerHeight;
    
    // 基础缩放比例计算
    let baseZoom = 0.5;
    
    // 如果指定了目标节点类型，优先考虑该类型的最佳显示
    if (targetNodeType) {
      const isDetailNode = ['answer-detail', 'ANSWER_DETAIL', 'circuit-detail', 'knowledge-detail', 'PDF_ANALYSIS_POINT'].includes(targetNodeType);
      if (isDetailNode) {
        return { maxZoom: 2.0, minZoom: 1.0, padding: 0.2 };
      }
    }
    
    // 根据节点数量调整 - 因为布局更紧凑，可以适当提高缩放比例
    if (nodeCount <= 2) {
      baseZoom = 1.4; // 节点很少时大幅放大 (原来1.2)
    } else if (nodeCount <= 4) {
      baseZoom = 1.2; // 节点少时放大显示细节 (原来1.0)
    } else if (nodeCount <= 8) {
      baseZoom = 1.0; // 适中显示 (原来0.8)
    } else if (nodeCount <= 15) {
      baseZoom = 0.8; // 适中显示 (原来0.6)
    } else if (nodeCount <= 25) {
      baseZoom = 0.6; // 适中显示 (原来0.4)
    } else {
      baseZoom = 0.4; // 节点很多时显示全局 (原来0.25)
    }
    
    // 根据屏幕尺寸调整
    const screenRatio = Math.min(screenWidth / 1920, screenHeight / 1080);
    const screenAdjustedZoom = baseZoom * Math.max(0.7, Math.min(1.3, screenRatio));
    
    // 计算合理的缩放范围
    const maxZoom = Math.min(2.5, screenAdjustedZoom + 0.4);
    const minZoom = Math.max(0.1, screenAdjustedZoom - 0.3);
    
    return {
      maxZoom,
      minZoom,
      padding: nodeCount > 10 ? 0.1 : 0.2 // 节点多时减少padding
    };
  }, []);

  /**
   * 智能fitView - 根据节点情况自动调整
   */
  const smartFitView = useCallback(async (
    nodeIds: string[],
    nodes: Node[],
    delay: number = 0,
    duration: number = 650,
    targetNodeType?: string
  ) => {
    const { maxZoom, minZoom, padding } = calculateOptimalZoom(nodes, targetNodeType);
    
    console.log(`智能fitView: 节点数=${nodes.length}, 目标类型=${targetNodeType || 'auto'}, 缩放范围=[${minZoom.toFixed(2)}, ${maxZoom.toFixed(2)}]`);
    
    setTimeout(async () => {
      const result = await fitView({
        nodes: nodeIds.map(id => ({ id })),
        duration,
        padding,
        maxZoom,
        minZoom,
      });
      return result;
    }, delay);
  }, [fitView, calculateOptimalZoom]);

  /**
   * 概览模式 - 显示所有节点的全局视图
   */
  const switchToOverviewMode = useCallback(async (nodes: Node[]) => {
    const nodeCount = nodes.length;
    
    // 概览模式参数 - 针对紧凑布局优化
    const maxZoom = nodeCount > 20 ? 0.5 : nodeCount > 10 ? 0.7 : 0.9; // 略微提高缩放 
    const minZoom = 0.08; // 略微提高最小缩放
    const padding = 0.08; // 概览模式使用更小的padding
    
    console.log('切换到概览模式:', { nodeCount, maxZoom, minZoom });
    
    return await fitView({
      nodes: nodes.map(node => ({ id: node.id })),
      duration: 500,
      padding,
      maxZoom,
      minZoom
    });
  }, [fitView]);

  /**
   * 详情模式 - 放大显示节点细节
   */
  const switchToDetailMode = useCallback(async (nodes: Node[], focusNodeIds?: string[]) => {
    // 详情模式参数 - 针对紧凑布局优化
    const maxZoom = 2.2; // 支持更大缩放，因为布局紧凑
    const minZoom = 1.0;  // 提高最小缩放
    const padding = 0.25; // 适当减少padding
    
    console.log('切换到详情模式:', { focusNodeIds });
    
    const targetNodes = focusNodeIds ? 
      focusNodeIds.map(id => ({ id })) : 
      nodes.map(node => ({ id: node.id }));
    
    return await fitView({
      nodes: targetNodes,
      duration: 500,
      padding,
      maxZoom,
      minZoom
    });
  }, [fitView]);

  return {
    calculateOptimalZoom,
    smartFitView,
    switchToOverviewMode,
    switchToDetailMode
  };
}
