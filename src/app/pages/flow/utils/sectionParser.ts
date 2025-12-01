import { Edge, Node } from "@xyflow/react";
import { NodeData } from "../components/node/types/node.types";
import { TextData } from "../types/ChatTask.types";

// 二级标题的正则表达式
export const H2_SECTION_REGEX = /^##\s+(.+)$/gm;

/**
 * 分割带有二级标题的Markdown文本
 * @param text Markdown文本
 * @returns 分割后的各部分，包含标题和内容
 */
function splitTextByHeadings(text: string): Array<{title: string, content: string}> {
  // 初始化结果数组
  const sections: Array<{title: string, content: string}> = [];
  
  // 查找所有二级标题的位置
  const headingMatches: Array<{index: number, title: string, length: number}> = [];
  let match;
  const regex = new RegExp(H2_SECTION_REGEX);
  
  while ((match = regex.exec(text)) !== null) {
    headingMatches.push({
      index: match.index,
      title: match[1].trim(),
      length: match[0].length
    });
  }
  
  // 如果没有找到二级标题，返回整个文本作为一个部分
  if (headingMatches.length === 0) {
    return [{title: "", content: text}];
  }
  
  // 处理第一个标题前的内容（如果有）
  if (headingMatches[0].index > 0) {
    sections.push({
      title: "",
      content: text.substring(0, headingMatches[0].index)
    });
  }
  
  // 处理各个标题之间的内容
  for (let i = 0; i < headingMatches.length; i++) {
    const currentHeading = headingMatches[i];
    const nextHeading = i < headingMatches.length - 1 ? headingMatches[i + 1] : null;
    
    const startIndex = currentHeading.index + currentHeading.length;
    const endIndex = nextHeading ? nextHeading.index : text.length;
    
    sections.push({
      title: currentHeading.title,
      content: text.substring(startIndex, endIndex).trim()
    });
  }
  
  return sections;
}

/**
 * 检查节点内容是否包含二级标题
 * @param text 节点文本内容
 * @returns 是否包含二级标题
 */
export function hasH2Headings(text: string): boolean {
  if (!text || typeof text !== 'string') return false;
  return H2_SECTION_REGEX.test(text);
}

/**
 * 根据二级标题拆分节点
 * @param nodeId 要拆分的节点ID
 * @param nodes 当前节点列表
 * @param edges 当前边列表
 * @returns 更新后的节点和边，以及新创建的节点ID列表
 */
export function splitNodeByHeadings(
  nodeId: string, 
  nodes: Node[],
  edges: Edge[]
): {
  nodes: Node[],
  edges: Edge[],
  newNodeIds: string[]
} {
  // 查找目标节点
  const targetNode = nodes.find(node => node.id === nodeId);
  if (!targetNode || !targetNode.data.text || typeof targetNode.data.text !== 'string') {
    return { nodes, edges, newNodeIds: [] };
  }
  
  // 分割文本内容
  const sections = splitTextByHeadings(targetNode.data.text);
  
  // 如果只有一个部分且没有标题，说明没有二级标题，直接返回原始节点
  if (sections.length === 1 && !sections[0].title) {
    return { nodes, edges, newNodeIds: [] };
  }
  
  // 保存新创建的节点ID
  const newNodeIds: string[] = [];
  
  // 创建新节点和边的数组
  const newNodes: Node[] = [];
  const newEdges: Edge[] = [];
  
  // 直接使用第一部分内容创建节点，不再更新原始节点
  if (sections[0].title === "") {
    // 如果第一部分没有标题，创建一个包含这部分内容的新节点
    const introContent = sections[0].content;
    if (introContent.trim().length > 0) {
      // 为引言内容创建一个新节点
      const introNodeId = `${targetNode.id}_intro_${Date.now()}`;
      newNodeIds.push(introNodeId);
      
      // 创建引言节点
      const introNode: Node<NodeData<'answer'>> = {
        id: introNodeId,
        type: 'answer',
        position: {
          x: targetNode.position.x + 380, // 水平排列
          y: targetNode.position.y - 200  // 稍微向上放置
        },
        data: {
          ...targetNode.data,
          title: "引言", // 使用"引言"作为标题
          text: introContent, // 使用无标题部分内容
          parentId: targetNode.data.parentId,
          createdAt: targetNode.data.createdAt,
          updatedAt: targetNode.data.updatedAt
        } as NodeData<'answer'>
      };
      
      // 创建连接边
      const parentId = typeof targetNode.data.parentId === 'number' 
        ? targetNode.data.parentId.toString() 
        : (targetNode.data.parentId as string || '');
      
      const introEdge: Edge = {
        id: `e${parentId}-${introNodeId}`,
        source: parentId,
        target: introNodeId,
        type: 'smoothstep',
      };
      
      // 添加到新节点和边集合
      newNodes.push(introNode);
      newEdges.push(introEdge);
    }
    
    // 移除第一部分，剩下的都是有标题的部分
    sections.shift();
  }
  
  sections.forEach((section, index) => {
    // 为新节点创建唯一ID
    const sanitizedTitle = section.title
      .replace(/[^a-zA-Z0-9_\u4e00-\u9fa5]/g, '_')
      .substring(0, 20);
    const newNodeId = `${targetNode.id}_section_${sanitizedTitle}_${Date.now() + index}`;
    newNodeIds.push(newNodeId);
    
    // 创建新节点
    const newNode: Node<NodeData<'answer'>> = {
      id: newNodeId,
      type: 'answer',
      position: {
        x: targetNode.position.x + 380 * (index + 1), // 水平排列
        y: targetNode.position.y                      // 保持相同高度
      },
      data: {
        ...targetNode.data,
        title: section.title,                        // 使用二级标题作为节点标题
        text: section.content,                       // 使用标题对应的内容
        parentId: targetNode.data.parentId,          // 与原节点保持相同的父节点
        createdAt: targetNode.data.createdAt,        // 保持相同的时间戳
        updatedAt: targetNode.data.updatedAt         // 保持相同的更新时间
      } as NodeData<'answer'>
    };
    
    // 创建新的边连接父节点和新节点
    const parentId = typeof targetNode.data.parentId === 'number' 
      ? targetNode.data.parentId.toString() 
      : (targetNode.data.parentId as string || '');
    
    const newEdge: Edge = {
      id: `e${parentId}-${newNodeId}`,
      source: parentId,
      target: newNodeId,
      type: 'smoothstep',
    };
    
    newNodes.push(newNode);
    newEdges.push(newEdge);
  });
  
  // 从节点列表中完全移除原始节点，而不是保留它
  const updatedNodes = nodes
    .filter(node => node.id !== targetNode.id) // 过滤掉原始节点
    .concat(newNodes);
  
  // 删除与原始节点相关的所有边
  const updatedEdges = edges
    .filter(edge => edge.source !== targetNode.id && edge.target !== targetNode.id) // 过滤掉原始节点的所有边
    .concat(newEdges);
  
  return {
    nodes: updatedNodes,
    edges: updatedEdges,
    newNodeIds
  };
}

/**
 * 处理节点文本完成后的自动分节功能
 * 当检测到节点内容包含二级标题时，将大节点分解为多个子节点
 * 
 * @param nodes 当前节点列表
 * @param edges 当前边列表
 * @param completedNodeId 刚刚完成内容生成的节点ID
 * @returns 更新后的节点和边，以及新创建的节点ID列表
 */
export function processCompletedNode(
  nodes: Node[],
  edges: Edge[],
  completedNodeId: string
): {
  nodes: Node[],
  edges: Edge[],
  newNodeIds: string[]
} {
  const targetNode = nodes.find(node => node.id === completedNodeId);
  
  // 如果找不到节点或节点没有文本内容，直接返回原始状态
  if (!targetNode || !targetNode.data.text || typeof targetNode.data.text !== 'string') {
    return { nodes, edges, newNodeIds: [] };
  }
  
  // 新的电路分析节点不再进行二级标题分裂
  if (targetNode.type === 'circuit-canvas' || targetNode.type === 'circuit-analyze') {
    return { nodes, edges, newNodeIds: [] };
  }
  
  // 检查节点内容是否包含二级标题
  if (hasH2Headings(targetNode.data.text)) {
    // 执行节点拆分
    return splitNodeByHeadings(completedNodeId, nodes, edges);
  }
  
  // 没有二级标题，返回原始状态
  return { nodes, edges, newNodeIds: [] };
}

/**
 * 节点内容更新处理函数
 * 用于替代原有的processSectionMarkers
 * 仅处理节点文本更新，不执行分点逻辑
 * 优化版本：更快速的文本拼接和状态更新
 * 
 * @param textData 文本数据
 * @param nodes 当前节点列表
 * @param edges 当前边列表
 * @returns 更新后的节点和边
 */
export function processTextUpdate(
  textData: TextData,
  nodes: Node[],
  edges: Edge[]
): { 
  nodes: Node[],
  edges: Edge[],
  updated: boolean
} {
  const nodeId = textData.nodeId.toString();
  const targetNodeIndex = nodes.findIndex(node => node.id === nodeId);
  
  if (targetNodeIndex === -1) {
    return { nodes, edges, updated: false };
  }
  
  // 优化: 直接修改数组中的节点，减少内存分配
  const updatedNodes = [...nodes];
  const targetNode = updatedNodes[targetNodeIndex];
  
  // 快速文本拼接和状态更新
  updatedNodes[targetNodeIndex] = {
    ...targetNode,
    data: {
      ...targetNode.data,
      text: ((targetNode.data.text || '') as string) + textData.content,
      updatedAt: Date.now(), // 添加时间戳以触发UI更新
      process: 'generating' // 确保状态为生成中
    }
  };
  
  console.log(`文本更新完成，节点ID: ${nodeId}，新文本长度: ${((targetNode.data.text || '') as string + textData.content).length}`);
  
  return { 
    nodes: updatedNodes, 
    edges, 
    updated: true
  };
}
