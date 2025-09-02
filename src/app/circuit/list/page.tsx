"use client";

import CircuitList from '@/app/pages/circuit/components/CircuitList';
import { ArrowLeft, CircuitBoard, Plus, Search, Filter, ArrowUpDown } from 'lucide-react';
import { useNavigate } from 'react-router-dom';
import { Button, Input, Select, Space, Card } from 'antd';

const { Search: SearchInput } = Input;

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
          
          <div className="flex items-center space-x-2">
            <Button
              type="primary"
              icon={<Plus size={16} />}
              onClick={() => navigate('/circuit/create')}
            >
              创建新电路
            </Button>
          </div>
        </div>
      </div>
      
      {/* 搜索和筛选栏 */}
      <div className="bg-white border-b border-gray-200 px-6 py-3">
        <div className="flex items-center justify-between">
          <div className="flex items-center space-x-4 flex-1">
            <SearchInput
              placeholder="搜索电路设计..."
              allowClear
              style={{ width: 300 }}
              prefix={<Search size={16} />}
            />
            
            <Select
              placeholder="筛选类型"
              style={{ width: 150 }}
              allowClear
              prefix={<Filter size={16} />}
            >
              <Select.Option value="recent">最近创建</Select.Option>
              <Select.Option value="updated">最近更新</Select.Option>
              <Select.Option value="complex">复杂电路</Select.Option>
              <Select.Option value="simple">简单电路</Select.Option>
            </Select>
            
            <Select
              placeholder="排序方式"
              style={{ width: 150 }}
              defaultValue="updated"
              prefix={<ArrowUpDown size={16} />}
            >
              <Select.Option value="updated">更新时间</Select.Option>
              <Select.Option value="created">创建时间</Select.Option>
              <Select.Option value="name">名称</Select.Option>
              <Select.Option value="complexity">复杂度</Select.Option>
            </Select>
          </div>
          
          <div className="flex items-center space-x-2">
            <Button icon={<Filter size={16} />}>
              高级筛选
            </Button>
          </div>
        </div>
      </div>
      
      {/* 主要内容区域 */}
      <div className="flex-1 overflow-auto bg-gray-50">
        <CircuitList />
      </div>
    </div>
  );
} 