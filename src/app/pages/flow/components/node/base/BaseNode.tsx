import { Handle, Position, NodeProps } from '@xyflow/react';
import { NodeType } from '@/api/types/flow.types';
import { format } from 'date-fns';
import type { NodeData } from '../types/node.types';
import { NODE_WIDTH, NODE_MIN_HEIGHT } from '../../../constants';
import MarkdownWithLatex from '../../markdown/MarkdownWithLatex';
import React, { useMemo } from 'react';

// 用于类型检查的接口
interface HasTitleText {
  title?: string;
  text?: string;
  createdAt: number;
}

// 扩展 NodeProps 的接口
export interface ExtendedNodeProps<T extends NodeType> extends Omit<NodeProps, 'data'> {
  data: NodeData<T>;
  headerContent?: React.ReactNode;
  footerContent?: React.ReactNode;
  customContent?: React.ReactNode;
  showSourceHandle?: boolean;
  showTargetHandle?: boolean;
}

/**
 * 自定义比较函数，用于React.memo
 * 只有当关键属性发生变化时才重新渲染
 */
function arePropsEqual<T extends NodeType>(
  prevProps: ExtendedNodeProps<T>,
  nextProps: ExtendedNodeProps<T>
): boolean {
  // 检查选中状态变化
  if (prevProps.selected !== nextProps.selected) return false;
  
  // 检查数据变化
  const prevData = prevProps.data;
  const nextData = nextProps.data;
  
  // 检查关键属性
  if (prevData.title !== nextData.title) return false;
  if (prevData.text !== nextData.text) return false;
  if (prevData.updatedAt !== nextData.updatedAt) return false;
  
  // 检查自定义内容
  if (prevProps.customContent !== nextProps.customContent) return false;
  if (prevProps.headerContent !== nextProps.headerContent) return false;
  if (prevProps.footerContent !== nextProps.footerContent) return false;
  
  // 检查句柄显示状态
  if (prevProps.showSourceHandle !== nextProps.showSourceHandle) return false;
  if (prevProps.showTargetHandle !== nextProps.showTargetHandle) return false;
  
  // 其他属性变化不重要，返回true表示不需要重新渲染
  return true;
}

// 使用React.memo包装BaseNode组件，避免不必要的重新渲染
export const BaseNode = React.memo(function BaseNode<T extends NodeType>({
  data,
  headerContent,
  footerContent,
  customContent,
  showSourceHandle = true,
  showTargetHandle = true,
  selected,
}: ExtendedNodeProps<T>) {
  const nodeData = data as unknown as HasTitleText;
  
  // 使用useMemo缓存计算结果
  const { hasTitle, hasText, formattedDate } = useMemo(() => {
    return {
      hasTitle: nodeData.title !== undefined,
      hasText: nodeData.text !== undefined,
      formattedDate: format(new Date(nodeData.createdAt), 'yyyy-MM-dd HH:mm')
    };
  }, [nodeData.title, nodeData.text, nodeData.createdAt]);
  
  // 使用useMemo缓存样式计算
  const nodeStyles = useMemo(() => ({
    width: NODE_WIDTH,
    minHeight: NODE_MIN_HEIGHT
  }), []);
  
  return (
    <div 
      className={`base-node ${selected ? 'node-selected' : ''}`} 
      style={nodeStyles}
    >
      {/* Header */}
      <div className={`base-node-header ${selected ? 'selected' : 'default'}`}>
        {hasTitle && <h3 className={`base-node-title ${selected ? 'selected' : 'default'}`}>{nodeData.title}</h3>}
        {headerContent}
      </div>

      {/* Content */}
      <div className={`base-node-content nodrag nopan`}>
        {customContent ? (
          customContent
        ) : (
          hasText && (
            <article className="node-content select-text prose prose-sm max-w-none px-3">
              <MarkdownWithLatex className="scrollbar-hide" text={nodeData.text || ''}></MarkdownWithLatex>
            </article>
          )
        )}
      </div>

      {/* Footer */}
      <div className={`base-node-footer ${selected ? 'selected' : 'default'}`}>
        <div>{footerContent}</div>
        <div className="node-timestamp">
          {formattedDate}
        </div>
      </div>

      {/* Handles */}
      {showSourceHandle && (
        <Handle
          type="source"
          position={Position.Bottom}
          className={`node-handle ${selected ? 'selected' : ''}`}
        />
      )}
      {showTargetHandle && (
        <Handle
          type="target"
          position={Position.Top}
          className={`node-handle ${selected ? 'selected' : ''}`}
        />
      )}
    </div>
  );
}, arePropsEqual); 