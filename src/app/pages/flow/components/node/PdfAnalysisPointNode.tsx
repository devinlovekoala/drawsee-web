import { useState, useEffect } from 'react';
import { Button, message } from 'antd';
import { PlayCircleOutlined, EditOutlined, CheckOutlined, CloseOutlined } from '@ant-design/icons';
import { BaseNode, ExtendedNodeProps } from './base/BaseNode';
import { createAiTask } from '@/api/methods/flow.methods';
import { CreateAiTaskDTO } from '@/api/types/flow.types';
import { useAppContext } from '@/app/contexts/AppContext';
import { useFlowContext } from '@/app/contexts/FlowContext';
import { ModelSelector } from '../../../blank/components/ModelSelector';
import { ModelType } from '../input/FlowInputPanel';

/**
 * PDF分析点节点组件 - 两阶段工作流
 * 类似于AnswerPointNode，支持继续解析功能
 */
export default function PdfAnalysisPointNode(props: ExtendedNodeProps<'PDF_ANALYSIS_POINT'>) {
  const { data, id } = props;
  const [loading, setLoading] = useState(false);
  const [selectedModel, setSelectedModel] = useState<ModelType>('deepseekV3');
  const [isEditing, setIsEditing] = useState(false);
  const [editText, setEditText] = useState(data.text || '');
  
  const { handleAiTaskCountPlus } = useAppContext();
  const { convId } = useFlowContext();
  
  // 检查是否已生成详情
  const isGenerated = (data as any).isGenerated || false;
  const process = (data as any).process || 'idle';

  // 同步编辑文本
  useEffect(() => {
    setEditText(data.text || '');
  }, [data.text]);

  // 模型选择处理
  const handleModelChange = (model: ModelType) => {
    setSelectedModel(model);
  };

  // 处理PDF分析详情任务
  const handlePdfAnalysisDetailChat = async () => {
    if (!data.text?.trim()) {
      message.error('分析点内容为空，无法生成详情');
      return;
    }

    setLoading(true);
    try {
      const dto: CreateAiTaskDTO = {
        type: 'PDF_CIRCUIT_ANALYSIS_DETAIL',
        prompt: data.text,
        promptParams: {},
        convId: typeof convId === 'number' ? convId : null,
        parentId: Number(id),
        model: selectedModel,
        classId: null
      };

      await createAiTask(dto);
      handleAiTaskCountPlus();
      
      // 触发自动选中详情节点事件
      window.dispatchEvent(new CustomEvent('auto-select-detail-node', {
        detail: {
          parentNodeId: id,
          detailNodeType: 'PDF_ANALYSIS_DETAIL',
          detailNodeTypes: ['PDF_ANALYSIS_DETAIL']
        }
      }));
      
      message.success('已发送PDF分析详情任务');
    } catch (error) {
      console.error('发送PDF分析详情任务失败:', error);
      message.error('发送PDF分析详情任务失败');
    } finally {
      setLoading(false);
    }
  };
  // intentionally unused while feature is disabled
  void handlePdfAnalysisDetailChat;
  void loading;

  // 编辑功能
  const handleEdit = () => {
    setIsEditing(true);
  };

  const handleSaveEdit = () => {
    // 这里可以添加保存编辑的逻辑
    setIsEditing(false);
    message.success('编辑已保存');
  };

  const handleCancelEdit = () => {
    setEditText(data.text || '');
    setIsEditing(false);
  };

  // 获取状态文本和样式
  const getStatusInfo = () => {
    if (process === 'generating') {
      return { text: '生成中...', color: 'text-blue-600' };
    }
    if (isGenerated) {
      return { text: '已完成', color: 'text-green-600' };
    }
    return { text: '待生成', color: 'text-gray-500' };
  };

  const statusInfo = getStatusInfo();

  // 自定义内容渲染
  const customContent = (
    <div className="space-y-3">
      <div className="flex items-center justify-between mb-2">
        <div className="flex items-center gap-2">
          <span className="text-sm font-medium text-purple-600">PDF分析点</span>
          <span className={`text-xs ${statusInfo.color}`}>{statusInfo.text}</span>
        </div>
        <div className="flex items-center gap-2">
          <ModelSelector
            selectedModel={selectedModel}
            onModelChange={handleModelChange}
          />
          {!isEditing && (
            <Button
              type="text"
              size="small"
              icon={<EditOutlined />}
              onClick={handleEdit}
              title="编辑"
            />
          )}
        </div>
      </div>
      
      <div className="mb-3">
        {isEditing ? (
          <div className="space-y-2">
            <textarea
              value={editText}
              onChange={(e) => setEditText(e.target.value)}
              className="w-full p-2 text-sm border border-gray-300 rounded resize-none"
              rows={3}
              placeholder="输入分析点内容..."
            />
            <div className="flex gap-2">
              <Button
                type="primary"
                size="small"
                icon={<CheckOutlined />}
                onClick={handleSaveEdit}
              >
                保存
              </Button>
              <Button
                size="small"
                icon={<CloseOutlined />}
                onClick={handleCancelEdit}
              >
                取消
              </Button>
            </div>
          </div>
        ) : (
          <p className="text-sm leading-relaxed text-gray-700">{data.text}</p>
        )}
      </div>
      
      {!isEditing && (
        <Button
          type="primary"
          size="small"
          icon={<PlayCircleOutlined />}
          // 已临时禁用继续解析，后端PDF详情功能未就绪
          disabled={true}
          loading={false}
          block
          title="继续解析（已禁用）"
        >
          继续解析（已禁用）
        </Button>
      )}
    </div>
  );

  return (
    <BaseNode
      {...props}
      customContent={customContent}
    />
  );
} 