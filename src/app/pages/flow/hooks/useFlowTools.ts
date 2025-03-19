import { useCallback } from "react";
import { entitreeFlexLayout } from "../utils/layoutNodes";
import { Edge, Node, useReactFlow } from "@xyflow/react";

// 默认的fitView配置
const DEFAULT_FIT_VIEW_CONFIG = {
  duration: 650,
  maxZoom: 0.90,
  minZoom: 0.75,  
  padding: 0.3
};

function useFlowTools() {

	const { fitView, getViewport, setViewport } = useReactFlow();

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
    // 记录开始时间
    const startTime = performance.now();
    
    // 执行布局计算
    const { nodes: layoutedNodes } = entitreeFlexLayout(nodes, edges, updateServer, resetHeight);
    
    // 记录结束时间
    const endTime = performance.now();
    console.log(`布局计算耗时: ${endTime - startTime}ms`);
    
    return layoutedNodes;
  }, []);

  return {
    executeFitView,
    adjustViewportToShowLatestContent,
    executeLayout
  }

}

export default useFlowTools;
