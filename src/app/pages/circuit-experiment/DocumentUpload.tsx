import React, { useState } from 'react';
import { Upload, Button, Form, Input, message, Card, Typography, Space } from 'antd';
import { InboxOutlined, TagOutlined, ArrowLeftOutlined } from '@ant-design/icons';
import { uploadUserDocument } from '@/api/methods/document.methods';
import { useNavigate } from 'react-router-dom';
import { isPdfFile, isFileSizeExceeded } from '@/utils/file';

const { Title, Text } = Typography;
const { TextArea } = Input;
const { Dragger } = Upload;

/**
 * 文档上传页面
 * 提供美观的文件上传界面
 */
export default function DocumentUpload() {
  const [form] = Form.useForm();
  const [file, setFile] = useState<File | null>(null);
  const [uploading, setUploading] = useState(false);
  const navigate = useNavigate();

  // 处理文件选择
  const handleFileChange = (info: any) => {
    const file = info.file.originFileObj as File;
    
    // 检查文件类型
    if (!isPdfFile(file)) {
      message.error('只能上传PDF文件');
      return;
    }
    
    // 检查文件大小 (限制为30MB)
    if (isFileSizeExceeded(file, 30)) {
      message.error('文件大小不能超过30MB');
      return;
    }
    
    setFile(file);
    message.success(`${file.name} 文件选择成功`);
  };

  // 处理表单提交
  const handleSubmit = async (values: any) => {
    if (!file) {
      message.error('请先选择PDF文件');
      return;
    }

    setUploading(true);
    try {
      await uploadUserDocument(
        file,
        values.title || file.name.replace('.pdf', ''),
        values.description || '电路实验文档',
        values.tags || '电路实验'
      );

      message.success('文档上传成功');
      
      // 延迟跳转，让用户看到成功消息
      setTimeout(() => {
        navigate('/circuit-experiment/documents');
      }, 1500);
    } catch (error) {
      console.error('文档上传失败:', error);
      message.error('文档上传失败');
    } finally {
      setUploading(false);
    }
  };

  // 返回文档库
  const handleBack = () => {
    navigate('/circuit-experiment/documents');
  };

  return (
    <div className="p-6">
      <Card>
        <div className="flex items-center mb-4">
          <Button 
            type="text" 
            icon={<ArrowLeftOutlined />} 
            onClick={handleBack}
            className="mr-2"
          />
          <Title level={4} className="m-0">上传实验文档</Title>
        </div>

        <div className="mb-6">
          <Text type="secondary">
            上传电路实验PDF文档到您的个人文档库，支持单个文件上传，文件大小不超过30MB。
          </Text>
        </div>

        <Form
          form={form}
          layout="vertical"
          onFinish={handleSubmit}
          className="max-w-2xl"
        >
          <Form.Item
            name="file"
            rules={[{ required: true, message: '请上传PDF文件' }]}
          >
            <Dragger
              name="file"
              accept=".pdf"
              maxCount={1}
              onChange={handleFileChange}
              beforeUpload={() => false}
              showUploadList={true}
            >
              <p className="ant-upload-drag-icon">
                <InboxOutlined style={{ fontSize: 48, color: '#1890ff' }} />
              </p>
              <p className="ant-upload-text">点击或拖拽PDF文件到此处上传</p>
              <p className="ant-upload-hint">
                支持单个PDF文件上传，文件大小不超过30MB
              </p>
            </Dragger>
          </Form.Item>

          <Form.Item
            label="文档标题"
            name="title"
            rules={[{ required: true, message: '请输入文档标题' }]}
          >
            <Input placeholder="请输入文档标题" />
          </Form.Item>

          <Form.Item
            label="文档描述"
            name="description"
          >
            <TextArea rows={3} placeholder="请输入文档描述（选填）" />
          </Form.Item>

          <Form.Item
            label="标签"
            name="tags"
          >
            <Input 
              placeholder="多个标签用逗号分隔（选填）" 
              prefix={<TagOutlined />} 
              defaultValue="电路实验"
            />
          </Form.Item>

          <Form.Item>
            <Space>
              <Button 
                type="default" 
                onClick={handleBack}
                disabled={uploading}
              >
                取消
              </Button>
              <Button 
                type="primary" 
                htmlType="submit"
                loading={uploading}
              >
                上传文档
              </Button>
            </Space>
          </Form.Item>
        </Form>
      </Card>
    </div>
  );
} 