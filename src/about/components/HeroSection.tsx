import React, { useEffect, useRef } from 'react';
import { useNavigate } from 'react-router-dom';
import MainImage from '../../assets/img/首页主图.png';
import { LOGIN_FLAG_KEY } from '@/common/constant/storage-key.constant.ts';
import { landingHeroStats } from '@/common/constant/landing-page.constant.ts';

const HeroSection: React.FC = () => {
  const navigate = useNavigate();
  const containerRef = useRef<HTMLDivElement>(null);
  const backgroundRef = useRef<HTMLDivElement>(null);
  
  // 视差效果
  useEffect(() => {
    const handleMouseMove = (e: MouseEvent) => {
      if (!backgroundRef.current) return;
      
      const x = e.clientX / window.innerWidth;
      const y = e.clientY / window.innerHeight;
      
      // 创建视差效果
      backgroundRef.current.style.transform = `translate(${x * -30}px, ${y * -30}px)`;
    };
    
    window.addEventListener('mousemove', handleMouseMove);
    
    return () => {
      window.removeEventListener('mousemove', handleMouseMove);
    };
  }, []);
  
  // 滚动动画
  useEffect(() => {
    const observer = new IntersectionObserver(
      (entries) => {
        entries.forEach((entry) => {
          if (entry.isIntersecting) {
            entry.target.classList.add('animate-fade-in-up');
            entry.target.classList.remove('opacity-0');
          }
        });
      },
      { threshold: 0.1 }
    );
    
    const elements = document.querySelectorAll('.hero-animated');
    elements.forEach((el) => {
      observer.observe(el);
    });
    
    return () => {
      elements.forEach((el) => {
        observer.unobserve(el);
      });
    };
  }, []);
  
  const handleGetStarted = () => {
    // 检查用户是否已登出
    const hasLoggedOut = localStorage.getItem('Auth:LoggedOut') === 'true';
    const isLoggedIn = sessionStorage.getItem(LOGIN_FLAG_KEY) === 'true';
    
    // 如果已登出或未登录，则不跳转到应用页面，而是进入登录拦截模式
    if (hasLoggedOut || !isLoggedIn) {
      // 此处不需要navigate到/blank，app.tsx的登录拦截会处理
      // 将状态设置为需要登录，App组件会检测并显示登录表单
      navigate('/blank', { state: { requireLogin: true } });
    } else {
      // 已登录用户直接跳转
      navigate('/blank', { state: { from: '/about' } });
    }
  };

  return (
    <section className="relative bg-white overflow-hidden pt-32 pb-20 min-h-screen flex items-center" ref={containerRef}>
      {/* 背景装饰 */}
      <div className="absolute inset-0 overflow-hidden">
        <div 
          ref={backgroundRef}
          className="absolute inset-0 -z-10 transition-transform duration-1000 ease-out"
        >
          <div className="absolute -top-40 -right-40 w-[600px] h-[600px] bg-blue-100/30 rounded-full blur-3xl"></div>
          <div className="absolute top-1/3 -left-20 w-[400px] h-[400px] bg-indigo-100/30 rounded-full blur-3xl"></div>
          <div className="absolute -bottom-40 left-1/3 w-[500px] h-[500px] bg-purple-100/20 rounded-full blur-3xl"></div>
        </div>
      </div>
      
      <div className="container mx-auto px-4">
        <div className="flex flex-col lg:flex-row items-center gap-12">
          {/* 左侧内容 */}
          <div
            className="lg:w-1/2 hero-animated opacity-0"
            data-lenis-scroll-snap-align="start"
            data-lenis-scroll-snap-stop="always"
          >
            <div className="mb-6">
              <h2 className="text-2xl md:text-3xl font-bold text-transparent bg-clip-text bg-gradient-to-r from-indigo-500 to-purple-600 mb-2 animate-typing">
                昭析（DrawSee）
              </h2>
            </div>
            <h1 className="text-4xl md:text-5xl lg:text-6xl font-bold leading-tight mb-6">
              <span className="block text-transparent bg-clip-text bg-gradient-to-r from-blue-600 to-indigo-700">
                思维的画布
              </span>
              <span className="block text-transparent bg-clip-text bg-gradient-to-r from-indigo-600 to-purple-600">
                知识的星图
              </span>
            </h1>
            
            <p className="text-xl md:text-2xl text-gray-700 mb-8 max-w-lg">
              打破线性对话的局限，让AI交流如同在<span className="text-blue-600 font-medium">思维画布</span>上绘制<span className="text-indigo-600 font-medium">知识星图</span>，并将教师知识库、学生答疑与电路实践连接成一条连续链路。
            </p>

            <div className="rounded-2xl border border-blue-100 bg-blue-50/70 p-5 mb-8 max-w-2xl">
              <p className="text-gray-700 leading-7">
                平台采用 Java 后端自研 Agent 工作流，系统会根据问题与上下文自动编排任务类型，
                无需用户手动切换模式，支持班级知识库增强答疑与电路工程场景深度分析。
              </p>
            </div>
            
            <div className="flex flex-wrap gap-4">
              <button
                onClick={handleGetStarted}
                className="px-8 py-4 bg-gradient-to-r from-blue-600 to-indigo-600 text-white font-medium rounded-full shadow-xl shadow-blue-500/20 hover:shadow-blue-500/40 transition-all duration-300 transform hover:scale-105"
              >
                立即体验
              </button>
              
              <a
                href="#features"
                className="px-8 py-4 bg-white text-indigo-600 font-medium rounded-full border border-indigo-200 shadow-lg hover:shadow-xl hover:border-indigo-300 transition-all duration-300"
              >
                了解更多
              </a>
            </div>
            
            {/* 数据点 */}
            <div className="flex gap-6 mt-12">
              {landingHeroStats.map((item, index) => (
                <div
                  key={item.label}
                  className="hero-animated opacity-0"
                  style={{ animationDelay: `${200 + index * 200}ms` }}
                >
                  <div className="text-2xl font-bold text-blue-600">{item.value}</div>
                  <div className="text-gray-600 text-sm">{item.label}</div>
                </div>
              ))}
            </div>
          </div>
          
          {/* 右侧图片 */}
          <div className="lg:w-1/2 hero-animated opacity-0" style={{ animationDelay: '300ms' }}>
            <div className="relative w-full">
              <div className="absolute -inset-4 bg-gradient-to-r from-blue-100 to-indigo-100 rounded-3xl blur-xl opacity-70 -z-10"></div>
              <div className="relative rounded-2xl overflow-hidden shadow-2xl transform transition-all duration-700 hover:scale-[1.02] hover:shadow-indigo-200/50">
                <img 
                  src={MainImage} 
                  alt="DrawSee应用界面" 
                  className="w-full object-cover"
                />
                
                {/* 浮动装饰元素 */}
                <div className="absolute top-10 right-10 w-20 h-20 bg-gradient-to-br from-blue-500 to-indigo-500 rounded-full opacity-40 blur-xl animate-float"></div>
                <div className="absolute bottom-20 left-10 w-16 h-16 bg-gradient-to-br from-indigo-500 to-purple-500 rounded-full opacity-40 blur-xl animate-float" style={{ animationDelay: '1s' }}></div>
              </div>
            </div>
          </div>
        </div>
      </div>
      
      {/* 向下滚动提示 */}
      <div className="absolute bottom-10 left-1/2 transform -translate-x-1/2 flex flex-col items-center">
        <div className="text-gray-400 mb-2 text-sm">向下滚动了解更多</div>
        <div className="w-6 h-10 border-2 border-gray-300 rounded-full flex justify-center items-start p-1">
          <div className="w-1.5 h-1.5 bg-gray-300 rounded-full animate-bounce"></div>
        </div>
      </div>
    </section>
  );
};

export default HeroSection; 