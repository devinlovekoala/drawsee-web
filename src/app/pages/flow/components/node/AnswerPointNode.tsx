import { BaseNode, ExtendedNodeProps } from './base/BaseNode';
import { useFlowContext } from '@/app/contexts/FlowContext';
import { AiTaskType, CreateAiTaskDTO } from '@/api/types/flow.types';
import { toast } from 'sonner';
import { createAiTask } from '@/api/methods/flow.methods';
import { useState, useCallback } from 'react';
import { useAppContext } from '@/app/contexts/AppContext';
import { ModelType } from '../input/FlowInputPanel';
import { ModelSelector } from '../../../blank/components/ModelSelector';

/**
 * 回答角度节点组件
 * 用于存储问题可能的不同回答角度，可点击"继续解析"按钮获取详细内容
 */
function AnswerPointNode({ data, ...props }: ExtendedNodeProps<'answer-point' | 'ANSWER_POINT'>) {
  const {chat, convId, isChatting, addChatTask} = useFlowContext();
  const {handleAiTaskCountPlus} = useAppContext();
  
  const [isGenerated, setIsGenerated] = useState(data.isGenerated || false);
  const [selectedModel, setSelectedModel] = useState<ModelType>('doubao'); // 默认使用豆包模型
  const [isLoading, setIsLoading] = useState(false); // 添加加载状态

  // 处理模型变更
  const handleModelChange = useCallback((model: ModelType) => {
    setSelectedModel(model);
  }, []);

  const handleGeneralDetailChat = () => {
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
      type: "GENERAL_DETAIL",
      prompt: "请完成以该角度为切入点对用户提问的回答",
      promptParams: {},
      convId: convId,
      parentId: parseInt(props.id),
      model: selectedModel
    };
    
    console.log('发送通用详情AI任务', createAiTaskDTO);
    createAiTask(createAiTaskDTO).then((response) => {
      toast.success("问题已发送");
      handleAiTaskCountPlus();
      setIsGenerated(true); // 在成功响应后设置
      addChatTask({
        type: 'data',
        data: {
          nodeId: parseInt(props.id),
          isGenerated: true
        }
      });
      setTimeout(() => {
        chat(response.taskId);
      }, 200);
    }).catch(error => {
      console.error('通用详情AI任务失败', error);
      toast.error(error.response?.data?.message || error.message || "创建任务失败，请重试");
    }).finally(() => {
      setIsLoading(false); // 请求完成后重置加载状态
    });
  }

  // 模型选择器内容
  const modelSelector = (
    <div className="mt-2 mb-3">
      <div className="w-full">
        <ModelSelector
          selectedModel={selectedModel}
          onModelChange={handleModelChange}
        />
      </div>
    </div>
  );

  return (
    <BaseNode
      {...props}
      data={{...data, customContent: !isGenerated ? modelSelector : undefined}}
      footerContent={
        <button
          onClick={handleGeneralDetailChat}
          disabled={isGenerated || isLoading || isChatting}
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

export default AnswerPointNode;