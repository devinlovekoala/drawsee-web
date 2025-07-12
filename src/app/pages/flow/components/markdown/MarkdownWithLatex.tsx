import React, { useMemo, useCallback } from 'react';
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
import { Terminal, Eye } from 'lucide-react';
import CopyButton from '../button/CopyButton';
import { nanoid } from 'nanoid';
import { useAppContext } from '@/app/contexts/AppContext';

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
}

const MarkdownWithLatex: React.FC<MarkdownWithLatexProps> = ({ 
	text,
	className,
	isStreaming = false, // 默认不是流式内容
}) => {
	// 为文本内容生成hash，用作缓存键
	const cacheKey = useMemo(() => generateHash(text), [text]);
	
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
	
	// 从缓存中获取或生成渲染内容
	const renderedContent = useMemo(() => {
		// 对于流式内容，不使用缓存，直接渲染
		if (isStreaming) {
			console.log('流式内容，跳过缓存直接渲染');
			return (
				<ReactMarkdown
					remarkPlugins={[remarkMath, remarkParse, remarkRehype, remarkGfm]}
					rehypePlugins={[rehypeKatex, rehypeHighlight, rehypeStringify]}
					components={{
						pre: ({ children }) => <pre className="not-prose">{children}</pre>,
						code: createCodeComponent,
					}}
				>
					{escapeMhchem(escapeBrackets(text))}
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
				}}
			>
				{escapeMhchem(escapeBrackets(text))}
			</ReactMarkdown>
		);
		
		// 存入全局缓存
		markdownCache[cacheKey] = {
			content: rendered,
			timestamp: now
		};
		return rendered;
	}, [text, cacheKey, isStreaming, createCodeComponent]);
	
	// 渲染包含缓存内容的容器
	return (
		<div className={classNames('markdown-container', className)}>
			{renderedContent}
		</div>
	);
};

// 修改memo的比较函数，确保流式内容能及时更新
export default React.memo(MarkdownWithLatex, (prevProps, nextProps) => {
	// 如果是流式内容，任何text变化都要重新渲染
	if (nextProps.isStreaming || prevProps.isStreaming) {
		return prevProps.text === nextProps.text && prevProps.className === nextProps.className && prevProps.isStreaming === nextProps.isStreaming;
	}
	
	// 非流式内容使用默认比较
	return prevProps.text === nextProps.text && prevProps.className === nextProps.className;
});