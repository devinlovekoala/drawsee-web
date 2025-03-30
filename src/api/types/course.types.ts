export interface CourseType {
  id: string;
  name: string;
  description: string;
  classCode: string;
  creatorId: number;
  createdAt: string;
  updatedAt: string;
  studentCount: number;
  knowledgeBaseIds?: string[];
  modes?: string[];
}

export interface JoinCourseDTO {
  classCode: string;
}

export interface CreateCourseDTO {
  name: string;
  description: string;
} 