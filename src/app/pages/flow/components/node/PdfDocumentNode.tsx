import React from 'react';
import { BaseNode, ExtendedNodeProps } from './base/BaseNode';
import { Button } from 'antd';

/**
 * PDF文档节点组件
 * 展示PDF文档的基本信息和预览入口
 */
export default function PdfDocumentNode(props: ExtendedNodeProps<'PDF_DOCUMENT'>) {
  const { data } = props;
  const { title, fileUrl, fileType } = data as any;

  // 预览PDF
  const handlePreview = () => {
    if (fileUrl && typeof fileUrl === 'string') {
      window.open(fileUrl, '_blank');
    }
  };

  // 自定义内容渲染
  const customContent = (
    <div className="space-y-3">
      <div className="flex items-center mb-2">
        <svg width="1em" height="1em" viewBox="0 0 1024 1024" fill="#1890ff" style={{marginRight: 8, verticalAlign: 'middle'}}>
          <path d="M880 112H144c-17.7 0-32 14.3-32 32v736c0 17.7 14.3 32 32 32h736c17.7 0 32-14.3 32-32V144c0-17.7-14.3-32-32-32zm-40 728H184V184h656v656z"/>
          <path d="M320 464h384v56H320zm0 112h384v56H320z"/>
        </svg>
        <span className="font-semibold text-base">{title || 'PDF实验文档'}</span>
      </div>
      
      <div className="mb-3">
        <div className="text-sm text-gray-600 mb-1">
          文档类型: {(fileType ? String(fileType) : 'PDF文档')}
        </div>
        <div className="text-xs text-gray-500">
          电路实验任务文档，包含实验要求和设计规范
        </div>
      </div>
      
      {fileUrl && (
        <Button 
          size="small" 
          onClick={handlePreview} 
          type="primary"
          block
        >
          预览PDF文档
        </Button>
      )}
    </div>
  );

  return (
    <BaseNode
      {...props}
      customContent={customContent}
    />
  );
} 