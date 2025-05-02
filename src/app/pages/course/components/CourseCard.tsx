import { CourseVO } from '@/api/types/course.types';
import { Users, Book, Clock, ArrowUpRight, CircuitBoard } from 'lucide-react';
import { useNavigate } from 'react-router-dom';

// 根据课程主题生成颜色
const getColorsBySubject = (subject: string) => {
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

  return subjectMap[subject] || {
    bg: 'bg-indigo-50',
    text: 'text-indigo-800',
    border: 'border-indigo-200',
    icon: 'text-indigo-500'
  };
};

// 判断是否为电路分析课程的多种方式
const isCircuitAnalysisCourse = (course: CourseVO): boolean => {
  // 判断课程学科是否为电路分析（多种可能的表示方式）
  const subjectCheck = [
    'CIRCUIT_ANALYSIS', 
    'circuit_analysis', 
    'CircuitAnalysis', 
    '电路分析', 
    '电子电路分析'
  ].includes(course.subject);
  
  // 判断课程名称是否包含电路分析相关词汇
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
}

export function CourseCard({ course }: CourseCardProps) {
  const navigate = useNavigate();
  const colors = getColorsBySubject(course.subject);
  
  // 判断是否为电路分析课程
  const isCircuitAnalysis = isCircuitAnalysisCourse(course);
  
  // 格式化日期
  const formatDate = (date: Date) => {
    return new Date(date).toLocaleDateString('zh-CN', {
      year: 'numeric',
      month: 'long',
      day: 'numeric'
    });
  };

  const handleCourseClick = () => {
    if (isCircuitAnalysis) {
      // 电路分析课程直接导航到电路分析页面
      navigate('/circuit', {
        state: {
          classId: course.id // 传递班级ID
        }
      });
    } else {
      // 其他课程导航到通用对话页面
      navigate('/blank', { 
        state: { 
          agentType: 'GENERAL',
          agentName: '昭析智能助手',
          classId: course.id // 传递班级ID
        } 
      });
    }
  };

  return (
    <div 
      onClick={handleCourseClick}
      className={`group relative p-5 rounded-xl ${colors.bg} border ${colors.border} cursor-pointer transition-all duration-300 hover:shadow-md hover:scale-[1.01]`}
    >
      <div className="absolute top-3 right-3">
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
          <span className="text-neutral-600">{course.knowledgeBases?.length || 0}个知识库</span>
        </div>
      </div>
      
      <div className="mt-3 pt-3 border-t border-neutral-200 flex justify-between items-center">
        <div className="text-xs text-neutral-500 flex items-center">
          <Clock className="w-3.5 h-3.5 mr-1" />
          <span>创建于 {formatDate(course.createdAt)}</span>
        </div>
        <div className={`text-xs ${colors.text} px-2 py-1 rounded-full ${colors.bg} border ${colors.border}`}>
          {isCircuitAnalysis ? '电路分析' : course.subject}
        </div>
      </div>
    </div>
  );
}

export default CourseCard;