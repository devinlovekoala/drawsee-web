import React, { useEffect, useRef } from 'react';

const benefits = [
  {
    title: '思考不再是单行道',
    description: 'DrawSee的树状对话结构让你可以同时探索多个思路分支，大幅提升思考效率，让灵感不再因线性对话而中断。',
    icon: (
      <svg xmlns="http://www.w3.org/2000/svg" className="h-10 w-10" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="1.5" strokeLinecap="round" strokeLinejoin="round">
        <path d="M21 11.5a8.38 8.38 0 0 1-.9 3.8 8.5 8.5 0 0 1-7.6 4.7 8.38 8.38 0 0 1-3.8-.9L3 21l1.9-5.7a8.38 8.38 0 0 1-.9-3.8 8.5 8.5 0 0 1 4.7-7.6 8.38 8.38 0 0 1 3.8-.9h.5a8.48 8.48 0 0 1 8 8v.5z"></path>
      </svg>
    )
  },
  {
    title: '构建专属知识星图',
    description: '每一次对话都是一张思维地图，帮助你有条理地组织和拓展知识，形成结构化的思维体系。',
    icon: (
      <svg xmlns="http://www.w3.org/2000/svg" className="h-10 w-10" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="1.5" strokeLinecap="round" strokeLinejoin="round">
        <path d="M18 3a3 3 0 0 0-3 3v12a3 3 0 0 0 3 3 3 3 0 0 0 3-3 3 3 0 0 0-3-3H6a3 3 0 0 0-3 3 3 3 0 0 0 3 3 3 3 0 0 0 3-3V6a3 3 0 0 0-3-3 3 3 0 0 0-3 3 3 3 0 0 0 3 3h12a3 3 0 0 0 3-3 3 3 0 0 0-3-3z"></path>
      </svg>
    )
  },
  {
    title: '适应多元场景需求',
    description: '无论是学习解题、项目规划、创意发想还是知识探索，DrawSee的多模式设计都能完美适应不同场景需求。',
    icon: (
      <svg xmlns="http://www.w3.org/2000/svg" className="h-10 w-10" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="1.5" strokeLinecap="round" strokeLinejoin="round">
        <circle cx="12" cy="12" r="10"></circle>
        <path d="M8 14s1.5 2 4 2 4-2 4-2"></path>
        <line x1="9" y1="9" x2="9.01" y2="9"></line>
        <line x1="15" y1="9" x2="15.01" y2="9"></line>
      </svg>
    )
  }
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
            解锁全新思维方式，释放创造力
          </p>
          
          {/* 装饰线 */}
          <div className="w-24 h-1 bg-gradient-to-r from-blue-500 to-indigo-500 mx-auto mt-6"></div>
        </div>
        
        {/* 价值卡片网格 */}
        <div className="grid grid-cols-1 lg:grid-cols-3 gap-10">
          {benefits.map((benefit, index) => (
            <div 
              key={index} 
              className="benefit-card group bg-white rounded-2xl p-8 shadow-lg hover:shadow-xl transition-all duration-500 transform hover:-translate-y-1"
            >
              {/* 图标 */}
              <div className="w-20 h-20 rounded-2xl bg-gradient-to-br from-blue-400 to-indigo-600 flex items-center justify-center text-white mb-8 group-hover:shadow-lg group-hover:shadow-blue-200 transition-shadow duration-300">
                {benefit.icon}
              </div>
              
              {/* 标题和描述 */}
              <h3 className="text-xl font-bold text-gray-800 mb-4">{benefit.title}</h3>
              <p className="text-gray-600">{benefit.description}</p>
            </div>
          ))}
        </div>
        
        {/* 统计数字 */}
        <div className="mt-24 grid grid-cols-1 md:grid-cols-3 gap-10 text-center">
          <div className="p-8 rounded-2xl bg-white/70 backdrop-blur-md shadow-lg">
            <div className="text-4xl md:text-5xl font-bold text-transparent bg-clip-text bg-gradient-to-r from-blue-600 to-indigo-600 mb-4">
              50%
            </div>
            <p className="text-gray-600">思考效率提升</p>
          </div>
          
          <div className="p-8 rounded-2xl bg-white/70 backdrop-blur-md shadow-lg">
            <div className="text-4xl md:text-5xl font-bold text-transparent bg-clip-text bg-gradient-to-r from-blue-600 to-indigo-600 mb-4">
              3x
            </div>
            <p className="text-gray-600">知识拓展速度</p>
          </div>
          
          <div className="p-8 rounded-2xl bg-white/70 backdrop-blur-md shadow-lg">
            <div className="text-4xl md:text-5xl font-bold text-transparent bg-clip-text bg-gradient-to-r from-blue-600 to-indigo-600 mb-4">
              100%
            </div>
            <p className="text-gray-600">用户满意度</p>
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