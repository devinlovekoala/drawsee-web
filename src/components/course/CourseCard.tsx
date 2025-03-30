import React from 'react';
import { UserIcon } from 'lucide-react';

interface CourseCardProps {
  title: string;
  description: string;
  author: string;
  studentCount: number;
  onClick: () => void;
}

export const CourseCard: React.FC<CourseCardProps> = ({
  title,
  description,
  author,
  studentCount,
  onClick
}) => {
  return (
    <div 
      className="bg-white rounded-xl shadow-md overflow-hidden hover:shadow-lg transition-shadow cursor-pointer border border-gray-200"
      onClick={onClick}
    >
      <div className="p-6">
        <div className="flex justify-between items-start">
          <h3 className="text-xl font-semibold text-gray-900 mb-2">{title}</h3>
          <div className="flex items-center text-gray-500 text-sm">
            <UserIcon className="w-4 h-4 mr-1" />
            <span>{studentCount}</span>
          </div>
        </div>
        
        <p className="text-gray-600 mb-4 line-clamp-2">{description}</p>
        
        <div className="flex items-center text-gray-500 text-sm">
          <span className="font-medium">作者: {author}</span>
        </div>
      </div>
      
      <div className="bg-blue-50 px-6 py-2">
        <div className="flex justify-between items-center">
          <span className="text-blue-600 text-sm font-medium">点击进入</span>
          <svg className="w-4 h-4 text-blue-600" fill="none" stroke="currentColor" viewBox="0 0 24 24" xmlns="http://www.w3.org/2000/svg">
            <path strokeLinecap="round" strokeLinejoin="round" strokeWidth="2" d="M14 5l7 7m0 0l-7 7m7-7H3"></path>
          </svg>
        </div>
      </div>
    </div>
  );
}; 