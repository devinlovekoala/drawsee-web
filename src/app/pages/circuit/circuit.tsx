import { useState, useCallback } from 'react';
import { CircuitDesign } from '@/api/types/circuit.types';
import { CircuitFlowWithProvider } from './components/CircuitFlow';
import { ModelSelector } from '../blank/components/ModelSelector';
import { ModelType } from '../flow/components/input/FlowInputPanel';

// 电路分析页面 - 提供电路设计可视化界面
function Circuit() {
  const [circuitDesign, setCircuitDesign] = useState<CircuitDesign | null>(null);
  const [selectedModel, setSelectedModel] = useState<ModelType>('doubao'); // 默认使用豆包模型
  
  // 更新电路设计数据
  const handleCircuitDesignChange = useCallback((design: CircuitDesign) => {
    setCircuitDesign(design);
  }, []);
  
  // 处理模型变更
  const handleModelChange = useCallback((model: ModelType) => {
    setSelectedModel(model);
  }, []);
  
  return (
    <div className="w-full h-full bg-white flex flex-col">
      {/* 页面标题区域 */}
      <div className="bg-white border-b border-neutral-100 py-4 px-6 flex justify-between items-center">
        <div>
          <h1 className="text-xl font-semibold text-neutral-800">AI电子电路分析</h1>
          <p className="text-sm text-neutral-500">设计电路并获取AI智能分析</p>
        </div>
        
        {/* 模型选择器 - 使用更紧凑的样式 */}
        <div className="w-60">
          <ModelSelector selectedModel={selectedModel} onModelChange={handleModelChange} />
        </div>
      </div>
      
      {/* 主要内容区域 */}
      <div className="flex-1 overflow-hidden">
        <CircuitFlowWithProvider 
          onCircuitDesignChange={handleCircuitDesignChange}
          selectedModel={selectedModel}
        />
      </div>
    </div>
  );
}

export default Circuit;