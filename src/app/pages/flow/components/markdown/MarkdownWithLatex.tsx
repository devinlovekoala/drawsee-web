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
import { Terminal, Eye } from 'lucide-react';
import CopyButton from '../button/CopyButton';
import { nanoid } from 'nanoid';
import { useAppContext } from '@/app/contexts/AppContext';

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
	
  // 使用AppContext获取HTML预览相关状态和函数
  const { openHtmlPreview } = useAppContext();
	
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
					},
				}}
			>
				{/* {preprocessLaTeX(text)} */}
				{escapeMhchem(escapeBrackets(text))}
			</ReactMarkdown>
		);
		
		// 存入全局缓存
		markdownCache[cacheKey] = rendered;
		return rendered;
	}, [text, cacheKey, openHtmlPreview]);
	
	// 渲染包含缓存内容的容器
	return (
		<div className={classNames('markdown-container', className)}>
			{renderedContent}
		</div>
	);
};

export default React.memo(MarkdownWithLatex);