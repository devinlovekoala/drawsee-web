import React, { useState } from 'react';
import { useNavigate } from 'react-router-dom';

interface Course {
  id: string;
  name: string;
  description: string;
  imageUrl: string;
  level: string;
  tags?: string[];
}

interface Class {
  id: string;
  name: string;
  teacherName: string;
  studentCount: number;
  status?: 'active' | 'inactive';
  lastUpdated?: string;
}

// 示例数据
const sampleCourses: Course[] = [
  {
    id: '1',
    name: '初中数学基础',
    description: '涵盖初中数学的核心概念和解题技巧',
    imageUrl: 'https://via.placeholder.com/150?text=Math',
    level: '初中',
    tags: ['热门', '基础课程']
  },
  {
    id: '2',
    name: '高中物理进阶',
    description: '高中物理知识体系和经典问题分析',
    imageUrl: 'https://via.placeholder.com/150?text=Physics',
    level: '高中',
    tags: ['进阶', '实验课程']
  },
  {
    id: '3',
    name: '小学英语启蒙',
    description: '小学英语基础知识与口语练习',
    imageUrl: 'https://via.placeholder.com/150?text=English',
    level: '小学',
    tags: ['语言', '互动']
  },
  {
    id: '4',
    name: '高中化学挑战',
    description: '高中化学重难点突破与实验探究',
    imageUrl: 'https://via.placeholder.com/150?text=Chemistry',
    level: '高中',
    tags: ['实验', '挑战']
  },
  {
    id: '5',
    name: '初中语文阅读与写作',
    description: '提升阅读理解能力和写作技巧',
    imageUrl: 'https://via.placeholder.com/150?text=Chinese',
    level: '初中',
    tags: ['写作', '阅读']
  },
  {
    id: '6',
    name: '高中生物知识整合',
    description: '系统化学习高中生物知识体系',
    imageUrl: 'https://via.placeholder.com/150?text=Biology',
    level: '高中',
    tags: ['系统化', '知识图谱']
  },
];

const sampleClasses: Class[] = [
  { id: '101', name: '2024春季初中数学班', teacherName: '张老师', studentCount: 25, status: 'active', lastUpdated: '2024-03-15' },
  { id: '102', name: '2024高中物理特训班', teacherName: '李老师', studentCount: 18, status: 'active', lastUpdated: '2024-03-20' },
  { id: '103', name: '小学英语口语班', teacherName: '王老师', studentCount: 20, status: 'inactive', lastUpdated: '2024-03-10' },
];

const CourseSelection: React.FC = () => {
  const [activeTab, setActiveTab] = useState<'courses' | 'classes'>('courses');
  const [classCode, setClassCode] = useState('');
  const [searchQuery, setSearchQuery] = useState('');
  const navigate = useNavigate();

  const handleCourseClick = (courseId: string) => {
    // 导航到选定课程的对话流页面
    navigate(`/app/flow/${courseId}`);
  };

  const handleJoinClass = (e: React.FormEvent) => {
    e.preventDefault();
    if (classCode.trim()) {
      // 这里可以添加验证班级码的逻辑
      alert(`成功加入班级！班级码: ${classCode}`);
      setClassCode('');
      // 导航到班级对应的页面
      navigate('/app/blank'); // 假设加入班级后先进入空白页面
    }
  };

  // 过滤课程
  const filteredCourses = sampleCourses.filter(course => 
    course.name.toLowerCase().includes(searchQuery.toLowerCase()) ||
    course.description.toLowerCase().includes(searchQuery.toLowerCase()) ||
    course.level.toLowerCase().includes(searchQuery.toLowerCase()) ||
    (course.tags && course.tags.some(tag => tag.toLowerCase().includes(searchQuery.toLowerCase())))
  );

  // 过滤班级
  const filteredClasses = sampleClasses.filter(cls => 
    cls.name.toLowerCase().includes(searchQuery.toLowerCase()) ||
    cls.teacherName.toLowerCase().includes(searchQuery.toLowerCase())
  );

  return (
    <div className="min-h-screen bg-[#FAFAFA] text-gray-800">
      <div className="max-w-7xl mx-auto px-4 py-8">
        <header className="mb-10">
          <div className="flex justify-between items-center mb-6">
            <h1 className="text-3xl font-bold text-gray-900">DrawSee 学习中心</h1>
            <div className="relative">
              <input
                type="text"
                placeholder="搜索课程或班级..."
                value={searchQuery}
                onChange={(e) => setSearchQuery(e.target.value)}
                className="pl-10 pr-4 py-2 rounded-lg border border-gray-300 focus:outline-none focus:ring-2 focus:ring-blue-500 focus:border-transparent w-64 bg-white"
              />
              <svg 
                className="absolute left-3 top-1/2 transform -translate-y-1/2 text-gray-400" 
                width="16" 
                height="16" 
                viewBox="0 0 24 24" 
                fill="none" 
                xmlns="http://www.w3.org/2000/svg"
              >
                <path d="M21 21L15 15M17 10C17 13.866 13.866 17 10 17C6.13401 17 3 13.866 3 10C3 6.13401 6.13401 3 10 3C13.866 3 17 6.13401 17 10Z" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round"/>
              </svg>
            </div>
          </div>
          
          <div className="flex space-x-2 mb-6 border-b border-gray-200">
            <button
              onClick={() => setActiveTab('courses')}
              className={`px-4 py-3 font-medium text-sm ${
                activeTab === 'courses'
                  ? 'text-blue-600 border-b-2 border-blue-600'
                  : 'text-gray-500 hover:text-gray-700'
              }`}
            >
              课程中心
            </button>
            <button
              onClick={() => setActiveTab('classes')}
              className={`px-4 py-3 font-medium text-sm ${
                activeTab === 'classes'
                  ? 'text-blue-600 border-b-2 border-blue-600'
                  : 'text-gray-500 hover:text-gray-700'
              }`}
            >
              我的班级
            </button>
          </div>
        </header>

        {/* 课程中心 */}
        {activeTab === 'courses' && (
          <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-3 gap-6">
            {filteredCourses.map((course) => (
              <div
                key={course.id}
                onClick={() => handleCourseClick(course.id)}
                className="bg-white rounded-lg overflow-hidden shadow-sm hover:shadow-md transition-shadow duration-300 cursor-pointer border border-gray-100"
              >
                <div className="h-40 overflow-hidden relative">
                  <img
                    src={course.imageUrl}
                    alt={course.name}
                    className="w-full h-full object-cover"
                  />
                  <div className="absolute top-3 right-3 bg-blue-100 text-blue-800 text-xs px-2 py-1 rounded-full">
                    {course.level}
                  </div>
                </div>
                <div className="p-5">
                  <h3 className="text-lg font-semibold text-gray-900 mb-2">{course.name}</h3>
                  <p className="text-gray-600 text-sm mb-4 line-clamp-2">{course.description}</p>
                  
                  {course.tags && (
                    <div className="flex flex-wrap gap-2 mb-4">
                      {course.tags.map((tag, index) => (
                        <span key={index} className="bg-gray-100 text-gray-600 text-xs px-2 py-1 rounded">
                          {tag}
                        </span>
                      ))}
                    </div>
                  )}
                  
                  <button className="w-full py-2 bg-blue-600 hover:bg-blue-700 text-white rounded-md transition-colors duration-200 text-sm font-medium">
                    开始学习
                  </button>
                </div>
              </div>
            ))}
            
            {/* 创建新课程卡片 */}
            <div 
              className="bg-white rounded-lg border border-dashed border-gray-300 flex flex-col items-center justify-center h-[352px] cursor-pointer hover:border-blue-500 transition-colors duration-200"
              onClick={() => alert('创建课程功能尚未开放')}
            >
              <div className="w-14 h-14 rounded-full bg-blue-50 flex items-center justify-center mb-4">
                <svg width="24" height="24" viewBox="0 0 24 24" fill="none" xmlns="http://www.w3.org/2000/svg">
                  <path d="M12 5V19M5 12H19" stroke="#3B82F6" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round"/>
                </svg>
              </div>
              <p className="text-gray-600 font-medium">创建新课程</p>
            </div>
          </div>
        )}

        {/* 班级 */}
        {activeTab === 'classes' && (
          <div>
            {/* 班级加入表单 */}
            <div className="bg-white rounded-lg p-6 shadow-sm mb-8">
              <h2 className="text-lg font-semibold text-gray-900 mb-4">加入班级</h2>
              <form onSubmit={handleJoinClass} className="flex space-x-4">
                <input
                  type="text"
                  value={classCode}
                  onChange={(e) => setClassCode(e.target.value)}
                  placeholder="请输入6位班级邀请码"
                  className="flex-1 px-4 py-2 rounded-md border border-gray-300 focus:outline-none focus:ring-2 focus:ring-blue-500 focus:border-transparent"
                  required
                />
                <button
                  type="submit"
                  className="px-4 py-2 bg-blue-600 hover:bg-blue-700 text-white rounded-md transition-colors duration-200 text-sm font-medium"
                >
                  加入班级
                </button>
              </form>
            </div>
            
            {/* 班级列表 */}
            <h2 className="text-lg font-semibold text-gray-900 mb-4">我的班级</h2>
            <div className="space-y-4">
              {filteredClasses.length > 0 ? (
                filteredClasses.map((cls) => (
                  <div 
                    key={cls.id} 
                    className="bg-white rounded-lg p-5 shadow-sm border border-gray-100 hover:shadow-md transition-shadow duration-300"
                  >
                    <div className="flex justify-between items-center">
                      <div>
                        <div className="flex items-center space-x-2">
                          <h3 className="font-semibold text-gray-900">{cls.name}</h3>
                          <span className={`text-xs px-2 py-0.5 rounded-full ${
                            cls.status === 'active' 
                              ? 'bg-green-100 text-green-800' 
                              : 'bg-gray-100 text-gray-600'
                          }`}>
                            {cls.status === 'active' ? '进行中' : '已结束'}
                          </span>
                        </div>
                        <p className="text-gray-500 text-sm mt-1">
                          老师：{cls.teacherName} | 学生数：{cls.studentCount} | 上次更新：{cls.lastUpdated}
                        </p>
                      </div>
                      <button
                        onClick={() => navigate('/app/blank')}
                        className="px-4 py-2 bg-blue-600 hover:bg-blue-700 text-white rounded-md transition-colors duration-200 text-sm font-medium"
                      >
                        进入班级
                      </button>
                    </div>
                  </div>
                ))
              ) : (
                <div className="bg-white rounded-lg p-8 text-center border border-gray-100">
                  <div className="w-16 h-16 mx-auto mb-4 bg-gray-100 rounded-full flex items-center justify-center">
                    <svg width="24" height="24" viewBox="0 0 24 24" fill="none" xmlns="http://www.w3.org/2000/svg">
                      <path d="M21 10H3M21 10C21.5523 10 22 10.4477 22 11V19C22 19.5523 21.5523 20 21 20H3C2.44772 20 2 19.5523 2 19V11C2 10.4477 2.44772 10 3 10M21 10V7C21 6.44772 20.5523 6 20 6H4C3.44772 6 3 6.44772 3 7V10M16 14C16 15.1046 15.1046 16 14 16H10C8.89543 16 8 15.1046 8 14" stroke="#9CA3AF" strokeWidth="2" strokeLinecap="round"/>
                    </svg>
                  </div>
                  <p className="text-gray-500">您还没有加入任何班级</p>
                  <p className="text-gray-400 text-sm mt-1">请使用上方输入框输入班级邀请码加入班级</p>
                </div>
              )}
            </div>
          </div>
        )}
      </div>
    </div>
  );
};

export default CourseSelection;