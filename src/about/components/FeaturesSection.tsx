import React, { useRef, useEffect } from 'react';
import { landingFeatures } from '@/common/constant/landing-page.constant.ts';

const featureIcons = [
  (
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
  ),
  (
    <svg xmlns="http://www.w3.org/2000/svg" className="h-10 w-10" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="1.5" strokeLinecap="round" strokeLinejoin="round">
      <path d="M12 3v18" />
      <path d="M3 12h18" />
      <circle cx="12" cy="12" r="9" />
    </svg>
  ),
  (
    <svg xmlns="http://www.w3.org/2000/svg" className="h-10 w-10" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="1.5" strokeLinecap="round" strokeLinejoin="round">
      <polyline points="3 6 10 6 12 10 21 10" />
      <polyline points="3 14 9 14 11 18 21 18" />
      <circle cx="6" cy="18" r="2" />
      <circle cx="6" cy="10" r="2" />
    </svg>
  ),
  (
    <svg xmlns="http://www.w3.org/2000/svg" className="h-10 w-10" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="1.5" strokeLinecap="round" strokeLinejoin="round">
      <path d="M4 19.5A2.5 2.5 0 0 1 6.5 17H20" />
      <path d="M6.5 2H20v20H6.5A2.5 2.5 0 0 1 4 19.5v-15A2.5 2.5 0 0 1 6.5 2z" />
      <path d="M9 8h8" />
      <path d="M9 12h6" />
    </svg>
  ),
  (
    <svg xmlns="http://www.w3.org/2000/svg" className="h-10 w-10" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="1.5" strokeLinecap="round" strokeLinejoin="round">
      <rect x="3" y="3" width="18" height="18" rx="2" ry="2" />
      <path d="M7 12h10" />
      <path d="M7 16h6" />
      <path d="M7 8h3" />
    </svg>
  ),
  (
    <svg xmlns="http://www.w3.org/2000/svg" className="h-10 w-10" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="1.5" strokeLinecap="round" strokeLinejoin="round">
      <path d="M4 5h16" />
      <path d="M4 12h10" />
      <path d="M4 19h7" />
      <path d="M18 9l3 3-3 3" />
    </svg>
  )
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
              平台能力
            </span>
          </h2>
          <p className="text-xl text-gray-600">
            围绕教学答疑与电路实践构建的智能交互基础设施
          </p>
          
          {/* 装饰线 */}
          <div className="w-24 h-1 bg-gradient-to-r from-blue-500 to-indigo-500 mx-auto mt-6"></div>
        </div>
        
        {/* 功能卡片网格 */}
        <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-10">
          {landingFeatures.map((feature, index) => (
            <div
              key={index}
              className="feature-card opacity-0 bg-white rounded-xl p-8 shadow-lg hover:shadow-xl transition-all duration-500 border border-gray-100 hover:border-blue-100 relative overflow-hidden group"
            >
              {/* 圆形装饰背景 */}
              <div className="absolute w-32 h-32 rounded-full bg-blue-50 right-0 bottom-0 translate-x-1/2 translate-y-1/2 transition-transform duration-500 group-hover:scale-150"></div>
              
              {/* 图标 */}
              <div className="relative z-10 w-16 h-16 rounded-xl bg-gradient-to-br from-blue-500 to-indigo-600 flex items-center justify-center text-white mb-6 shadow-md">
                {featureIcons[index % featureIcons.length]}
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