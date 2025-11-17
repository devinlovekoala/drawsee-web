import { useState, useEffect } from 'react';
import { 
  Card, 
  Button, 
  Typography, 
  Spin, 
  message, 
  Space, 
  Divider,
  Empty
} from 'antd';
import { ArrowLeftOutlined, FileTextOutlined } from '@ant-design/icons';
import { useNavigate, useParams, useLocation } from 'react-router-dom';
import { getDocumentById } from '@/api/methods/document.methods';
import { UserDocumentVO } from '@/api/types/document.types';
import { useAppContext } from '@/app/contexts/AppContext';
import { bytesToSize } from '@/utils/file';
import { createAiTask } from '@/api/methods/flow.methods';
import { CreateAiTaskDTO } from '@/api/types/flow.types';
import { ModelSelector } from '../../pages/blank/components/ModelSelector';
import { ModelType } from '../flow/components/input/FlowInputPanel';
import { BASE_URL } from '@/api';

const { Title, Text, Paragraph } = Typography;

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
  const [selectedModel, setSelectedModel] = useState<ModelType>('deepseekV3');
  
  // 从location中获取班级ID
  const classId = location.state?.classId as string || null;

  // 从对象路径中提取文件名
  const extractFileNameFromPath = (objectPath?: string): string => {
    if (!objectPath) return '';
    const pathParts = objectPath.split('/');
    const fileName = pathParts[pathParts.length - 1];
    // 移除时间戳前缀（如果存在）
    const cleanFileName = fileName.replace(/^\d+_/, '');
    return decodeURIComponent(cleanFileName);
  };

  // 构建完整的文档URL
  const buildFullDocumentUrl = (fileUrl: string): string => {
    if (!fileUrl) return '';
    
    // 如果已经是完整URL，直接返回
    if (fileUrl.startsWith('http://') || fileUrl.startsWith('https://')) {
      return fileUrl;
    }
    
    // 如果是相对路径，构建完整URL
    const baseUrl = BASE_URL.replace(/\/+$/, ''); // 移除末尾的斜杠
    const path = fileUrl.startsWith('/') ? fileUrl : `/${fileUrl}`;
    
    return `${baseUrl}${path}`;
  };

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
    console.log('=== PDF预览调试信息 (DocumentAnalysis) ===');
    console.log('文档对象:', document);
    console.log('原始fileUrl:', document?.fileUrl);
    console.log('objectPath:', document?.objectPath);
    
    if (!document?.fileUrl) {
      console.error('fileUrl为空:', document?.fileUrl);
      message.error('文档URL无效，无法预览');
      return;
    }
    
    // 构建完整URL
    const fullUrl = buildFullDocumentUrl(document.fileUrl);
    console.log('构建的完整URL:', fullUrl);
    
    // 检查URL格式
    try {
      const url = new URL(fullUrl);
      console.log('解析的URL:', url);
      console.log('协议:', url.protocol);
      console.log('主机:', url.host);
      console.log('路径:', url.pathname);
      
      // 尝试打开文档
      console.log('尝试打开URL:', fullUrl);
      const newWindow = window.open(fullUrl, '_blank');
      
      if (!newWindow) {
        console.error('无法打开新窗口，可能被浏览器拦截');
        message.warning('无法打开新窗口，请检查浏览器弹窗设置');
      } else {
        console.log('成功打开新窗口');
        // 检查新窗口是否成功加载
        setTimeout(() => {
          try {
            if (newWindow.closed) {
              console.log('新窗口已被关闭');
            } else {
              console.log('新窗口仍然打开');
            }
          } catch (e) {
            console.log('无法检查新窗口状态（跨域限制）');
          }
        }, 1000);
      }
      
    } catch (error) {
      console.error('URL解析失败:', error);
      console.error('无效的URL:', fullUrl);
      message.error('文档URL格式无效，无法预览');
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
      
      // 保存PDF文件URL到localStorage，供后续节点使用
      localStorage.setItem('currentPdfUrl', document.fileUrl);
      
      // 创建分析任务，严格按照API文档格式
      const taskDto: CreateAiTaskDTO = {
        type: "PDF_CIRCUIT_ANALYSIS",
        prompt: document.fileUrl, // 直接将fileUrl放入prompt字段
        promptParams: {}, // 空对象，非null
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
  void handleAnalyze;

  // 处理电路设计
  const handleDesign = async () => {
    if (!document) return;
    
    try {
      setAnalyzing(true);
      
      // 保存PDF文件URL到localStorage，供后续节点使用
      localStorage.setItem('currentPdfUrl', document.fileUrl);
      
      // 创建设计任务，严格按照API文档格式
      const taskDto: CreateAiTaskDTO = {
        type: "PDF_CIRCUIT_DESIGN",
        prompt: document.fileUrl, // 直接将fileUrl放入prompt字段
        promptParams: {}, // 空对象，非null
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
  void handleDesign;

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
            <Text>文件名: {document.fileName || extractFileNameFromPath(document.objectPath) || document.title}</Text>
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
              // 分析功能已临时禁用，避免触发不完整后端流程
              disabled={true}
              loading={analyzing}
              block
              title="实验任务分析（已禁用，后端未就绪）"
            >
              分析实验内容（已禁用）
            </Button>
            
            <Button 
              // 设计功能已临时禁用
              disabled={true}
              loading={analyzing}
              block
              title="电路设计（已禁用，后端未就绪）"
            >
              根据实验要求设计电路（已禁用）
            </Button>
          </Space>
        </div>
      </Card>
    </div>
  );
} 