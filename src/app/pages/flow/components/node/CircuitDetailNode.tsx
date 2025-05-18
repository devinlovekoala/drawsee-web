import { useMemo, useEffect, useState, useCallback } from 'react';
import { BaseNode, ExtendedNodeProps } from './base/BaseNode';
import { CircuitDetailData } from './types/circuitNode.types';
import { useFlowContext } from '@/app/contexts/FlowContext';
import { ModelSelector } from '@/app/pages/blank/components/ModelSelector';
import { ModelType } from '../input/FlowInputPanel';
import { CreateAiTaskDTO } from '@/api/types/flow.types';
import { createAiTask } from '@/api/methods/flow.methods';
import { toast } from 'sonner';
import { useAppContext } from '@/app/contexts/AppContext';
import { useLocation } from 'react-router-dom';

/**
 * 电路分析详情节点组件
 * 用于展示电路分析的详细内容，支持追问功能
 */
function CircuitDetailNode({ data, ...props }: ExtendedNodeProps<'circuit-detail'>) {
  const nodeData = data as unknown as CircuitDetailData;
  const { addChatTask, chat, convId, isChatting } = useFlowContext();
  const { handleAiTaskCountPlus } = useAppContext();
  const location = useLocation();
  const classId = location.state?.classId as string || null;
  
  // 添加追问功能需要的状态
  const [selectedModel, setSelectedModel] = useState<ModelType>('deepseekV3');
  const [isLoading, setIsLoading] = useState(false);
  
  // 添加组件加载日志
  useEffect(() => {
    console.log('CircuitDetailNode组件挂载，信息：', {
      id: props.id,
      type: 'circuit-detail',
      data: nodeData
    });
  }, [props.id, nodeData]);
  
  // 处理模型变更
  const handleModelChange = useCallback((model: ModelType) => {
    setSelectedModel(model);
  }, []);
  
  // 添加日志显示接收到的数据
  useEffect(() => {
    console.log('CircuitDetailNode接收数据，ID:', props.id);
    
    // 如果有父节点ID，更新父节点的isGenerated状态
    if (nodeData.parentPointId) {
      // 仅在组件首次加载时更新父节点状态，避免重复更新导致布局变形
      const parentId = parseInt(nodeData.parentPointId);
      console.log('更新父节点状态:', parentId);
      
      // 使用一个小延时确保父节点已存在
      setTimeout(() => {
        addChatTask({
          type: 'data',
          data: {
            nodeId: parentId,
            isGenerated: true
          }
        });
      }, 100);
    }
    // 只在组件挂载时执行一次
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, []);
  
  // 处理追问操作
  const handleFollowupQuestion = useCallback(() => {
    // 再次检查聊天状态，确保可以继续
    if (isChatting) {
      toast.error('正在聊天中，请先完成当前对话');
      return;
    }
    
    setIsLoading(true);
    
    const createAiTaskDTO: CreateAiTaskDTO = {
      type: "GENERAL",
      prompt: "请对之前的电路分析结果提出更深入的问题，探讨更复杂的情况或边界条件",
      promptParams: null,
      convId: convId,
      parentId: parseInt(props.id),
      model: selectedModel,
      classId: classId
    };
    
    console.log('发送电路分析追问任务', createAiTaskDTO);
    createAiTask(createAiTaskDTO).then((response) => {
      toast.success("追问已发送");
      handleAiTaskCountPlus();
      
      // 在电路分析通常情况下，创建任务后应该立即开始获取流式响应
      setTimeout(() => {
        console.log('开始获取追问流式响应，taskId:', response.taskId);
        chat(response.taskId);
      }, 200);
    }).catch(error => {
      console.error('电路分析追问任务失败', error);
      toast.error(error.response?.data?.message || error.message || "创建任务失败，请重试");
    }).finally(() => {
      setIsLoading(false); // 请求完成后重置加载状态
    });
  }, [props.id, convId, selectedModel, classId, isChatting, chat, handleAiTaskCountPlus]);
  
  // 添加角度信息到标题
  const headerContent = useMemo(() => {
    if (nodeData.angle) {
      return (
        <div className="angle-badge px-2 py-1 text-xs rounded-full bg-blue-100 text-blue-800 inline-flex items-center">
          <svg className="w-3 h-3 mr-1" fill="none" stroke="currentColor" viewBox="0 0 24 24" xmlns="http://www.w3.org/2000/svg">
            <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M13 16h-1v-4h-1m1-4h.01M21 12a9 9 0 11-18 0 9 9 0 0118 0z" />
          </svg>
          角度: {nodeData.angle}
        </div>
      );
    }
    return undefined;
  }, [nodeData.angle]);
  
  // 添加详细内容和模型选择器
  const detailContent = useMemo(() => {
    return (
      <div>
        {/* 详细内容区域 */}
        {nodeData.detailContent ? (
          <div className="detail-content mt-3 text-sm text-gray-700">
            {nodeData.detailContent}
          </div>
        ) : nodeData.text ? (
          <div className="detail-content mt-3 text-sm text-gray-700">
            {nodeData.text}
          </div>
        ) : (
          <div className="flex justify-center items-center py-4">
            <div className="animate-pulse text-blue-500">
              加载详细内容中...
            </div>
          </div>
        )}
        
        {/* 模型选择器和追问功能 */}
        <div className="mt-4 mb-3">
          <div className="w-full">
            <ModelSelector
              selectedModel={selectedModel}
              onModelChange={handleModelChange}
            />
          </div>
        </div>
      </div>
    );
  }, [nodeData.detailContent, nodeData.text, selectedModel, handleModelChange]);

  // 添加追问按钮到底部
  const footerContent = (
    <button
      onClick={handleFollowupQuestion}
      disabled={isLoading || isChatting}
      className={`px-6 py-2.5 font-medium rounded transition-colors ${
        isLoading 
          ? 'bg-gray-500 text-white cursor-wait'
          : isChatting
            ? 'bg-gray-400 text-white cursor-not-allowed'
            : 'bg-blue-500 text-white hover:bg-blue-600'
      }`}
    >
      {isLoading ? '处理中...' : '继续追问'}
    </button>
  );

  return (
    <BaseNode
      {...props}
      data={nodeData}
      headerContent={headerContent}
      customContent={detailContent}
      footerContent={footerContent}
    />
  );
}

export default CircuitDetailNode; 