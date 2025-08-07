import { useCallback } from 'react';
import { useReactFlow, Node } from '@xyflow/react';

/**
 * 自适应缩放Hook
 * 根据节点数量、类型和屏幕尺寸智能计算最佳缩放比例
 */
export function useAdaptiveZoom() {
  const { fitView } = useReactFlow();

  /**
   * 计算最佳缩放比例 - 针对横向布局和更大节点优化
   */
  const calculateOptimalZoom = useCallback((nodes: Node[], targetNodeType?: string) => {
    const nodeCount = nodes.length;
    const screenWidth = window.innerWidth;
    const screenHeight = window.innerHeight;
    
    // 基础缩放比例计算 - 考虑到节点变大，需要适当降低缩放比例
    let baseZoom = 0.45; // 从0.5降低到0.45，为更大节点提供空间
    
    // 如果指定了目标节点类型，优先考虑该类型的最佳显示
    if (targetNodeType) {
      const isDetailNode = ['answer-detail', 'ANSWER_DETAIL', 'circuit-detail', 'knowledge-detail', 'PDF_ANALYSIS_POINT'].includes(targetNodeType);
      if (isDetailNode) {
        return { maxZoom: 1.8, minZoom: 0.9, padding: 0.12 }; // 稍微降低最大缩放，减少padding
      }
    }
    
    // 根据节点数量调整 - 考虑到节点更大，需要更保守的缩放策略
    if (nodeCount <= 2) {
      baseZoom = 1.0; // 节点很少时适中显示（从1.2降低到1.0）
    } else if (nodeCount <= 4) {
      baseZoom = 0.85; // 节点少时适中显示（从1.0降低到0.85）
    } else if (nodeCount <= 8) {
      baseZoom = 0.7; // 适中显示（从0.8降低到0.7）
    } else if (nodeCount <= 15) {
      baseZoom = 0.55; // 较多节点时缩小（从0.6降低到0.55）
    } else if (nodeCount <= 25) {
      baseZoom = 0.4; // 很多节点时进一步缩小（保持0.4）
    } else {
      baseZoom = 0.28; // 极多节点时最小缩放（从0.3降低到0.28）
    }
    
    // 根据屏幕尺寸调整 - 横向布局更注重宽度，同时考虑更大节点
    const screenWidthRatio = screenWidth / 1920;
    const screenHeightRatio = screenHeight / 1080;
    // 给宽度更大的权重，因为横向布局主要沿宽度扩展，同时为更大节点调整权重
    const screenAdjustedZoom = baseZoom * Math.max(0.65, Math.min(1.25, screenWidthRatio * 0.75 + screenHeightRatio * 0.25));
    
    // 计算合理的缩放范围 - 为更大节点优化
    const maxZoom = Math.min(2.2, screenAdjustedZoom + 0.35); // 稍微降低最大缩放
    const minZoom = Math.max(0.08, screenAdjustedZoom - 0.25); // 稍微提高最小缩放
    
    return {
      maxZoom,
      minZoom,
      padding: nodeCount > 10 ? 0.06 : 0.12 // 进一步减少padding为更大节点腾出空间
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
