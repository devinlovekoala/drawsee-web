import React, { useState } from 'react';
import { Upload, Button, message, Card, Spin, Typography, Space } from 'antd';
import { InboxOutlined, FileTextOutlined, DatabaseOutlined } from '@ant-design/icons';
import { useNavigate } from 'react-router-dom';
import ExperimentConversation from './ExperimentConversation';
import { uploadUserDocument } from '@/api/methods/document.methods';
import { UserDocumentVO } from '@/api/types/document.types';
import { isPdfFile, isFileSizeExceeded } from '@/utils/file';

const { Text, Title } = Typography;
const { Dragger } = Upload;

/**
 * 电路实验任务分析主页面
 * 包含PDF上传与会话流入口
 */
export default function CircuitExperimentTask() {
  const [fileUrl, setFileUrl] = useState<string | null>(null);
  const [uploading, setUploading] = useState(false);
  const [selectedDocument, setSelectedDocument] = useState<UserDocumentVO | null>(null);
  const navigate = useNavigate();

  // 处理文件上传
  const handleUpload = async (file: File) => {
    // 检查文件类型
    if (!isPdfFile(file)) {
      message.error('只能上传PDF文件');
      return false;
    }
    
    // 检查文件大小 (限制为20MB)
    if (isFileSizeExceeded(file, 20)) {
      message.error('文件大小不能超过20MB');
      return false;
    }

    setUploading(true);
    try {
      // 上传文件到用户文档库
      const document = await uploadUserDocument(
        file,
        file.name.replace('.pdf', ''),
        '电路实验文档',
        '电路实验'
      );

      setSelectedDocument(document);
      setFileUrl(document.fileUrl);
      message.success('文档上传成功！已保存到您的文档库');
    } catch (e) {
      console.error('文档上传失败:', e);
      message.error('文档上传失败');
    } finally {
      setUploading(false);
    }
    return false; // 阻止默认上传行为
  };

  // 跳转到文档库
  const goToDocumentLibrary = () => {
    navigate('/circuit-experiment/documents');
  };

  return (
    <div className="p-6">
      <Card 
        title="电路实验任务分析" 
        extra={
          <Button 
            type="primary" 
            icon={<DatabaseOutlined />} 
            onClick={goToDocumentLibrary}
          >
            进入实验文档库
          </Button>
        }
      >
        {!fileUrl ? (
          <>
            <div className="mb-4">
              <Title level={5}>上传实验任务PDF文档</Title>
              <Text type="secondary">
                上传电路实验任务PDF文档进行AI分析。上传的文档将保存到您的
                <a onClick={goToDocumentLibrary}> 实验文档库</a> 中。
              </Text>
            </div>

            {/* 上传区域 */}
            <Dragger
              accept=".pdf"
              beforeUpload={handleUpload}
              showUploadList={true}
              disabled={uploading}
              maxCount={1}
            >
              <p className="ant-upload-drag-icon">
                <InboxOutlined style={{ fontSize: 48, color: '#1890ff' }} />
              </p>
              <p className="ant-upload-text">点击或拖拽PDF文件到此处上传</p>
              <p className="ant-upload-hint">
                支持单个PDF文件上传，文件大小不超过20MB
              </p>
            </Dragger>
            {uploading && (
              <div className="text-center mt-4">
                <Spin tip="上传中..." />
              </div>
            )}
          </>
        ) : (
          <>
            {/* 显示已选文档信息 */}
            {selectedDocument && (
              <div className="mb-4">
                <div className="flex items-start">
                  <FileTextOutlined className="text-blue-500 text-xl mt-1 mr-2" />
                  <div>
                    <Title level={5} className="m-0">{selectedDocument.title || selectedDocument.fileName}</Title>
                    <Text type="secondary" className="block mb-2">{selectedDocument.description || '电路实验文档'}</Text>
                    <Text type="secondary" className="text-xs">
                      文件大小: {(selectedDocument.fileSize / 1024 / 1024).toFixed(2)} MB | 
                      上传时间: {new Date(selectedDocument.createdAt).toLocaleString()}
                    </Text>
                  </div>
                </div>
                <div className="mt-4">
                  <Space>
                    <Button onClick={() => {
                      setFileUrl(null);
                      setSelectedDocument(null);
                    }}>
                      上传新文档
                    </Button>
                    <Button type="primary" onClick={goToDocumentLibrary}>
                      查看文档库
                    </Button>
                  </Space>
                </div>
              </div>
            )}

            {/* 文件URL存在时显示会话流 */}
            <ExperimentConversation fileUrl={fileUrl} />
          </>
        )}
      </Card>
    </div>
  );
}
