import { useState } from 'react';
import { toast } from 'sonner';
import { joinCourse } from '@/api/methods/course.methods';
import { GraduationCap, ArrowRight } from 'lucide-react';

interface ClassCodeInputProps {
  onJoinSuccess: () => void;
}

export function ClassCodeInput({ onJoinSuccess }: ClassCodeInputProps) {
  const [classCode, setClassCode] = useState('');
  const [isJoining, setIsJoining] = useState(false);

  const handleJoin = async () => {
    if (!classCode || classCode.length !== 6) {
      toast.error('请输入6位班级码');
      return;
    }

    setIsJoining(true);
    try {
      await joinCourse({ classCode });
      toast.success('成功加入班级');
      setClassCode('');
      onJoinSuccess();
    } catch (error) {
      toast.error('加入班级失败，请检查班级码是否正确');
      console.error('加入班级失败:', error);
    } finally {
      setIsJoining(false);
    }
  };

  const handleKeyDown = (e: React.KeyboardEvent<HTMLInputElement>) => {
    if (e.key === 'Enter') {
      handleJoin();
    }
  };

  return (
    <div className="w-full max-w-md mx-auto p-6 bg-white/90 backdrop-blur-sm rounded-2xl shadow-sm border border-neutral-200/70">
      <div className="flex items-center justify-center mb-6">
        <div className="bg-indigo-100 rounded-full p-2 mr-3">
          <GraduationCap className="h-6 w-6 text-indigo-600" />
        </div>
        <h2 className="text-xl font-medium text-neutral-800">加入班级</h2>
      </div>
      
      <div className="space-y-4">
        <div>
          <label htmlFor="classCode" className="block text-sm font-medium text-neutral-700 mb-1">
            班级码
          </label>
          <div className="relative">
            <input
              type="text"
              id="classCode"
              value={classCode}
              onChange={(e) => setClassCode(e.target.value.slice(0, 6))}
              onKeyDown={handleKeyDown}
              className="w-full px-4 py-3 bg-white border border-neutral-300 rounded-lg text-neutral-900 font-medium text-lg tracking-wider focus:ring-2 focus:ring-indigo-500 focus:border-indigo-500 outline-none transition-all duration-200"
              placeholder="输入6位班级码"
              maxLength={6}
              autoComplete="off"
            />
          </div>
          <p className="mt-1.5 text-xs text-neutral-500">
            班级码由教师提供，请向您的老师获取
          </p>
        </div>
        
        <button
          onClick={handleJoin}
          disabled={isJoining || classCode.length !== 6}
          className={`w-full flex items-center justify-center gap-2 px-4 py-3 rounded-lg font-medium transition-all duration-200
            ${
              isJoining || classCode.length !== 6
                ? 'bg-neutral-200 text-neutral-500 cursor-not-allowed'
                : 'bg-indigo-600 text-white hover:bg-indigo-700 active:bg-indigo-800'
            }`}
        >
          {isJoining ? (
            <>
              <div className="animate-spin h-4 w-4 border-2 border-white rounded-full border-t-transparent"></div>
              <span>加入中...</span>
            </>
          ) : (
            <>
              <span>加入班级</span>
              <ArrowRight className="h-4 w-4" />
            </>
          )}
        </button>
      </div>
    </div>
  );
}

export default ClassCodeInput;