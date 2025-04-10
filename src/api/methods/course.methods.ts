import alova from "@/api";
import {
    CourseProgressVO,
    CourseStatsVO,
    CourseVO,
    CreateCourseDTO,
    CreateKnowledgeBaseDTO,
    JoinCourseDTO,
    PaginatedResponse,
    PaginationParams,
    UpdateCourseDTO
} from "@/api/types/course.types.ts";

/**
 * 获取系统课程列表（可访问的课程）
 */
export const getSystemCourses = 
  (params: PaginationParams, subject?: string) => 
    alova.Get<PaginatedResponse<CourseVO>>('/courses/system', {
      params: { ...params, subject }
    });

/**
 * 获取用户已加入的课程列表
 */
export const getUserCourses = 
  (params: PaginationParams) =>
    alova.Get<PaginatedResponse<CourseVO>>('/courses/user', { params });

/**
 * 获取用户创建的课程列表
 */
export const getCreatedCourses = 
  (params: PaginationParams) =>
    alova.Get<PaginatedResponse<CourseVO>>('/courses/created', { params });

/**
 * 创建课程
 */
export const createCourse = 
  (createCourseDTO: CreateCourseDTO) =>
    alova.Post<string>('/courses', createCourseDTO);

/**
 * 加入课程
 */
export const joinCourse = 
  (joinCourseDTO: JoinCourseDTO) =>
    alova.Post<string>('/courses/join', joinCourseDTO);

/**
 * 获取课程详情
 */
export const getCourseDetail = 
  (id: string) =>
    alova.Get<CourseVO>(`/courses/${id}`);

/**
 * 更新课程
 */
export const updateCourse = 
  (id: string, updateCourseDTO: UpdateCourseDTO) =>
    alova.Put<boolean>(`/courses/${id}`, updateCourseDTO);

/**
 * 删除课程
 */
export const deleteCourse = 
  (id: string) =>
    alova.Delete<boolean>(`/courses/${id}`);

/**
 * 获取课程统计信息
 */
export const getCourseStats = 
  (id: string) =>
    alova.Get<CourseStatsVO>(`/courses/${id}/stats`);

/**
 * 获取课程学习进度
 */
export const getCourseProgress = 
  (id: string) =>
    alova.Get<CourseProgressVO>(`/courses/${id}/progress`);

/**
 * 为课程创建知识库
 */
export const createKnowledgeBaseForCourse = 
  (id: string, createKnowledgeBaseDTO: CreateKnowledgeBaseDTO) =>
    alova.Post<string>(`/courses/${id}/knowledge-base`, createKnowledgeBaseDTO);