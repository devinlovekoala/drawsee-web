import alova from "@/api";
import {ConversationVO, CreateTaskVO, NodeVO, TaskVO, UpdatePositionNode} from "@/api/types/flow.types.ts";

export const getConversations =
  () => alova.Get<Array<ConversationVO>>('/flow/conversations');

export const getNodes =
    (convId: number) => alova.Get<Array<NodeVO>>(`/flow/nodes?convId=${convId}`);

export const updateNodesPosition =
  (nodes: Array<UpdatePositionNode>) => alova.Post('/flow/nodes', { nodes });

export const createAiTask =
  (convId: number, parentNodeId: number, question: string) =>
    alova.Post<CreateTaskVO>('/flow/tasks', { convId, parentNodeId, question });

export const getRunningTasks =
  () => alova.Get<TaskVO>('/flow/tasks');
