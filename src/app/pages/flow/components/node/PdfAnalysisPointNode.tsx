import React, { useState, useMemo } from 'react';
import { BaseNode, ExtendedNodeProps } from './base/BaseNode';
import { Button, Typography, message } from 'antd';
import { createAiTask } from '@/api/methods/flow.methods';
import { useAppContext } from '@/app/contexts/AppContext';
import { AiTaskType, CreateAiTaskDTO } from '@/api/types/flow.types';
import { ModelSelector } from '../../../../pages/blank/components/ModelSelector';
import { ModelType } from '../../../flow/components/input/FlowInputPanel';
import { useLocation } from 'react-router-dom';

const { Text, Paragraph } = Typography;

/**
 * PDF分析点节点组件
 * 展示分析内容，并支持生成设计图
 */
export default function PdfAnalysisPointNode(props: ExtendedNodeProps<'answer-point'>) {
  const { data, id } = props;
  const { title, text, fileUrl, convId } = data;
  const [loading, setLoading] = useState(false);
  const { handleAiTaskCountPlus } = useAppContext();
  const [selectedModel, setSelectedModel] = useState<ModelType>('deepseekV3');
  const location = useLocation();
  
  // 从location中获取班级ID
  const classId = location.state?.classId as string || null;

  // 处理模型选择
  const handleModelChange = (model: ModelType) => {
    setSelectedModel(model);
  };

  // 生成设计图任务
  const handleDesign = async () => {
    if (!fileUrl) {
      message.error('缺少文档URL，无法生成设计图');
      return;
    }
    setLoading(true);
    try {
      // 按照新的要求设置参数
      const dto: CreateAiTaskDTO = {
        type: 'PDF_CIRCUIT_DESIGN',
        prompt: String(fileUrl), // 直接将fileUrl放入prompt字段
        promptParams: {}, // 清空promptParams对象
        convId: typeof convId === 'number' ? convId : null,
        parentId: Number(id),
        model: selectedModel, // 使用用户选择的模型
        classId: classId // 传递班级ID
      };
      await createAiTask(dto);
      handleAiTaskCountPlus();
      message.success('已发送生成设计图任务');
    } catch (e) {
      message.error('生成设计图任务发送失败');
    } finally {
      setLoading(false);
    }
  };

  // 自定义内容区域
  const customContent = useMemo(() => (
    <>
      <div className="flex items-center mb-2">
        <svg width="1em" height="1em" viewBox="0 0 1024 1024" fill="#52c41a" style={{marginRight: 6, verticalAlign: 'middle'}}><path d="M512 64C264.6 64 64 264.6 64 512s200.6 448 448 448 448-200.6 448-448S759.4 64 512 64zm0 820c-205.9 0-372-166.1-372-372S306.1 140 512 140s372 166.1 372 372-166.1 372-372 372z"/><path d="M464 336h96v352h-96z"/><path d="M464 688h96v96h-96z"/></svg>
        <span className="font-semibold text-base">{title || '分析点'}</span>
      </div>
      <Paragraph>{text}</Paragraph>
      <div className="flex items-center gap-2 mt-2">
        <ModelSelector
          selectedModel={selectedModel}
          onModelChange={handleModelChange}
        />
        <Button 
          icon={<svg width="1em" height="1em" viewBox="0 0 1024 1024" fill="#1890ff" style={{verticalAlign: 'middle'}}><path d="M512 64C264.6 64 64 264.6 64 512s200.6 448 448 448 448-200.6 448-448S759.4 64 512 64zm0 820c-205.9 0-372-166.1-372-372S306.1 140 512 140s372 166.1 372 372-166.1 372-372 372z"/><path d="M464 336h96v352h-96z"/><path d="M464 688h96v96h-96z"/></svg>} 
          type="primary" 
          size="small" 
          loading={loading}
          onClick={handleDesign}
        >
          生成电路设计图
        </Button>
      </div>
    </>
  ), [title, text, loading, handleDesign, selectedModel]);

  // 直接用BaseNode统一渲染
  return (
    <BaseNode
      {...props}
      customContent={customContent}
    />
  );
} 