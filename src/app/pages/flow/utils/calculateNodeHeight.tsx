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
const containerDiv = document.createElement('div');
containerDiv.style.visibility = 'hidden';
containerDiv.style.position = 'fixed';
document.body.appendChild(containerDiv);

// 媒体数据类型定义
interface MediaData {
  bilibiliUrls?: string[];
  animationObjectNames?: string[];
}

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

  // 清空容器
  containerDiv.innerHTML = '';
  // 设置新的内容
  containerDiv.innerHTML = htmlString;

  // 获取实际高度，取整数
  let height = Math.round(containerDiv.getBoundingClientRect().height);

  // 为 knowledge-detail 类型的节点添加媒体内容的高度
  if (node.type === 'knowledge-detail') {
    const mediaData = node.data.media as MediaData | undefined;
    
    // 计算额外的媒体内容高度
    let extraHeight = 0;
    
    // 如果有 B 站视频，每个视频高度为 140px
    const bilibiliCount = mediaData?.bilibiliUrls?.length || 0;
    // if (bilibiliCount > 0) {
    //   // 标题高度 + 每个视频的高度 + 间距
    //   extraHeight += (bilibiliCount * 90);
    // }
    
    // 如果有动画，每个动画高度为 150px
    const animationCount = mediaData?.animationObjectNames?.length || 0;
    // if (animationCount > 0) {
    //   // 标题高度 + 每个动画的高度 + 间距
    //   extraHeight += (animationCount * 200);
    // }
    
    // 如果有任何媒体内容，添加顶部间距
    if (extraHeight > 0) {
      extraHeight += 10;
    }
    
    console.log(`知识详情节点额外媒体高度: ${extraHeight}`);
    height += extraHeight;
  }

  console.log(`计算得到${node.type}节点高度: ${height}`);

  return Math.max(height, NODE_DEFAULT_HEIGHT);
} 