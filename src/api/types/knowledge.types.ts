export interface KnowledgeNode {
    id?: string;
    label: string;
    names: string[];
    resources: KnowledgeResource[];
    level: number;
    childrenIds: string[];
    iframeData?: KnowledgeIframeData;
}

export interface KnowledgeResource {
    type: string;
    value: string;
}

export interface KnowledgeIframeData {
    knowledgeName: string;
    basicLlmExplain: string;
    problemLlmExplain: string;
    geometryLlmExplain: string;
    animationUrls: string[];
    bilibiliUrls: string[];
    exampleUrls: string[];
}
