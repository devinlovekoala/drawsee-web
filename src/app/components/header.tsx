import React from 'react';
import { Link, useNavigate } from 'react-router-dom';

const Header: React.FC = () => {
  const navigate = useNavigate();
  
  return (
    <header className="sticky top-0 z-40 w-full bg-white border-b border-gray-200">
      <div className="container mx-auto px-4 py-3 flex justify-between items-center">
        <div className="flex items-center">
          <Link to="/" className="flex items-center space-x-2">
            <img src="/logo.svg" alt="Drawsee Logo" className="h-8 w-auto" />
            <span className="text-xl font-bold text-gray-900">Drawsee</span>
          </Link>
        </div>
        
        <nav className="hidden md:flex space-x-8">
          <Link to="/courses" className="text-gray-700 hover:text-blue-600 font-medium">
            课程
          </Link>
          <Link to="/flow" className="text-gray-700 hover:text-blue-600 font-medium">
            对话
          </Link>
          <Link to="/about" className="text-gray-700 hover:text-blue-600 font-medium">
            关于我们
          </Link>
        </nav>
        
        <div className="flex items-center space-x-4">
          <button 
            onClick={() => navigate('/profile')}
            className="text-sm font-medium text-gray-700 hover:text-blue-600"
          >
            用户中心
          </button>
          <button
            className="px-4 py-2 rounded-md bg-blue-600 text-white text-sm font-medium hover:bg-blue-700 transition-colors"
            onClick={() => navigate('/flow')}
          >
            开始对话
          </button>
        </div>
      </div>
    </header>
  );
};

export default Header;