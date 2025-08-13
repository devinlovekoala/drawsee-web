import React, { useEffect, useState } from 'react';
import { Table, Button, Card, Space, message, Modal, Typography, Spin, Tag, Tooltip } from 'antd';
import { DeleteOutlined, EyeOutlined, ExperimentOutlined, UploadOutlined } from '@ant-design/icons';
import { getUserPdfDocuments, deleteDocument } from '@/api/methods/document.methods';
import { UserDocumentVO } from '@/api/types/document.types';
import { useNavigate, useLocation } from 'react-router-dom';
import dayjs from 'dayjs';
import { bytesToSize } from '@/utils/file';
import { createAiTask } from '@/api/methods/flow.methods';
import { CreateAiTaskDTO } from '@/api/types/flow.types';
import { ModelSelector } from '../../pages/blank/components/ModelSelector';
import { ModelType } from '../flow/components/input/FlowInputPanel';

const { Title } = Typography;

/**
 * 实验文档库组件
 * 展示用户上传的PDF实验文档列表
 */
export default function DocumentLibrary() {
  const [documents, setDocuments] = useState<UserDocumentVO[]>([]);
  const [loading, setLoading] = useState<boolean>(true);
  const [deleteLoading, setDeleteLoading] = useState<boolean>(false);
  const navigate = useNavigate();
  const location = useLocation();
  const [selectedModel, setSelectedModel] = useState<ModelType>('deepseekV3');
  
  // 从location中获取班级ID
  const classId = location.state?.classId as string || null;

  // 获取文档列表
  const fetchDocuments = async () => {
    try {
      setLoading(true);
      const response = await getUserPdfDocuments();
      
      // 处理后端返回的数据，确保文件名字段存在
      const processedDocuments = response.map(doc => ({
        ...doc,
        fileName: doc.fileName || extractFileNameFromPath(doc.objectPath) || doc.title || '未知文件名',
        fileType: doc.fileType || doc.documentType || 'pdf'
      }));
      
      setDocuments(processedDocuments);
    } catch (error) {
      console.error('获取实验文档列表失败:', error);
      message.error('获取实验文档列表失败');
    } finally {
      setLoading(false);
    }
  };

  // 从对象路径中提取文件名
  const extractFileNameFromPath = (objectPath?: string): string => {
    if (!objectPath) return '';
    const pathParts = objectPath.split('/');
    const fileName = pathParts[pathParts.length - 1];
    // 移除时间戳前缀（如果存在）
    const cleanFileName = fileName.replace(/^\d+_/, '');
    return decodeURIComponent(cleanFileName);
  };

  // 组件加载时获取列表
  useEffect(() => {
    fetchDocuments();
  }, []);

  // 删除文档
  const handleDelete = async (id: number) => {
    Modal.confirm({
      title: '确认删除',
      content: '确定要删除这个实验文档吗？此操作不可恢复。',
      okText: '删除',
      okType: 'danger',
      cancelText: '取消',
      onOk: async () => {
        try {
          setDeleteLoading(true);
          await deleteDocument(id);
          message.success('删除成功');
          // 重新获取列表
          fetchDocuments();
        } catch (error) {
          console.error('删除实验文档失败:', error);
          message.error('删除实验文档失败');
        } finally {
          setDeleteLoading(false);
        }
      }
    });
  };

  // 处理模型选择
  const handleModelChange = (model: ModelType) => {
    setSelectedModel(model);
  };

  // 跳转到 flow 智能体会话页面并自动分析（实验任务分析agentType）
  const handleAnalyze = async (document: UserDocumentVO) => {
    try {
      // 构造AI任务参数，按照新的要求设置
      const taskDto: CreateAiTaskDTO = {
        type: "PDF_CIRCUIT_ANALYSIS",
        prompt: document.fileUrl, // 直接将fileUrl放入prompt字段
        promptParams: {}, // 清空promptParams对象
        convId: null,
        parentId: null,
        model: selectedModel, // 使用用户选择的模型
        classId: classId // 传递班级ID
      };
      
      // 将taskDto作为请求体参数传递
      const res = await createAiTask(taskDto);
      
      // 创建新的对话并导航到对话流页面
      if (res && res.conversation && res.taskId) {
        navigate('/flow', {
          state: {
            convId: res.conversation.id,
            taskId: res.taskId,
            classId: classId // 传递班级ID到flow页面
          }
        });
        message.success('实验分析已开始');
      } else {
        message.error('AI任务创建失败，未返回会话ID');
      }
    } catch (error) {
      console.error('分析实验失败:', error);
      message.error('分析实验失败');
    }
  };

  // 上传新文档
  const handleUpload = () => {
    navigate('/circuit-experiment/upload');
  };

  // 表格列定义
  const columns = [
    {
      title: '文档名称',
      dataIndex: 'title',
      key: 'title',
      render: (text: string, record: UserDocumentVO) => (
        <div>
          <div className="font-medium">{text || record.fileName}</div>
          {record.fileName && record.fileName !== text && (
            <div className="text-xs text-gray-500">文件: {record.fileName}</div>
          )}
        </div>
      ),
    },
    {
      title: '文档类型',
      dataIndex: 'documentType',
      key: 'documentType',
      render: (type: string) => (
        <Tag color={type === 'pdf' ? 'red' : 'blue'}>
          {type?.toUpperCase() || 'PDF'}
        </Tag>
      ),
    },
    {
      title: '大小',
      dataIndex: 'fileSize',
      key: 'fileSize',
      render: (size: number) => bytesToSize(size),
    },
    {
      title: '标签',
      dataIndex: 'tags',
      key: 'tags',
      render: (tags: string) => tags ? tags.split(',').map((tag, index) => (
        <Tag key={index} color="blue">{tag.trim()}</Tag>
      )) : <span className="text-gray-400">无标签</span>,
    },
    {
      title: '上传时间',
      dataIndex: 'createdAt',
      key: 'createdAt',
      render: (text: string) => dayjs(text).format('YYYY-MM-DD HH:mm:ss'),
    },
    {
      title: '操作',
      key: 'action',
      render: (_: any, record: UserDocumentVO) => (
        <Space size="middle">
          <Tooltip title="分析文档">
            <Button 
              type="primary" 
              icon={<ExperimentOutlined />} 
              disabled={deleteLoading}
              onClick={() => handleAnalyze(record)}
            />
          </Tooltip>
          <Tooltip title="查看原文件">
            <Button 
              type="default" 
              icon={<EyeOutlined />} 
              disabled={deleteLoading}
              onClick={() => window.open(record.fileUrl, '_blank')}
            />
          </Tooltip>
          <Tooltip title="删除文档">
            <Button 
              type="text" 
              danger 
              icon={<DeleteOutlined />} 
              onClick={() => handleDelete(record.id)}
              disabled={deleteLoading}
            />
          </Tooltip>
        </Space>
      ),
    },
  ];

  return (
    <div className="p-6">
      <Card>
        <div className="flex justify-between items-center mb-4">
          <Title level={4}>我的实验文档库</Title>
          <div className="flex items-center gap-3">
            <ModelSelector
              selectedModel={selectedModel}
              onModelChange={handleModelChange}
            />
            <Button 
              type="primary" 
              icon={<UploadOutlined />}
              onClick={handleUpload}
            >
              上传实验文档
            </Button>
          </div>
        </div>

        {loading ? (
          <Spin size="large">
            <div style={{ minHeight: 120 }} />
          </Spin>
        ) : documents.length > 0 ? (
          <Table 
            columns={columns} 
            dataSource={documents} 
            rowKey="id"
            pagination={{ 
              pageSize: 10,
              showSizeChanger: true,
              showQuickJumper: true,
              showTotal: (total) => `共 ${total} 条`
            }}
          />
        ) : (
          <div className="flex flex-col items-center justify-center py-12 text-center">
            <div className="text-gray-400 mb-4 text-6xl">
              <UploadOutlined />
            </div>
            <p className="text-gray-500 mb-6">暂无实验文档，请上传实验文档进行分析</p>
            <Button 
              type="primary"
              onClick={handleUpload}
            >
              立即上传
            </Button>
          </div>
        )}
      </Card>
    </div>
  );
} 