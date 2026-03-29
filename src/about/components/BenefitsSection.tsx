import React, { useEffect, useRef } from 'react';
import { landingBenefits } from '@/common/constant/landing-page.constant.ts';

const icons = [
  (
    <svg xmlns="http://www.w3.org/2000/svg" className="h-10 w-10" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="1.5" strokeLinecap="round" strokeLinejoin="round">
      <path d="M21 11.5a8.38 8.38 0 0 1-.9 3.8 8.5 8.5 0 0 1-7.6 4.7 8.38 8.38 0 0 1-3.8-.9L3 21l1.9-5.7a8.38 8.38 0 0 1-.9-3.8 8.5 8.5 0 0 1 4.7-7.6 8.38 8.38 0 0 1 3.8-.9h.5a8.48 8.48 0 0 1 8 8v.5z"></path>
    </svg>
  ),
  (
    <svg xmlns="http://www.w3.org/2000/svg" className="h-10 w-10" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="1.5" strokeLinecap="round" strokeLinejoin="round">
      <path d="M18 3a3 3 0 0 0-3 3v12a3 3 0 0 0 3 3 3 3 0 0 0 3-3 3 3 0 0 0-3-3H6a3 3 0 0 0-3 3 3 3 0 0 0 3 3 3 3 0 0 0 3-3V6a3 3 0 0 0-3-3 3 3 0 0 0-3 3 3 3 0 0 0 3 3h12a3 3 0 0 0 3-3 3 3 0 0 0-3-3z"></path>
    </svg>
  ),
  (
    <svg xmlns="http://www.w3.org/2000/svg" className="h-10 w-10" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="1.5" strokeLinecap="round" strokeLinejoin="round">
      <circle cx="12" cy="12" r="10"></circle>
      <path d="M8 14s1.5 2 4 2 4-2 4-2"></path>
      <line x1="9" y1="9" x2="9.01" y2="9"></line>
      <line x1="15" y1="9" x2="15.01" y2="9"></line>
    </svg>
  )
];

const BenefitsSection: React.FC = () => {
  const sectionRef = useRef<HTMLElement>(null);
  
  // 滚动动画效果
  useEffect(() => {
    const observer = new IntersectionObserver((entries) => {
      entries.forEach((entry) => {
        if (entry.isIntersecting) {
          entry.target.classList.add('animate-fade-in-up');
          entry.target.classList.remove('opacity-0');
          entry.target.classList.remove('translate-y-10');
        }
      });
    }, { threshold: 0.1 });
    
    const elements = document.querySelectorAll('.benefit-card');
    elements.forEach((el, index) => {
      el.classList.add('opacity-0', 'translate-y-10');
      ((el as HTMLElement).style.transitionDelay = `${index * 150}ms`);
      observer.observe(el);
    });
    
    return () => {
      elements.forEach((el) => observer.unobserve(el));
    };
  }, []);

  return (
    <section id="benefits" className="py-24 bg-gradient-to-b from-blue-50 to-white relative overflow-hidden" ref={sectionRef}>
      <div className="container mx-auto px-4">
        {/* 标题部分 */}
        <div className="text-center max-w-3xl mx-auto mb-16">
          <h2 className="text-3xl md:text-4xl font-bold mb-4 text-gray-800">
            <span className="text-transparent bg-clip-text bg-gradient-to-r from-blue-600 to-indigo-600">
              用户价值
            </span>
          </h2>
          <p className="text-xl text-gray-600">
            聚焦教学答疑与工程实践的真实收益
          </p>
          
          {/* 装饰线 */}
          <div className="w-24 h-1 bg-gradient-to-r from-blue-500 to-indigo-500 mx-auto mt-6"></div>
        </div>
        
        {/* 价值卡片网格 */}
        <div className="grid grid-cols-1 lg:grid-cols-3 gap-10">
          {landingBenefits.map((benefit, index) => (
            <div 
              key={index} 
              className="benefit-card group bg-white rounded-2xl p-8 shadow-lg hover:shadow-xl transition-all duration-500 transform hover:-translate-y-1"
            >
              {/* 图标 */}
              <div className="w-20 h-20 rounded-2xl bg-gradient-to-br from-blue-400 to-indigo-600 flex items-center justify-center text-white mb-8 group-hover:shadow-lg group-hover:shadow-blue-200 transition-shadow duration-300">
                {icons[index % icons.length]}
              </div>
              
              {/* 标题和描述 */}
              <h3 className="text-xl font-bold text-gray-800 mb-4">{benefit.title}</h3>
              <p className="text-gray-600">{benefit.description}</p>
            </div>
          ))}
        </div>
        
        {/* 关键场景 */}
        <div className="mt-24 grid grid-cols-1 md:grid-cols-3 gap-10 text-center">
          <div className="p-8 rounded-2xl bg-white/70 backdrop-blur-md shadow-lg">
            <div className="text-4xl md:text-5xl font-bold text-transparent bg-clip-text bg-gradient-to-r from-blue-600 to-indigo-600 mb-4">
              教师
            </div>
            <p className="text-gray-600">可配置班级知识库，统一课程答疑口径</p>
          </div>
          
          <div className="p-8 rounded-2xl bg-white/70 backdrop-blur-md shadow-lg">
            <div className="text-4xl md:text-5xl font-bold text-transparent bg-clip-text bg-gradient-to-r from-blue-600 to-indigo-600 mb-4">
              学生
            </div>
            <p className="text-gray-600">在班级语境中获得日常答疑与实践指导</p>
          </div>
          
          <div className="p-8 rounded-2xl bg-white/70 backdrop-blur-md shadow-lg">
            <div className="text-4xl md:text-5xl font-bold text-transparent bg-clip-text bg-gradient-to-r from-blue-600 to-indigo-600 mb-4">
              实验
            </div>
            <p className="text-gray-600">任务文档解析与电路分析可连续追问</p>
          </div>
        </div>
      </div>
      
      {/* 背景装饰 */}
      <div className="absolute -bottom-32 -right-32 w-96 h-96 bg-blue-50 rounded-full opacity-70"></div>
      <div className="absolute top-1/3 left-0 w-24 h-24 bg-blue-100 rounded-full opacity-30"></div>
    </section>
  );
};

export default BenefitsSection; 