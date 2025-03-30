import React, { useState, useEffect, useCallback } from 'react';
import { X, Maximize2, Minimize2, RefreshCw, Code, Eye } from 'lucide-react';
import { motion, AnimatePresence } from 'framer-motion';

interface HtmlPreviewModalProps {
  isOpen: boolean;
  onClose: () => void;
  htmlContent: string;
}

const HtmlPreviewModal: React.FC<HtmlPreviewModalProps> = ({
  isOpen,
  onClose,
  htmlContent
}) => {
  const [isFullscreen, setIsFullscreen] = useState(false);
  const [showSource, setShowSource] = useState(false);
  const [iframeKey, setIframeKey] = useState(0);

  // 关闭模态框时重置状态
  useEffect(() => {
    if (!isOpen) {
      setIsFullscreen(false);
      setShowSource(false);
    }
  }, [isOpen]);

  // 刷新iframe
  const refreshIframe = () => {
    setIframeKey(prev => prev + 1);
  };

  // 处理全屏切换
  const toggleFullscreen = useCallback(() => {
    if (!isFullscreen) {
      document.documentElement.style.overflow = 'hidden'; // 防止页面滚动
    } else {
      document.documentElement.style.overflow = '';
    }
    setIsFullscreen(prev => !prev);
  }, [isFullscreen]);

  // 处理Escape键退出全屏
  useEffect(() => {
    const handleKeyDown = (e: KeyboardEvent) => {
      if (e.key === 'Escape' && isFullscreen) {
        toggleFullscreen();
      }
    };

    window.addEventListener('keydown', handleKeyDown);
    return () => window.removeEventListener('keydown', handleKeyDown);
  }, [isFullscreen, toggleFullscreen]);

  // 切换显示源代码/预览
  const toggleSourceView = () => {
    setShowSource(prev => !prev);
  };

  if (!isOpen) return null;

  return (
    <AnimatePresence>
      {isOpen && (
        <div className="fixed inset-0 z-[100] flex items-center justify-center">
          {/* 背景遮罩 */}
          <motion.div
            initial={{ opacity: 0 }}
            animate={{ opacity: 1 }}
            exit={{ opacity: 0 }}
            transition={{ duration: 0.2 }}
            className="absolute inset-0 bg-black bg-opacity-50 backdrop-blur-sm"
            onClick={onClose}
          />

          {/* 模态框内容 */}
          <motion.div
            initial={{ opacity: 0, scale: 0.9 }}
            animate={{ opacity: 1, scale: 1 }}
            exit={{ opacity: 0, scale: 0.9 }}
            transition={{ 
              type: "spring",
              stiffness: 300,
              damping: 30
            }}
            className={`
              relative z-[101] bg-white rounded-xl shadow-2xl overflow-hidden
              border border-gray-200 flex flex-col
              ${isFullscreen ? 
                'fixed inset-0 rounded-none w-[100vw] h-[100vh]' : 
                'w-[85vw] max-w-5xl h-[80vh]'
              }
            `}
            onClick={(e) => e.stopPropagation()}
          >
            {/* 模态框头部 */}
            <div className="flex items-center justify-between px-6 py-4 border-b border-gray-100 bg-gradient-to-r from-gray-50 to-white">
              <div className="flex items-center space-x-2">
                <div className="w-3 h-3 rounded-full bg-red-500"></div>
                <div className="w-3 h-3 rounded-full bg-yellow-500"></div>
                <div className="w-3 h-3 rounded-full bg-green-500"></div>
                <h3 className="ml-3 text-lg font-medium text-gray-800">HTML 预览</h3>
              </div>
              <div className="flex items-center space-x-2">
                <button 
                  onClick={toggleSourceView}
                  className="p-2 text-gray-500 hover:text-gray-700 hover:bg-gray-100 rounded-lg transition-colors"
                  title={showSource ? "查看预览" : "查看源代码"}
                >
                  {showSource ? <Eye size={18} /> : <Code size={18} />}
                </button>
                <button 
                  onClick={refreshIframe}
                  className="p-2 text-gray-500 hover:text-gray-700 hover:bg-gray-100 rounded-lg transition-colors"
                  title="刷新预览"
                >
                  <RefreshCw size={18} />
                </button>
                <button 
                  onClick={toggleFullscreen}
                  className="p-2 text-gray-500 hover:text-gray-700 hover:bg-gray-100 rounded-lg transition-colors"
                  title={isFullscreen ? "退出全屏" : "全屏预览"}
                >
                  {isFullscreen ? <Minimize2 size={18} /> : <Maximize2 size={18} />}
                </button>
                <button 
                  onClick={onClose}
                  className="p-2 text-gray-500 hover:text-gray-700 hover:bg-gray-100 rounded-lg transition-colors"
                  title="关闭"
                >
                  <X size={18} />
                </button>
              </div>
            </div>

            {/* 模态框内容区域 */}
            <div className="flex-1 overflow-hidden">
              {showSource ? (
                <div className="h-full overflow-auto p-4 bg-gray-50 font-mono text-sm">
                  <pre className="whitespace-pre-wrap break-words">{htmlContent}</pre>
                </div>
              ) : (
                <iframe 
                  key={iframeKey}
                  srcDoc={htmlContent}
                  title="HTML Preview"
                  className="w-full h-full border-none"
                  sandbox="allow-scripts allow-same-origin"
                />
              )}
            </div>
          </motion.div>
        </div>
      )}
    </AnimatePresence>
  );
};

export default HtmlPreviewModal; 