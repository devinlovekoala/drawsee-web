import { toast } from 'sonner';
import { BaseNode, ExtendedNodeProps } from './base/BaseNode';
import { useFlowContext } from '@/app/contexts/FlowContext';
import { useCallback, useMemo, useState } from 'react';
import { AiTaskType, CreateAiTaskDTO } from '@/api/types/flow.types';
import { createAiTask } from '@/api/methods/flow.methods';
import { useAppContext } from '@/app/contexts/AppContext';
import { ModelSelector } from '../../../blank/components/ModelSelector';
import { ModelType } from '../../../flow/components/input/FlowInputPanel';
import AnswerPointNode from './AnswerPointNode';
import AnswerDetailNode from './AnswerDetailNode';
import { useLocation } from 'react-router-dom';

function AnswerNode({ data, ...props }: ExtendedNodeProps<'answer'>) {
  // 根据subtype渲染不同的节点组件
  if (data.subtype === 'ANSWER_POINT') {
    return <AnswerPointNode data={data} {...props} />;
  }
  
  if (data.subtype === 'ANSWER_DETAIL') {
    return <AnswerDetailNode data={data} {...props} />;
  }
  
  const {chat, convId, isChatting, addChatTask} = useFlowContext();
  const {handleAiTaskCountPlus} = useAppContext();
  const { subtype, isDone } = data;
  const [isGenerated, setIsGenerated] = useState(data.isGenerated || false);
  const [selectedModel, setSelectedModel] = useState<ModelType>('deepseekV3'); // 默认使用DeepSeekV3模型

  const location = useLocation();
  const classId = location.state?.classId as string || null;

  const handleSolverChat = useCallback((taskType: AiTaskType) => {
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
      type: taskType,
      prompt: (() => {
        // 根据任务类型返回适当的提示
        switch(taskType) {
          case 'SOLVER_CONTINUE':
            return "请继续推导解题过程";
          case 'SOLVER_SUMMARY':
            return "请总结全部的解题过程";
          case 'ANIMATION':
            return "请为此内容生成动画";
          default:
            return "请继续解析此内容";
        }
      })(),  // 立即调用函数
      promptParams: null,
      convId: convId,
      parentId: parseInt(props.id),
      model: selectedModel,
      classId: classId // 添加班级ID
    };
    console.log('发送节点AI任务', createAiTaskDTO);
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
      console.error('节点AI任务失败', error);
      setIsGenerated(false);
      toast.error(error.message || "创建任务失败，请重试");
    });
  }, [isChatting, isGenerated, convId, props.id, addChatTask, chat, handleAiTaskCountPlus, selectedModel, classId]);

  // 处理模型变更
  const handleModelChange = useCallback((model: ModelType) => {
    setSelectedModel(model);
  }, []);

  // 模型选择器组件 - 使用紧凑样式
  const modelSelectorElement = useMemo(() => (
    <div className="mt-2 mb-1">
      <div className="w-full">
        <ModelSelector 
          selectedModel={selectedModel} 
          onModelChange={handleModelChange} 
        />
      </div>
    </div>
  ), [selectedModel, handleModelChange]);

  // 自定义内容
  const customContent = useMemo(() => {
    // 为解题和动画节点显示模型选择器
    const showModelSelector = 
      subtype === 'solver-continue' || 
      subtype === 'solver-summary' || 
      subtype === 'animation';
    
    return showModelSelector ? modelSelectorElement : null;
  }, [subtype, modelSelectorElement]);

  // 底部按钮内容
  const footerContent = useMemo(() => {
    if (subtype === 'solver-first' || (subtype === 'solver-continue' && isDone !== undefined)) {
      return (
        <button
          onClick={() => {
            if (subtype === 'solver-first' || (subtype === 'solver-continue' && !isDone)) {
              handleSolverChat('SOLVER_CONTINUE' as AiTaskType);
            } else if (subtype === 'solver-continue' && isDone) {
              handleSolverChat('SOLVER_SUMMARY' as AiTaskType);
            }
          }}
          disabled={isGenerated}
          className={`px-6 py-2.5 font-medium rounded transition-colors ${
            isGenerated
              ? 'bg-yellow-500 text-white cursor-not-allowed'
              : 'bg-green-500 text-white hover:bg-green-600'
          }`}
        >
          {
            isGenerated ? '已经生成' : 
            subtype === 'solver-first' ? '开始推导' :
            subtype === 'solver-continue' && isDone ? '题目总结' :
            '继续推导'
          }
        </button>
      );
    }
    
    // 为动画节点添加生成按钮
    if (subtype === 'animation' && !isGenerated) {
      return (
        <button
          onClick={() => handleSolverChat('ANIMATION' as AiTaskType)}
          disabled={isGenerated}
          className="px-6 py-2.5 font-medium rounded transition-colors bg-purple-500 text-white hover:bg-purple-600"
        >
          生成动画
        </button>
      );
    }
    
    return undefined;
  }, [subtype, isDone, isGenerated, handleSolverChat]);

  // 创建增强的数据对象，包含自定义内容
  const enhancedData = {
    ...data,
    customContent
  };

  return (
    <BaseNode
      data={enhancedData}
      footerContent={footerContent}
      {...props}
    />
  );
}

export default AnswerNode; 