import React, { useCallback, useState, useEffect } from 'react';
import { HighlightMenu } from 'react-highlight-menu';
import { Quote, Copy, Check, Search } from 'lucide-react';
import copy from 'copy-to-clipboard';
import { useAppContext } from '@/app/contexts/AppContext';
import './TextSelectionToolbar.css';

interface TextSelectionToolbarProps {
  target: string;
}

/**
 * 文本选择工具栏组件
 * 提供引用和复制功能，当用户选择文本时显示
 */
const TextSelectionToolbar: React.FC<TextSelectionToolbarProps> = ({ target }) => {
  const { setQuoteText } = useAppContext();
  const [isCopied, setIsCopied] = useState<boolean>(false);
  const [isVisible, setIsVisible] = useState<boolean>(true);
  
  // 处理用户点击引用按钮
  const handleQuote = useCallback((selectedText: string) => {
    if (selectedText.trim()) {
      setQuoteText(selectedText.trim());
    }
  }, [setQuoteText]);

  // 处理用户点击复制按钮
  const handleCopy = useCallback((selectedText: string) => {
    if (selectedText.trim()) {
      copy(selectedText.trim());
      setIsCopied(true);
      setTimeout(() => {
        setIsCopied(false);
      }, 2000);
    }
  }, []);

  // 处理用户点击搜索按钮
  const handleSearch = useCallback((selectedText: string) => {
    if (selectedText.trim()) {
      // 使用New Bing搜索选中的文本
      window.open(`https://cn.bing.com/search?q=${encodeURIComponent(selectedText.trim())}`, '_blank');
    }
  }, []);

  // 监听节点选择变化事件
  useEffect(() => {
    const handleNodeSelectionChange = () => {
      // 隐藏工具栏
      setIsVisible(false);
      
      // 清除文本选择
      if (window.getSelection) {
        window.getSelection()?.removeAllRanges();
      }
      
      // 短暂延迟后重新启用工具栏显示
      setTimeout(() => {
        setIsVisible(true);
      }, 100);
    };
    
    // 监听自定义事件
    window.addEventListener('node-selection-change', handleNodeSelectionChange);
    
    return () => {
      window.removeEventListener('node-selection-change', handleNodeSelectionChange);
    };
  }, []);

  if (!isVisible) {
    return null;
  }

  return (
    <HighlightMenu
      target={target}
      withoutStyles={true}
      classNames={{
        menu: "rhm-menu",
        popover: "rhm-popover",
        arrow: "rhm-arrow"
      }}
      allowedPlacements={["top", "bottom"]}
      offset={10}
      menu={({ selectedText = "", setMenuOpen }) => (
        <>
          {/* 引用按钮 */}
          <button
            className="text-selection-btn"
            title="引用文本"
            onClick={() => {
              handleQuote(selectedText);
              setMenuOpen(false);
            }}
          >
            <Quote size={18} />
          </button>
          
          {/* 搜索按钮 */}
          <button
            className="text-selection-btn"
            title="搜索文本"
            onClick={() => {
              handleSearch(selectedText);
              // 不关闭菜单，让用户可以同时执行多个操作
            }}
          >
            <Search size={18} />
          </button>
          
          {/* 复制按钮 */}
          <button
            className="text-selection-btn relative"
            title="复制到剪贴板"
            onClick={() => {
              handleCopy(selectedText);
              setTimeout(() => {
                setMenuOpen(false);
              }, 1000);
            }}
          >
            <Copy
              size={18}
              className={`transition-all ${isCopied ? 'scale-0' : 'scale-100'}`}
            />
            <Check
              size={18}
              className={`absolute left-1/2 top-1/2 -translate-x-1/2 -translate-y-1/2 transition-all ${
                isCopied ? 'scale-100' : 'scale-0'
              }`}
            />
          </button>
        </>
      )}
    />
  );
};

export default TextSelectionToolbar; 