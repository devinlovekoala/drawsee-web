import alova from "@/api";
import {
    AiTaskVO,
    ConversationVO,
    CreateAiTaskDTO,
    CreateAiTaskVO,
    NodeVO,
    NodeToUpdate
} from "@/api/types/flow.types.ts";

export const getConversations =
  () => alova.Get<Array<ConversationVO>>('/flow/conversations');

export const getNodesByConvId =
    (convId: number) => alova.Get<Array<NodeVO>>('/flow/nodes', {params: {convId}});

export const updateNodesPositionAndHeight =
  (nodes: Array<NodeToUpdate>) => alova.Post('/flow/nodes', { nodes });

export const getProcessingAiTasks =
  (convId: number) => alova.Get<AiTaskVO>('/flow/tasks', {params: {convId}});

export const createAiTask = (createAiTaskDTO: CreateAiTaskDTO) => {
  return alova.Post<CreateAiTaskVO>('/flow/tasks', createAiTaskDTO);
};

export const getResourceUrl =
  (objectName: string) => alova.Get<{url: string}>(`/flow/resources`, {params: {objectName}});

export const deleteNode = 
  (nodeId: string) =>  alova.Delete(`/flow/nodes/${nodeId}`)

export const deleteConversation =
  (convId: string) => alova.Delete(`/flow/conversations/${convId}`)
