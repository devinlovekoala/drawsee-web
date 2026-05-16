import { CourseVO } from '@/api/types/course.types';
import { getCourseStats, leaveCourse } from '@/api/methods/course.methods';
import { Users, Book, Clock, ArrowUpRight, CircuitBoard, LogOut, Loader2 } from 'lucide-react';
import { useEffect, useRef, useState } from 'react';
import { useNavigate } from 'react-router-dom';
import { toast } from 'sonner';

// 根据课程主题生成颜色
const getColorsBySubject = (subject?: string) => {
  const subjectMap: Record<string, { bg: string; text: string; border: string; icon: string }> = {
    '数学': {
      bg: 'bg-blue-50',
      text: 'text-blue-800',
      border: 'border-blue-200',
      icon: 'text-blue-500'
    },
    '语文': {
      bg: 'bg-green-50',
      text: 'text-green-800',
      border: 'border-green-200',
      icon: 'text-green-500'
    },
    '英语': {
      bg: 'bg-purple-50',
      text: 'text-purple-800',
      border: 'border-purple-200',
      icon: 'text-purple-500'
    },
    '物理': {
      bg: 'bg-amber-50',
      text: 'text-amber-800',
      border: 'border-amber-200',
      icon: 'text-amber-500'
    },
    '化学': {
      bg: 'bg-teal-50',
      text: 'text-teal-800',
      border: 'border-teal-200',
      icon: 'text-teal-500'
    },
    '生物': {
      bg: 'bg-lime-50',
      text: 'text-lime-800',
      border: 'border-lime-200',
      icon: 'text-lime-500'
    },
    '历史': {
      bg: 'bg-orange-50',
      text: 'text-orange-800',
      border: 'border-orange-200',
      icon: 'text-orange-500'
    },
    '政治': {
      bg: 'bg-red-50',
      text: 'text-red-800',
      border: 'border-red-200',
      icon: 'text-red-500'
    },
    '地理': {
      bg: 'bg-emerald-50',
      text: 'text-emerald-800',
      border: 'border-emerald-200',
      icon: 'text-emerald-500'
    },
    'CIRCUIT_ANALYSIS': {
      bg: 'bg-cyan-50',
      text: 'text-cyan-800',
      border: 'border-cyan-200',
      icon: 'text-cyan-500'
    }
  };

  return subjectMap[subject || ""] || {
    bg: 'bg-indigo-50',
    text: 'text-indigo-800',
    border: 'border-indigo-200',
    icon: 'text-indigo-500'
  };
};

const isCircuitAnalysisCourse = (course: CourseVO): boolean => {
  const subjectCheck = [
    'CIRCUIT_ANALYSIS',
    'circuit_analysis',
    'CircuitAnalysis',
    '电路分析',
    '电子电路分析'
  ].includes(course.subject || "");

  const nameCheck = [
    '电路分析',
    '电子电路',
    'circuit',
    'Circuit',
    'CIRCUIT'
  ].some(keyword => course.name?.includes(keyword));

  return subjectCheck || nameCheck;
};

interface CourseCardProps {
  course: CourseVO;
  onLeave?: (courseId: string) => void;
}

export function CourseCard({ course, onLeave }: CourseCardProps) {
  const navigate = useNavigate();
  const colors = getColorsBySubject(course.subject);
  const [kbCount, setKbCount] = useState<number>(
    course.knowledgeBases?.length || course.knowledgeBaseIds?.length || 0
  );
  const [showConfirm, setShowConfirm] = useState(false);
  const [leaving, setLeaving] = useState(false);
  const confirmRef = useRef<HTMLDivElement>(null);

  useEffect(() => {
    const fromVO = course.knowledgeBases?.length || course.knowledgeBaseIds?.length || 0;
    if (fromVO > 0) {
      setKbCount(fromVO);
      return;
    }
    getCourseStats(course.id)
      .then(s => setKbCount(s?.knowledgeBaseCount ?? 0))
      .catch(() => {});
  }, [course.id, course.knowledgeBases, course.knowledgeBaseIds]);

  useEffect(() => {
    if (!showConfirm) return;
    const handleClickOutside = (e: MouseEvent) => {
      if (confirmRef.current && !confirmRef.current.contains(e.target as Node)) {
        setShowConfirm(false);
      }
    };
    document.addEventListener('mousedown', handleClickOutside);
    return () => document.removeEventListener('mousedown', handleClickOutside);
  }, [showConfirm]);

  const isCircuitAnalysis = isCircuitAnalysisCourse(course);

  const formatDate = (date: Date) => {
    return new Date(date).toLocaleDateString('zh-CN', {
      year: 'numeric',
      month: 'long',
      day: 'numeric'
    });
  };

  const handleCourseClick = () => {
    navigate(`/course/${course.id}`);
  };

  const handleLeaveClick = (e: React.MouseEvent) => {
    e.stopPropagation();
    setShowConfirm(true);
  };

  const handleConfirmLeave = async (e: React.MouseEvent) => {
    e.stopPropagation();
    setLeaving(true);
    try {
      await leaveCourse(course.id);
      toast.success(`已退出班级「${course.name}」`);
      onLeave?.(course.id);
    } catch (error: unknown) {
      const msg = error instanceof Error ? error.message : '退出失败，请稍后再试';
      toast.error(msg);
    } finally {
      setLeaving(false);
      setShowConfirm(false);
    }
  };

  const handleCancelLeave = (e: React.MouseEvent) => {
    e.stopPropagation();
    setShowConfirm(false);
  };

  return (
    <div
      onClick={handleCourseClick}
      className={`group relative p-5 rounded-xl ${colors.bg} border ${colors.border} cursor-pointer transition-all duration-300 hover:shadow-md hover:scale-[1.01]`}
    >
      <div className="absolute top-3 right-3 flex items-center gap-1.5">
        <button
          onClick={handleLeaveClick}
          title="退出班级"
          className="opacity-0 group-hover:opacity-100 transition-opacity p-1 rounded-md hover:bg-red-100 text-neutral-400 hover:text-red-500"
        >
          <LogOut className="w-3.5 h-3.5" />
        </button>
        <ArrowUpRight className={`w-4 h-4 ${colors.icon} opacity-70 transition-all duration-300 group-hover:opacity-100 group-hover:translate-x-0.5 group-hover:-translate-y-0.5`} />
      </div>

      <div className="flex items-start space-x-2 mb-2">
        <div className={`p-2 rounded-lg ${colors.bg} border ${colors.border}`}>
          {isCircuitAnalysis ? (
            <CircuitBoard className={`w-5 h-5 ${colors.icon}`} />
          ) : (
            <Book className={`w-5 h-5 ${colors.icon}`} />
          )}
        </div>
        <div className="flex-1">
          <h3 className={`text-lg font-semibold ${colors.text} mb-1 truncate`}>{course.name}</h3>
          <p className="text-neutral-600 text-sm line-clamp-2 h-10">{course.description || '没有课程描述'}</p>
        </div>
      </div>

      <div className="mt-4 text-xs flex items-center space-x-4">
        <div className="flex items-center">
          <Users className="w-3.5 h-3.5 text-neutral-500 mr-1" />
          <span className="text-neutral-600">{course.studentCount}名学生</span>
        </div>
        <div className="flex items-center">
          <Book className="w-3.5 h-3.5 text-neutral-500 mr-1" />
          <span className="text-neutral-600">{kbCount}个知识库</span>
        </div>
      </div>

      <div className="mt-3 pt-3 border-t border-neutral-200 flex justify-between items-center">
        <div className="text-xs text-neutral-500 flex items-center">
          <Clock className="w-3.5 h-3.5 mr-1" />
          <span>创建于 {formatDate(course.createdAt)}</span>
        </div>
        <div className={`text-xs ${colors.text} px-2 py-1 rounded-full ${colors.bg} border ${colors.border}`}>
          {isCircuitAnalysis ? '电路分析' : (course.subject || '未设置')}
        </div>
      </div>

      {showConfirm && (
        <div
          ref={confirmRef}
          onClick={e => e.stopPropagation()}
          className="absolute inset-0 rounded-xl bg-white/95 backdrop-blur-sm flex flex-col items-center justify-center gap-4 p-6 z-10"
        >
          <LogOut className="w-8 h-8 text-red-400" />
          <div className="text-center">
            <p className="font-medium text-neutral-800">退出班级</p>
            <p className="text-sm text-neutral-500 mt-1">确认退出「{course.name}」？退出后需重新加入。</p>
          </div>
          <div className="flex gap-3 w-full">
            <button
              onClick={handleCancelLeave}
              className="flex-1 py-2 rounded-lg border border-neutral-200 text-sm text-neutral-600 hover:bg-neutral-50"
            >
              取消
            </button>
            <button
              onClick={handleConfirmLeave}
              disabled={leaving}
              className="flex-1 py-2 rounded-lg bg-red-500 text-sm text-white hover:bg-red-600 disabled:opacity-60 flex items-center justify-center gap-1.5"
            >
              {leaving ? <Loader2 className="w-3.5 h-3.5 animate-spin" /> : null}
              确认退出
            </button>
          </div>
        </div>
      )}
    </div>
  );
}

export default CourseCard;
