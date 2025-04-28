import { useCallback, useEffect, useRef } from 'react';
import { Edge, Node, useReactFlow } from '@xyflow/react';
import useFlowTools from './useFlowTools';

// 节流函数
function throttle<T extends (...args: any[]) => any>(
  func: T,
  limit: number
): (...args: Parameters<T>) => void {
  let inThrottle: boolean;
  
  return function(this: any, ...args: Parameters<T>): void {
    if (!inThrottle) {
      func.apply(this, args);
      inThrottle = true;
      
      setTimeout(() => {
        inThrottle = false;
      }, limit);
    }
  };
}

/**
 * 监听视口变化，优化布局的Hook
 * 特别针对电路分析节点在缩放时的布局问题
 */
export function useViewportChange(
  nodes: Node[],
  edges: Edge[],
  isChatting: boolean,
  setElements: React.Dispatch<React.SetStateAction<{nodes: Node[], edges: Edge[]}>>
) {
  const { getViewport } = useReactFlow();
  const { executeLayout } = useFlowTools();
  const timeoutRef = useRef<ReturnType<typeof setTimeout> | null>(null);
  const lastZoomRef = useRef<number>(getViewport().zoom);
  const lastUpdateTimeRef = useRef<number>(Date.now());
  
  // 自定义视口变化事件
  const dispatchViewportChangeEvent = useCallback((zoom: number) => {
    // 创建自定义事件
    const event = new CustomEvent('viewportChanged', { 
      detail: { zoom }
    });
    // 分发事件
    window.dispatchEvent(event);
  }, []);
  
  // 创建节流后的视口变化处理函数
  const throttledHandleViewportChange = useCallback(
    throttle(() => {
      const { zoom } = getViewport();
      const currentTime = Date.now();
      
      // 计算缩放变化幅度
      const zoomChangeDelta = Math.abs(zoom - lastZoomRef.current);
      
      // 计算距离上次更新的时间间隔
      const timeSinceLastUpdate = currentTime - lastUpdateTimeRef.current;
      
      // 只有当缩放变化足够明显且距离上次更新有足够时间时才触发处理
      if (zoomChangeDelta > 0.05 && timeSinceLastUpdate > 100) {
        lastZoomRef.current = zoom;
        lastUpdateTimeRef.current = currentTime;
        
        // 清除之前的延时操作
        if (timeoutRef.current) {
          clearTimeout(timeoutRef.current);
        }
        
        // 设置新的延时操作
        timeoutRef.current = setTimeout(() => {
          dispatchViewportChangeEvent(zoom);
        }, 150); // 增加延迟时间，让变化更平滑
      }
    }, 100), // 100ms的节流时间
    [getViewport, dispatchViewportChangeEvent]
  );
  
  // 监听ReactFlow的视口变化
  useEffect(() => {
    // 创建MutationObserver监视ReactFlow容器的data-zoom属性变化
    const observer = new MutationObserver((mutations) => {
      mutations.forEach((mutation) => {
        if (
          mutation.type === 'attributes' && 
          mutation.attributeName === 'data-zoom'
        ) {
          throttledHandleViewportChange();
        }
      });
    });
    
    // 查找ReactFlow容器并开始观察
    const reactFlowContainer = document.querySelector('.react-flow');
    if (reactFlowContainer) {
      observer.observe(reactFlowContainer, { attributes: true });
    }
    
    // 清理函数
    return () => {
      observer.disconnect();
      if (timeoutRef.current) {
        clearTimeout(timeoutRef.current);
      }
    };
  }, [throttledHandleViewportChange]);
  
  // 处理视口变化事件
  useEffect(() => {
    // 处理缩放变化，重新布局电路节点
    const handleZoomChange = (event: CustomEvent) => {
      // 获取当前缩放值
      const zoom = event.detail.zoom;
      
      // 仅在特定缩放值范围内触发重新布局（避免频繁触发）
      if (zoom < 0.4 && !isChatting && nodes.length > 0) {
        // 过滤出电路相关节点
        const circuitNodes = nodes.filter(node => 
          node.type === 'circuit-point' || 
          node.type === 'circuit-detail' || 
          node.type === 'circuit-canvas'
        );
        
        // 如果有电路节点，执行特定布局
        if (circuitNodes.length > 0) {
          console.log('检测到电路节点且缩放值小于0.4，执行特定布局适配');
          
          // 使用自适应间距的布局算法
          setElements(({nodes, edges}) => {
            const layoutedNodes = executeLayout(nodes, edges, false, false);
            return {
              nodes: layoutedNodes,
              edges
            };
          });
        }
      }
    };
    
    // 添加事件监听器
    window.addEventListener('viewportChanged', handleZoomChange as EventListener);
    
    // 清理函数
    return () => {
      window.removeEventListener('viewportChanged', handleZoomChange as EventListener);
    };
  }, [nodes, edges, executeLayout, isChatting, setElements]);
} 