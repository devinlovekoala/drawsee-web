import React, { useCallback, useMemo, useState } from "react";
import { FaFilePdf, FaDownload, FaEye, FaExternalLinkAlt } from "react-icons/fa";

interface PdfViewerProps {
  urls: string[];
}

/**
 * PDF文档卡片组件 - 使用React.memo避免不必要的重渲染
 */
const PdfCard = React.memo(({ url, index }: { url: string, index: number }) => {
  const [showPreview, setShowPreview] = useState(false);
  
  // 提取文件名 - 使用useMemo缓存结果
  const fileName = useMemo(() => {
    try {
      const urlObj = new URL(url);
      const pathParts = urlObj.pathname.split('/');
      const rawFileName = pathParts[pathParts.length - 1];
      // 解码URL编码的文件名
      return decodeURIComponent(rawFileName) || `文档${index + 1}.pdf`;
    } catch (e) {
      return `文档${index + 1}.pdf`;
    }
  }, [url, index]);
  
  // 使用useCallback避免不必要的函数重建
  const handleTogglePreview = useCallback(() => {
    setShowPreview(prev => !prev);
  }, []);
  
  // 使用useMemo缓存预览部分的渲染
  const previewContent = useMemo(() => {
    if (!showPreview) return null;
    
    return (
      <div className="pdf-preview-container">
        <div className="relative w-full h-[600px] bg-gray-800 rounded-lg overflow-hidden border border-gray-700">
          <iframe 
            src={`${url}#toolbar=0&navpanes=0`}
            title={`PDF预览 - ${fileName}`}
            className="w-full h-full border-none"
            sandbox="allow-scripts allow-same-origin"
            loading="lazy"
          />
          <button 
            onClick={handleTogglePreview}
            className="absolute top-2 right-2 p-2 bg-white/80 hover:bg-white rounded-full shadow-md transition-colors duration-200"
            title="关闭预览"
          >
            <FaExternalLinkAlt size={14} className="text-gray-700" />
          </button>
        </div>
      </div>
    );
  }, [showPreview, url, fileName, handleTogglePreview]);
  
  // 使用useMemo缓存卡片部分的渲染
  const cardContent = useMemo(() => {
    if (showPreview) return null;
    
    return (
      <div className="pdf-card-content p-4 bg-white rounded-lg border border-gray-200 shadow-sm hover:shadow-md transition-shadow duration-200">
        {/* 文档图标和标题 */}
        <div className="flex items-center mb-3">
          <div className="flex-shrink-0 w-10 h-10 bg-red-100 rounded-lg flex items-center justify-center mr-3">
            <FaFilePdf className="text-red-600" size={20} />
          </div>
          <div className="flex-1 min-w-0">
            <h3 className="text-sm font-medium text-gray-800 truncate" title={fileName}>
              {fileName}
            </h3>
            <p className="text-xs text-gray-500">PDF文档</p>
          </div>
        </div>
        
        {/* 操作按钮 */}
        <div className="flex justify-between mt-3">
          <button 
            onClick={handleTogglePreview}
            className="flex items-center px-3 py-1.5 bg-red-50 hover:bg-red-100 text-red-600 rounded-md text-xs font-medium transition-colors duration-200"
          >
            <FaEye size={12} className="mr-1.5" />
            预览
          </button>
          
          <a 
            href={url} 
            target="_blank" 
            rel="noopener noreferrer"
            className="flex items-center px-3 py-1.5 bg-gray-50 hover:bg-gray-100 text-gray-700 rounded-md text-xs font-medium transition-colors duration-200"
            download
          >
            <FaDownload size={12} className="mr-1.5" />
            下载
          </a>
        </div>
      </div>
    );
  }, [showPreview, fileName, url, handleTogglePreview]);
  
  return (
    <div className="pdf-card mb-3">
      {showPreview ? previewContent : cardContent}
    </div>
  );
}, (prevProps, nextProps) => {
  // 自定义比较函数，仅当URL变化时才重新渲染
  return prevProps.url === nextProps.url && prevProps.index === nextProps.index;
});

// 确保组件有显示名称，便于调试
PdfCard.displayName = 'PdfCard';

/**
 * PDF文档查看器组件
 */
const PdfViewer: React.FC<PdfViewerProps> = ({ urls }) => {
  // 如果没有URLs，显示空状态
  if (!urls || urls.length === 0) {
    return (
      <div className="p-4 text-center text-gray-500">
        没有可用的PDF文档
      </div>
    );
  }

  return (
    <div className="pdf-docs-container p-2">
      {urls.map((url, index) => (
        <PdfCard key={`pdf-doc-${index}`} url={url} index={index} />
      ))}
    </div>
  );
};

export default PdfViewer;