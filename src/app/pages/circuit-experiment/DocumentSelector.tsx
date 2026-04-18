import React from 'react';
import { Button } from 'antd';
import { FileTextOutlined } from '@ant-design/icons';
import { useNavigate } from 'react-router-dom';

/**
 * 文档选择器组件
 * 用于跳转到文档库页面
 */
export default function DocumentSelector() {
  const navigate = useNavigate();

  // 跳转到文档库页面
  const goToDocumentLibrary = () => {
    navigate('/circuit-experiment/documents');
  };

  return (
    <Button 
      type="primary" 
      icon={<FileTextOutlined />} 
      onClick={goToDocumentLibrary}
    >
      从我的文档库选择
    </Button>
  );
} 