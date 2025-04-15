import { Edge, Node } from "@xyflow/react";
import { NodeData } from "../components/node/types/node.types";
import { TextData } from "../types/ChatTask.types";

// 用于识别SECTION标记的正则表达式 - 使用更精确的匹配
export const SECTION_REGEX = /\[\[SECTION:(.*?)\]\]/g;

// 跟踪节点处理状态
interface NodeProcessState {
  lastProcessTime: number;        // 最后处理时间
  sectionCount: number;           // 已处理的SECTION数量
  accumulatedText: string;        // 累积的文本内容
  pendingNewSection: boolean;     // 是否有待处理的新SECTION
  lastSectionEndIndex: number;    // 上一个SECTION结束的位置
  currentSectionNodeId: string;   // 当前正在写入的SECTION节点ID
}

// 跟踪处理过的节点状态
const processedNodes = new Map<string, NodeProcessState>();

// 最小处理间隔(毫秒)，防止频繁处理
const MIN_PROCESSING_INTERVAL = 300;

// 记录清理间隔(毫秒)
const CLEANUP_INTERVAL = 60000; // 1分钟

// 记录过期时间(毫秒)
const RECORD_EXPIRY = 300000; // 5分钟

// 设置定期清理过期记录
setInterval(() => {
  const now = Date.now();
  let cleanedCount = 0;
  
  // 清理过期的记录
  processedNodes.forEach((state, nodeId) => {
    if (now - state.lastProcessTime > RECORD_EXPIRY) {
      processedNodes.delete(nodeId);
      cleanedCount++;
    }
  });
  
  if (cleanedCount > 0) {
    console.log(`清理了${cleanedCount}条过期的节点处理记录`);
  }
}, CLEANUP_INTERVAL);

/**
 * 查找字符串中所有SECTION标记的位置信息
 */
function findAllSectionPositions(text: string): Array<{
  index: number;
  length: number;
  title: string;
  fullMatch: string;
}> {
  const results = [];
  let match;
  
  while ((match = SECTION_REGEX.exec(text)) !== null) {
    results.push({
      index: match.index,
      length: match[0].length,
      title: match[1],
      fullMatch: match[0]
    });
  }
  
  // 重置正则表达式的lastIndex
  SECTION_REGEX.lastIndex = 0;
  
  return results;
}

/**
 * 分割文本为SECTION
 * @returns 返回包含段落内容的数组，格式为[{title, content}, ...]
 */
function splitTextBySections(text: string): Array<{title: string, content: string}> {
  const sections = [];
  const sectionPositions = findAllSectionPositions(text);
  
  if (sectionPositions.length === 0) {
    return [{title: "", content: text}];
  }
  
  // 处理第一个SECTION之前的内容
  if (sectionPositions[0].index > 0) {
    sections.push({
      title: "",
      content: text.substring(0, sectionPositions[0].index)
    });
  }
  
  // 处理各个SECTION之间的内容
  for (let i = 0; i < sectionPositions.length; i++) {
    const currentPos = sectionPositions[i];
    const nextPos = i < sectionPositions.length - 1 ? sectionPositions[i + 1] : null;
    
    const startIndex = currentPos.index + currentPos.length;
    const endIndex = nextPos ? nextPos.index : text.length;
    
    sections.push({
      title: currentPos.title,
      content: text.substring(startIndex, endIndex)
    });
  }
  
  return sections;
}

/**
 * 处理节点文本中的SECTION标记
 * 当检测到SECTION标记时，创建新的平行节点
 * 
 * @param textData 文本数据
 * @param nodes 当前节点列表
 * @param edges 当前边列表
 * @returns 更新后的节点和边
 */
export function processSectionMarkers(
  textData: TextData,
  nodes: Node[],
  edges: Edge[]
): { 
  nodes: Node[],
  edges: Edge[],
  newNodeId: string | null,
  hasSection: boolean
} {
  const nodeId = textData.nodeId.toString();
  const targetNode = nodes.find(node => node.id === nodeId);
  
  if (!targetNode) {
    return { nodes, edges, newNodeId: null, hasSection: false };
  }
  
  // 获取或初始化节点处理状态
  let nodeState = processedNodes.get(nodeId);
  const currentTime = Date.now();
  
  // 如果节点中包含"_section_"但不是当前正在处理的SECTION节点，就将文本转发到正确的节点
  if (targetNode.id.includes('_section_')) {
    // 在现有的所有节点状态中查找指向这个节点的记录
    let parentNodeState = null;
    let parentNodeId = "";
    
    for (const [id, state] of processedNodes.entries()) {
      if (state.currentSectionNodeId === targetNode.id) {
        parentNodeState = state;
        parentNodeId = id;
        break;
      }
    }
    
    if (parentNodeState) {
      console.log(`${targetNode.id}是SECTION节点，将内容添加到当前节点`);
      const updatedNodes = nodes.map(node =>
        node.id === targetNode.id ? 
        {
          ...node, 
          data: {
            ...node.data, 
            text: node.data.text + textData.content
          }
        } : node
      );
      
      // 更新父节点状态的累积文本
      parentNodeState.accumulatedText += textData.content;
      parentNodeState.lastProcessTime = currentTime;
      
      return { 
        nodes: updatedNodes, 
        edges, 
        newNodeId: null, 
        hasSection: false
      };
    } else {
      console.log(`${targetNode.id}是孤立的SECTION节点，直接添加内容`);
      const updatedNodes = nodes.map(node =>
        node.id === targetNode.id ? 
        {
          ...node, 
          data: {
            ...node.data, 
            text: node.data.text + textData.content
          }
        } : node
      );
      
      return { 
        nodes: updatedNodes, 
        edges, 
        newNodeId: null, 
        hasSection: false
      };
    }
  }
  
  // 如果是第一次处理这个节点，初始化状态
  if (!nodeState) {
    nodeState = {
      lastProcessTime: currentTime,
      sectionCount: 0,
      accumulatedText: "",
      pendingNewSection: false,
      lastSectionEndIndex: 0,
      currentSectionNodeId: nodeId
    };
    processedNodes.set(nodeId, nodeState);
  } 
  // 如果节点最近处理过且没有待处理的SECTION，跳过SECTION检查
  else if (currentTime - nodeState.lastProcessTime < MIN_PROCESSING_INTERVAL && !nodeState.pendingNewSection) {
    console.log(`节点${nodeId}最近处理过(${currentTime - nodeState.lastProcessTime}ms < ${MIN_PROCESSING_INTERVAL}ms)，跳过SECTION检查`);
    
    // 仍然累积文本以便后续识别
    nodeState.accumulatedText += textData.content;
    
    // 如果当前有指定的Section节点，就将内容路由到该节点
    if (nodeState?.currentSectionNodeId && nodeState?.currentSectionNodeId !== nodeId) {
      const sectionNode = nodes.find(node => node.id === nodeState?.currentSectionNodeId);
      if (sectionNode) {
        console.log(`文本路由到当前SECTION节点: ${nodeState?.currentSectionNodeId}`);
        return {
          nodes: nodes.map(node => 
            node.id === nodeState?.currentSectionNodeId ? 
            {
              ...node, 
              data: {
                ...node.data, 
                text: node.data.text + textData.content
              }
            } : node
          ),
          edges,
          newNodeId: null,
          hasSection: false
        };
      }
    }
    
    // 默认更新当前节点内容
    const updatedNodes = nodes.map(node =>
      node.id === nodeId ? 
      {
        ...node, 
        data: {
          ...node.data, 
          text: node.data.text + textData.content
        }
      } : node
    );
    
    return { 
      nodes: updatedNodes, 
      edges, 
      newNodeId: null, 
      hasSection: false
    };
  }
  
  // 确保nodeState已初始化 (这一步确保了后续代码中的nodeState一定不为undefined)
  if (!nodeState) {
    nodeState = {
      lastProcessTime: currentTime,
      sectionCount: 0,
      accumulatedText: "",
      pendingNewSection: false,
      lastSectionEndIndex: 0,
      currentSectionNodeId: nodeId
    };
    processedNodes.set(nodeId, nodeState);
  }
  
  // 更新最后处理时间
  nodeState.lastProcessTime = currentTime;
  
  // 累积文本，然后检查累积的文本中是否包含SECTION标记
  nodeState.accumulatedText += textData.content;
  
  // 查找累积文本中的所有SECTION位置
  const sectionPositions = findAllSectionPositions(nodeState.accumulatedText);
  
  // 如果没有找到SECTION标记，或者所有SECTION已处理完毕
  if (sectionPositions.length === 0 || nodeState.sectionCount >= sectionPositions.length) {
    // 如果有当前处理的SECTION节点，路由文本到该节点
    if (nodeState.currentSectionNodeId && nodeState.currentSectionNodeId !== nodeId) {
      const sectionNode = nodes.find(node => node.id === nodeState.currentSectionNodeId);
      if (sectionNode) {
        console.log(`将文本路由到当前活动的SECTION节点: ${nodeState.currentSectionNodeId}`);
        return {
          nodes: nodes.map(node => 
            node.id === nodeState.currentSectionNodeId ? 
            {
              ...node, 
              data: {
                ...node.data, 
                text: node.data.text + textData.content
              }
            } : node
          ),
          edges,
          newNodeId: null,
          hasSection: false
        };
      }
    }
    
    // 更新当前节点内容
    const updatedNodes = nodes.map(node =>
      node.id === nodeId ? 
      {
        ...node, 
        data: {
          ...node.data, 
          text: node.data.text + textData.content
        }
      } : node
    );
    
    // 不需要特殊处理
    nodeState.pendingNewSection = false;
    
    return { 
      nodes: updatedNodes, 
      edges, 
      newNodeId: null, 
      hasSection: false
    };
  }
  
  // 如果有新的SECTION需要处理
  if (nodeState.sectionCount < sectionPositions.length) {
    // 获取需要处理的SECTION
    const currentSectionPos = sectionPositions[nodeState.sectionCount];
    const sectionTitle = currentSectionPos.title;
    
    console.log(`检测到第${nodeState.sectionCount + 1}个SECTION: ${sectionTitle}`);
    
    // 如果是第一个SECTION，更新当前节点的标题
    if (nodeState.sectionCount === 0) {
      console.log(`更新第一个节点标题为: ${sectionTitle}`);
      
      // 更新节点标题 
      const updatedNodes = nodes.map(node =>
        node.id === nodeId ? 
        {
          ...node, 
          data: {
            ...node.data,
            title: sectionTitle || node.data.title || 'AI解析',
            text: node.data.text + textData.content
          }
        } : node
      );
      
      // 增加已处理的SECTION计数
      nodeState.sectionCount += 1;
      nodeState.lastSectionEndIndex = currentSectionPos.index + currentSectionPos.length;
      nodeState.currentSectionNodeId = nodeId; // 当前节点继续接收文本
      
      // 如果还有更多的SECTION，标记为待处理
      nodeState.pendingNewSection = nodeState.sectionCount < sectionPositions.length;
      
      return {
        nodes: updatedNodes,
        edges,
        newNodeId: null,
        hasSection: false
      };
    } else {
      // 第二个及以后的SECTION，创建新的平行节点
      console.log(`创建第${nodeState.sectionCount + 1}个SECTION节点，标题: ${sectionTitle}`);
      
      // 为新节点准备初始内容 - 从当前SECTION标记之后到下一个SECTION标记之前的内容
      const nextSectionPos = sectionPositions[nodeState.sectionCount + 1];
      const sectionEndIndex = nextSectionPos ? nextSectionPos.index : nodeState.accumulatedText.length;
      const initialContent = nodeState.accumulatedText.substring(
        currentSectionPos.index + currentSectionPos.length,
        sectionEndIndex
      );
      
      console.log(`为新节点准备初始内容，长度: ${initialContent.length}字符`);
      
      // 创建新的平行节点 - 水平方向延伸
      const newNodeId = `${targetNode.id}_section_${Date.now()}`;
      const newParallelNode = {
        id: newNodeId,
        type: 'answer',
        position: {
          x: targetNode.position.x + 380 * nodeState.sectionCount, // 水平方向延伸
          y: targetNode.position.y                                 // 保持相同高度
        },
        data: {
          ...targetNode.data,
          title: sectionTitle || 'AI解析',                        // 使用SECTION标题
          text: initialContent,                                   // 包含初始内容
          parentId: targetNode.data.parentId,                     // 与原节点保持相同的父节点
        }
      } as Node<NodeData<'answer'>>;
      
      // 创建新的边连接父节点和新节点
      const newEdge = {
        id: `e${targetNode.data.parentId}-${newNodeId}`,
        source: targetNode.data.parentId ? targetNode.data.parentId.toString() : '',
        target: newNodeId,
        type: 'smoothstep',
      } as Edge;
      
      // 更新当前节点的文本内容 
      const updatedCurrentNode = {
        ...targetNode,
        data: {
          ...targetNode.data,
          text: targetNode.data.text // 保持当前内容不变
        }
      };
      
      // 增加已处理的SECTION计数并更新最后处理位置
      nodeState.sectionCount += 1;
      nodeState.lastSectionEndIndex = currentSectionPos.index + currentSectionPos.length;
      nodeState.currentSectionNodeId = newNodeId; // 新节点将接收后续文本
      
      // 如果还有更多的SECTION，将它们标记为待处理
      nodeState.pendingNewSection = nodeState.sectionCount < sectionPositions.length;
      
      return {
        nodes: [...nodes.map(n => n.id === targetNode.id ? updatedCurrentNode : n), newParallelNode],
        edges: [...edges, newEdge],
        newNodeId,
        hasSection: true
      };
    }
  }
  
  // 已处理所有SECTION，应该路由到当前活动的SECTION节点
  if (nodeState.currentSectionNodeId && nodeState.currentSectionNodeId !== nodeId) {
    const sectionNode = nodes.find(node => node.id === nodeState.currentSectionNodeId);
    if (sectionNode) {
      console.log(`路由文本到当前活动的SECTION节点: ${nodeState.currentSectionNodeId}`);
      return {
        nodes: nodes.map(node => 
          node.id === nodeState.currentSectionNodeId ? 
          {
            ...node, 
            data: {
              ...node.data, 
              text: node.data.text + textData.content
            }
          } : node
        ),
        edges,
        newNodeId: null,
        hasSection: false
      };
    }
  }
  
  // 默认情况：更新当前节点
  const updatedNodes = nodes.map(node =>
    node.id === nodeId ? 
    {
      ...node, 
      data: {
        ...node.data, 
        text: node.data.text + textData.content
      }
    } : node
  );
  
  return { 
    nodes: updatedNodes, 
    edges, 
    newNodeId: null, 
    hasSection: false
  };
}