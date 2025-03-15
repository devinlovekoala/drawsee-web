import { timer } from 'd3-timer';
import { interpolate } from 'd3-interpolate';
import { Node, Edge } from '@xyflow/react';

/**
 * 节点位置动画器
 * 实现节点位置的平滑过渡动画
 */

/**
 * 对节点位置进行平滑过渡动画
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

  // 创建节点ID到节点的映射，便于快速查找
  const sourceNodeMap = new Map<string, Node>();
  sourceNodes.forEach(node => {
    sourceNodeMap.set(node.id, node);
  });

  const targetNodeMap = new Map<string, Node>();
  targetNodes.forEach(node => {
    targetNodeMap.set(node.id, node);
  });

  // 创建当前节点状态的副本
  let currentNodes = [...sourceNodes];
  
  // 创建节点位置插值器
  const interpolators = new Map<string, (t: number) => { x: number; y: number }>();
  
  // 为每个目标节点创建位置插值器
  targetNodes.forEach(targetNode => {
    const sourceNode = sourceNodeMap.get(targetNode.id);
    
    // 如果源节点存在，创建位置插值器
    if (sourceNode) {
      const sourcePos = sourceNode.position;
      const targetPos = targetNode.position;
      
      // 创建位置插值器
      const posInterpolator = interpolate(sourcePos, targetPos);
      interpolators.set(targetNode.id, posInterpolator);
    }
  });

  // 返回一个Promise，在动画完成后解析
  return new Promise((resolve) => {
    // 创建计时器
    const t = timer((elapsed: number) => {
      // 计算动画进度 (0-1)
      const progress = Math.min(1, elapsed / duration);
      
      // 更新当前节点位置
      currentNodes = currentNodes.map(node => {
        const interpolator = interpolators.get(node.id);
        const targetNode = targetNodeMap.get(node.id);
        
        if (interpolator && targetNode) {
          // 使用插值器计算当前位置
          const newPos = interpolator(progress);
          
          // 返回更新后的节点
          return {
            ...node,
            position: newPos,
            data: targetNode.data
          };
        }
        
        return node;
      });
      
      // 实时更新 ReactFlow 节点
      setNodes([...currentNodes]);
      
      // 如果动画完成，停止计时器并解析Promise
      if (progress === 1) {
        t.stop();
        resolve(targetNodes);
      }
    });
  });
};

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