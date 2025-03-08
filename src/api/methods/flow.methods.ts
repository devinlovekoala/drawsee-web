import alova from "@/api";
import {
    AiTaskVO,
    ConversationVO,
    CreateAiTaskDTO,
    CreateAiTaskVO,
    NodeVO,
    UpdatePositionNode
} from "@/api/types/flow.types.ts";

export const getConversations =
  () => alova.Get<Array<ConversationVO>>('/flow/conversations');

export const getNodes =
    (convId: number) => alova.Get<Array<NodeVO>>(`/flow/nodes?convId=${convId}`);

export const updateNodesPosition =
  (nodes: Array<UpdatePositionNode>) => alova.Post('/flow/nodes', { nodes });

export const createAiTask = (data: CreateAiTaskDTO) =>
    alova.Post<CreateAiTaskVO>('/flow/tasks', data);

export const getRunningTasks =
  () => alova.Get<AiTaskVO>('/flow/tasks');
