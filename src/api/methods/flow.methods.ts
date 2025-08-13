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
  // 检查是否是PDF相关任务，需要使用multipart格式
  const isPdfTask = createAiTaskDTO.type === 'PDF_CIRCUIT_ANALYSIS' || 
                   createAiTaskDTO.type === 'PDF_CIRCUIT_ANALYSIS_DETAIL' ||
                   createAiTaskDTO.type === 'PDF_CIRCUIT_DESIGN';
  
  if (isPdfTask) {
    // 使用FormData发送multipart请求
    const formData = new FormData();
    formData.append('type', createAiTaskDTO.type);
    
    if (createAiTaskDTO.prompt) {
      formData.append('prompt', createAiTaskDTO.prompt);
    }
    
    if (createAiTaskDTO.promptParams) {
      formData.append('promptParams', JSON.stringify(createAiTaskDTO.promptParams));
    } else {
      formData.append('promptParams', '{}');
    }
    
    if (createAiTaskDTO.convId !== null) {
      formData.append('convId', createAiTaskDTO.convId.toString());
    }
    
    if (createAiTaskDTO.parentId !== null) {
      formData.append('parentId', createAiTaskDTO.parentId.toString());
    }
    
    if (createAiTaskDTO.model) {
      formData.append('model', createAiTaskDTO.model);
    }
    
    if (createAiTaskDTO.classId) {
      formData.append('classId', createAiTaskDTO.classId);
    }
    
    return alova.Post<CreateAiTaskVO>('/flow/tasks', formData, {
      // 标记为文件类型请求，避免拦截器覆盖Content-Type
      meta: { isFile: true }
    });
  } else {
    // 非PDF任务使用JSON格式
    return alova.Post<CreateAiTaskVO>('/flow/tasks', createAiTaskDTO);
  }
};

export const getResourceUrl =
  (objectName: string) => alova.Get<{url: string}>(`/flow/resources`, {params: {objectName}});

export const deleteNode = 
  (nodeId: string) =>  alova.Delete(`/flow/nodes/${nodeId}`)

export const deleteConversation =
  (convId: string) => alova.Delete(`/flow/conversations/${convId}`)
