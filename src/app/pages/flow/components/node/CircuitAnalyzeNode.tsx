import { useMemo, useCallback } from 'react';
import { BaseNode, ExtendedNodeProps } from './base/BaseNode';
import MarkdownWithLatex from '../markdown/MarkdownWithLatex';
import type { AnswerNodeData } from './types/node.types';
import type { FollowUpSuggestionData } from '@/api/types/flow.types';
import { format } from 'date-fns';
import { Sparkles, Clock } from 'lucide-react';

function CircuitAnalyzeNode({ data, ...props }: ExtendedNodeProps<'circuit-analyze'>) {
  const nodeData = data as AnswerNodeData & {
    contextTitle?: string;
    parentId?: number;
    followUps?: FollowUpSuggestionData[];
  };
  const followUps = Array.isArray(nodeData.followUps) ? nodeData.followUps : [];

  const createdAtLabel = useMemo(() => {
    if (!nodeData.createdAt) return null;
    try {
      return format(new Date(nodeData.createdAt), 'MM-dd HH:mm');
    } catch {
      return null;
    }
  }, [nodeData.createdAt]);

  const stripMarkdown = useCallback((input: string) => {
    return input
      .replace(/\$\$[\s\S]*?\$\$/g, '')
      .replace(/\$(.*?)\$/g, '')
      .replace(/```[\s\S]*?```/g, '')
      .replace(/#{1,6}\s+/g, '')
      .replace(/\*\*/g, '')
      .replace(/\*/g, '')
      .replace(/\[.*?\]\(.*?\)/g, '')
      .trim();
  }, []);

  const fallbackSummary = useMemo(() => {
    if (!nodeData.text) {
      return '模型正在分析该电路，请稍候...';
    }
    const stripped = stripMarkdown(nodeData.text);
    if (stripped.length <= 40) {
      return stripped;
    }
    return stripped.substring(0, 40) + '...';
  }, [nodeData.text, stripMarkdown]);

  const warmupIntro = useMemo(() => {
    if (!nodeData.text) return '';
    const normalized = nodeData.text.replace(/\r\n/g, '\n');
    let warmupMatch = normalized.match(/###\s*预热导语\s*\n([\s\S]*?)(?=\n\s*(?:#{2,3}|###|##|【)|$)/);
    if (!warmupMatch) {
      warmupMatch = normalized.match(/【预热导语】([\s\S]*?)(?=【.*?】|$)/);
    }
    if (!warmupMatch) return '';
    const cleaned = stripMarkdown(warmupMatch[1])
      .split('\n')
      .map(line => line.trim())
      .filter(Boolean)
      .join(' ');
    return cleaned.length > 0 ? cleaned : '';
  }, [nodeData.text, stripMarkdown]);

  // 提取所有标题作为缩略标题
  const extractedTitle = useMemo(() => {
    if (!nodeData.text) return '';
    const normalized = nodeData.text.replace(/\r\n/g, '\n');

    // 按优先级提取标题：预热导语 > 其他三级标题 > 其他二级标题
    const titlePatterns = [
      /###\s*(预热导语)/,
      /###\s*([^\n]+)/,
      /##\s*([^\n]+)/,
      /【([^】]+)】/
    ];

    for (const pattern of titlePatterns) {
      const match = normalized.match(pattern);
      if (match && match[1]) {
        return match[1].trim();
      }
    }

    return '';
  }, [nodeData.text]);

  const displayIntro = warmupIntro || fallbackSummary;

  const previewLabel = useMemo(() => {
    // 在缩略视图中，优先显示提取的标题（如"预热导语"）
    // 如果没有标题，则显示内容摘要
    return extractedTitle || displayIntro;
  }, [extractedTitle, displayIntro]);

  const content = useMemo(() => (
    <div className="space-y-3">
      <div className="flex items-center justify-between text-[11px] font-semibold text-rose-500">
        <span className="flex items-center gap-1">
          <Sparkles className="w-3.5 h-3.5" />
          电路分析节点
        </span>
        {createdAtLabel && (
          <span className="flex items-center gap-1 text-gray-400 font-normal">
            <Clock className="w-3 h-3" />
            {createdAtLabel}
          </span>
        )}
      </div>

      <div className="rounded-2xl border border-rose-100 bg-white/85 px-3 py-2.5 shadow-[0_4px_15px_rgba(244,63,94,0.08)]">
        <p className="text-[11px] text-gray-500">
          {nodeData.parentId ? `来自节点 #${nodeData.parentId}` : '分析对象'}
        </p>
        <p className="text-sm font-semibold text-gray-900 leading-tight">
          {nodeData.contextTitle || nodeData.title || '未命名电路'}
        </p>
        <p className="mt-1 text-[12px] text-gray-500 leading-relaxed">
          {displayIntro}
        </p>
      </div>

      <div className="rounded-xl border border-rose-50 bg-rose-50/40 relative">
        <div className="max-h-32 overflow-hidden p-2 text-sm text-gray-700">
          {nodeData.text ? (
            <MarkdownWithLatex
              text={nodeData.text}
              ragSources={Array.isArray((nodeData as any).ragSources) ? (nodeData as any).ragSources : []}
              showRagReferences={false}
            />
          ) : (
            <div className="text-gray-400">模型正在分析该电路，请稍候...</div>
          )}
        </div>
        {nodeData.text && (
          <div className="absolute bottom-0 left-0 right-0 h-6 bg-gradient-to-t from-rose-50/80 to-transparent pointer-events-none" />
        )}
      </div>

      <div className="flex flex-wrap items-center gap-3 text-[11px] text-gray-500">
        <span className="rounded-full bg-white px-2 py-0.5 border border-rose-100 text-rose-500 font-medium">
          追问推荐 {followUps.length}
        </span>
        {nodeData.parentId && (
          <span className="text-gray-400">源节点 #{nodeData.parentId}</span>
        )}
      </div>
    </div>
  ), [createdAtLabel, nodeData.contextTitle, nodeData.parentId, nodeData.text, nodeData.title, displayIntro, followUps.length]);

  const enhancedData = useMemo(() => ({
    ...nodeData,
    previewText: previewLabel
  }), [nodeData, previewLabel]);

  return (
    <BaseNode
      {...props}
      data={enhancedData}
      customContent={content}
    />
  );
}

export default CircuitAnalyzeNode;
