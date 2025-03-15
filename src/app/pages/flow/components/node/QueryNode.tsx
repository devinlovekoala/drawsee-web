import { NodeProps } from '@xyflow/react';
import type { QueryNode as QueryNodeType } from './types/node.types';
import { BaseNode, ExtendedNodeProps } from './base/BaseNode';

function QueryNode({ showSourceHandle, showTargetHandle, ...props }: ExtendedNodeProps<'query'>) {
  return (
    <BaseNode
      {...props}
      showSourceHandle={showSourceHandle}
      showTargetHandle={showTargetHandle}
      footerContent={
        <span className="inline-flex items-center px-2.5 py-0.5 rounded-full text-xs font-medium bg-blue-100 text-blue-800">
          查询
        </span>
      }
    />
  );
}

export default QueryNode; 