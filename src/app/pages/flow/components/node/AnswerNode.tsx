import { toast } from 'sonner';
import { BaseNode, ExtendedNodeProps } from './base/BaseNode';
import { useFlowContext } from '@/app/contexts/FlowContext';
import { useCallback, useMemo, useState } from 'react';
import { AiTaskType, CreateAiTaskDTO } from '@/api/types/flow.types';
import { createAiTask } from '@/api/methods/flow.methods';
import { useAppContext } from '@/app/contexts/AppContext';

function AnswerNode({ data, ...props }: ExtendedNodeProps<'answer'>) {
  const {chat, convId, isChatting, addChatTask} = useFlowContext();
  const {handleAiTaskCountPlus} = useAppContext();
  const { subtype, isDone } = data;
  const [isGenerated, setIsGenerated] = useState(data.isGenerated || false);

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
    const createAiTaskDTO = {
      type: taskType,
      prompt: null,
      promptParams: null,
      convId: convId,
      parentId: parseInt(props.id)
    } as CreateAiTaskDTO;
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
    });
  }, [isChatting, isGenerated, convId, props.id, addChatTask, chat]);

  const footerContent = useMemo(() => {
    if (subtype === 'solver-first' || (subtype === 'solver-continue' && isDone !== undefined)) {
      return (
        <button
          onClick={() => {
            if (subtype === 'solver-first' || (subtype === 'solver-continue' && !isDone)) {
              handleSolverChat('solver-continue');
            } else if (subtype === 'solver-continue' && isDone) {
              handleSolverChat('solver-summary');
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
    return undefined;
  }, [subtype, isDone, isGenerated, handleSolverChat]);

  return (
    <BaseNode
      data={data}
      footerContent={footerContent}
      {...props}
    />
  );
}

export default AnswerNode; 