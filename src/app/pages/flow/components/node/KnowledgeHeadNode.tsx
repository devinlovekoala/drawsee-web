import { BaseNode, ExtendedNodeProps } from './base/BaseNode';
import { useFlowContext } from '@/app/contexts/FlowContext';
import { CreateAiTaskDTO } from '@/api/types/flow.types';
import { toast } from 'sonner';
import { createAiTask } from '@/api/methods/flow.methods';
import { useState, useCallback } from 'react';
import { useAppContext } from '@/app/contexts/AppContext';
import { ModelType } from '../input/FlowInputPanel';
import { ModelSelector } from '../../../blank/components/ModelSelector';
import { useLocation } from 'react-router-dom';

function KnowledgeHeadNode({ showSourceHandle, showTargetHandle, data, ...props }: ExtendedNodeProps<'knowledge-head'>) {
  
  const {chat, convId, isChatting, addChatTask} = useFlowContext();
  const {handleAiTaskCountPlus} = useAppContext();
  
  const location = useLocation();
  const classId = location.state?.classId as string || null;

  const [isGenerated, setIsGenerated] = useState(data.isGenerated || false);
  const [selectedModel, setSelectedModel] = useState<ModelType>('deepseekV3'); // 默认使用DeepSeekV3模型

  // 处理模型变更
  const handleModelChange = useCallback((model: ModelType) => {
    setSelectedModel(model);
  }, []);

  const handleKnowledgeDetailChat = () => {
    if (isChatting) {
      toast.error('正在聊天中，请先完成当前对话');
      return;
    }
    if (isGenerated) {
      toast.error('已经生成，请勿重复生成');
      return;
    }
    setIsGenerated(true);
    const createAiTaskDTO: CreateAiTaskDTO = {
      type: "KNOWLEDGE_DETAIL",
      prompt: "请详细解析该知识点",
      promptParams: null,
      convId: convId,
      parentId: parseInt(props.id),
      model: selectedModel,
      classId: classId
    };
    console.log('发送知识详情AI任务', createAiTaskDTO);
    createAiTask(createAiTaskDTO).then((response) => {
      toast.success("问题已发送");
      handleAiTaskCountPlus();
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
      console.error('知识详情AI任务失败', error);
      setIsGenerated(false);
      toast.error(error.message || "创建任务失败，请重试");
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
      data={{...data, customContent: !isGenerated ? modelSelector : null}}
      showSourceHandle={showSourceHandle}
      showTargetHandle={showTargetHandle}
      footerContent={
        <button
          onClick={handleKnowledgeDetailChat}
          disabled={isGenerated}
          className={`px-6 py-2.5 font-medium rounded transition-colors ${
            isGenerated 
              ? 'bg-yellow-500 text-white cursor-not-allowed'
              : 'bg-green-500 text-white hover:bg-green-600'
          }`}
        >
          {isGenerated ? '已经生成' : '详细解析'}
        </button>
      }
    />
  );
}

export default KnowledgeHeadNode; 