import React, { useMemo } from 'react';
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
import { Terminal } from 'lucide-react';
import CopyButton from '../button/CopyButton';
import { nanoid } from 'nanoid';

// 创建静态全局缓存，避免组件重新渲染时缓存被重置
// 使用弱映射减少内存占用，允许文本内容被垃圾回收
const markdownCache: Record<string, React.ReactNode> = {};

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
 * 渲染Markdown和LaTeX数学公式，使用全局缓存优化性能
 * 
 * 特性:
 * - 文本内容缓存: 相同的markdown内容只渲染一次，大幅提升性能
 * - 减少DOM元素: 避免频繁的DOM树重建
 * - 支持数学公式: 使用KaTeX渲染数学表达式
 */
interface MarkdownWithLatexProps {
	text: string;
	className?: string;
}

const MarkdownWithLatex: React.FC<MarkdownWithLatexProps> = ({ 
	text,
	className,
}) => {
	// 为文本内容生成hash，用作缓存键
	const cacheKey = useMemo(() => generateHash(text), [text]);
	
	// 从缓存中获取或生成渲染内容
	const renderedContent = useMemo(() => {
		// 检查缓存中是否已有该内容
		if (markdownCache[cacheKey]) {
			return markdownCache[cacheKey];
		}
		// 如果缓存中没有，渲染并存入缓存
		const rendered = (
			<ReactMarkdown
				remarkPlugins={[remarkMath, remarkParse, remarkRehype, remarkGfm]}
				rehypePlugins={[rehypeKatex, rehypeHighlight, rehypeStringify]}
				components={{
					pre: ({ children }) => <pre className="not-prose">{children}</pre>,
					code: ({ node, className, children, ...props }) => {
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
										<CopyButton getText={() => document.getElementById(uuid)?.innerText || ''} size={24} />
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
					},
				}}
			>
				{text}
			</ReactMarkdown>
		);
		
		// 存入全局缓存
		markdownCache[cacheKey] = rendered;
		return rendered;
	}, [text, cacheKey]);
	
	// 渲染包含缓存内容的容器
	return (
		<div className={classNames('markdown-container', className)}>
			{renderedContent}
		</div>
	);
};

export default React.memo(MarkdownWithLatex);