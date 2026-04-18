import React, { useState, useEffect } from 'react';
import { useNavigate } from 'react-router-dom';
import Logo from '../../assets/svg/昭析.svg';
import { LOGIN_FLAG_KEY } from '@/common/constant/storage-key.constant.ts';

const NavBar: React.FC = () => {
  const [isScrolled, setIsScrolled] = useState(false);
  const [isMobileMenuOpen, setIsMobileMenuOpen] = useState(false);
  const navigate = useNavigate();

  // 监听滚动事件，用于改变导航栏样式
  useEffect(() => {
    const handleScroll = () => {
      setIsScrolled(window.scrollY > 10);
    };
    
    window.addEventListener('scroll', handleScroll);
    return () => window.removeEventListener('scroll', handleScroll);
  }, []);

  const handleLogin = () => {
    // 检查用户是否已登出
    const hasLoggedOut = localStorage.getItem('Auth:LoggedOut') === 'true';
    const isLoggedIn = sessionStorage.getItem(LOGIN_FLAG_KEY) === 'true';
    
    // 如果已登出或未登录，则不跳转到应用页面，而是进入登录拦截模式
    if (hasLoggedOut || !isLoggedIn) {
      // 将状态设置为需要登录，App组件会检测并显示登录表单
      navigate('/blank', { state: { requireLogin: true, loginRequestId: Date.now() } });
    } else {
      // 已登录用户直接跳转
      navigate('/blank', { state: { from: '/about' } });
    }
  };

  return (
    <header className={`fixed top-0 left-0 right-0 z-50 transition-all duration-300 ${
      isScrolled 
        ? 'py-2 bg-white/80 backdrop-blur-lg shadow-sm' 
        : 'py-4 bg-transparent'
    }`}>
      <div className="container mx-auto px-4 flex items-center justify-between">
        {/* Logo */}
        <div className="flex items-center gap-2 select-none">
          <img src={Logo} alt="DrawSee Logo" className="h-10 w-10" />
          <div className="text-transparent bg-clip-text bg-gradient-to-r from-blue-600 to-indigo-600 text-2xl font-bold">
            昭析
          </div>
        </div>

        {/* Desktop Navigation */}
        <nav className="hidden md:flex items-center space-x-8">
          <a href="#features" className="text-gray-700 hover:text-blue-600 transition-colors duration-300">
            功能
          </a>
          <a href="#visual" className="text-gray-700 hover:text-blue-600 transition-colors duration-300">
            可视化
          </a>
          <a href="#agents" className="text-gray-700 hover:text-blue-600 transition-colors duration-300">
            交互方案
          </a>
          <a href="#benefits" className="text-gray-700 hover:text-blue-600 transition-colors duration-300">
            价值
          </a>
        </nav>

        {/* 登录/注册按钮 */}
        <div className="hidden md:flex items-center">
          <button
            onClick={handleLogin}
            className="px-6 py-2.5 rounded-full bg-gradient-to-r from-blue-500 to-indigo-600 text-white font-medium shadow-lg shadow-blue-500/20 hover:shadow-blue-500/40 transform hover:translate-y-[-2px] transition-all duration-300"
          >
            立即体验
          </button>
        </div>

        {/* 移动端汉堡菜单 */}
        <button 
          className="md:hidden text-gray-700 focus:outline-none"
          onClick={() => setIsMobileMenuOpen(!isMobileMenuOpen)}
        >
          <svg 
            xmlns="http://www.w3.org/2000/svg" 
            className="h-6 w-6" 
            fill="none" 
            viewBox="0 0 24 24" 
            stroke="currentColor"
          >
            {isMobileMenuOpen ? (
              <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M6 18L18 6M6 6l12 12" />
            ) : (
              <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M4 6h16M4 12h16m-7 6h7" />
            )}
          </svg>
        </button>
      </div>

      {/* 移动端菜单 */}
      <div className={`md:hidden absolute w-full bg-white/90 backdrop-blur-lg shadow-lg transition-all duration-300 ease-in-out ${
        isMobileMenuOpen ? 'max-h-64 opacity-100 py-4' : 'max-h-0 opacity-0 overflow-hidden'
      }`}>
        <div className="container mx-auto px-6 flex flex-col space-y-4">
          <a href="#features" className="text-gray-700 py-2 hover:text-blue-600">功能</a>
          <a href="#visual" className="text-gray-700 py-2 hover:text-blue-600">可视化</a>
          <a href="#agents" className="text-gray-700 py-2 hover:text-blue-600">交互方案</a>
          <a href="#benefits" className="text-gray-700 py-2 hover:text-blue-600">价值</a>
          <button
            onClick={handleLogin}
            className="px-6 py-2.5 rounded-full bg-gradient-to-r from-blue-500 to-indigo-600 text-white font-medium"
          >
            立即体验
          </button>
        </div>
      </div>
    </header>
  );
};

export default NavBar; 