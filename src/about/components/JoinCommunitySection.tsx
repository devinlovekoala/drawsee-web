import React from 'react';

const JoinCommunitySection: React.FC = () => {
  // 模拟跳转到调查问卷链接
  const handleSurveyClick = () => {
    window.open('https://bcn290wiug78.feishu.cn/wiki/WU52wMMHxiEMjpkw8Q2cSUbFnue?table=tblFLOETx53shMgQ&view=vewQ0UxN3f', '_blank');
  };
  
  // 模拟展示微信群二维码
  const handleWechatClick = () => {
    // 这里可以实现显示微信群二维码的弹窗逻辑
    window.open('https://bcn290wiug78.feishu.cn/wiki/PzKTwSmV6ip8sNkUjlockw5NnTd', '_blank');
  };
  
  return (
    <section className="bg-white py-20 overflow-hidden relative">
      <div className="container mx-auto px-4">
        {/* 标题 */}
        <div className="text-center mb-16">
          <h2 className="text-3xl md:text-4xl font-bold mb-6">
            <span className="text-transparent bg-clip-text bg-gradient-to-r from-blue-600 to-indigo-600">
              加入我们！成为昭析共建者
            </span>
          </h2>
          <p className="text-xl text-gray-600 max-w-3xl mx-auto">
            我们相信集体智慧的力量。加入昭析共建者社区，分享您的想法，
            参与产品讨论，一起定义思维可视化的未来！
          </p>
        </div>
        
        {/* 共建者卡片 */}
        <div className="max-w-4xl mx-auto mb-24 bg-gradient-to-r from-indigo-50 to-blue-50 rounded-2xl p-10 shadow-xl relative overflow-hidden transform transition-all duration-500 hover:translate-y-[-5px] hover:shadow-2xl">
          {/* 装饰背景 */}
          <div className="absolute -right-10 top-10 w-40 h-40 rounded-full bg-indigo-300/20 blur-3xl"></div>
          <div className="absolute -left-10 bottom-10 w-40 h-40 rounded-full bg-blue-300/20 blur-3xl"></div>
          
          <div className="relative z-10">
            <div className="grid md:grid-cols-2 gap-8 mb-10">
              <div className="bg-white/80 backdrop-blur-sm rounded-xl p-6 shadow-lg border border-indigo-100 transition-all duration-300 hover:shadow-xl hover:bg-white/90">
                <div className="text-indigo-600 text-xl font-semibold mb-4">提供反馈</div>
                <p className="text-gray-700 mb-4">
                  您的每一个建议都是昭析成长的动力。分享您的使用体验和改进意见，帮助我们打造更好的产品。
                </p>
                <button 
                  onClick={handleSurveyClick}
                  className="px-6 py-2.5 bg-gradient-to-r from-blue-600 to-indigo-600 text-white font-medium rounded-lg shadow-md hover:shadow-lg transform hover:translate-y-[-2px] transition-all duration-300"
                >
                  填写反馈问卷
                </button>
              </div>
              
              <div className="bg-white/80 backdrop-blur-sm rounded-xl p-6 shadow-lg border border-indigo-100 transition-all duration-300 hover:shadow-xl hover:bg-white/90">
                <div className="text-indigo-600 text-xl font-semibold mb-4">加入社区</div>
                <p className="text-gray-700 mb-4">
                  与志同道合的思考者交流，分享使用技巧，讨论功能需求，一起探索昭析的无限可能。
                </p>
                <button 
                  onClick={handleWechatClick}
                  className="px-6 py-2.5 bg-white text-indigo-600 font-medium rounded-lg border border-indigo-200 shadow-md hover:shadow-lg hover:border-indigo-300 transform hover:translate-y-[-2px] transition-all duration-300"
                >
                  加入微信社群
                </button>
              </div>
            </div>
            
            <div className="text-center">
              <p className="text-gray-600 italic">
                "每一个伟大的产品，都是用户与创造者共同塑造的艺术品"
              </p>
              <div className="mt-4 inline-flex items-center justify-center">
                <div className="flex -space-x-2">
                  {[1, 2, 3, 4, 5].map((i) => (
                    <div key={i} className="w-8 h-8 rounded-full border-2 border-white overflow-hidden transform transition-transform hover:scale-110 hover:z-10">
                      <img 
                        src={`https://randomuser.me/api/portraits/${i % 2 === 0 ? 'women' : 'men'}/${20 + i * 10}.jpg`} 
                        alt="社区成员" 
                        className="w-full h-full object-cover"
                      />
                    </div>
                  ))}
                </div>
                <div className="ml-3 text-indigo-600 font-medium">加入 100+ 共建者</div>
              </div>
            </div>
          </div>
        </div>
        
        {/* 社区统计数据 */}
        <div className="max-w-5xl mx-auto grid grid-cols-2 md:grid-cols-4 gap-8 mb-16">
          <div className="text-center">
            <div className="text-3xl md:text-4xl font-bold text-blue-600 mb-2">2000+</div>
            <div className="text-gray-600">活跃用户</div>
          </div>
          <div className="text-center">
            <div className="text-3xl md:text-4xl font-bold text-indigo-600 mb-2">500+</div>
            <div className="text-gray-600">功能建议</div>
          </div>
          <div className="text-center">
            <div className="text-3xl md:text-4xl font-bold text-blue-600 mb-2">50+</div>
            <div className="text-gray-600">社区活动</div>
          </div>
          <div className="text-center">
            <div className="text-3xl md:text-4xl font-bold text-indigo-600 mb-2">12</div>
            <div className="text-gray-600">版本迭代</div>
          </div>
        </div>
      </div>
      
      {/* 底部波浪过渡 - 与CtaSection衔接 */}
      <div className="absolute bottom-0 left-0 right-0 h-24 overflow-hidden">
        {/* 第一层波浪 */}
        <svg 
          className="absolute top-0 left-0 w-full" 
          xmlns="http://www.w3.org/2000/svg" 
          viewBox="0 0 1200 120" 
          preserveAspectRatio="none"
        >
          <path 
            d="M321.39,56.44c58-10.79,114.16-30.13,172-41.86,82.39-16.72,168.19-17.73,250.45-.39C823.78,31,906.67,72,985.66,92.83c70.05,18.48,146.53,26.09,214.34,3V0H0V27.35A600.21,600.21,0,0,0,321.39,56.44Z" 
            className="fill-[#EBF5FF] opacity-30"
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
            d="M985.66,92.83C906.67,72,823.78,31,743.84,14.19c-82.26-17.34-168.06-16.33-250.45.39-57.84,11.73-114,31.07-172,41.86A600.21,600.21,0,0,1,0,27.35V120H1200V95.8C1132.19,118.92,1055.71,111.31,985.66,92.83Z" 
            className="fill-[#EBF5FF] opacity-60"
          ></path>
        </svg>
      </div>
    </section>
  );
};

export default JoinCommunitySection; 