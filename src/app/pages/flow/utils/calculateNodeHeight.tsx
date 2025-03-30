import { renderToStaticMarkup } from 'react-dom/server';
import { Node, ReactFlowProvider } from '@xyflow/react';
import { NodeType } from '@/api/types/flow.types';
import { NodeData } from '../components/node/types/node.types';
import { NODE_DEFAULT_HEIGHT, NODE_WIDTH } from '../constants';
import QueryNode from '../components/node/QueryNode';
import AnswerNode from '../components/node/AnswerNode';
import KnowledgeHeadNode from '../components/node/KnowledgeHeadNode';
import KnowledgeDetailNode from '../components/node/KnowledgeDetailNode';
import RootNode from '../components/node/RootNode';
import { ExtendedNodeProps } from '../components/node/base/BaseNode';
import ResourceNode from '../components/node/resource/ResourceNode';

// 创建一个隐藏的容器div
let containerDiv: HTMLDivElement | null = null;

// 确保容器div存在
function ensureContainerDiv(): HTMLDivElement {
  if (!containerDiv) {
    containerDiv = document.createElement('div');
    containerDiv.style.position = 'fixed'; // 必须是fixed，不然hidden不生效
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
export function calculateNodeHeight(node: Node<NodeData<NodeType>>, nodeWidth: number = NODE_WIDTH): number {    
  let NodeComponent: React.ComponentType<ExtendedNodeProps<NodeType>>;
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
    case 'resource':
      NodeComponent = ResourceNode;
      break;
    default:
      return NODE_DEFAULT_HEIGHT;
  }
  // 确保容器div存在
  const container = ensureContainerDiv();
  // 渲染节点组件，禁用所有 handles

  // 禁用console.error，让它别输出在控制台中
  const originalConsoleError = console.error;
  console.error = () => {}; // Suppress console.error warnings

  const htmlString = renderToStaticMarkup(
    <ReactFlowProvider>
      <NodeComponent
        id={node.id}
        type={node.type}
        data={node.data}
        selected={false}
        dragging={false}
        showSourceHandle={false}
        showTargetHandle={false}
        zIndex={0}
        selectable={false}
        deletable={false}
        draggable={false}
        isConnectable={false}
        positionAbsoluteX={0}
        positionAbsoluteY={0}
      />
    </ReactFlowProvider>
  );

  console.error = originalConsoleError; // Restore original console.error

  // 统计获得高度所需的时间并输出
  //const startTime = performance.now();

  // 清空容器
  container.innerHTML = '';
  // 设置新的内容
  container.innerHTML = htmlString;
  // 获取实际高度，取整数
  let height = Math.round(container.getBoundingClientRect().height);
  // 确保最小高度
  height = Math.max(height, NODE_DEFAULT_HEIGHT);

  // 计算需要额外加的高度
  let extraHeight = 0;
  if (node.type === 'resource') {
    console.log(`ResourceNode: ${node.data.subtype}节点计算得高度为：${height}`);

    // 资源高度，根据nodeWidth计算，宽高比16:9
    const resourceHeight = nodeWidth * 9 / 16;

    switch (node.data.subtype) {
      case 'bilibili': {
        const urls = node.data.urls as string[];
        extraHeight = urls.length * resourceHeight;
        break;
      }
      case 'animation': {
        const objectNames = node.data.objectNames as string[];
        extraHeight = objectNames.length * resourceHeight;
        break;
      }
      case 'generated-animation': {
        extraHeight = resourceHeight;
        break;
      }
      default:
        break;
    }
  }

  //const endTime = performance.now();
  //console.log(`获得${node.type}节点高度所需的时间: ${endTime - startTime}毫秒`);

  if (node.type === 'resource') {
    console.log(`ResourceNode: ${node.data.subtype}节点最终计算得高度为：${height + extraHeight}`);
  }

  return height + extraHeight;
}