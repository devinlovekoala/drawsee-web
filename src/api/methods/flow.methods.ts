import alova from "@/api";
import {
    AiTaskVO,
    ConversationVO,
    CreateAiTaskDTO,
    CreateAiTaskVO,
    NodeVO,
    NodeToUpdate,
    ConversationShareVO,
    ShareConversationVO,
    ConversationForkVO,
    CreateConversationShareDTO
} from "@/api/types/flow.types.ts";

export const getConversations =
  () => alova.Get<Array<ConversationVO>>('/flow/conversations');

export const getNodesByConvId =
    (convId: number, extraParams?: Record<string, unknown>) => alova.Get<Array<NodeVO>>('/flow/nodes', {
      params: {convId, ...(extraParams || {})},
      cacheFor: 0 // 禁用缓存，确保每次刷新拿到最新节点
    });

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

export const createConversationShare =
  (convId: number, dto?: CreateConversationShareDTO) =>
    alova.Post<ConversationShareVO>(`/flow/conversations/${convId}/share`, dto ?? {});

export const getSharedConversation =
  (shareToken: string) => alova.Get<ShareConversationVO>(`/share/${shareToken}`);

export const forkSharedConversation =
  (shareToken: string) => alova.Post<ConversationForkVO>(`/share/${shareToken}/fork`);
