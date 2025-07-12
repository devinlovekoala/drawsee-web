import React, { useState } from 'react';
import { Button, message } from 'antd';
import { ToolOutlined } from '@ant-design/icons';
import { BaseNode, ExtendedNodeProps } from './base/BaseNode';
import { createAiTask } from '@/api/methods/flow.methods';
import { CreateAiTaskDTO } from '@/api/types/flow.types';
import { useAppContext } from '@/app/contexts/AppContext';
import { useFlowContext } from '@/app/contexts/FlowContext';
import { ModelSelector } from '../../../blank/components/ModelSelector';
import { ModelType } from '../input/FlowInputPanel';
import { useLocation } from 'react-router-dom';

/**
 * PDF分析点节点组件
 * 显示分析内容并支持生成设计图功能
 */
export default function PdfAnalysisPointNode(props: ExtendedNodeProps<'PDF_ANALYSIS_POINT'>) {
  const { data, id } = props;
  const [loading, setLoading] = useState(false);
  const [selectedModel, setSelectedModel] = useState<ModelType>('deepseekV3');
  
  const { handleAiTaskCountPlus } = useAppContext();
  const { convId } = useFlowContext();
  const location = useLocation();
  const classId = location.state?.classId as string || null;
  
  // 从location state或节点数据中获取fileUrl
  const fileUrl = location.state?.fileUrl || (data as any).fileUrl || localStorage.getItem('currentPdfUrl');

  // 模型选择处理
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
      // 按照API文档要求设置参数
      const dto: CreateAiTaskDTO = {
        type: 'PDF_CIRCUIT_DESIGN',
        prompt: String(fileUrl), // 直接将fileUrl放入prompt字段
        promptParams: {}, // 空对象
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

  // 自定义内容渲染
  const customContent = (
    <div className="space-y-3">
      <div className="flex items-center justify-between mb-2">
        <span className="text-sm font-medium text-blue-600">分析点</span>
        <ModelSelector
          selectedModel={selectedModel}
          onModelChange={handleModelChange}
        />
      </div>
      <div className="mb-3">
        <p className="text-sm leading-relaxed">{data.text}</p>
      </div>
      <Button
        type="primary"
        size="small"
        icon={<ToolOutlined />}
        onClick={handleDesign}
        loading={loading}
        block
      >
        基于此点生成电路设计
      </Button>
    </div>
  );

  return (
    <BaseNode
      {...props}
      customContent={customContent}
    />
  );
} 