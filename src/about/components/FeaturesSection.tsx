import React, { useRef, useEffect } from 'react';

const features = [
  {
    title: '树状对话结构',
    description: '告别线性对话，支持同时探索多个想法分支，实现全新思维组织方式',
    icon: (
      <svg xmlns="http://www.w3.org/2000/svg" className="h-10 w-10" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="1.5" strokeLinecap="round" strokeLinejoin="round">
        <path d="M3 3v18h18" />
        <path d="M18.4 9a6 6 0 0 0-5-5" />
        <path d="M6 12a6 6 0 0 0 5 5" />
        <path d="M18.4 16a6 6 0 0 0-5 5" />
        <path d="M6 19a6 6 0 0 0 5-5" />
        <path d="M12 12h.01" />
        <path d="M12 5v7" />
        <path d="M7 12h5" />
        <path d="M12 19v-7" />
      </svg>
    )
  },
  {
    title: '多模型支持',
    description: '集成多种顶尖大语言模型，根据不同场景智能匹配最佳模型，提升回答质量',
    icon: (
      <svg xmlns="http://www.w3.org/2000/svg" className="h-10 w-10" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="1.5" strokeLinecap="round" strokeLinejoin="round">
        <rect x="3" y="3" width="18" height="18" rx="2" ry="2"></rect>
        <line x1="3" y1="9" x2="21" y2="9"></line>
        <path d="M15 14h1"></path>
        <path d="M15 18h1"></path>
        <path d="M8 14h4"></path>
        <path d="M8 18h4"></path>
      </svg>
    )
  },
  {
    title: '上下文管理',
    description: '智能管理上下文窗口，保持对话连贯性的同时，优化性能与回答质量',
    icon: (
      <svg xmlns="http://www.w3.org/2000/svg" className="h-10 w-10" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="1.5" strokeLinecap="round" strokeLinejoin="round">
        <rect x="2" y="5" width="20" height="14" rx="2"></rect>
        <line x1="2" y1="10" x2="22" y2="10"></line>
        <line x1="7" y1="15" x2="8" y2="15"></line>
        <line x1="11" y1="15" x2="12" y2="15"></line>
        <line x1="15" y1="15" x2="16" y2="15"></line>
      </svg>
    )
  },
  {
    title: '知识库集成',
    description: '无缝接入个人知识库，确保AI回答内容更贴合用户特定场景与知识体系',
    icon: (
      <svg xmlns="http://www.w3.org/2000/svg" className="h-10 w-10" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="1.5" strokeLinecap="round" strokeLinejoin="round">
        <path d="M4 19.5A2.5 2.5 0 0 1 6.5 17H20"></path>
        <path d="M6.5 2H20v20H6.5A2.5 2.5 0 0 1 4 19.5v-15A2.5 2.5 0 0 1 6.5 2z"></path>
      </svg>
    )
  },
  {
    title: '跨设备同步',
    description: '所有对话内容自动跨设备同步，随时随地继续您的思考过程',
    icon: (
      <svg xmlns="http://www.w3.org/2000/svg" className="h-10 w-10" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="1.5" strokeLinecap="round" strokeLinejoin="round">
        <rect x="5" y="2" width="14" height="20" rx="2" ry="2"></rect>
        <line x1="12" y1="18" x2="12.01" y2="18"></line>
        <polyline points="8 6 12 2 16 6"></polyline>
      </svg>
    )
  },
  {
    title: '导出与分享',
    description: '轻松导出对话内容为多种格式，方便记录与分享您的思考成果',
    icon: (
      <svg xmlns="http://www.w3.org/2000/svg" className="h-10 w-10" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="1.5" strokeLinecap="round" strokeLinejoin="round">
        <path d="M21 15v4a2 2 0 0 1-2 2H5a2 2 0 0 1-2-2v-4"></path>
        <polyline points="17 8 12 3 7 8"></polyline>
        <line x1="12" y1="3" x2="12" y2="15"></line>
      </svg>
    )
  }
];

const FeaturesSection: React.FC = () => {
  const featuresRef = useRef<HTMLDivElement>(null);

  useEffect(() => {
    const observer = new IntersectionObserver(
      (entries) => {
        entries.forEach((entry) => {
          if (entry.isIntersecting) {
            const elements = entry.target.querySelectorAll('.feature-card');
            elements.forEach((el, index) => {
              setTimeout(() => {
                el.classList.add('animate-fade-in-up');
                el.classList.remove('opacity-0');
              }, index * 100);
            });
          }
        });
      },
      { threshold: 0.1 }
    );

    if (featuresRef.current) {
      observer.observe(featuresRef.current);
    }

    return () => {
      if (featuresRef.current) {
        observer.unobserve(featuresRef.current);
      }
    };
  }, []);

  return (
    <section id="features" className="py-24 bg-white">
      <div className="container mx-auto px-4" ref={featuresRef}>
        {/* 标题部分 */}
        <div className="text-center max-w-3xl mx-auto mb-16">
          <h2 className="text-3xl md:text-4xl font-bold mb-4 text-gray-800">
            <span className="text-transparent bg-clip-text bg-gradient-to-r from-blue-600 to-indigo-600">
              功能特点
            </span>
          </h2>
          <p className="text-xl text-gray-600">
            重新定义AI交流体验
          </p>
          
          {/* 装饰线 */}
          <div className="w-24 h-1 bg-gradient-to-r from-blue-500 to-indigo-500 mx-auto mt-6"></div>
        </div>
        
        {/* 功能卡片网格 */}
        <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-10">
          {features.map((feature, index) => (
            <div
              key={index}
              className="feature-card opacity-0 bg-white rounded-xl p-8 shadow-lg hover:shadow-xl transition-all duration-500 border border-gray-100 hover:border-blue-100 relative overflow-hidden group"
            >
              {/* 圆形装饰背景 */}
              <div className="absolute w-32 h-32 rounded-full bg-blue-50 right-0 bottom-0 translate-x-1/2 translate-y-1/2 transition-transform duration-500 group-hover:scale-150"></div>
              
              {/* 图标 */}
              <div className="relative z-10 w-16 h-16 rounded-xl bg-gradient-to-br from-blue-500 to-indigo-600 flex items-center justify-center text-white mb-6 shadow-md">
                {feature.icon}
              </div>
              
              {/* 标题和描述 */}
              <h3 className="relative z-10 text-xl font-bold text-gray-800 mb-3">{feature.title}</h3>
              <p className="relative z-10 text-gray-600">{feature.description}</p>
            </div>
          ))}
        </div>
      </div>
    </section>
  );
};

export default FeaturesSection; 