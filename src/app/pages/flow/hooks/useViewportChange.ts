import { useCallback, useEffect, useRef } from 'react';
import { Edge, Node, useReactFlow } from '@xyflow/react';
import useFlowTools from './useFlowTools';

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
  
  // 自定义视口变化事件
  const dispatchViewportChangeEvent = useCallback((zoom: number) => {
    // 创建自定义事件
    const event = new CustomEvent('viewportChanged', { 
      detail: { zoom }
    });
    // 分发事件
    window.dispatchEvent(event);
  }, []);
  
  // 监听ReactFlow的视口变化
  useEffect(() => {
    const handleViewportChange = () => {
      const { zoom } = getViewport();
      
      // 计算缩放变化幅度
      const zoomChangeDelta = Math.abs(zoom - lastZoomRef.current);
      
      // 只有当缩放变化足够明显时才触发处理（避免微小变化引起不必要的重新布局）
      if (zoomChangeDelta > 0.05) {
        lastZoomRef.current = zoom;
        
        // 延迟分发事件，减少频繁触发
        if (timeoutRef.current) {
          clearTimeout(timeoutRef.current);
        }
        
        timeoutRef.current = setTimeout(() => {
          dispatchViewportChangeEvent(zoom);
        }, 100);
      }
    };
    
    // 创建MutationObserver监视ReactFlow容器的data-zoom属性变化
    const observer = new MutationObserver((mutations) => {
      mutations.forEach((mutation) => {
        if (
          mutation.type === 'attributes' && 
          mutation.attributeName === 'data-zoom'
        ) {
          handleViewportChange();
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
  }, [getViewport, dispatchViewportChangeEvent]);
  
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