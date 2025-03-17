import { NodeProps } from '@xyflow/react';
import type { KnowledgeHeadNode as KnowledgeHeadNodeType } from './types/node.types';
import { BaseNode, ExtendedNodeProps } from './base/BaseNode';
import { FlowContext, FlowContextType } from '../../flow';
import { useContext } from 'react';
import { CreateAiTaskDTO } from '@/api/types/flow.types';
import { toast } from 'sonner';
import { createAiTask } from '@/api/methods/flow.methods';

function KnowledgeHeadNode({ showSourceHandle, showTargetHandle, ...props }: ExtendedNodeProps<'knowledge-head'>) {
  
  const {chat, convId} = useContext<FlowContextType>(FlowContext);
  const handleKnowledgeDetailChat = () => {
    const createAiTaskDTO = {
      type: "knowledge-detail",
      prompt: null,
      promptParams: null,
      convId: convId,
      parentId: parseInt(props.id)
    } as CreateAiTaskDTO;
    createAiTask(createAiTaskDTO).then((response) => {
      toast.success("问题已发送");
      // 发送聊天请求
      setTimeout(() => {
        chat(response.taskId);
      }, 200);
    });
  }

  return (
    <BaseNode
      {...props}
      showSourceHandle={showSourceHandle}
      showTargetHandle={showTargetHandle}
      footerContent={
        <button
          onClick={() => {handleKnowledgeDetailChat()}}
          className="px-3 py-1 text-xs font-medium text-white bg-green-500 rounded hover:bg-green-600 transition-colors"
        >
          继续生成
        </button>
      }
    />
  );
}

export default KnowledgeHeadNode; 