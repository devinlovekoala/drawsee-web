import React, { useState } from 'react';
import { Button, Card, Input, Space, message } from 'antd';
import { SendOutlined, ExperimentOutlined, ToolOutlined } from '@ant-design/icons';
import { createAiTask } from '@/api/methods/flow.methods';
import { CreateAiTaskDTO, AiTaskType } from '@/api/types/flow.types';
import { useAppContext } from '@/app/contexts/AppContext';
import { useNavigate } from 'react-router-dom';

interface ExperimentConversationProps {
  fileUrl: string;
}

/**
 * 电路实验会话组件
 * 使用现有的昭析智能体会话组件，提供电路实验分析功能
 */
export default function ExperimentConversation({ fileUrl }: ExperimentConversationProps) {
  const [loading, setLoading] = useState<boolean>(false);
  const [customQuestion, setCustomQuestion] = useState<string>('');
  
  const { handleBlankQuery, handleAiTaskCountPlus } = useAppContext();
  const navigate = useNavigate();

  // 处理电路实验分析
  const handleAnalyze = async () => {
    try {
      setLoading(true);
      
      // 构建电路实验分析任务
      const createAiTaskDTO: CreateAiTaskDTO = {
        type: 'PDF_CIRCUIT_ANALYSIS' as AiTaskType,
        prompt: '请分析这份电路实验文档，提取关键信息并给出实验分析',
        promptParams: {
          fileUrl
        },
        convId: null, // 新会话
        parentId: null, // 无父节点
        model: 'deepseekV3', // 使用DeepSeek模型
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
        prompt: '请根据这份电路实验文档，设计一个符合要求的电路',
        promptParams: {
          fileUrl
        },
        convId: null, // 新会话
        parentId: null, // 无父节点
        model: 'deepseekV3', // 使用DeepSeek模型
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

  // 处理自定义问题
  const handleCustomQuestion = async () => {
    if (!customQuestion.trim()) {
      message.warning('请输入问题');
      return;
    }

    try {
      setLoading(true);
      
      // 构建自定义问题任务
      const createAiTaskDTO: CreateAiTaskDTO = {
        type: 'GENERAL' as AiTaskType,
        prompt: customQuestion,
        promptParams: {
          fileUrl
        },
        convId: null, // 新会话
        parentId: null, // 无父节点
        model: 'deepseekV3', // 使用DeepSeek模型
        classId: null // 无班级ID
      };
      
      const response = await createAiTask(createAiTaskDTO);
      
      // 增加AI任务计数
      handleAiTaskCountPlus();
      
      // 显示成功消息
      message.success('问题已提交');
      
      // 清空输入框
      setCustomQuestion('');
      
      // 跳转到对话流页面
      handleBlankQuery(response);
    } catch (error) {
      console.error('提交问题失败:', error);
      message.error('提交问题失败');
    } finally {
      setLoading(false);
    }
  };

  return (
    <Card title="电路实验智能分析" className="mb-4">
      <Space direction="vertical" className="w-full">
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
        
        <div className="mt-4">
          <Input.Group compact>
            <Input
              style={{ width: 'calc(100% - 100px)' }}
              placeholder="输入自定义问题..."
              value={customQuestion}
              onChange={(e) => setCustomQuestion(e.target.value)}
              onPressEnter={handleCustomQuestion}
              disabled={loading}
            />
            <Button
              type="primary"
              icon={<SendOutlined />}
              onClick={handleCustomQuestion}
              loading={loading}
              style={{ width: '100px' }}
            >
              发送
            </Button>
          </Input.Group>
        </div>
      </Space>
    </Card>
  );
} 