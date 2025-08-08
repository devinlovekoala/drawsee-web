import { useCallback, useRef } from "react";
import { entitreeFlexLayout } from "../utils/layoutNodes";
import { Edge, Node, useReactFlow } from "@xyflow/react";

// 默认的fitView配置 - 调整为更灵活的范围
const DEFAULT_FIT_VIEW_CONFIG = {
  duration: 650,
  maxZoom: 1.5,
  minZoom: 0.3,  
  padding: 0.2
};

function useFlowTools() {

	const { fitView, getViewport, setViewport } = useReactFlow();
  
  // 性能优化：防抖机制，避免频繁调用布局
  const layoutTimeoutRef = useRef<NodeJS.Timeout | null>(null);
  const lastLayoutCallRef = useRef<number>(0);

	/**
   * 执行fitView操作
   */
  const executeFitView = useCallback(async (
    nodeIds: string[],
    delay: number = 0,
    duration: number = DEFAULT_FIT_VIEW_CONFIG.duration,
    maxZoom: number = DEFAULT_FIT_VIEW_CONFIG.maxZoom,
    minZoom: number = DEFAULT_FIT_VIEW_CONFIG.minZoom,
    padding: number = DEFAULT_FIT_VIEW_CONFIG.padding
  ) => {
    setTimeout(async () => {
      const result = await fitView({
        nodes: nodeIds.map(id => ({ id })),
        duration,
        padding,
        maxZoom,
        minZoom,
      });
      console.log('fitView result', result);
      return result;
    }, delay);
  }, [fitView]);

  /**
   * 调整视口以显示最新内容
   */
  const adjustViewportToShowLatestContent = useCallback(async (node: Node) => {    
    // 获取当前视口
    const viewport = getViewport();
    // 计算节点在视口中的位置
    //const nodeX = node.position.x * viewport.zoom + viewport.x;
    const nodeY = node.position.y * viewport.zoom + viewport.y;
    // 获取视口尺寸
    const viewportHeight = window.innerHeight;
    // 计算节点底部位置
    const nodeHeight = node.measured?.height ?? 200; // 估计节点高度
    const nodeBottom = nodeY + nodeHeight * viewport.zoom;
    // 如果节点底部超出视口，调整视口位置
    if (nodeBottom > viewportHeight - 300) {
      const newY = viewport.y - (nodeBottom - viewportHeight + 150);
      const result = await setViewport({ x: viewport.x, y: newY - 100, zoom: viewport.zoom }, { duration: 250 });
      console.log('adjustViewportToShowLatestContent result', result);
			return result;
    }
  }, [getViewport, setViewport]);

  const executeLayout = useCallback((nodes: Node[], edges: Edge[], updateServer: boolean = false, resetHeight: boolean = false) => {
    // 性能优化：防抖机制，避免在短时间内频繁调用布局
    const now = Date.now();
    const timeSinceLastCall = now - lastLayoutCallRef.current;
    
    // 如果距离上次调用时间太短（小于100ms），延迟执行
    if (timeSinceLastCall < 100 && !updateServer) {
      if (layoutTimeoutRef.current) {
        clearTimeout(layoutTimeoutRef.current);
      }
      
      // 延迟执行布局
      layoutTimeoutRef.current = setTimeout(() => {
        lastLayoutCallRef.current = Date.now();
        const { nodes: layoutedNodes } = entitreeFlexLayout(nodes, edges, updateServer, resetHeight);
        return layoutedNodes;
      }, 50);
      
      // 返回原节点，避免空返回
      return nodes;
    }
    
    // 立即执行布局
    lastLayoutCallRef.current = now;
    
    // 执行布局计算
    const { nodes: layoutedNodes } = entitreeFlexLayout(nodes, edges, updateServer, resetHeight);
    
    return layoutedNodes;
  }, []);

  return {
    executeFitView,
    adjustViewportToShowLatestContent,
    executeLayout
  }

}

export default useFlowTools;
