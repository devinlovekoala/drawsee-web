import { Handle, Position, NodeProps } from '@xyflow/react';
import { NodeType } from '@/api/types/flow.types';
import { format } from 'date-fns';
import type { NodeData } from '../types/node.types';
import { NODE_WIDTH, NODE_MIN_HEIGHT } from '../../../constants';
import MarkdownWithLatex from '../../markdown/MarkdownWithLatex';

// 定义节点选中样式的CSS
const selectedNodeStyles = `
@keyframes pulseHighlight {
  0% {
    box-shadow: 0 0 0 0 rgba(79, 70, 229, 0.4);
  }
  70% {
    box-shadow: 0 0 0 10px rgba(79, 70, 229, 0);
  }
  100% {
    box-shadow: 0 0 0 0 rgba(79, 70, 229, 0);
  }
}

.node-selected {
  border: 2px solid #4F46E5 !important;
  box-shadow: 0 0 0 4px rgba(79, 70, 229, 0.2), 0 4px 12px rgba(0, 0, 0, 0.08) !important;
  transform: translateY(-2px);
  transition: all 0.2s ease-in-out;
}

.node-selected-pulse {
  animation: pulseHighlight 2s infinite;
}
`;

// 扩展 NodeProps 的接口
export interface ExtendedNodeProps<T extends NodeType> extends Omit<NodeProps, 'data'> {
  data: NodeData<T>;
  headerContent?: React.ReactNode;
  footerContent?: React.ReactNode;
  customContent?: React.ReactNode;
  showSourceHandle?: boolean;
  showTargetHandle?: boolean;
}

interface HasTitleText {
  title?: string;
  text?: string;
  createdAt: number;
}

export function BaseNode<T extends NodeType>({
  data,
  headerContent,
  footerContent,
  customContent,
  showSourceHandle = true,
  showTargetHandle = true,
  selected,
  ...props
}: ExtendedNodeProps<T>) {
  const nodeData = data as unknown as HasTitleText;
  const hasTitle = nodeData.title !== undefined;
  const hasText = nodeData.text !== undefined;
  
  return (
    <>
      <style>{selectedNodeStyles}</style>
      <div 
        className={`bg-white rounded-lg shadow-md border border-gray-200 overflow-hidden transition-all duration-200 ${selected ? 'node-selected' : ''}`} 
        style={{ width: NODE_WIDTH, minHeight: NODE_MIN_HEIGHT }}
      >
        {/* Header */}
        <div className={`px-4 py-3 ${selected ? 'bg-indigo-50' : 'bg-gray-50'} border-b border-gray-200 transition-colors duration-200`}>
          {hasTitle && <h3 className={`node-title text-lg font-semibold ${selected ? 'text-indigo-800' : 'text-gray-800'}`}>{nodeData.title}</h3>}
          {headerContent}
        </div>

        {/* Content */}
        <div className="px-4 py-3">
          {customContent ? (
            customContent
          ) : (
            hasText && (
              <article className="node-content select-text prose prose-sm max-w-none">
                <MarkdownWithLatex className="scrollbar-hide">{nodeData.text || ''}</MarkdownWithLatex>
              </article>
            )
          )}
        </div>

        {/* Footer */}
        <div className={`node-footer px-4 py-2 ${selected ? 'bg-indigo-50' : 'bg-gray-50'} border-t border-gray-200 flex items-center justify-between text-sm text-gray-600 transition-colors duration-200`}>
          <div>{footerContent}</div>
          <div className="node-timestamp">
            {format(new Date(nodeData.createdAt), 'yyyy-MM-dd HH:mm')}
          </div>
        </div>

        {/* Handles */}
        {showTargetHandle && (
          <Handle
            type="target"
            position={Position.Top}
            className={`w-3 h-3 ${selected ? 'bg-indigo-500' : 'bg-blue-500'} transition-colors duration-200`}
          />
        )}
        {showSourceHandle && (
          <Handle
            type="source"
            position={Position.Bottom}
            className={`w-3 h-3 ${selected ? 'bg-indigo-500' : 'bg-blue-500'} transition-colors duration-200`}
          />
        )}
      </div>
    </>
  );
} 