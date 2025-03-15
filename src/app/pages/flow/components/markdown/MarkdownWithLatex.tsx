import React from 'react';
import ReactMarkdown from 'react-markdown';
import remarkGfm from 'remark-gfm';
import remarkMath from 'remark-math';
import rehypeKatex from 'rehype-katex';
import 'katex/dist/katex.min.css';

interface MarkdownWithLatexProps {
  children: string;
  className?: string;
}

/**
 * 支持 LaTeX 公式的 Markdown 渲染组件
 * 
 * 使用方式：
 * 行内公式：$E=mc^2$
 * 块级公式：
 * $$
 * E = mc^2
 * $$
 */
const MarkdownWithLatex: React.FC<MarkdownWithLatexProps> = ({ children, className }) => {
  return (
    <div className={`${className || 'prose prose-sm max-w-none'}`}>
      <ReactMarkdown
        remarkPlugins={[remarkGfm, remarkMath]}
        rehypePlugins={[rehypeKatex]}
      >
        {children}
      </ReactMarkdown>
    </div>
  );
};

export default MarkdownWithLatex; 