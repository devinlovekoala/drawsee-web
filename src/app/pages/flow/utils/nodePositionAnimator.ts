import { Node } from '@xyflow/react';

/**
 * 节点位置动画器
 * 实现节点位置的平滑过渡动画
 * 高性能版：使用requestAnimationFrame和CSS变换实现丝滑动画
 */

/**
 * 使用requestAnimationFrame实现的高性能动画函数
 * @param callback 每帧执行的回调函数
 * @param duration 动画持续时间（毫秒）
 * @returns 一个包含stop方法的对象，用于停止动画
 */
const createAnimationFrame = (callback: (progress: number, timestamp: number) => void, duration: number) => {
  let startTime: number | null = null;
  let animationFrameId: number | null = null;
  let lastTimestamp: number = 0;
  
  const animate = (timestamp: number) => {
    if (!startTime) startTime = timestamp;
    const elapsed = timestamp - startTime;
    const progress = Math.min(1, elapsed / duration);
    
    // 计算帧率并输出（仅在开发环境）
    if (process.env.NODE_ENV === 'development') {
      const fps = timestamp - lastTimestamp > 0 ? 1000 / (timestamp - lastTimestamp) : 0;
      if (elapsed % 500 < 16) { // 每500ms输出一次
        console.log(`Animation FPS: ${Math.round(fps)}`);
      }
    }
    
    lastTimestamp = timestamp;
    
    callback(progress, timestamp);
    
    if (progress < 1) {
      animationFrameId = requestAnimationFrame(animate);
    }
  };
  
  animationFrameId = requestAnimationFrame(animate);
  
  return {
    stop: () => {
      if (animationFrameId !== null) {
        cancelAnimationFrame(animationFrameId);
        animationFrameId = null;
      }
    }
  };
};

/**
 * 对节点位置进行平滑过渡动画 - 高性能版
 * @param sourceNodes 源节点列表
 * @param targetNodes 目标节点列表（布局后的节点）
 * @param setNodes 更新节点的函数，用于实时更新 ReactFlow 节点
 * @param duration 动画持续时间（毫秒）
 * @returns Promise，动画完成后解析为最终节点列表
 */
export const animateNodePositions = async (
  sourceNodes: Node[],
  targetNodes: Node[],
  setNodes: (nodes: Node[]) => void,
  duration: number = 500
): Promise<Node[]> => {
  // 如果没有节点，直接返回目标节点
  if (sourceNodes.length === 0 || targetNodes.length === 0) {
    setNodes(targetNodes);
    return targetNodes;
  }
  
  // 如果节点数量过多，减少动画时间但不低于100ms
  if (sourceNodes.length > 50) {
    duration = Math.max(100, duration - (sourceNodes.length - 50));
  }

  console.log(`开始节点动画，节点数: ${sourceNodes.length}，动画时长: ${duration}ms`);

  // 创建节点ID到节点的映射，便于快速查找
  const sourceNodeMap = new Map<string, Node>();
  for (const node of sourceNodes) {
    sourceNodeMap.set(node.id, node);
  }

  // 预计算动画数据 - 仅计算需要移动的节点
  const animationDataMap = new Map<string, {
    id: string;
    sourcePos: { x: number; y: number };
    targetPos: { x: number; y: number };
    data: any;
    distanceSquared: number; // 存储距离平方，用于优先级排序
  }>();
  
  // 只为需要移动的节点创建动画数据
  for (const targetNode of targetNodes) {
    const sourceNode = sourceNodeMap.get(targetNode.id);
    if (sourceNode) {
      const sourcePos = sourceNode.position;
      const targetPos = targetNode.position;
      
      // 计算距离平方
      const distanceSquared = 
        Math.pow(sourcePos.x - targetPos.x, 2) + 
        Math.pow(sourcePos.y - targetPos.y, 2);
      
      // 只有位置变化超过一定阈值的节点才进行动画
      if (distanceSquared > 4) { // 距离超过2像素才动画
        animationDataMap.set(targetNode.id, {
          id: targetNode.id,
          sourcePos: { ...sourcePos },
          targetPos: { ...targetPos },
          data: targetNode.data,
          distanceSquared
        });
      }
    }
  }
  
  // 如果没有需要动画的节点，直接更新
  if (animationDataMap.size === 0) {
    setNodes(targetNodes);
    return targetNodes;
  }
  
  // 性能优化：对动画数据按距离排序，优先处理移动距离大的节点
  const sortedAnimationData = Array.from(animationDataMap.values())
    .sort((a, b) => b.distanceSquared - a.distanceSquared);
  
  // 返回一个Promise，在动画完成后解析
  return new Promise((resolve) => {
    // 创建当前节点状态的副本
    let currentNodes = [...sourceNodes];
    
    // 使用requestAnimationFrame创建动画
    const animation = createAnimationFrame((progress, timestamp) => {
      // 使用缓动函数使动画更平滑
      const easedProgress = easeOutCubic(progress);
      
      // 批量更新节点位置
      const updatedNodes = currentNodes.map(node => {
        const animData = animationDataMap.get(node.id);
        
        if (animData) {
          // 计算当前位置
          const newX = animData.sourcePos.x + (animData.targetPos.x - animData.sourcePos.x) * easedProgress;
          const newY = animData.sourcePos.y + (animData.targetPos.y - animData.sourcePos.y) * easedProgress;
          
          // 返回更新后的节点
          return {
            ...node,
            position: { x: newX, y: newY },
            data: animData.data
          };
        }
        
        // 未参与动画的节点保持不变
        return node;
      });
      
      // 实时更新 ReactFlow 节点
      setNodes(updatedNodes);
      currentNodes = updatedNodes;
      
      // 如果动画完成，解析Promise
      if (progress === 1) {
        console.log('节点动画完成');
        resolve(targetNodes);
      }
    }, duration);
  });
};

/**
 * 缓动函数：三次方缓出
 * 提供更自然的动画效果
 * @param t 进度 (0-1)
 * @returns 缓动后的进度 (0-1)
 */
function easeOutCubic(t: number): number {
  return 1 - Math.pow(1 - t, 3);
}

/**
 * 对布局后的节点进行平滑过渡动画
 * @param currentNodes 当前节点列表
 * @param layoutedNodes 布局后的节点列表
 * @param setNodes 更新节点的函数
 * @param duration 动画持续时间（毫秒）
 * @returns Promise，动画完成后解析为最终节点列表
 */
export const animateLayoutTransition = async (
  currentNodes: Node[],
  layoutedNodes: Node[],
  setNodes: (nodes: Node[]) => void,
  duration: number = 500
): Promise<Node[]> => {
  return animateNodePositions(currentNodes, layoutedNodes, setNodes, duration);
}; 