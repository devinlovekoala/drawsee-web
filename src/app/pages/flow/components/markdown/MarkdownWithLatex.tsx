import React, { useMemo } from 'react';
import ReactMarkdown from 'react-markdown';
import remarkGfm from 'remark-gfm';
import remarkMath from 'remark-math';
import rehypeKatex from 'rehype-katex';
import classNames from 'classnames';
import 'katex/dist/katex.min.css';

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
	className 
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
				remarkPlugins={[remarkGfm, remarkMath]}
				rehypePlugins={[rehypeKatex]}
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