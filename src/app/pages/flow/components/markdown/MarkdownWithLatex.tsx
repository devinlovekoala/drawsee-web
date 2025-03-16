import React, { useMemo, useRef, useEffect } from 'react';
import ReactMarkdown from 'react-markdown';
import remarkGfm from 'remark-gfm';
import remarkMath from 'remark-math';
import rehypeKatex from 'rehype-katex';
import 'katex/dist/katex.min.css';

interface MarkdownWithLatexProps {
  children: string;
  className?: string;
  debug?: boolean; // 是否显示调试信息
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
 * 
 * 特性：
 * 1. 支持双反斜杠 (\\) 和单反斜杠 (\) 格式的 LaTeX 公式
 * 2. 自动处理转义字符
 * 3. 支持常见的 LaTeX 命令和环境
 * 4. 自动检测公式溢出并等比例缩放，确保公式完整显示
 */
const MarkdownWithLatex: React.FC<MarkdownWithLatexProps> = ({ children, className, debug = false }) => {
  const containerRef = useRef<HTMLDivElement>(null);
  
  // 预处理 Markdown 内容，处理 LaTeX 公式中的双反斜杠
  const processedContent = useMemo(() => {
    if (!children) return '';
    
    // 记录处理过程，用于调试
    if (debug) {
      console.log('处理 Markdown 内容，长度:', children.length);
    }
    
    try {
      // 简化处理逻辑，避免复杂的正则表达式
      let processed = children;
      
      // 1. 简单替换双反斜杠为单反斜杠 (针对 LaTeX 命令)
      const commonPatterns = [
        // 环境
        { pattern: '\\\\begin', replacement: '\\begin' },
        { pattern: '\\\\end', replacement: '\\end' },
        
        // 常见命令
        { pattern: '\\\\frac', replacement: '\\frac' },
        { pattern: '\\\\sum', replacement: '\\sum' },
        { pattern: '\\\\int', replacement: '\\int' },
        { pattern: '\\\\prod', replacement: '\\prod' },
        { pattern: '\\\\alpha', replacement: '\\alpha' },
        { pattern: '\\\\beta', replacement: '\\beta' },
        { pattern: '\\\\gamma', replacement: '\\gamma' },
        { pattern: '\\\\delta', replacement: '\\delta' },
        { pattern: '\\\\theta', replacement: '\\theta' },
        { pattern: '\\\\lambda', replacement: '\\lambda' },
        { pattern: '\\\\mu', replacement: '\\mu' },
        { pattern: '\\\\pi', replacement: '\\pi' },
        { pattern: '\\\\sigma', replacement: '\\sigma' },
        { pattern: '\\\\omega', replacement: '\\omega' },
        { pattern: '\\\\Gamma', replacement: '\\Gamma' },
        { pattern: '\\\\Delta', replacement: '\\Delta' },
        { pattern: '\\\\Theta', replacement: '\\Theta' },
        { pattern: '\\\\Lambda', replacement: '\\Lambda' },
        { pattern: '\\\\Sigma', replacement: '\\Sigma' },
        { pattern: '\\\\Omega', replacement: '\\Omega' },
        
        // 数学函数
        { pattern: '\\\\sin', replacement: '\\sin' },
        { pattern: '\\\\cos', replacement: '\\cos' },
        { pattern: '\\\\tan', replacement: '\\tan' },
        { pattern: '\\\\log', replacement: '\\log' },
        { pattern: '\\\\ln', replacement: '\\ln' },
        { pattern: '\\\\exp', replacement: '\\exp' },
        { pattern: '\\\\lim', replacement: '\\lim' },
        
        // 符号和运算符
        { pattern: '\\\\times', replacement: '\\times' },
        { pattern: '\\\\div', replacement: '\\div' },
        { pattern: '\\\\pm', replacement: '\\pm' },
        { pattern: '\\\\cdot', replacement: '\\cdot' },
        { pattern: '\\\\cdots', replacement: '\\cdots' },
        { pattern: '\\\\ldots', replacement: '\\ldots' },
        { pattern: '\\\\vdots', replacement: '\\vdots' },
        { pattern: '\\\\ddots', replacement: '\\ddots' },
        
        // 括号和定界符
        { pattern: '\\\\left', replacement: '\\left' },
        { pattern: '\\\\right', replacement: '\\right' },
        { pattern: '\\\\{', replacement: '\\{' },
        { pattern: '\\\\}', replacement: '\\}' },
        { pattern: '\\\\|', replacement: '\\|' },
        
        // 矩阵环境
        { pattern: '\\\\begin{pmatrix}', replacement: '\\begin{pmatrix}' },
        { pattern: '\\\\end{pmatrix}', replacement: '\\end{pmatrix}' },
        { pattern: '\\\\begin{bmatrix}', replacement: '\\begin{bmatrix}' },
        { pattern: '\\\\end{bmatrix}', replacement: '\\end{bmatrix}' },
        { pattern: '\\\\begin{vmatrix}', replacement: '\\begin{vmatrix}' },
        { pattern: '\\\\end{vmatrix}', replacement: '\\end{vmatrix}' },
        { pattern: '\\\\begin{Vmatrix}', replacement: '\\begin{Vmatrix}' },
        { pattern: '\\\\end{Vmatrix}', replacement: '\\end{Vmatrix}' },
        
        // 对齐环境
        { pattern: '\\\\begin{aligned}', replacement: '\\begin{aligned}' },
        { pattern: '\\\\end{aligned}', replacement: '\\end{aligned}' },
        { pattern: '\\\\begin{cases}', replacement: '\\begin{cases}' },
        { pattern: '\\\\end{cases}', replacement: '\\end{cases}' },
        
        // 其他常用命令
        { pattern: '\\\\nabla', replacement: '\\nabla' },
        { pattern: '\\\\partial', replacement: '\\partial' },
        { pattern: '\\\\infty', replacement: '\\infty' },
        { pattern: '\\\\vec', replacement: '\\vec' },
        { pattern: '\\\\overrightarrow', replacement: '\\overrightarrow' },
        { pattern: '\\\\overleftarrow', replacement: '\\overleftarrow' },
        { pattern: '\\\\overline', replacement: '\\overline' },
        { pattern: '\\\\underline', replacement: '\\underline' },
        { pattern: '\\\\hbar', replacement: '\\hbar' },
        { pattern: '\\\\vert', replacement: '\\vert' },
        { pattern: '\\\\text', replacement: '\\text' },
        { pattern: '\\\\mathbb', replacement: '\\mathbb' },
        { pattern: '\\\\mathbf', replacement: '\\mathbf' },
        { pattern: '\\\\mathcal', replacement: '\\mathcal' },
        { pattern: '\\\\mathfrak', replacement: '\\mathfrak' },
        { pattern: '\\\\mathit', replacement: '\\mathit' },
        { pattern: '\\\\mathrm', replacement: '\\mathrm' },
        { pattern: '\\\\mathsf', replacement: '\\mathsf' },
        { pattern: '\\\\mathtt', replacement: '\\mathtt' }
      ];
      
      // 应用所有模式替换
      commonPatterns.forEach(({ pattern, replacement }) => {
        processed = processed.split(pattern).join(replacement);
      });
      
      // 处理矩阵中的换行符 (这是一个常见问题)
      processed = processed.split('\\\\\\\\').join('\\\\');
      
      if (debug) {
        console.log('处理完成，新长度:', processed.length);
        console.log('处理前的前100个字符:', children.substring(0, 100));
        console.log('处理后的前100个字符:', processed.substring(0, 100));
      }
      
      return processed;
    } catch (error) {
      console.error('处理 Markdown 内容时出错:', error);
      return children; // 出错时返回原始内容
    }
  }, [children, debug]);
  
  // 自动检测并缩放溢出的公式
  useEffect(() => {
    if (!containerRef.current) return;
    
    // 延迟执行，确保公式已渲染完成
    const timer = setTimeout(() => {
      try {
        // 获取所有块级公式
        const displayFormulas = containerRef.current?.querySelectorAll('.katex-display');
        const containerWidth = containerRef.current?.clientWidth || 0;
        
        if (debug) {
          console.log(`容器宽度: ${containerWidth}px, 找到 ${displayFormulas?.length || 0} 个块级公式`);
        }
        
        // 处理块级公式
        if (displayFormulas) {
          Array.from(displayFormulas).forEach((formula, index) => {
            const formulaWidth = formula.scrollWidth;
            
            if (formulaWidth > containerWidth) {
              // 计算缩放比例
              const scale = (containerWidth / formulaWidth) * 0.95; // 留5%的边距
              
              if (debug) {
                console.log(`公式 ${index + 1} 宽度: ${formulaWidth}px, 需要缩放至 ${scale.toFixed(2)}倍`);
              }
              
              // 应用缩放
              (formula as HTMLElement).style.transform = `scale(${scale})`;
              (formula as HTMLElement).style.transformOrigin = 'left top';
              // 调整高度，避免内容被裁剪
              (formula as HTMLElement).style.height = `${formula.scrollHeight * scale}px`;
              (formula as HTMLElement).style.marginBottom = '1em';
            }
          });
        }
        
        // 获取所有行内公式
        const inlineFormulas = containerRef.current?.querySelectorAll('.katex:not(.katex-display .katex)');
        
        if (debug) {
          console.log(`找到 ${inlineFormulas?.length || 0} 个行内公式`);
        }
        
        // 处理行内公式
        if (inlineFormulas) {
          Array.from(inlineFormulas).forEach((formula, index) => {
            const parent = formula.parentElement;
            if (!parent) return;
            
            const parentWidth = parent.clientWidth;
            const formulaWidth = formula.scrollWidth;
            
            if (formulaWidth > parentWidth * 0.9) { // 如果公式宽度超过父元素的90%
              // 计算缩放比例
              const scale = (parentWidth * 0.9 / formulaWidth);
              
              if (debug) {
                console.log(`行内公式 ${index + 1} 宽度: ${formulaWidth}px, 父元素宽度: ${parentWidth}px, 缩放至 ${scale.toFixed(2)}倍`);
              }
              
              // 应用缩放
              (formula as HTMLElement).style.transform = `scale(${scale})`;
              (formula as HTMLElement).style.transformOrigin = 'left center';
              (formula as HTMLElement).style.display = 'inline-block';
              // 调整宽度，避免影响布局
              (formula as HTMLElement).style.width = `${formulaWidth * scale}px`;
            }
          });
        }
      } catch (error) {
        console.error('自动缩放公式时出错:', error);
      }
    }, 100); // 延迟100ms执行，确保公式已渲染
    
    return () => clearTimeout(timer);
  }, [processedContent, debug]);
  
  // 自定义 CSS 样式
  const latexStyles = `
    /* 基础样式 */
    .katex-display {
      margin: 1em 0;
      position: relative;
    }
    
    /* 优化滚动条样式（作为备用方案） */
    .katex-display::-webkit-scrollbar {
      height: 4px;
    }
    
    .katex-display::-webkit-scrollbar-track {
      background: #f1f1f1;
      border-radius: 2px;
    }
    
    .katex-display::-webkit-scrollbar-thumb {
      background: #888;
      border-radius: 2px;
    }
    
    .katex-display::-webkit-scrollbar-thumb:hover {
      background: #555;
    }
    
    /* 调试模式样式 */
    .latex-debug-info {
      position: absolute;
      top: -18px;
      right: 0;
      font-size: 10px;
      color: #888;
      background: #f8f8f8;
      padding: 2px 4px;
      border-radius: 2px;
      z-index: 10;
    }
  `;
  
  return (
    <div ref={containerRef} className={`${className || 'prose prose-sm max-w-none'}`}>
      <style>{latexStyles}</style>
      {debug && (
        <div className="mb-4 p-2 bg-yellow-50 border border-yellow-200 rounded text-xs">
          <div>原始内容长度: {children?.length || 0}</div>
          <div>处理后内容长度: {processedContent?.length || 0}</div>
          <div>容器宽度: {containerRef.current?.clientWidth || 0}px</div>
        </div>
      )}
      <ReactMarkdown
        remarkPlugins={[remarkGfm, remarkMath]}
        rehypePlugins={[
          [rehypeKatex, { 
            throwOnError: false, // 遇到错误时不抛出异常
            strict: false, // 不严格模式，更宽容的解析
            output: 'html', // 输出 HTML
            displayMode: false, // 默认不使用显示模式
            trust: true, // 允许所有命令
            macros: { // 自定义宏命令
              "\\vert": "\\lvert"
            }
          }]
        ]}
      >
        {processedContent}
      </ReactMarkdown>
    </div>
  );
};

export default MarkdownWithLatex; 