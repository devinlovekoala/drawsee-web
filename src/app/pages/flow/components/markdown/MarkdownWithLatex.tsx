import React, { useEffect, useMemo, useRef } from 'react';
import ReactMarkdown from 'react-markdown';
import remarkGfm from 'remark-gfm';
import remarkMath from 'remark-math';
import rehypeKatex from 'rehype-katex';
import 'katex/dist/katex.min.css';

interface MarkdownWithLatexProps {
	text: string;
	className?: string;
}

/**
 * 支持 LaTeX 公式的 Markdown 渲染组件
 * 使用 useMemo 缓存渲染结果，提高性能
 *
 * 使用方式：
 * 行内公式：$E=mc^2$
 * 块级公式：
 * $$
 * E = mc^2
 * $$
 */
const MarkdownWithLatex: React.FC<MarkdownWithLatexProps> = ({ text, className }) => {
	// 使用useMemo缓存渲染结果，只有当text变化时才重新渲染
	const renderedContent = useMemo(() => {
		console.log('重新渲染 MarkdownWithLatex');

		return (
			<ReactMarkdown
				remarkPlugins={[remarkGfm, remarkMath]}
				rehypePlugins={[rehypeKatex]}
			>
				{text}
			</ReactMarkdown>
		);
	}, [text]);

	return (
		<div className={`${className || 'prose prose-sm max-w-none'}`}>
			{renderedContent}
		</div>
	);
};

export default React.memo(MarkdownWithLatex);