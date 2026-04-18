// 课程相关类型定义

export interface KnowledgeBaseVO {
    id: string;
    name: string;
    description: string;
    subject: string;
    invitationCode: string;
    creatorId: number;
    createdAt: Date;
    updatedAt: Date;
    knowledgeIds: string[];
    members: number[];
    isPublished: boolean;
    isDeleted: boolean;
    knowledgeCount: number;
    memberCount: number;
}

export interface CourseVO {
    id: string;
    name: string;
    description: string;
    classCode: string;
    code?: string;
    subject?: string;
    creatorId: number;
    creatorRole: string;
    createdAt: Date;
    updatedAt: Date;
    studentCount: number;
    knowledgeBaseIds: string[];
    knowledgeBases: KnowledgeBaseVO[];
    isPublished: boolean;
}

export interface CourseStatsVO {
    studentCount: number;
    knowledgePointCount: number;
    activeStudentCount: number;
    knowledgeBaseCount: number;
}

export interface CourseProgressVO {
    completedKnowledgePoints: number;
    totalKnowledgePoints: number;
    lastAccessTime: Date;
    totalLearningTime: number;
}

export interface PaginationParams {
    page: number;
    size: number;
}

export interface PaginatedResponse<T> {
    items: T[];
    total: number;
    page: number;
    size: number;
    totalPages: number;
}

export interface CreateCourseDTO {
    name: string;
    description?: string;
    code?: string;
    subject?: string;
}

export interface JoinCourseDTO {
    classCode: string;
}

export interface UpdateCourseDTO {
    name: string;
    description?: string;
    code?: string;
    subject?: string;
}

export interface CreateKnowledgeBaseDTO {
    name: string;
    description?: string;
    subject: string;
}
export type CourseResourceType = 'COURSEWARE' | 'TASK' | 'CIRCUIT_REF';

export interface CourseResourceVO {
    id: number;
    courseId: string;
    type: CourseResourceType;
    title: string;
    description?: string;
    content?: string;
    fileUrl?: string;
    fileName?: string;
    fileSize?: number;
    coverUrl?: string;
    dueAt?: Date;
    createdBy: number;
    createdAt: Date;
    updatedAt: Date;
}

export interface CreateCourseResourceDTO {
    type: CourseResourceType;
    title: string;
    description?: string;
    content?: string;
    fileUrl?: string;
    fileName?: string;
    fileSize?: number;
    coverUrl?: string;
    dueAt?: Date;
}
