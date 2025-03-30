import alova from "@/api";
import { CourseType, CreateCourseDTO, JoinCourseDTO } from "@/api/types/course.types";

/**
 * 获取用户加入的课程列表
 */
export const getMyJoinedCourses = () => 
  alova.Get<CourseType[]>('/course/joined');

/**
 * 获取用户创建的课程列表
 */
export const getMyCreatedCourses = () => 
  alova.Get<CourseType[]>('/course/created');

/**
 * 获取默认/推荐课程列表
 */
export const getDefaultCourses = () => 
  alova.Get<CourseType[]>('/course/default');

/**
 * 获取课程详情
 */
export const getCourseDetail = (id: string) => 
  alova.Get<CourseType>(`/course/${id}`);

/**
 * 创建新课程
 */
export const createCourse = (data: CreateCourseDTO) => 
  alova.Post<string>('/course', data);

/**
 * 加入课程
 */
export const joinCourse = (data: JoinCourseDTO) => 
  alova.Post<string>('/course/join', data); 