import { renderToStaticMarkup } from 'react-dom/server';
import { Node } from '@xyflow/react';
import { NodeType } from '@/api/types/flow.types';
import { NodeData } from '../components/node/types/node.types';
import { NODE_DEFAULT_HEIGHT } from '../constants';
import QueryNode from '../components/node/QueryNode';
import AnswerNode from '../components/node/AnswerNode';
import KnowledgeHeadNode from '../components/node/KnowledgeHeadNode';
import KnowledgeDetailNode from '../components/node/KnowledgeDetailNode';
import RootNode from '../components/node/RootNode';

// 创建一个隐藏的容器div
let containerDiv: HTMLDivElement | null = null;

// 确保容器div存在
function ensureContainerDiv(): HTMLDivElement {
  if (!containerDiv) {
    containerDiv = document.createElement('div');
    containerDiv.style.position = 'fixed';
    containerDiv.style.visibility = 'hidden';
    document.body.appendChild(containerDiv);
  }
  return containerDiv;
}

/**
 * 计算节点高度 - 优化版
 * 使用缓存机制减少DOM操作，提高性能
 * @param node 需要计算高度的节点
 * @returns 计算得到的节点高度
 */
export function calculateNodeHeight(node: Node<NodeData<NodeType>>): number {    
  let NodeComponent: React.ComponentType<any>;
  switch (node.type) {
    case 'root':
      NodeComponent = RootNode;
      break;
    case 'query':
      NodeComponent = QueryNode;
      break;
    case 'answer':
      NodeComponent = AnswerNode;
      break;
    case 'knowledge-head':
      NodeComponent = KnowledgeHeadNode;
      break;
    case 'knowledge-detail':
      NodeComponent = KnowledgeDetailNode;
      break;
    default:
      return NODE_DEFAULT_HEIGHT;
  }
  // 确保容器div存在
  const container = ensureContainerDiv();
  // 渲染节点组件，禁用所有 handles
  const htmlString = renderToStaticMarkup(
    <NodeComponent
      id={node.id}
      type={node.type}
      data={node.data}
      selected={false}
      dragging={false}
      showSourceHandle={false}
      showTargetHandle={false}
    />
  );

  // 统计获得高度所需的时间并输出
  const startTime = performance.now();

  // 计算需要额外加的高度
  let extraHeight = 0;
  if (node.type === 'knowledge-detail') {
    const media = node.data.media as {
      bilibiliUrls: string[];
      animationObjectNames: string[];
    };
    const hasBilibiliUrls = media?.bilibiliUrls?.length ? true : false;
    const hasAnimations = media?.animationObjectNames?.length ? true : false;
    extraHeight = hasBilibiliUrls ? 200 * media.bilibiliUrls.length : 0;
    extraHeight += hasAnimations ? 210 * media.animationObjectNames.length : 0;
  }

  // 清空容器
  container.innerHTML = '';
  // 设置新的内容
  container.innerHTML = htmlString;
  // 获取实际高度，取整数
  let height = Math.round(container.getBoundingClientRect().height);
  // 确保最小高度
  height = Math.max(height, NODE_DEFAULT_HEIGHT);

  const endTime = performance.now();
  console.log(`获得${node.type}节点高度所需的时间: ${endTime - startTime}毫秒`);

  return height + extraHeight;
}