import React from 'react';
import { Link } from 'react-router-dom';

const Footer: React.FC = () => {
  return (
    <footer className="bg-gray-50 border-t border-gray-200 py-8">
      <div className="container mx-auto px-4">
        <div className="grid grid-cols-1 md:grid-cols-4 gap-8">
          <div>
            <h3 className="text-sm font-semibold text-gray-900 mb-4">关于我们</h3>
            <ul className="space-y-3">
              <li>
                <Link to="/about" className="text-sm text-gray-600 hover:text-blue-600">
                  公司介绍
                </Link>
              </li>
              <li>
                <Link to="/about#team" className="text-sm text-gray-600 hover:text-blue-600">
                  团队成员
                </Link>
              </li>
              <li>
                <Link to="/about#partners" className="text-sm text-gray-600 hover:text-blue-600">
                  合作伙伴
                </Link>
              </li>
            </ul>
          </div>
          
          <div>
            <h3 className="text-sm font-semibold text-gray-900 mb-4">产品服务</h3>
            <ul className="space-y-3">
              <li>
                <Link to="/courses" className="text-sm text-gray-600 hover:text-blue-600">
                  课程体系
                </Link>
              </li>
              <li>
                <Link to="/flow" className="text-sm text-gray-600 hover:text-blue-600">
                  AI对话
                </Link>
              </li>
            </ul>
          </div>
          
          <div>
            <h3 className="text-sm font-semibold text-gray-900 mb-4">帮助中心</h3>
            <ul className="space-y-3">
              <li>
                <Link to="/faq" className="text-sm text-gray-600 hover:text-blue-600">
                  常见问题
                </Link>
              </li>
              <li>
                <Link to="/contact" className="text-sm text-gray-600 hover:text-blue-600">
                  联系我们
                </Link>
              </li>
            </ul>
          </div>
          
          <div>
            <h3 className="text-sm font-semibold text-gray-900 mb-4">关注我们</h3>
            <div className="flex space-x-4">
              <a href="#" className="text-gray-600 hover:text-blue-600">
                <span className="sr-only">微信</span>
                <svg className="h-6 w-6" fill="currentColor" viewBox="0 0 24 24">
                  <path d="M12 2C6.48 2 2 6.48 2 12s4.48 10 10 10 10-4.48 10-10S17.52 2 12 2zm0 18c-4.41 0-8-3.59-8-8s3.59-8 8-8 8 3.59 8 8-3.59 8-8 8z"/>
                </svg>
              </a>
              <a href="#" className="text-gray-600 hover:text-blue-600">
                <span className="sr-only">微博</span>
                <svg className="h-6 w-6" fill="currentColor" viewBox="0 0 24 24">
                  <path d="M12 2C6.48 2 2 6.48 2 12s4.48 10 10 10 10-4.48 10-10S17.52 2 12 2zm0 18c-4.41 0-8-3.59-8-8s3.59-8 8-8 8 3.59 8 8-3.59 8-8 8z"/>
                </svg>
              </a>
            </div>
          </div>
        </div>
        
        <div className="mt-8 pt-6 border-t border-gray-200">
          <p className="text-sm text-gray-500 text-center">
            &copy; {new Date().getFullYear()} Drawsee 绘视科技. 保留所有权利.
          </p>
        </div>
      </div>
    </footer>
  );
};

export default Footer;