import { BaseNode, ExtendedNodeProps } from './base/BaseNode';
import { useFlowContext } from '@/app/contexts/FlowContext';
import { AiTaskType, CreateAiTaskDTO } from '@/api/types/flow.types';
import { toast } from 'sonner';
import { createAiTask } from '@/api/methods/flow.methods';
import { useState, useCallback, useMemo } from 'react';
import { useAppContext } from '@/app/contexts/AppContext';
import { ModelType } from '../input/FlowInputPanel';
import { ModelSelector } from '@/app/pages/blank/components/ModelSelector';
import { CircuitPointData } from './types/circuitNode.types';

/**
 * 电路分析点节点组件
 * 用于存储电路分析的不同角度或重点，可点击"继续解析"按钮获取详细内容
 */
function CircuitPointNode({ data, ...props }: ExtendedNodeProps<'circuit-point'>) {
  const {chat, convId, isChatting, addChatTask} = useFlowContext();
  const {handleAiTaskCountPlus} = useAppContext();
  
  const nodeData = data as unknown as CircuitPointData;
  const [isGenerated, setIsGenerated] = useState(nodeData.isGenerated || false);
  const [selectedModel, setSelectedModel] = useState<ModelType>('doubao'); // 默认使用豆包模型
  const [isLoading, setIsLoading] = useState(false); // 添加加载状态

  // 处理模型变更
  const handleModelChange = useCallback((model: ModelType) => {
    setSelectedModel(model);
  }, []);
  
  // 添加点类型标签
  const headerContent = useMemo(() => {
    if (nodeData.pointType) {
      return (
        <div className="point-type-badge px-2 py-1 text-xs rounded-full bg-blue-100 text-blue-800 inline-flex items-center">
          <svg className="w-3 h-3 mr-1" fill="none" stroke="currentColor" viewBox="0 0 24 24" xmlns="http://www.w3.org/2000/svg">
            <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M9 12l2 2 4-4m6 2a9 9 0 11-18 0 9 9 0 0118 0z" />
          </svg>
          {nodeData.pointType}
        </div>
      );
    }
    return undefined;
  }, [nodeData.pointType]);
  
  // 添加点描述内容
  const pointDescriptionContent = useMemo(() => {
    // 优先显示 pointDescription
    if (nodeData.pointDescription) {
      return (
        <div className="point-description mt-2 text-sm text-gray-700">
          {nodeData.pointDescription}
        </div>
      );
    }
    
    // 如果没有 pointDescription，则显示节点 text 内容
    if (nodeData.text) {
      return (
        <div className="point-description mt-2 text-sm text-gray-700">
          {nodeData.text}
        </div>
      );
    }
    
    return undefined;
  }, [nodeData.pointDescription, nodeData.text]);

  // 处理电路详情生成
  const handleCircuitDetailGeneration = () => {
    if (isChatting) {
      toast.error('正在聊天中，请先完成当前对话');
      return;
    }
    if (isGenerated) {
      toast.error('已经生成，请勿重复生成');
      return;
    }
    
    setIsLoading(true); // 设置加载状态
    
    const createAiTaskDTO: CreateAiTaskDTO = {
      type: "CIRCUIT_DETAIL",
      prompt: nodeData.text || "请对该电路分析点进行详细解析",
      promptParams: {},
      convId: convId,
      parentId: parseInt(props.id),
      model: selectedModel
    };
    
    console.log('发送电路详情AI任务', createAiTaskDTO);
    createAiTask(createAiTaskDTO).then((response) => {
      toast.success("电路分析已发送");
      handleAiTaskCountPlus();
      
      // 先在本地更新节点状态
      setIsGenerated(true);
      
      // 打印调试信息
      console.log('电路详情AI任务创建成功，taskId:', response.taskId, '节点ID:', props.id);
      
      // 更新节点数据
      addChatTask({
        type: 'data',
        data: {
          nodeId: parseInt(props.id),
          isGenerated: true
        }
      });
      
      // 延迟一点再开始聊天，确保前面的数据更新已处理
      setTimeout(() => {
        console.log('开始获取电路详情流式响应，taskId:', response.taskId);
        chat(response.taskId);
      }, 500);
    }).catch(error => {
      console.error('电路详情AI任务失败', error);
      toast.error(error.response?.data?.message || error.message || "创建任务失败，请重试");
    }).finally(() => {
      setIsLoading(false); // 请求完成后重置加载状态
    });
  }

  return (
    <BaseNode
      {...props}
      data={nodeData}
      headerContent={headerContent}
      customContent={
        <>
          {pointDescriptionContent}
          {!isGenerated && (
            <div className="mt-2 mb-3">
              <div className="w-full">
                <ModelSelector
                  selectedModel={selectedModel}
                  onModelChange={handleModelChange}
                />
              </div>
            </div>
          )}
        </>
      }
      footerContent={
        <button
          onClick={handleCircuitDetailGeneration}
          disabled={!!(isGenerated || isLoading || isChatting)}
          className={`px-6 py-2.5 font-medium rounded transition-colors ${
            isGenerated 
              ? 'bg-yellow-500 text-white cursor-not-allowed'
              : isLoading
                ? 'bg-gray-500 text-white cursor-wait'
                : 'bg-blue-500 text-white hover:bg-blue-600'
          }`}
        >
          {isGenerated ? '已经解析' : isLoading ? '解析中...' : '继续解析'}
        </button>
      }
    />
  );
}

export default CircuitPointNode; 