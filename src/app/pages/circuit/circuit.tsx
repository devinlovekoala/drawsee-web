import { useState, useCallback } from 'react';
import { useLocation } from 'react-router-dom';
import { CircuitDesign } from '@/api/types/circuit.types';
import { CircuitFlowWithProvider } from './components/CircuitFlow';
import { ModelType } from '../flow/components/input/FlowInputPanel';

// 电路分析页面 - 提供电路设计可视化界面
function Circuit() {
  // 获取location，用于获取班级ID
  const location = useLocation();
  const classId = location.state?.classId as string || null;

  // eslint-disable-next-line @typescript-eslint/no-unused-vars
  const [_circuitDesign, setCircuitDesign] = useState<CircuitDesign | null>(null);
  const [selectedModel, setSelectedModel] = useState<ModelType>('deepseekV3'); // 默认使用DeepSeekV3模型
  
  // 更新电路设计数据
  const handleCircuitDesignChange = useCallback((design: CircuitDesign) => {
    setCircuitDesign(design);
  }, []);
  
  // 处理模型切换
  const handleModelChange = useCallback((model: ModelType) => {
    setSelectedModel(model);
  }, []);
  
  return (
    <div className="w-full h-full bg-gray-50 flex flex-col">
      {/* 页面标题区域 */}
      <div className="bg-white border-b border-gray-200 py-4 px-6 shadow-sm">
        <div className="flex items-center justify-between">
          <div>
            <h1 className="text-xl font-semibold text-gray-800">AI电子电路分析</h1>
            <p className="text-sm text-gray-500">
              {classId ? '班级电路分析学习 - ' : ''}
              设计电路并获取AI智能分析
            </p>
          </div>
          
          <div className="text-sm text-gray-500">
            <span className="bg-blue-100 text-blue-800 px-2 py-1 rounded-md font-medium">
              专业版
            </span>
          </div>
        </div>
      </div>
      
      {/* 主要内容区域 */}
      <div className="flex-1 overflow-hidden">
        <CircuitFlowWithProvider 
          onCircuitDesignChange={handleCircuitDesignChange}
          selectedModel={selectedModel}
          classId={classId}
          onModelChange={handleModelChange}
        />
      </div>
    </div>
  );
}

export default Circuit;