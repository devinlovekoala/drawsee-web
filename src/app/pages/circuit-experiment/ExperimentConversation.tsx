import { useState } from 'react';
import { Button, Card, Space, message } from 'antd';
import { ExperimentOutlined, ToolOutlined } from '@ant-design/icons';
import { createAiTask } from '@/api/methods/flow.methods';
import { CreateAiTaskDTO, AiTaskType } from '@/api/types/flow.types';
import { useAppContext } from '@/app/contexts/AppContext';
import { ModelSelector } from '../../pages/blank/components/ModelSelector';
import { ModelType } from '../flow/components/input/FlowInputPanel';

interface ExperimentConversationProps {
  fileUrl: string;
}

/**
 * 电路实验会话组件
 * 使用现有的昭析智能体会话组件，提供电路实验分析功能
 */
export default function ExperimentConversation({ fileUrl }: ExperimentConversationProps) {
  const [loading, setLoading] = useState<boolean>(false);
  const [selectedModel, setSelectedModel] = useState<ModelType>('deepseekV3');
  
  const { handleBlankQuery, handleAiTaskCountPlus } = useAppContext();

  // 处理模型选择
  const handleModelChange = (model: ModelType) => {
    setSelectedModel(model);
  };

  // 处理电路实验分析
  const handleAnalyze = async () => {
    try {
      setLoading(true);
      
      // 构建电路实验分析任务 - 第一阶段：生成分析点
      const createAiTaskDTO: CreateAiTaskDTO = {
        type: 'PDF_CIRCUIT_ANALYSIS' as AiTaskType,
        prompt: fileUrl, // 直接将fileUrl放入prompt字段
        promptParams: {}, // 清空promptParams对象
        convId: null, // 新会话
        parentId: null, // 无父节点
        model: selectedModel, // 使用用户选择的模型
        classId: null // 无班级ID
      };
      
      const response = await createAiTask(createAiTaskDTO);
      
      // 增加AI任务计数
      handleAiTaskCountPlus();
      
      // 显示成功消息
      message.success('电路实验分析任务已创建');
      
      // 跳转到对话流页面
      handleBlankQuery(response);
    } catch (error) {
      console.error('创建电路实验分析任务失败:', error);
      message.error('创建电路实验分析任务失败');
    } finally {
      setLoading(false);
    }
  };

  // 处理电路设计任务
  const handleDesign = async () => {
    try {
      setLoading(true);
      
      // 构建电路设计任务
      const createAiTaskDTO: CreateAiTaskDTO = {
        type: 'PDF_CIRCUIT_DESIGN' as AiTaskType,
        prompt: fileUrl, // 直接将fileUrl放入prompt字段
        promptParams: {}, // 清空promptParams对象
        convId: null, // 新会话
        parentId: null, // 无父节点
        model: selectedModel, // 使用用户选择的模型
        classId: null // 无班级ID
      };
      
      const response = await createAiTask(createAiTaskDTO);
      
      // 增加AI任务计数
      handleAiTaskCountPlus();
      
      // 显示成功消息
      message.success('电路设计任务已创建');
      
      // 跳转到对话流页面
      handleBlankQuery(response);
    } catch (error) {
      console.error('创建电路设计任务失败:', error);
      message.error('创建电路设计任务失败');
    } finally {
      setLoading(false);
    }
  };

  return (
    <Card title="电路实验智能分析" className="mb-4">
      <Space direction="vertical" className="w-full">
        <div className="flex items-center mb-4">
          <div className="mr-auto">
            <ModelSelector
              selectedModel={selectedModel}
              onModelChange={handleModelChange}
            />
          </div>
        </div>
        
        <div className="flex gap-4">
          <Button
            type="primary"
            icon={<ExperimentOutlined />}
            onClick={handleAnalyze}
            loading={loading}
            block
          >
            分析实验文档
          </Button>
          <Button
            type="default"
            icon={<ToolOutlined />}
            onClick={handleDesign}
            loading={loading}
            block
          >
            设计电路方案
          </Button>
        </div>
      </Space>
    </Card>
  );
} 