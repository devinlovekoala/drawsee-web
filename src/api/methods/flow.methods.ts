import alova from "@/api";
import {
    AiTaskVO,
    ConversationVO,
    CreateAiTaskDTO,
    CreateAiTaskVO,
    NodeVO,
    nodeToUpdate
} from "@/api/types/flow.types.ts";

export const getConversations =
  () => alova.Get<Array<ConversationVO>>('/flow/conversations');

export const getNodes =
    (convId: number) => alova.Get<Array<NodeVO>>('/flow/nodes', {params: {convId}});

export const updateNodesPosition =
  (nodes: Array<nodeToUpdate>) => alova.Post('/flow/nodes', { nodes });

export const getProcessingAiTasks =
  (convId: number) => alova.Get<AiTaskVO>('/flow/tasks', {params: {convId}});

export const createAiTask =
  (createAiTaskDTO: CreateAiTaskDTO) => alova.Post<CreateAiTaskVO>('/flow/tasks', createAiTaskDTO);

export const getResourceUrl =
  (objectName: string) => alova.Get<string>(`/flow/resources/${objectName}`);
