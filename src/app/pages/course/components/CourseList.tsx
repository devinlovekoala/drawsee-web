import { useState, useEffect } from 'react';
import { CourseVO, PaginationParams } from '@/api/types/course.types';
import { getUserCourses } from '@/api/methods/course.methods';
import { toast } from 'sonner';
import CourseCard from './CourseCard';
import { Loader2 } from 'lucide-react';

interface CourseListProps {
  refreshTrigger?: number;
}

export function CourseList({ refreshTrigger = 0 }: CourseListProps) {
  const [courses, setCourses] = useState<CourseVO[]>([]);
  const [isLoading, setIsLoading] = useState(false);
  const [pagination, setPagination] = useState<PaginationParams>({
    page: 1,
    size: 12
  });
  const [totalPages, setTotalPages] = useState(0);

  // 获取课程列表
  const fetchCourses = async () => {
    setIsLoading(true);
    try {
      // 获取所有已加入的班级课程
      const result = await getUserCourses(pagination);
      setCourses(result.items);
      setTotalPages(result.totalPages);
    } catch (error) {
      toast.error('获取班级列表失败');
      console.error('获取班级列表失败:', error);
    } finally {
      setIsLoading(false);
    }
  };

  // 加载更多课程
  const loadMoreCourses = () => {
    if (pagination.page < totalPages) {
      setPagination(prev => ({ ...prev, page: prev.page + 1 }));
    }
  };

  // 当分页参数变化时，重新获取课程
  useEffect(() => {
    fetchCourses();
  }, [pagination.page, refreshTrigger]);

  return (
    <div className="w-full">
      <h2 className="text-xl font-semibold text-neutral-800 mb-6">已加入的班级</h2>
      
      {isLoading && pagination.page === 1 ? (
        <div className="flex flex-col items-center justify-center min-h-[200px]">
          <Loader2 className="h-10 w-10 text-indigo-500 animate-spin mb-2" />
          <p className="text-neutral-500">加载中...</p>
        </div>
      ) : courses.length === 0 ? (
        <div className="bg-neutral-100/70 border border-neutral-200 rounded-xl p-8 text-center">
          <p className="text-neutral-600">暂无已加入的班级</p>
        </div>
      ) : (
        <>
          <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-4">
            {courses.map(course => (
              <CourseCard key={course.id} course={course} />
            ))}
          </div>
          
          {totalPages > pagination.page && (
            <div className="mt-8 text-center">
              <button
                onClick={loadMoreCourses}
                className="px-6 py-2 bg-indigo-100 text-indigo-700 rounded-lg font-medium hover:bg-indigo-200 transition-colors"
              >
                {isLoading ? (
                  <div className="flex items-center justify-center gap-2">
                    <Loader2 className="h-4 w-4 animate-spin" />
                    <span>加载中...</span>
                  </div>
                ) : (
                  '加载更多'
                )}
              </button>
            </div>
          )}
        </>
      )}
    </div>
  );
}

export default CourseList;