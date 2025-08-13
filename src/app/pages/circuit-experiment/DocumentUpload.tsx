import { useState } from 'react';
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
    console.log('文件选择事件:', info);
    
    // 获取文件对象
    let selectedFile: File | null = null;
    
    // 处理不同的文件状态
    if (info.file) {
      // 如果有originFileObj，优先使用（通常在选择文件时）
      if (info.file.originFileObj) {
        selectedFile = info.file.originFileObj;
      } 
      // 否则直接使用file对象（可能在某些情况下）
      else if (info.file instanceof File) {
        selectedFile = info.file;
      }
      // 如果file有name属性但不是File实例，可能需要从fileList获取
      else if (info.fileList && info.fileList.length > 0) {
        const latestFile = info.fileList[info.fileList.length - 1];
        if (latestFile.originFileObj) {
          selectedFile = latestFile.originFileObj;
        }
      }
    }
    
    console.log('解析出的文件:', selectedFile);
    
    if (!selectedFile) {
      console.warn('未能获取到文件对象');
      return;
    }
    
    // 检查文件类型
    if (!isPdfFile(selectedFile)) {
      message.error('只能上传PDF文件');
      setFile(null);
      return;
    }
    
    // 检查文件大小 (限制为30MB)
    if (isFileSizeExceeded(selectedFile, 30)) {
      message.error('文件大小不能超过30MB');
      setFile(null);
      return;
    }
    
    setFile(selectedFile);
    
    // 同时更新表单字段，确保验证通过
    form.setFieldsValue({ file: selectedFile.name });
    
    message.success(`${selectedFile.name} 文件选择成功`);
  };

  // 处理表单提交
  const handleSubmit = async (values: any) => {
    console.log('表单提交，当前文件状态:', file);
    console.log('表单值:', values);
    
    if (!file) {
      message.error('请先选择PDF文件');
      console.error('提交时文件为空');
      return;
    }

    console.log('开始上传文件:', file.name, '大小:', file.size);
    
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
            rules={[
              { 
                required: true, 
                message: '请上传PDF文件',
                validator: () => {
                  if (!file) {
                    return Promise.reject(new Error('请先选择PDF文件'));
                  }
                  return Promise.resolve();
                }
              }
            ]}
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