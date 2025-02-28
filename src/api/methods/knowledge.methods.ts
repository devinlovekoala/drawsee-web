import alova from '@/api';
import type { KnowledgeNode } from '@/api/types/knowledge.types';

export const fetchAllKnowledgePoints = () => {
    return alova.Get<KnowledgeNode[]>(`/api/knowledge/all`);
};

export const addKnowledgeNode = (node: KnowledgeNode) => {
    return alova.Post(`/api/knowledge/add`, node);
};

export const findKnowledgeNodeByName = (name: string) => {
    return alova.Get<KnowledgeNode>(`/api/knowledge/find`, { params: { name } });
};

export const updateKnowledgeNode = (node: KnowledgeNode) => {
    return alova.Put(`/api/knowledge/update`, node);
};

export const deleteKnowledgeNodeByName = (name: string) => {
    return alova.Delete(`/api/knowledge/delete`, { params: { name } });
};
