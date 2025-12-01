import { useMemo } from 'react';
import { BaseNode, ExtendedNodeProps } from './base/BaseNode';
import MarkdownWithLatex from '../markdown/MarkdownWithLatex';
import type { AnswerNodeData } from './types/node.types';

function CircuitAnalyzeNode({ data, ...props }: ExtendedNodeProps<'circuit-analyze'>) {
  const nodeData = data as AnswerNodeData & {
    contextTitle?: string;
  };

  const content = useMemo(() => (
    <div className="space-y-3">
      {nodeData.contextTitle && (
        <div className="text-xs uppercase tracking-wide text-emerald-600 font-semibold">
          针对：{nodeData.contextTitle}
        </div>
      )}
      {nodeData.text ? (
        <MarkdownWithLatex text={nodeData.text} />
      ) : (
        <div className="text-sm text-gray-400">模型正在分析该电路，请稍候...</div>
      )}
    </div>
  ), [nodeData.contextTitle, nodeData.text]);

  return (
    <BaseNode
      {...props}
      data={nodeData}
      customContent={content}
    />
  );
}

export default CircuitAnalyzeNode;
