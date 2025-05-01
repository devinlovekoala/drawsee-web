import React from 'react';
import { useNavigate } from 'react-router-dom';
import { LOGIN_FLAG_KEY } from '@/common/constant/storage-key.constant.ts';

const CtaSection: React.FC = () => {
  const navigate = useNavigate();
  
  const handleGetStarted = () => {
    // 检查用户是否已登出
    const hasLoggedOut = localStorage.getItem('Auth:LoggedOut') === 'true';
    const isLoggedIn = sessionStorage.getItem(LOGIN_FLAG_KEY) === 'true';
    
    // 如果已登出或未登录，则不跳转到应用页面，而是进入登录拦截模式
    if (hasLoggedOut || !isLoggedIn) {
      // 将状态设置为需要登录，App组件会检测并显示登录表单
      navigate('/blank', { state: { requireLogin: true } });
    } else {
      // 已登录用户直接跳转
      navigate('/blank', { state: { from: '/about' } });
    }
  };

  return (
    <section className="pt-32 pb-24 bg-gradient-to-b from-white via-blue-50 to-indigo-50 relative overflow-hidden">
      {/* 顶部波浪过渡 - 与JoinCommunitySection衔接 */}
      <div className="absolute top-0 left-0 right-0 h-32 overflow-hidden -translate-y-1">
        {/* 第一层波浪 */}
        <svg 
          className="absolute bottom-0 left-0 w-full" 
          xmlns="http://www.w3.org/2000/svg" 
          viewBox="0 0 1200 120" 
          preserveAspectRatio="none"
        >
          <path 
            d="M0,0V46.29c47.79,22.2,103.59,32.17,158,28,70.36-5.37,136.33-33.31,206.8-37.5C438.64,32.43,512.34,53.67,583,72.05c69.27,18,138.3,24.88,209.4,13.08,36.15-6,69.85-17.84,104.45-29.34C989.49,25,1113-14.29,1200,52.47V0Z" 
            className="fill-white opacity-20"
          ></path>
        </svg>
        
        {/* 第二层波浪 */}
        <svg 
          className="absolute bottom-0 left-0 w-full" 
          xmlns="http://www.w3.org/2000/svg" 
          viewBox="0 0 1200 120" 
          preserveAspectRatio="none"
        >
          <path 
            d="M0,0V15.81C13,36.92,27.64,56.86,47.69,72.05,99.41,111.27,165,111,224.58,91.58c31.15-10.15,60.09-26.07,89.67-39.8,40.92-19,84.73-46,130.83-49.67,36.26-2.85,70.9,9.42,98.6,31.56,31.77,25.39,62.32,62,103.63,73,40.44,10.79,81.35-6.69,119.13-24.28s75.16-39,116.92-43.05c59.73-5.85,113.28,22.88,168.9,38.84,30.2,8.66,59,6.17,87.09-7.5,22.43-10.89,48-26.93,60.65-49.24V0Z" 
            className="fill-white opacity-40"
          ></path>
        </svg>
        
        {/* 第三层波浪 */}
        <svg 
          className="absolute bottom-0 left-0 w-full" 
          xmlns="http://www.w3.org/2000/svg" 
          viewBox="0 0 1200 120" 
          preserveAspectRatio="none"
        >
          <path 
            d="M0,0V5.63C149.93,59,314.09,71.32,475.83,42.57c43-7.64,84.23-20.12,127.61-26.46,59-8.63,112.48,12.24,165.56,35.4C827.93,77.22,886,95.24,951.2,90c86.53-7,172.46-45.71,248.8-84.81V0Z" 
            className="fill-white"
          ></path>
        </svg>
      </div>
      
      <div className="container mx-auto px-4 pt-12">
        <div className="max-w-5xl mx-auto">
          <div className="bg-gradient-to-r from-blue-600 to-indigo-600 rounded-3xl p-12 md:p-16 shadow-2xl shadow-blue-200/30 relative overflow-hidden">
            {/* 玻璃态模糊效果 */}
            <div className="absolute inset-0 backdrop-blur-[2px]">
              {/* 渐变背景 */}
              <div className="absolute inset-0 bg-gradient-to-br from-blue-500/80 to-indigo-600/90"></div>
              
              {/* 抽象图形 */}
              <div className="absolute top-0 right-0 w-96 h-96 bg-blue-400/20 rounded-full blur-3xl transform translate-x-1/3 -translate-y-1/2"></div>
              <div className="absolute bottom-0 left-0 w-80 h-80 bg-indigo-300/20 rounded-full blur-3xl transform -translate-x-1/3 translate-y-1/2"></div>
              
              {/* 网格图案 */}
              <div className="absolute inset-0 opacity-10">
                <div className="h-full w-full bg-[radial-gradient(#fff_1px,transparent_1px)] [background-size:16px_16px]"></div>
              </div>
            </div>
            
            {/* 内容区域 */}
            <div className="relative z-10 text-center">
              <h2 className="text-3xl md:text-5xl font-bold text-white mb-6 leading-tight">
                重新定义你的AI对话体验
              </h2>
              
              <p className="text-lg md:text-xl text-blue-100 mb-10 max-w-2xl mx-auto">
                加入DrawSee，体验非线性思维的魅力，让AI交流变得更加高效、直观和富有创造力
              </p>
              
              <div className="flex flex-col sm:flex-row items-center justify-center space-y-4 sm:space-y-0 sm:space-x-6">
                <button
                  onClick={handleGetStarted}
                  className="px-8 py-4 rounded-full bg-white text-blue-600 font-medium text-lg shadow-lg shadow-blue-600/20 hover:shadow-blue-500/30 transform hover:-translate-y-1 transition-all duration-300 group"
                >
                  <span className="flex items-center">
                    <span>立即开始使用</span>
                    <svg xmlns="http://www.w3.org/2000/svg" className="h-5 w-5 ml-2 transition-transform duration-300 group-hover:translate-x-1" viewBox="0 0 20 20" fill="currentColor">
                      <path fillRule="evenodd" d="M10.293 5.293a1 1 0 011.414 0l4 4a1 1 0 010 1.414l-4 4a1 1 0 01-1.414-1.414L12.586 11H5a1 1 0 110-2h7.586l-2.293-2.293a1 1 0 010-1.414z" clipRule="evenodd" />
                    </svg>
                  </span>
                </button>
                
                <a
                  href="#features"
                  className="px-8 py-4 rounded-full border-2 border-white/70 text-white font-medium text-lg hover:bg-white/10 transition-colors duration-300"
                >
                  了解更多
                </a>
              </div>
              
              {/* 装饰效果 - 浮动圆点 */}
              <div className="absolute w-8 h-8 rounded-full bg-blue-400/50 blur-sm top-12 right-12 animate-float delay-200"></div>
              <div className="absolute w-6 h-6 rounded-full bg-indigo-300/60 blur-sm bottom-24 left-20 animate-float delay-500"></div>
              <div className="absolute w-10 h-10 rounded-full bg-blue-300/40 blur-sm bottom-16 right-28 animate-float delay-1000"></div>
            </div>
          </div>
          
          {/* 客户标志轮播 */}
          {/* <div className="mt-20 mb-16">
            <p className="text-center text-gray-500 mb-8">全球数千家企业与机构的信任之选</p>
            <div className="flex items-center justify-between opacity-60 grayscale hover:grayscale-0 transition-all duration-500">
              {['Microsoft', 'Google', 'Amazon', 'Tesla', 'Apple'].map((company) => (
                <div key={company} className="px-5">
                  <div className="h-8 flex items-center justify-center">
                    <img 
                      src={`https://placehold.co/120x40/e2e8f0/475569?text=${company}`} 
                      alt={`${company} logo`} 
                      className="h-full object-contain"
                    />
                  </div>
                </div>
              ))}
            </div>
          </div> */}
          
          {/* 附加信息 */}
          <div className="grid grid-cols-1 md:grid-cols-3 gap-8 mt-16">
            <div className="text-center group">
              <div className="w-16 h-16 mx-auto rounded-full bg-blue-100 flex items-center justify-center mb-4 transform transition-transform duration-300 group-hover:scale-110 group-hover:bg-blue-200">
                <svg xmlns="http://www.w3.org/2000/svg" className="h-8 w-8 text-blue-600" fill="none" viewBox="0 0 24 24" stroke="currentColor" strokeWidth={1.5}>
                  <path strokeLinecap="round" strokeLinejoin="round" d="M13 10V3L4 14h7v7l9-11h-7z" />
                </svg>
              </div>
              <h3 className="text-xl font-bold text-gray-800 mb-2">快速上手</h3>
              <p className="text-gray-600">无需复杂设置，简单注册即可开始使用，享受全新AI对话体验</p>
            </div>
            
            <div className="text-center group">
              <div className="w-16 h-16 mx-auto rounded-full bg-blue-100 flex items-center justify-center mb-4 transform transition-transform duration-300 group-hover:scale-110 group-hover:bg-blue-200">
                <svg xmlns="http://www.w3.org/2000/svg" className="h-8 w-8 text-blue-600" fill="none" viewBox="0 0 24 24" stroke="currentColor" strokeWidth={1.5}>
                  <path strokeLinecap="round" strokeLinejoin="round" d="M12 15v2m-6 4h12a2 2 0 002-2v-6a2 2 0 00-2-2H6a2 2 0 00-2 2v6a2 2 0 002 2zm10-10V7a4 4 0 00-8 0v4h8z" />
                </svg>
              </div>
              <h3 className="text-xl font-bold text-gray-800 mb-2">安全可靠</h3>
              <p className="text-gray-600">所有对话内容加密存储，保护您的隐私和知识产权</p>
            </div>
            
            <div className="text-center group">
              <div className="w-16 h-16 mx-auto rounded-full bg-blue-100 flex items-center justify-center mb-4 transform transition-transform duration-300 group-hover:scale-110 group-hover:bg-blue-200">
                <svg xmlns="http://www.w3.org/2000/svg" className="h-8 w-8 text-blue-600" fill="none" viewBox="0 0 24 24" stroke="currentColor" strokeWidth={1.5}>
                  <path strokeLinecap="round" strokeLinejoin="round" d="M7 8h10M7 12h4m1 8l-4-4H5a2 2 0 01-2-2V6a2 2 0 012-2h14a2 2 0 012 2v8a2 2 0 01-2 2h-3l-4 4z" />
                </svg>
              </div>
              <h3 className="text-xl font-bold text-gray-800 mb-2">专业支持</h3>
              <p className="text-gray-600">强大的技术团队提供持续更新和专业支持服务</p>
            </div>
          </div>
        </div>
      </div>
    </section>
  );
};

export default CtaSection; 