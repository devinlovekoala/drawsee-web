import { useState, useEffect } from 'react';
import { useNavigate } from 'react-router-dom';
import { CourseCard } from '../../components/course/CourseCard';
import { getMyJoinedCourses, getDefaultCourses } from '../../api/methods/course.methods';
import {useRequest} from "alova/client";
import { CourseType } from '../../api/types/course.types';

/**
 * 首页组件
 */
export const Home = () => {
  const navigate = useNavigate();
  const [userCourses, setUserCourses] = useState<CourseType[]>([]);
  const [defaultCourses, setDefaultCourses] = useState<CourseType[]>([]);
  const [loading, setLoading] = useState(true);

  // 加载用户加入的课程
  const { loading: loadingJoined, data: joinedData, send: fetchJoinedCourses } = useRequest(getMyJoinedCourses, {
    immediate: true
  });

  // 加载默认课程
  const { loading: loadingDefault, data: defaultData, send: fetchDefaultCourses } = useRequest(getDefaultCourses, {
    immediate: true
  });

  useEffect(() => {
    if (joinedData) {
      setUserCourses(joinedData);
    }
  }, [joinedData]);

  useEffect(() => {
    if (defaultData) {
      setDefaultCourses(defaultData);
    }
  }, [defaultData]);

  useEffect(() => {
    if (!loadingJoined && !loadingDefault) {
      setLoading(false);
    }
  }, [loadingJoined, loadingDefault]);

  // 进入课程
  const handleEnterCourse = (courseId: string) => {
    navigate(`/flow/${courseId}`);
  };

  return (
    <div className="min-h-screen bg-gray-50 py-8">
      <div className="container mx-auto px-4">
        <h1 className="text-3xl font-bold text-gray-900 mb-8">欢迎使用 DrawSee - 动态交互知识图谱</h1>
        
        {loading ? (
          <div className="flex justify-center my-12">
            <div className="animate-spin rounded-full h-12 w-12 border-t-2 border-b-2 border-blue-500"></div>
          </div>
        ) : (
          <div className="space-y-12">
            {/* 用户加入的课程 */}
            {userCourses.length > 0 && (
              <div>
                <h2 className="text-2xl font-semibold text-gray-800 mb-4">我加入的课程</h2>
                <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-6">
                  {userCourses.map((course) => (
                    <CourseCard
                      key={course.id}
                      title={course.name}
                      description={course.description}
                      author={`教师ID: ${course.creatorId}`}
                      studentCount={course.studentCount}
                      onClick={() => handleEnterCourse(course.id)}
                    />
                  ))}
                </div>
              </div>
            )}
            
            {/* 默认课程 */}
            <div>
              <h2 className="text-2xl font-semibold text-gray-800 mb-4">推荐课程</h2>
              <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-6">
                {defaultCourses.map((course) => (
                  <CourseCard
                    key={course.id}
                    title={course.name}
                    description={course.description}
                    author="FunStack团队"
                    studentCount={course.studentCount || 0}
                    onClick={() => handleEnterCourse(course.id)}
                  />
                ))}
              </div>
            </div>
            
            {/* 加入课程按钮 */}
            <div className="flex justify-center mt-8">
              <button
                onClick={() => navigate('/join-course')}
                className="bg-blue-600 hover:bg-blue-700 text-white font-bold py-3 px-6 rounded-lg shadow-lg transition-all transform hover:scale-105"
              >
                使用班级码加入课程
              </button>
            </div>
          </div>
        )}
      </div>
    </div>
  );
}; 