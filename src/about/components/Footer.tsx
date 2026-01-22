import React from 'react';

const Footer: React.FC = () => {
  const currentYear = new Date().getFullYear();
  const icpRecord = "ICP 备案号待补充";
  const icpLink = "https://beian.miit.gov.cn/";

  return (
    <footer className="bg-gradient-to-b from-white to-blue-50 relative overflow-hidden">
      {/* 上部波浪装饰 */}
      <div className="absolute top-0 left-0 w-full overflow-hidden">
        <svg 
          className="relative block w-full h-[70px] rotate-180" 
          xmlns="http://www.w3.org/2000/svg" 
          viewBox="0 0 1200 120" 
          preserveAspectRatio="none"
        >
          <path 
            d="M321.39,56.44c58-10.79,114.16-30.13,172-41.86,82.39-16.72,168.19-17.73,250.45-.39C823.78,31,906.67,72,985.66,92.83c70.05,18.48,146.53,26.09,214.34,3V0H0V27.35A600.21,600.21,0,0,0,321.39,56.44Z" 
            className="fill-white"
          ></path>
        </svg>
      </div>
      
      <div className="container mx-auto px-4 pt-20 pb-16">
        {/* CTA区域 */}
        {/* <div className="max-w-4xl mx-auto mb-20 bg-gradient-to-r from-blue-600 to-indigo-600 rounded-2xl p-10 shadow-xl shadow-blue-200/30 text-center relative overflow-hidden">
          
          <div className="absolute inset-0">
            <div className="absolute -right-10 top-10 w-40 h-40 rounded-full bg-blue-500/20 blur-2xl"></div>
            <div className="absolute -left-10 bottom-10 w-40 h-40 rounded-full bg-indigo-500/20 blur-2xl"></div>
          </div>
          
          <div className="relative z-10">
            <h2 className="text-3xl md:text-4xl font-bold text-white mb-4">
              开启思维之旅
            </h2>
            <p className="text-xl text-blue-100 mb-8 max-w-2xl mx-auto">
              重新定义你与AI的交流方式，让每一次对话都成为思维的艺术品
            </p>
            <button 
              onClick={handleStartNow}
              className="px-8 py-3.5 bg-white text-blue-600 font-medium rounded-full shadow-lg shadow-blue-600/20 hover:shadow-blue-600/30 transform hover:translate-y-[-2px] transition-all duration-300"
            >
              立即体验
            </button>
          </div>
        </div> */}
        
        {/* 主要页脚 */}
        <div className="border-t border-blue-100 pt-12">
          <div className="grid grid-cols-1 md:grid-cols-4 gap-10">
            {/* Logo和简介 */}
            <div className="md:col-span-1">
              <h3 className="text-transparent bg-clip-text bg-gradient-to-r from-blue-600 to-indigo-600 text-xl font-bold mb-4">
                DrawSee
              </h3>
              <p className="text-gray-600 mb-6">
                思维的画布，知识的星图
              </p>
              <div className="flex space-x-4">
                <a href="#" className="text-gray-500 hover:text-blue-600 transition-colors">
                  <svg xmlns="http://www.w3.org/2000/svg" className="h-6 w-6" fill="currentColor" viewBox="0 0 24 24">
                    <path d="M24 4.557c-.883.392-1.832.656-2.828.775 1.017-.609 1.798-1.574 2.165-2.724-.951.564-2.005.974-3.127 1.195-.897-.957-2.178-1.555-3.594-1.555-3.179 0-5.515 2.966-4.797 6.045-4.091-.205-7.719-2.165-10.148-5.144-1.29 2.213-.669 5.108 1.523 6.574-.806-.026-1.566-.247-2.229-.616-.054 2.281 1.581 4.415 3.949 4.89-.693.188-1.452.232-2.224.084.626 1.956 2.444 3.379 4.6 3.419-2.07 1.623-4.678 2.348-7.29 2.04 2.179 1.397 4.768 2.212 7.548 2.212 9.142 0 14.307-7.721 13.995-14.646.962-.695 1.797-1.562 2.457-2.549z"></path>
                  </svg>
                </a>
                <a href="#" className="text-gray-500 hover:text-blue-600 transition-colors">
                  <svg xmlns="http://www.w3.org/2000/svg" className="h-6 w-6" fill="currentColor" viewBox="0 0 24 24">
                    <path d="M12 0c-6.626 0-12 5.373-12 12 0 5.302 3.438 9.8 8.207 11.387.599.111.793-.261.793-.577v-2.234c-3.338.726-4.033-1.416-4.033-1.416-.546-1.387-1.333-1.756-1.333-1.756-1.089-.745.083-.729.083-.729 1.205.084 1.839 1.237 1.839 1.237 1.07 1.834 2.807 1.304 3.492.997.107-.775.418-1.305.762-1.604-2.665-.305-5.467-1.334-5.467-5.931 0-1.311.469-2.381 1.236-3.221-.124-.303-.535-1.524.117-3.176 0 0 1.008-.322 3.301 1.23.957-.266 1.983-.399 3.003-.404 1.02.005 2.047.138 3.006.404 2.291-1.552 3.297-1.23 3.297-1.23.653 1.653.242 2.874.118 3.176.77.84 1.235 1.911 1.235 3.221 0 4.609-2.807 5.624-5.479 5.921.43.372.823 1.102.823 2.222v3.293c0 .319.192.694.801.576 4.765-1.589 8.199-6.086 8.199-11.386 0-6.627-5.373-12-12-12z"></path>
                  </svg>
                </a>
              </div>
            </div>
            
            {/* 快速链接 */}
            <div>
              <h4 className="font-medium text-gray-800 mb-4">产品</h4>
              <ul className="space-y-2">
                <li><a href="#features" className="text-gray-600 hover:text-blue-600 transition-colors">功能</a></li>
                <li><a href="#visual" className="text-gray-600 hover:text-blue-600 transition-colors">可视化</a></li>
                <li><a href="#agents" className="text-gray-600 hover:text-blue-600 transition-colors">智能助手</a></li>
                <li><a href="#benefits" className="text-gray-600 hover:text-blue-600 transition-colors">用户价值</a></li>
              </ul>
            </div>
            
            {/* 企业信息 */}
            <div>
              <h4 className="font-medium text-gray-800 mb-4">公司</h4>
              <ul className="space-y-2">
                <li><a href="#" className="text-gray-600 hover:text-blue-600 transition-colors">关于我们</a></li>
                <li><a href="#" className="text-gray-600 hover:text-blue-600 transition-colors">博客</a></li>
                <li><a href="#" className="text-gray-600 hover:text-blue-600 transition-colors">合作伙伴</a></li>
                <li><a href="#" className="text-gray-600 hover:text-blue-600 transition-colors">联系我们</a></li>
              </ul>
            </div>
            
            {/* 法律 */}
            <div>
              <h4 className="font-medium text-gray-800 mb-4">法律</h4>
              <ul className="space-y-2">
                <li><a href="#" className="text-gray-600 hover:text-blue-600 transition-colors">使用条款</a></li>
                <li><a href="#" className="text-gray-600 hover:text-blue-600 transition-colors">隐私政策</a></li>
                <li><a href="#" className="text-gray-600 hover:text-blue-600 transition-colors">Cookie 政策</a></li>
              </ul>
            </div>
          </div>
          
          {/* 版权信息 */}
          <div className="mt-12 pt-8 border-t border-blue-100 text-center text-gray-500 text-sm">
            <p>© {currentYear} DrawSee。保留所有权利。</p>
            <div className="mt-4 flex flex-col items-center gap-3 text-xs text-gray-500">
              <a
                href={icpLink}
                target="_blank"
                rel="noreferrer"
                className="inline-flex items-center gap-2 rounded-full border border-blue-100 bg-white/80 px-4 py-1.5 text-gray-600 shadow-sm shadow-blue-100/40 backdrop-blur transition hover:border-blue-200 hover:text-blue-600"
              >
                <span className="h-1.5 w-1.5 rounded-full bg-blue-500"></span>
                {icpRecord}
              </a>
              <p className="text-gray-400">
                工信部备案信息以官方网站查询为准
              </p>
            </div>
          </div>
        </div>
      </div>
    </footer>
  );
};

export default Footer; 
