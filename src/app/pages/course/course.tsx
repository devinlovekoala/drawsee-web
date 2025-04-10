import { useState, useEffect } from 'react';
import ClassCodeInput from './components/ClassCodeInput';
import CourseList from './components/CourseList';
import CourseTabs from './components/CourseTabs';
import { GraduationCap, Plus } from 'lucide-react';

type TabType = 'joined' | 'created' | 'available';

function Course() {
  const [activeTab, setActiveTab] = useState<TabType>('joined');
  const [refreshTrigger, setRefreshTrigger] = useState(0);
  const [showCreateModal, setShowCreateModal] = useState(false);

  // 处理加入课程成功
  const handleJoinSuccess = () => {
    setRefreshTrigger(prev => prev + 1);
    setActiveTab('joined');
  };
  
  return (
    <div className="w-full h-full bg-background flex flex-col flex-wrap content-start md:content-center md:pt-0">
      {/* 动态背景 */}
      <div className="absolute inset-0 z-0 overflow-hidden">
        <div className="size-full transition-opacity duration-150 [mask-image:radial-gradient(600px_circle_at_center,white,transparent)]">
          <div className="absolute inset-0 bg-[radial-gradient(#e5e7eb_1px,transparent_1px)] bg-[length:20px_20px] opacity-40"></div>
          
          {/* 背景波纹 - 增强版 */}
          <div className="absolute left-1/2 top-1/2 -translate-x-1/2 -translate-y-1/2 h-[800px] w-[800px]">
            {/* 主波纹圈 */}
            {[...Array(6)].map((_, i) => (
              <div
                key={`ripple-${i}`}
                className="absolute rounded-full border-2 animate-ripple animate-pulse-glow"
                style={{
                  height: `${(i + 1) * 100}px`,
                  width: `${(i + 1) * 100}px`,
                  left: '50%',
                  top: '50%',
                  borderColor: `rgba(99, 102, 241, ${0.3 - i * 0.04})`,
                  animationDelay: `${i * 0.8}s`,
                }}
              />
            ))}
            
            {/* 浮动装饰元素 */}
            <div className="absolute left-1/2 top-1/2 w-[400px] h-[400px] animate-float">
              <div className="absolute w-20 h-20 rounded-full bg-indigo-100/20 blur-md"
                   style={{ left: '20%', top: '10%', animationDelay: '0.5s' }}></div>
              <div className="absolute w-16 h-16 rounded-full bg-purple-100/20 blur-md"
                   style={{ left: '70%', top: '20%', animationDelay: '1.2s' }}></div>
              <div className="absolute w-24 h-24 rounded-full bg-blue-100/20 blur-md"
                   style={{ left: '30%', top: '70%', animationDelay: '0.8s' }}></div>
            </div>
          </div>
        </div>
      </div>

      {/* 主要内容 */}
      <div className="relative z-10 w-full mt-8 mb-16">
        <div className="w-full animate-fade-in">
          <div className="max-w-[1200px] mx-auto px-4">
            {/* 标题区域 */}
            <div className="flex justify-between items-center mb-8">
              <div className="flex items-center gap-2">
                <div className="bg-indigo-100 rounded-full p-2">
                  <GraduationCap className="h-7 w-7 text-indigo-600" />
                </div>
                <div>
                  <h1 className="text-2xl md:text-3xl font-bold tracking-tight text-transparent bg-clip-text bg-gradient-to-r from-neutral-900 to-neutral-600">课程中心</h1>
                  <p className="text-sm md:text-base tracking-tight text-neutral-600">加入班级，查看课程，管理学习进度</p>
                </div>
              </div>
              <button
                onClick={() => setShowCreateModal(true)}
                className="hidden md:flex items-center gap-1.5 bg-indigo-600 hover:bg-indigo-700 text-white px-4 py-2 rounded-lg transition-colors shadow-sm"
              >
                <Plus className="h-4 w-4" />
                <span>创建课程</span>
              </button>
            </div>

            <div className="grid grid-cols-1 lg:grid-cols-3 gap-6">
              {/* 左侧：课程列表 */}
              <div className="lg:col-span-2 order-2 lg:order-1">
                <CourseTabs activeTab={activeTab} onTabChange={setActiveTab} />
                <CourseList category={activeTab} refreshTrigger={refreshTrigger} />
              </div>

              {/* 右侧：加入班级 */}
              <div className="lg:col-span-1 order-1 lg:order-2">
                <ClassCodeInput onJoinSuccess={handleJoinSuccess} />
                
                <button
                  onClick={() => setShowCreateModal(true)}
                  className="md:hidden w-full flex items-center justify-center gap-1.5 bg-indigo-600 hover:bg-indigo-700 text-white px-4 py-3 rounded-lg transition-colors shadow-sm mt-4"
                >
                  <Plus className="h-4 w-4" />
                  <span>创建课程</span>
                </button>
                
                {/* 右侧信息卡片 */}
                <div className="mt-6 p-5 bg-gradient-to-br from-indigo-50 to-white border border-indigo-100 rounded-xl">
                  <h3 className="font-medium text-indigo-900 mb-2">什么是班级中心？</h3>
                  <p className="text-sm text-neutral-700 mb-4">班级中心是一个学习管理平台，可以帮助您：</p>
                  <ul className="space-y-2 text-sm text-neutral-600">
                    <li className="flex items-start">
                      <span className="bg-indigo-100 text-indigo-800 rounded-full w-5 h-5 flex items-center justify-center text-xs mr-2 mt-0.5">1</span>
                      <span>加入老师创建的班级，获取学习资源</span>
                    </li>
                    <li className="flex items-start">
                      <span className="bg-indigo-100 text-indigo-800 rounded-full w-5 h-5 flex items-center justify-center text-xs mr-2 mt-0.5">2</span>
                      <span>查看课程内容和知识点</span>
                    </li>
                    <li className="flex items-start">
                      <span className="bg-indigo-100 text-indigo-800 rounded-full w-5 h-5 flex items-center justify-center text-xs mr-2 mt-0.5">3</span>
                      <span>追踪您的学习进度和成绩</span>
                    </li>
                    <li className="flex items-start">
                      <span className="bg-indigo-100 text-indigo-800 rounded-full w-5 h-5 flex items-center justify-center text-xs mr-2 mt-0.5">4</span>
                      <span>参与课程讨论和作业提交</span>
                    </li>
                  </ul>
                </div>
              </div>
            </div>
          </div>
        </div>
      </div>
      
      {/* 创建课程模态框占位（实际实现可以根据需求添加） */}
      {showCreateModal && (
        <div className="fixed inset-0 bg-black/50 flex items-center justify-center z-50">
          <div className="bg-white p-6 rounded-xl w-[500px] max-w-full mx-4">
            <h2 className="text-xl font-semibold mb-4">创建课程</h2>
            <p className="text-neutral-600 mb-6">当前功能尚在开发中，敬请期待！</p>
            <button 
              onClick={() => setShowCreateModal(false)}
              className="w-full bg-indigo-600 text-white py-2 rounded-lg"
            >
              关闭
            </button>
          </div>
        </div>
      )}
    </div>
  );
}

export default Course;