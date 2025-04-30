import { useCallback, useEffect, useRef } from 'react';
import { Edge, Node, useReactFlow } from '@xyflow/react';
import useFlowTools from './useFlowTools';

/**
 * 监听视口变化，优化布局的Hook
 * 针对缩放操作时所有节点的布局问题
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
  const layoutInProgressRef = useRef<boolean>(false);
  const debounceTimeRef = useRef<number>(500); // 默认去抖时间
  
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
    // 创建MutationObserver监视ReactFlow容器的data-zoom属性变化
    const observer = new MutationObserver((mutations) => {
      // 如果正在聊天或布局进行中，不处理缩放变化
      if (isChatting || layoutInProgressRef.current) return;
      
      mutations.forEach((mutation) => {
        if (
          mutation.type === 'attributes' && 
          mutation.attributeName === 'data-zoom'
        ) {
          const { zoom } = getViewport();
          
          // 计算缩放变化幅度
          const zoomChangeDelta = Math.abs(zoom - lastZoomRef.current);
          
          // 只有当缩放变化足够明显时才触发处理（避免微小变化引起不必要的重新布局）
          // 缩放变化阈值为10%
          if (zoomChangeDelta > 0.1) {
            console.log('检测到明显缩放变化:', zoom, '与上次比较:', lastZoomRef.current);
            lastZoomRef.current = zoom;
            
            // 清除之前的定时器
            if (timeoutRef.current) {
              clearTimeout(timeoutRef.current);
            }
            
            // 根据缩放速度动态调整去抖时间
            // 缩放变化越大，去抖时间越长，避免频繁重新布局
            const dynamicDebounceTime = Math.min(
              1000, // 最大去抖时间1秒
              300 + Math.floor(zoomChangeDelta * 1000) // 根据变化幅度增加去抖时间
            );
            debounceTimeRef.current = dynamicDebounceTime;
            
            // 延迟分发事件
            timeoutRef.current = setTimeout(() => {
              dispatchViewportChangeEvent(zoom);
            }, debounceTimeRef.current);
          }
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
  }, [getViewport, dispatchViewportChangeEvent, isChatting]);
  
  // 处理视口变化事件
  useEffect(() => {
    // 处理缩放变化，重新布局节点
    const handleZoomChange = (event: CustomEvent) => {
      // 获取当前缩放值
      const zoom = event.detail.zoom;
      
      // 如果正在聊天或节点数量为0，不进行布局更新
      if (isChatting || nodes.length === 0 || layoutInProgressRef.current) {
        return;
      }
      
      // 设置布局进行中标志，防止重复触发
      layoutInProgressRef.current = true;
      
      console.log('缩放值变化触发布局更新，当前缩放值:', zoom);
      
      // 使用executeLayout对所有节点进行布局
      // 不更新服务器(false)，不重置高度(false)
      setElements(({nodes, edges}) => {
        const layoutedNodes = executeLayout(nodes, edges, false, false);
        
        // 布局完成后重置标志，延迟时间与去抖时间一致
        setTimeout(() => {
          layoutInProgressRef.current = false;
        }, debounceTimeRef.current + 200); // 多留一些缓冲时间
        
        return {
          nodes: layoutedNodes,
          edges
        };
      });
    };
    
    // 添加事件监听器
    window.addEventListener('viewportChanged', handleZoomChange as EventListener);
    
    // 清理函数
    return () => {
      window.removeEventListener('viewportChanged', handleZoomChange as EventListener);
    };
  }, [nodes, edges, executeLayout, isChatting, setElements]);
} 