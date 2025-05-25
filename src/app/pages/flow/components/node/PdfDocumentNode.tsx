import React from 'react';
import { BaseNode, ExtendedNodeProps } from './base/BaseNode';
import { Button } from 'antd';

/**
 * PDF文档节点组件
 * 展示PDF文档的基本信息和预览入口
 */
export default function PdfDocumentNode(props: ExtendedNodeProps<'answer'>) {
  const { data } = props;
  const { title, fileUrl, fileType } = data;

  // 预览PDF
  const handlePreview = () => {
    if (fileUrl && typeof fileUrl === 'string') {
      window.open(fileUrl, '_blank');
    }
  };

  // 直接写JSX，确保fileType为字符串，避免ReactNode类型错误
  const customContent = (
    <>
      <div className="flex items-center mb-2">
        <svg width="1em" height="1em" viewBox="0 0 1024 1024" fill="#1890ff" style={{marginRight: 6, verticalAlign: 'middle'}}><path d="M880 112H144c-17.7 0-32 14.3-32 32v736c0 17.7 14.3 32 32 32h736c17.7 0 32-14.3 32-32V144c0-17.7-14.3-32-32-32zm-40 728H184V184h656v656z"/><path d="M320 464h384v56H320zm0 112h384v56H320z"/></svg>
        <span className="font-semibold text-base">{title || 'PDF文档'}</span>
      </div>
      <div className="mb-2">
        <span className="text-gray-500">类型: {(fileType ? String(fileType) : 'pdf')}</span>
      </div>
      <Button size="small" onClick={handlePreview} type="primary">
        预览PDF
      </Button>
    </>
  );

  // 直接用BaseNode统一渲染
  return (
    <BaseNode
      {...props}
      customContent={customContent}
    />
  );
} 