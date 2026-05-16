import React, { useMemo, useCallback, useState, useRef } from 'react';
import ReactMarkdown from 'react-markdown';
import remarkGfm from 'remark-gfm';
import remarkMath from 'remark-math';
import remarkRehype from 'remark-rehype';
import remarkParse from 'remark-parse';
//import remarkCodeExtra from 'remark-code-extra';
//import codesandbox from 'remark-codesandbox';
import rehypeKatex from 'rehype-katex';
import rehypeHighlight from 'rehype-highlight'
//import rehypePrettyCode from "rehype-pretty-code";
//import rehypeStarryNight from 'rehype-starry-night'
import rehypeStringify from 'rehype-stringify'
import classNames from 'classnames';
import 'katex/dist/katex.min.css';
import './styles/katex.min.css';
//import './styles/starry-night-style-light.css';
import './styles/highlight-atom-one-dark.css';
import { Terminal, Eye, ChevronDown, ChevronUp, ExternalLink, Loader2 } from 'lucide-react';
import CopyButton from '../button/CopyButton';
import { nanoid } from 'nanoid';
import { useAppContext } from '@/app/contexts/AppContext';
import { getDocumentById } from '@/api/methods/document.methods';

// 创建静态全局缓存，但对于流式更新内容使用较小的缓存容量
// 使用弱映射减少内存占用，允许文本内容被垃圾回收
const markdownCache: Record<string, { content: React.ReactNode; timestamp: number }> = {};
const CACHE_SIZE_LIMIT = 100; // 限制缓存大小
const CACHE_EXPIRE_TIME = 5 * 60 * 1000; // 5分钟过期

/**
 * 为文本内容生成唯一hash，用作缓存键
 */
function generateHash(text: string): string {
	let hash = 0;
	for (let i = 0; i < text.length; i++) {
		const char = text.charCodeAt(i);
		hash = ((hash << 5) - hash) + char;
		hash = hash & hash; // Convert to 32bit integer
	}
	return hash.toString();
}

/**
 * 清理过期的缓存条目
 */
function cleanExpiredCache() {
	const now = Date.now();
	const keys = Object.keys(markdownCache);
	
	// 如果缓存大小超过限制，清理过期条目
	if (keys.length > CACHE_SIZE_LIMIT) {
		keys.forEach(key => {
			if (now - markdownCache[key].timestamp > CACHE_EXPIRE_TIME) {
				delete markdownCache[key];
			}
		});
		
		// 如果清理后仍然超过限制，删除最旧的条目
		const remainingKeys = Object.keys(markdownCache);
		if (remainingKeys.length > CACHE_SIZE_LIMIT) {
			const sortedKeys = remainingKeys.sort((a, b) => 
				markdownCache[a].timestamp - markdownCache[b].timestamp
			);
			// 删除最旧的一半
			const toDelete = sortedKeys.slice(0, Math.floor(sortedKeys.length / 2));
			toDelete.forEach(key => delete markdownCache[key]);
		}
	}
}

/**
 * KaTeX格式处理
 */
/*function preprocessLaTeX(content: string): string {
  // 步骤一：保护代码块
  const codeBlocks: string[] = [];
  content = content.replace(/(```[\s\S]*?```|`[^`\n]+`)/g, (match, code) => {
    codeBlocks.push(code);
    return `<<CODE_BLOCK_${codeBlocks.length - 1}>>`;
  });
 
  // 步骤二：保护 LaTeX 表达式
  const latexExpressions: string[] = [];
  content = content.replace(/(\$\$[\s\S]*?\$\$|\\\[[\s\S]*?\\\]|\\\(.*?\\\))/g, (match) => {
    latexExpressions.push(match);
    return `<<LATEX_${latexExpressions.length - 1}>>`;
  });
 
  // 步骤三：将内容中后跟数字的 $（如 $100）转义为 \$，以避免将其误认为是 LaTeX 行内公式的分隔符。
  content = content.replace(/\$(?=\d)/g, '\\$');
 
  // 步骤四: 将占位符 <<LATEX_n>> 替换回原始的 LaTeX 表达式，确保数学公式内容恢复。
  content = content.replace(/<<LATEX_(\d+)>>/g, (_, index) => latexExpressions[parseInt(index)]);
 
  // 步骤五: 将占位符 <<CODE_BLOCK_n>> 替换回原始代码块内容。
  content = content.replace(/<<CODE_BLOCK_(\d+)>>/g, (_, index) => codeBlocks[parseInt(index)]);
 
  // 步骤六：将 \[...\] 和 \(...\) 转换为 $$...$$ 和 $...$
  content = escapeBrackets(content);
  // 对化学公式中的 \ce{} 和 \pu{} 命令添加额外的反斜杠转义（如 $\\ce{} 变为 $\\\\ce{}），以防止解析错误。
  content = escapeMhchem(content);
 
  return content;
}*/

function escapeBrackets(text: string): string {
  const pattern = /(```[\S\s]*?```|`.*?`)|\\\[([\S\s]*?[^\\])\\]|\\\((.*?)\\\)/g;
  return text.replace(
    pattern,
    (
      match: string,
      codeBlock: string | undefined,
      squareBracket: string | undefined,
      roundBracket: string | undefined,
    ): string => {
      if (codeBlock != null) {
        return codeBlock;
      } else if (squareBracket != null) {
        return `$$${squareBracket}$$`;
      } else if (roundBracket != null) {
        return `$${roundBracket}$`;
      }
      return match;
    },
  );
}
 
// 处理特殊的化学函数
function escapeMhchem(text: string) {
  return text.replace(/\$\\ce{/g, '$\\\\ce{').replace(/\$\\pu{/g, '$\\\\pu{');
}

/**
 * 渲染Markdown和LaTeX数学公式，针对流式更新优化
 * 
 * 特性:
 * - 智能缓存: 对稳定内容使用缓存，对流式内容实时渲染
 * - 减少DOM元素: 避免频繁的DOM树重建
 * - 支持数学公式: 使用KaTeX渲染数学表达式
 */
interface MarkdownWithLatexProps {
	text: string;
	className?: string;
	isStreaming?: boolean; // 新增：标识是否为流式内容
	ragSources?: RagSource[];
	showRagReferences?: boolean;
}

export interface RagSource {
	citationKey?: string;
	documentId?: string;
	knowledgeBaseId?: string;
	chunkIndex?: number | string;
	pageNumber?: number | string;
	score?: number | string;
	title?: string;
	originalFileName?: string;
	fileType?: string;
	fileUrl?: string;
	imageUrl?: string;
	circuitId?: string;
	preview?: string;
}

const normalizeRagSources = (sources?: RagSource[]): RagSource[] => {
	if (!Array.isArray(sources)) return [];
	return sources.filter(source => source && typeof source.citationKey === 'string' && source.citationKey.trim().length > 0);
};

const getSourceTitle = (source: RagSource): string => {
	return source.title || source.originalFileName || source.documentId || '未命名资料';
};

const getRagSourceSignature = (sources?: RagSource[]): string => {
	return normalizeRagSources(sources)
		.map(source => `${source.citationKey}:${getSourceTitle(source)}:${source.pageNumber ?? ''}:${source.chunkIndex ?? ''}`)
		.join('|');
};

function RagSourceCard({ source }: { source: RagSource }) {
	const [expanded, setExpanded] = useState(false);
	const [openLoading, setOpenLoading] = useState(false);
	const cachedUrl = useRef<string | null>(null);
	const citationKey = source.citationKey || '';
	const metaParts = [
		source.pageNumber ? `第 ${source.pageNumber} 页` : null,
		source.chunkIndex !== undefined && source.chunkIndex !== null ? `片段 ${source.chunkIndex}` : null,
		source.score !== undefined && source.score !== null ? `相关度 ${Number(source.score).toFixed(2)}` : null,
	].filter(Boolean);

	// 是否有可打开的文档：直接有 fileUrl，或有数值型 documentId 可查询
	const numericDocId = Number(source.documentId);
	const hasNumericDocId = Boolean(source.documentId) && Number.isFinite(numericDocId) && numericDocId > 0;
	const canOpenDocument = Boolean(source.fileUrl) || hasNumericDocId;

	const handleOpenDocument = useCallback(async () => {
		if (openLoading) return;
		const pageNum = source.pageNumber ? Number(source.pageNumber) : null;
		const buildUrl = (base: string) =>
			pageNum ? `${base}#page=${pageNum}` : base;

		if (cachedUrl.current) {
			window.open(buildUrl(cachedUrl.current), '_blank', 'noopener,noreferrer');
			return;
		}
		// 优先使用 ragSource 直接携带的 fileUrl
		if (source.fileUrl) {
			cachedUrl.current = source.fileUrl;
			window.open(buildUrl(source.fileUrl), '_blank', 'noopener,noreferrer');
			return;
		}
		// 降级：数值型 documentId 走查询接口
		if (!hasNumericDocId) return;
		setOpenLoading(true);
		try {
			const doc = await getDocumentById(numericDocId);
			cachedUrl.current = doc.fileUrl;
			window.open(buildUrl(doc.fileUrl), '_blank', 'noopener,noreferrer');
		} catch {
			// 静默失败，按钮恢复可用
		} finally {
			setOpenLoading(false);
		}
	}, [source.fileUrl, source.documentId, source.pageNumber, openLoading, hasNumericDocId, numericDocId]);

	return (
		<div
			id={`rag-source-${citationKey}`}
			className="rounded-md border border-blue-100 bg-white px-3 py-2 text-xs text-slate-700 shadow-sm"
		>
			<div className="flex items-start gap-2">
				<span className="mt-0.5 inline-flex h-5 min-w-5 items-center justify-center rounded bg-blue-600 px-1 text-[10px] font-semibold text-white shrink-0">
					{citationKey}
				</span>
				<div className="min-w-0 flex-1">
					<div className="flex items-start justify-between gap-1">
						<div className="font-medium text-slate-900 leading-snug">
							{getSourceTitle(source)}
						</div>
						{canOpenDocument && (
							<button
								type="button"
								onClick={handleOpenDocument}
								disabled={openLoading}
								title={source.pageNumber ? `打开文档（第 ${source.pageNumber} 页）` : '打开文档'}
								className="shrink-0 ml-1 flex items-center gap-0.5 rounded px-1.5 py-0.5 text-[10px] text-blue-600 hover:bg-blue-50 disabled:opacity-50 transition-colors"
							>
								{openLoading
									? <Loader2 className="h-3 w-3 animate-spin" />
									: <ExternalLink className="h-3 w-3" />
								}
								{source.pageNumber ? `p.${source.pageNumber}` : '打开'}
							</button>
						)}
					</div>
					{metaParts.length > 0 && (
						<div className="mt-0.5 text-[11px] text-slate-500">
							{metaParts.join(' · ')}
						</div>
					)}
					{source.preview && (
						<>
							<div className={classNames('mt-1 text-[11px] leading-relaxed text-slate-600 whitespace-pre-line', { 'line-clamp-2': !expanded })}>
								{source.preview}
							</div>
							<button
								type="button"
								onClick={() => setExpanded(prev => !prev)}
								className="mt-1 flex items-center gap-0.5 text-[10px] text-blue-500 hover:text-blue-700"
							>
								{expanded ? (
									<><ChevronUp className="h-3 w-3" />收起</>
								) : (
									<><ChevronDown className="h-3 w-3" />展开原文</>
								)}
							</button>
						</>
					)}
				</div>
			</div>
		</div>
	);
}

function RagReferenceList({ sources }: { sources: RagSource[] }) {
	return (
		<section className="not-prose mt-5 rounded-lg border border-blue-100 bg-blue-50/40 p-3">
			<div className="mb-2 text-xs font-semibold text-blue-700">
				RAG 引用文档
			</div>
			<div className="space-y-2">
				{sources.map(source => (
					<RagSourceCard
						key={`${source.citationKey}-${source.documentId || source.chunkIndex || getSourceTitle(source)}`}
						source={source}
					/>
				))}
			</div>
		</section>
	);
}

const MarkdownWithLatex: React.FC<MarkdownWithLatexProps> = ({
	text,
	className,
	isStreaming = false, // 默认不是流式内容
	ragSources,
	showRagReferences = true,
}) => {
	const normalizedRagSources = useMemo(() => normalizeRagSources(ragSources), [ragSources]);
	const ragSourceMap = useMemo(() => {
		return new Map(normalizedRagSources.map(source => [source.citationKey!, source]));
	}, [normalizedRagSources]);
	const sourceSignature = useMemo(() => getRagSourceSignature(normalizedRagSources), [normalizedRagSources]);
	const markdownText = useMemo(() => {
		if (normalizedRagSources.length === 0) return text;
		return text.replace(/\[(R\d+)\]/g, (match, citationKey) => {
			return ragSourceMap.has(citationKey)
				? `[${citationKey}](#rag-citation-${citationKey})`
				: match;
		});
	}, [text, normalizedRagSources.length, ragSourceMap]);
	// 为文本内容生成hash，用作缓存键
	const cacheKey = useMemo(() => generateHash(`${markdownText}\n${sourceSignature}`), [markdownText, sourceSignature]);
	
  // 使用AppContext获取HTML预览相关状态和函数
  const { openHtmlPreview } = useAppContext();

	// 创建代码组件的回调，避免每次都重新创建
	const createCodeComponent = useCallback(({ node, className, children, ...props }: any) => {
		const match = /language-(\w+)/.exec(className || "");
		// 获取具体是哪中语言
		const language = match?.[1];
		if (match?.length) {
			const uuid = nanoid();
			return (
				<div className={`not-prose rounded-md border nowheel ${className}`}>
					{/* 顶部 */}
					<div className="flex h-12 items-center justify-between px-5 bg-zinc-600">
						<div className="flex items-center gap-2">
							<Terminal size={24} />
							<span className="text-[22px] ml-3">{language}</span>
							<p className="text-sm text-zinc-600">
								{node?.data?.meta}
							</p>
						</div>
						<div className="flex items-center gap-3">
              {language === 'html' && (
                <button
                  onClick={() => {
										openHtmlPreview(document.getElementById(uuid)?.innerText || '')
									}}
                  className="flex items-center justify-center p-1 rounded-md text-white hover:bg-zinc-500 transition-colors"
                  title="预览HTML"
                >
                  <Eye size={30} />
                </button>
              )}
							<CopyButton getText={() => document.getElementById(uuid)?.innerText || ''} size={24} />
						</div>
					</div>
					<div className="overflow-x-auto scrollbar-hide">
						<div id={uuid} className="p-4">
							{children}
						</div>
					</div>
				</div>
			);
		} else {
			return (
				<code
					{...props}
					className={`not-prose rounded-md border nowheel ${className}`}
				>
					{children}
				</code>
			);
		}
	}, [openHtmlPreview]);

	const createLinkComponent = useCallback(({ href, children, ...props }: any) => {
		const citationMatch = typeof href === 'string'
			? href.match(/^#rag-citation-(R\d+)$/)
			: null;
		if (citationMatch) {
			const citationKey = citationMatch[1];
			const source = ragSourceMap.get(citationKey);
			const title = source ? getSourceTitle(source) : citationKey;
			return (
				<a
					{...props}
					href={`#rag-source-${citationKey}`}
					title={`引用 ${citationKey}: ${title}`}
					className="rag-citation-marker align-super inline-flex h-4 min-w-4 items-center justify-center rounded bg-blue-50 px-1 text-[10px] font-semibold leading-none text-blue-700 no-underline ring-1 ring-blue-200 hover:bg-blue-100"
				>
					{children}
				</a>
			);
		}
		return (
			<a {...props} href={href}>
				{children}
			</a>
		);
	}, [ragSourceMap]);
	
	// 从缓存中获取或生成渲染内容
	const renderedContent = useMemo(() => {
		// 对于流式内容，不使用缓存，直接渲染
		if (isStreaming) {
			console.log('流式内容，跳过缓存直接渲染，文本长度:', text.length);
			return (
				<ReactMarkdown
					remarkPlugins={[remarkMath, remarkParse, remarkRehype, remarkGfm]}
					rehypePlugins={[rehypeKatex, rehypeHighlight, rehypeStringify]}
					components={{
						pre: ({ children }) => <pre className="not-prose">{children}</pre>,
						code: createCodeComponent,
						a: createLinkComponent,
					}}
				>
					{escapeMhchem(escapeBrackets(markdownText))}
				</ReactMarkdown>
			);
		}

		// 检查缓存中是否已有该内容且未过期
		const cachedItem = markdownCache[cacheKey];
		const now = Date.now();
		
		if (cachedItem && (now - cachedItem.timestamp) < CACHE_EXPIRE_TIME) {
			console.log('使用缓存的markdown内容');
			return cachedItem.content;
		}

		// 清理过期缓存
		cleanExpiredCache();
		
		// 如果缓存中没有或已过期，渲染并存入缓存
		console.log('渲染新的markdown内容并存入缓存');
		const rendered = (
			<ReactMarkdown
				remarkPlugins={[remarkMath, remarkParse, remarkRehype, remarkGfm]}
				rehypePlugins={[rehypeKatex, rehypeHighlight, rehypeStringify]}
				components={{
					pre: ({ children }) => <pre className="not-prose">{children}</pre>,
					code: createCodeComponent,
					a: createLinkComponent,
				}}
			>
				{escapeMhchem(escapeBrackets(markdownText))}
			</ReactMarkdown>
		);
		
		// 存入全局缓存
		markdownCache[cacheKey] = {
			content: rendered,
			timestamp: now
		};
		return rendered;
	}, [markdownText, cacheKey, isStreaming, createCodeComponent, createLinkComponent]);

	const referenceList = useMemo(() => {
		if (!showRagReferences || isStreaming || normalizedRagSources.length === 0) return null;
		return <RagReferenceList sources={normalizedRagSources} />;
	}, [showRagReferences, isStreaming, normalizedRagSources]);
	
	// 渲染包含缓存内容的容器
	return (
		<div className={classNames('markdown-container', className)}>
			{renderedContent}
			{referenceList}
		</div>
	);
};

// 修改memo的比较函数，确保流式内容能及时更新
export default React.memo(MarkdownWithLatex, (prevProps, nextProps) => {
	// 如果是流式内容，需要比较所有属性的变化
	if (nextProps.isStreaming || prevProps.isStreaming) {
		const textChanged = prevProps.text !== nextProps.text;
		const classNameChanged = prevProps.className !== nextProps.className;
		const streamingChanged = prevProps.isStreaming !== nextProps.isStreaming;
		const sourcesChanged = getRagSourceSignature(prevProps.ragSources) !== getRagSourceSignature(nextProps.ragSources);
		const referencesChanged = prevProps.showRagReferences !== nextProps.showRagReferences;
		
		// 任何属性变化都要重新渲染
		return !textChanged && !classNameChanged && !streamingChanged && !sourcesChanged && !referencesChanged;
	}
	
	// 非流式内容使用默认比较
	return prevProps.text === nextProps.text &&
		prevProps.className === nextProps.className &&
		prevProps.showRagReferences === nextProps.showRagReferences &&
		getRagSourceSignature(prevProps.ragSources) === getRagSourceSignature(nextProps.ragSources);
});
