import { BaseNode, ExtendedNodeProps } from './base/BaseNode';

/**
 * 知识详情节点组件
 * 支持显示 Bilibili 视频和自定义动画
 */
const KnowledgeDetailNode = function KnowledgeDetailNode({
  ...props
}: ExtendedNodeProps<'knowledge-detail'>) {
  return (
    <BaseNode
      {...props}
    />
  );
};

export default KnowledgeDetailNode;