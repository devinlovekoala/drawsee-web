import { NodeProps } from '@xyflow/react';
import type { AnswerNode as AnswerNodeType } from './types/node.types';
import { BaseNode, ExtendedNodeProps } from './base/BaseNode';

function AnswerNode({ showSourceHandle, showTargetHandle, ...props }: ExtendedNodeProps<'answer'>) {
  return (
    <BaseNode
      {...props}
      showSourceHandle={showSourceHandle}
      showTargetHandle={showTargetHandle}
    />
  );
}

export default AnswerNode; 