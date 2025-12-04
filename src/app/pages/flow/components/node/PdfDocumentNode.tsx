import React, { useMemo, MouseEvent } from 'react';
import { BaseNode, ExtendedNodeProps } from './base/BaseNode';
import { extractFileNameFromUrl, isHttpUrl } from '@/app/pages/flow/utils/document';
import { EyeOutlined, FileTextOutlined } from '@ant-design/icons';

/**
 * PDF文档节点组件
 * 展示PDF文档的基本信息和预览入口
 */
export default function PdfDocumentNode(props: ExtendedNodeProps<'PDF_DOCUMENT'>) {
  const { data } = props;
  const { title, fileUrl, fileType, text } = data as any;
  const previewUrl = useMemo(() => {
    if (typeof fileUrl === 'string' && fileUrl.trim().length > 0) {
      return fileUrl;
    }
    if (typeof text === 'string' && isHttpUrl(text)) {
      return text;
    }
    return undefined;
  }, [fileUrl, text]);

  const fileName = useMemo(() => extractFileNameFromUrl(previewUrl, title || 'PDF实验文档'), [previewUrl, title]);

  const hostLabel = useMemo(() => {
    if (!previewUrl) return '';
    try {
      return new URL(previewUrl).hostname;
    } catch {
      return '';
    }
  }, [previewUrl]);

  // 预览PDF
  const handlePreview = (event?: MouseEvent) => {
    event?.stopPropagation();
    if (previewUrl) {
      window.open(previewUrl, '_blank', 'noopener,noreferrer');
    }
  };

  // 自定义内容渲染
  const customContent = (
    <div className="space-y-3 relative p-3 rounded-2xl border border-indigo-100 bg-white shadow-sm">
      {previewUrl && (
        <button
          type="button"
          title="预览PDF文档"
          onClick={handlePreview}
          className="absolute top-3 right-3 w-8 h-8 rounded-full bg-white border border-indigo-100 text-indigo-600 flex items-center justify-center hover:bg-indigo-50"
        >
          <EyeOutlined />
        </button>
      )}

      <div className="flex items-start gap-3">
        <div className="flex-shrink-0 w-10 h-10 bg-indigo-100 rounded-xl flex items-center justify-center">
          <FileTextOutlined className="text-indigo-600 text-xl" />
        </div>
        <div className="flex-1 min-w-0">
          <p className="text-[11px] uppercase tracking-wide text-indigo-500 font-medium">
            {fileType || 'PDF实验文档'}
          </p>
          <p className="text-sm font-semibold text-gray-800 truncate" title={fileName}>
            {fileName}
          </p>
          {hostLabel && (
            <p className="text-[11px] text-gray-500 mt-0.5">
              来源：{hostLabel}
            </p>
          )}
        </div>
      </div>

      <div className="p-3 bg-gradient-to-br from-indigo-50 to-blue-50 rounded-xl border border-indigo-100 text-xs text-gray-600 leading-relaxed">
        电路实验任务文档，包含实验要求、设计规范与技术参数。
      </div>

      <div className="text-xs text-gray-500">
        当前节点记录原始文档信息，用于驱动后续的分析节点。
      </div>
    </div>
  );

  return (
    <BaseNode
      {...props}
      customContent={customContent}
    />
  );
} 
