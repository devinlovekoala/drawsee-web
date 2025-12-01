import { useMemo } from 'react';
import { BaseNode, ExtendedNodeProps } from './base/BaseNode';
import { useFlowContext } from '@/app/contexts/FlowContext';
import MarkdownWithLatex from '../markdown/MarkdownWithLatex';
import type { FollowUpSuggestionData } from '@/api/types/flow.types';
import type { AnswerNodeData } from './types/node.types';

function CircuitAnalyzeNode({ data, ...props }: ExtendedNodeProps<'circuit-analyze'>) {
  const nodeData = data as AnswerNodeData & {
    followUps?: FollowUpSuggestionData[];
    contextTitle?: string;
  };
  const { applySuggestion } = useFlowContext();

  const followUps = Array.isArray(nodeData.followUps) ? nodeData.followUps : [];

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
      {followUps.length > 0 && (
        <div className="space-y-1">
          <div className="text-xs font-semibold text-gray-500 flex items-center gap-1">
            推荐追问
            <span className="text-[10px] text-gray-400">(点击即可填入输入框)</span>
          </div>
          <div className="flex flex-wrap gap-2">
            {followUps.map((item, index) => {
              const payload = item.followUp || item.hint || item.title || '';
              return (
                <button
                  key={`${item.title || 'recommend'}-${index}`}
                  type="button"
                  onClick={() => applySuggestion?.(payload)}
                  className="group px-3 py-2 rounded-xl bg-white border border-emerald-200 shadow-sm text-left hover:border-emerald-400 hover:shadow-md transition-all duration-200 text-sm"
                >
                  <div className="font-medium text-emerald-700 flex items-center gap-2">
                    <span>{item.title || `追问 ${index + 1}`}</span>
                    {typeof item.confidence === 'number' && (
                      <span className="text-[10px] px-1.5 py-0.5 rounded-full bg-emerald-100 text-emerald-600">
                        {(item.confidence * 100).toFixed(0)}%
                      </span>
                    )}
                  </div>
                  {item.hint && (
                    <p className="text-xs text-gray-500 mt-1 leading-snug">
                      {item.hint}
                    </p>
                  )}
                </button>
              );
            })}
          </div>
        </div>
      )}
    </div>
  ), [nodeData.contextTitle, nodeData.text, followUps, applySuggestion]);

  return (
    <BaseNode
      {...props}
      data={nodeData}
      customContent={content}
    />
  );
}

export default CircuitAnalyzeNode;
