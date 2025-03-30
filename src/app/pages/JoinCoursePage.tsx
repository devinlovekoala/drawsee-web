import React, { useState } from 'react';
import { useNavigate } from 'react-router-dom';
import { joinCourse } from '../../api/methods/course.methods';

export const JoinCoursePage: React.FC = () => {
  const navigate = useNavigate();
  const [classCode, setClassCode] = useState('');
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState('');

  const handleJoin = async () => {
    if (!classCode.trim()) {
      setError('请输入班级码');
      return;
    }

    setLoading(true);
    setError('');

    try {
      const courseId = await joinCourse({ classCode });
      navigate(`/flow/${courseId}`);
    } catch (err) {
      console.error('加入课程失败:', err);
      setError('班级码无效或您已加入该课程');
    } finally {
      setLoading(false);
    }
  };

  return (
    <div className="min-h-screen bg-gray-50 flex flex-col items-center justify-center p-4">
      <div className="w-full max-w-md bg-white rounded-lg shadow-md p-8">
        <h1 className="text-2xl font-bold text-gray-900 mb-6 text-center">加入课程</h1>
        
        <div className="mb-6">
          <label htmlFor="classCode" className="block text-sm font-medium text-gray-700 mb-2">
            输入班级码
          </label>
          <input
            id="classCode"
            type="text"
            className="w-full px-4 py-2 border border-gray-300 rounded-md focus:outline-none focus:ring-2 focus:ring-blue-500"
            placeholder="请输入6位班级码"
            value={classCode}
            onChange={(e) => setClassCode(e.target.value)}
            maxLength={6}
          />
          {error && <p className="mt-2 text-sm text-red-600">{error}</p>}
        </div>
        
        <div className="flex justify-between">
          <button
            type="button"
            className="px-4 py-2 text-sm font-medium text-gray-700 bg-gray-100 rounded-md hover:bg-gray-200 focus:outline-none focus:ring-2 focus:ring-gray-500"
            onClick={() => navigate('/')}
          >
            返回
          </button>
          <button
            type="button"
            className={`px-4 py-2 text-sm font-medium text-white bg-blue-600 rounded-md hover:bg-blue-700 focus:outline-none focus:ring-2 focus:ring-blue-500 ${loading ? 'opacity-75 cursor-not-allowed' : ''}`}
            onClick={handleJoin}
            disabled={loading}
          >
            {loading ? '加入中...' : '加入课程'}
          </button>
        </div>
      </div>
    </div>
  );
}; 