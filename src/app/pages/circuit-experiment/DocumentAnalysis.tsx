import React, { useState, useEffect } from 'react';
import { 
  Card, 
  Button, 
  Typography, 
  Spin, 
  message, 
  Space, 
  Divider,
  Input,
  Empty
} from 'antd';
import { ArrowLeftOutlined, FileTextOutlined, SendOutlined } from '@ant-design/icons';
import { useNavigate, useParams, useLocation } from 'react-router-dom';
import { getDocumentById } from '@/api/methods/document.methods';
import { UserDocumentVO } from '@/api/types/document.types';
import { useAppContext } from '@/app/contexts/AppContext';
import { bytesToSize } from '@/utils/file';
import { createAiTask } from '@/api/methods/flow.methods';
import { CreateAiTaskDTO } from '@/api/types/flow.types';
import { ModelSelector } from '../../pages/blank/components/ModelSelector';
import { ModelType } from '../flow/components/input/FlowInputPanel';

const { Title, Text, Paragraph } = Typography;
const { TextArea } = Input;

/**
 * 文档分析页面组件
 * 显示文档详情并提供分析功能
 */
export default function DocumentAnalysis() {
  const { id } = useParams<{ id: string }>();
  const location = useLocation();
  const navigate = useNavigate();
  const { handleBlankQuery, handleAiTaskCountPlus } = useAppContext();
  
  const [document, setDocument] = useState<UserDocumentVO | null>(null);
  const [loading, setLoading] = useState(true);
  const [analyzing, setAnalyzing] = useState(false);
  const [customQuestion, setCustomQuestion] = useState('');
  const [selectedModel, setSelectedModel] = useState<ModelType>('deepseekV3');
  
  // 从location中获取班级ID
  const classId = location.state?.classId as string || null;

  // 获取文档详情
  useEffect(() => {
    const fetchDocument = async () => {
      if (!id) {
        message.error('文档ID不存在');
        navigate('/circuit-experiment/documents');
        return;
      }
      
      try {
        setLoading(true);
        const data = await getDocumentById(Number(id));
        if (!data) {
          message.error('文档不存在或已被删除');
          navigate('/circuit-experiment/documents');
          return;
        }
        setDocument(data);
      } catch (error) {
        console.error('获取文档详情失败:', error);
        message.error('获取文档详情失败');
        navigate('/circuit-experiment/documents');
      } finally {
        setLoading(false);
      }
    };

    fetchDocument();
  }, [id, navigate]);

  // 返回文档库
  const handleBack = () => {
    navigate('/circuit-experiment/documents');
  };

  // 查看PDF文件
  const handleViewPdf = () => {
    if (document?.fileUrl) {
      window.open(document.fileUrl, '_blank');
    }
  };

  // 处理模型选择
  const handleModelChange = (model: ModelType) => {
    setSelectedModel(model);
  };

  // 处理实验分析
  const handleAnalyze = async () => {
    if (!document) return;
    
    try {
      setAnalyzing(true);
      
      // 创建分析任务
      const taskDto: CreateAiTaskDTO = {
        type: "PDF_CIRCUIT_ANALYSIS",
        prompt: '请分析这个电路实验',
        // 确保所有参数都包含在promptParams内部，并且都是字符串类型
        promptParams: {
          fileUrl: String(document.fileUrl),
          fileName: String(document.fileName),
          title: String(document.title || document.fileName)
        },
        convId: null,
        parentId: null,
        model: selectedModel, // 使用用户选择的模型
        classId: classId // 传递班级ID
      };
      
      const response = await createAiTask(taskDto);
      
      // 增加AI任务计数
      handleAiTaskCountPlus();
      
      // 创建新的对话并导航到对话流页面
      handleBlankQuery(response);
      
      message.success('实验分析已开始');
    } catch (error) {
      console.error('分析实验失败:', error);
      message.error('分析实验失败');
    } finally {
      setAnalyzing(false);
    }
  };

  // 处理电路设计
  const handleDesign = async () => {
    if (!document) return;
    
    try {
      setAnalyzing(true);
      
      // 创建设计任务
      const taskDto: CreateAiTaskDTO = {
        type: "PDF_CIRCUIT_DESIGN",
        prompt: '请根据实验要求设计电路',
        // 确保所有参数都包含在promptParams内部，并且都是字符串类型
        promptParams: {
          fileUrl: String(document.fileUrl),
          fileName: String(document.fileName),
          title: String(document.title || document.fileName)
        },
        convId: null,
        parentId: null,
        model: selectedModel, // 使用用户选择的模型
        classId: classId // 传递班级ID
      };
      
      const response = await createAiTask(taskDto);
      
      // 增加AI任务计数
      handleAiTaskCountPlus();
      
      // 创建新的对话并导航到对话流页面
      handleBlankQuery(response);
      
      message.success('电路设计已开始');
    } catch (error) {
      console.error('设计电路失败:', error);
      message.error('设计电路失败');
    } finally {
      setAnalyzing(false);
    }
  };

  // 处理自定义问题
  const handleCustomQuestion = async () => {
    if (!document || !customQuestion.trim()) {
      message.warning('请输入您的问题');
      return;
    }
    
    try {
      setAnalyzing(true);
      
      // 创建自定义问题任务
      const taskDto: CreateAiTaskDTO = {
        type: "CIRCUIT_ANALYSIS",
        prompt: customQuestion,
        // 确保所有参数都包含在promptParams内部，并且都是字符串类型
        promptParams: {
          fileUrl: String(document.fileUrl),
          fileName: String(document.fileName),
          title: String(document.title || document.fileName)
        },
        convId: null,
        parentId: null,
        model: selectedModel, // 使用用户选择的模型
        classId: classId // 传递班级ID
      };
      
      const response = await createAiTask(taskDto);
      
      // 增加AI任务计数
      handleAiTaskCountPlus();
      
      // 创建新的对话并导航到对话流页面
      handleBlankQuery(response);
      
      message.success('问题已提交');
      setCustomQuestion('');
    } catch (error) {
      console.error('提交问题失败:', error);
      message.error('提交问题失败');
    } finally {
      setAnalyzing(false);
    }
  };

  if (loading) {
    return (
      <div className="flex justify-center items-center h-full">
        <Spin size="large" tip="加载中..." />
      </div>
    );
  }

  if (!document) {
    return (
      <div className="p-6">
        <Card>
          <Empty
            description="未找到文档"
            image={Empty.PRESENTED_IMAGE_SIMPLE}
          />
          <div className="flex justify-center mt-4">
            <Button type="primary" onClick={handleBack}>
              返回文档库
            </Button>
          </div>
        </Card>
      </div>
    );
  }

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
          <Title level={4} className="m-0">文档分析</Title>
          <div className="ml-auto">
            <ModelSelector
              selectedModel={selectedModel}
              onModelChange={handleModelChange}
            />
          </div>
        </div>

        <div className="mb-6">
          <div className="flex items-center mb-2">
            <FileTextOutlined className="text-blue-500 mr-2 text-lg" />
            <Title level={5} className="m-0">{document.title}</Title>
          </div>
          
          <div className="text-gray-500 mb-2">
            <Text>文件名: {document.fileName}</Text>
            <Text className="ml-4">大小: {bytesToSize(document.fileSize)}</Text>
            <Text className="ml-4">上传时间: {new Date(document.createdAt).toLocaleString()}</Text>
          </div>
          
          {document.description && (
            <Paragraph className="mb-2">
              <Text type="secondary">描述: {document.description}</Text>
            </Paragraph>
          )}
          
          {document.tags && (
            <div className="mb-2">
              <Text type="secondary">标签: {document.tags}</Text>
            </div>
          )}
          
          <div className="mt-4">
            <Button type="primary" onClick={handleViewPdf}>
              查看PDF文件
            </Button>
          </div>
        </div>
        
        <Divider orientation="left">实验助手</Divider>
        
        <div className="mb-6">
          <Space direction="vertical" style={{ width: '100%' }}>
            <Button 
              type="primary" 
              onClick={handleAnalyze}
              loading={analyzing}
              block
            >
              分析实验内容
            </Button>
            
            <Button 
              onClick={handleDesign}
              loading={analyzing}
              block
            >
              根据实验要求设计电路
            </Button>
          </Space>
        </div>
        
        <div className="mb-4">
          <div className="flex">
            <TextArea
              placeholder="输入您关于此实验的问题..."
              value={customQuestion}
              onChange={(e) => setCustomQuestion(e.target.value)}
              autoSize={{ minRows: 2, maxRows: 6 }}
              disabled={analyzing}
              className="flex-1 mr-2"
            />
            <Button
              type="primary"
              icon={<SendOutlined />}
              onClick={handleCustomQuestion}
              loading={analyzing}
              disabled={!customQuestion.trim()}
            />
          </div>
        </div>
      </Card>
    </div>
  );
} 