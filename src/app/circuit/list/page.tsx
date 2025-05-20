"use client";

import CircuitList from '@/app/pages/circuit/components/CircuitList';
import { ArrowLeft, CircuitBoard } from 'lucide-react';
import { useNavigate } from 'react-router-dom';
import { Button } from 'antd';

/**
 * 电路设计列表页面
 */
export default function CircuitListPage() {
  const navigate = useNavigate();
  
  return (
    <div className="w-full h-full flex flex-col">
      {/* 页面标题栏 */}
      <div className="bg-white border-b border-gray-200 py-4 px-6 shadow-sm">
        <div className="flex items-center justify-between">
          <div className="flex items-center space-x-2">
            <Button 
              type="text" 
              icon={<ArrowLeft size={16} />} 
              onClick={() => navigate('/circuit')}
            >
              返回电路分析
            </Button>
            <div className="h-6 w-px bg-gray-300 mx-2"></div>
            <div className="flex items-center">
              <CircuitBoard className="h-5 w-5 text-blue-600 mr-2" />
              <h1 className="text-xl font-semibold text-gray-800">我的电路库</h1>
            </div>
          </div>
          
          <Button
            type="primary"
            onClick={() => navigate('/circuit')}
          >
            创建新电路
          </Button>
        </div>
      </div>
      
      {/* 主要内容区域 */}
      <div className="flex-1 overflow-auto bg-gray-50">
        <CircuitList />
      </div>
    </div>
  );
} 