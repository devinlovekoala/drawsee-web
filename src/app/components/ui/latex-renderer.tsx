import React, { useEffect, useRef, useState } from 'react';

interface LaTeXRendererProps {
  latex: string;
  className?: string;
  displayMode?: boolean;
  fontSize?: 'sm' | 'base' | 'lg' | 'xl' | '2xl';
}

/**
 * LaTeXRenderer 组件用于渲染LaTeX公式
 * 
 * @param latex 需要渲染的LaTeX字符串
 * @param className 额外的CSS类名
 * @param displayMode 是否使用displayMode渲染（默认为false，即行内模式）
 * @param fontSize 字体大小，默认为'base'
 */
const LaTeXRenderer: React.FC<LaTeXRendererProps> = ({
  latex,
  className = '',
  displayMode = false,
  fontSize = 'base'
}) => {
  const containerRef = useRef<HTMLDivElement>(null);
  const [error, setError] = useState<string | null>(null);
  const [rendered, setRendered] = useState(false);

  // 处理渲染错误
  const handleRenderError = () => {
    setError('LaTeX渲染失败，请检查公式语法');
    console.error('Failed to render LaTeX:', latex);
  };

  // 判断是否需要外部包裹
  const needsWrapping = (input: string) => {
    const trimmed = input.trim();
    return !(
      (trimmed.startsWith('$') && trimmed.endsWith('$')) ||
      (trimmed.startsWith('$$') && trimmed.endsWith('$$')) ||
      (trimmed.startsWith('\\(') && trimmed.endsWith('\\)')) ||
      (trimmed.startsWith('\\[') && trimmed.endsWith('\\]'))
    );
  };

  // 准备LaTeX字符串用于渲染
  const prepareLatex = (input: string) => {
    let prepared = input.trim();
    
    // 已经有包裹符号的情况下，应该保留原样
    if (!needsWrapping(prepared)) {
      return prepared;
    }

    // 添加适当的包裹符号
    return displayMode ? `$$${prepared}$$` : `$${prepared}$`;
  };

  useEffect(() => {
    if (!containerRef.current) return;

    const preparedLatex = prepareLatex(latex);
    setError(null);

    // 确保MathJax已加载
    if (typeof window.MathJax !== 'undefined') {
      try {
        containerRef.current.innerHTML = preparedLatex;
        
        // 渲染
        window.MathJax.typesetPromise([containerRef.current])
          .then(() => {
            setRendered(true);
          })
          .catch(handleRenderError);
      } catch (err) {
        handleRenderError();
      }
    } else {
      // MathJax未加载时使用基本的显示方式
      containerRef.current.textContent = latex;
      setError('MathJax未加载，显示原始LaTeX');
    }
  }, [latex, displayMode]);

  // 根据fontSize选择合适的Tailwind类
  const getFontSizeClass = () => {
    switch (fontSize) {
      case 'sm': return 'text-sm';
      case 'base': return 'text-base';
      case 'lg': return 'text-lg';
      case 'xl': return 'text-xl';
      case '2xl': return 'text-2xl';
      default: return 'text-base';
    }
  };

  return (
    <div 
      className={`latex-renderer ${getFontSizeClass()} ${displayMode ? 'my-2' : 'inline-block'} ${className} ${error ? 'text-red-500' : ''}`}
    >
      {error ? (
        <span className="text-red-500">{error}</span>
      ) : (
        <div 
          ref={containerRef} 
          className={`${rendered ? 'opacity-100' : 'opacity-50'} transition-opacity duration-300`}
        />
      )}
    </div>
  );
};

// 为window添加MathJax类型
declare global {
  interface Window {
    MathJax: any;
  }
}

export default LaTeXRenderer; 