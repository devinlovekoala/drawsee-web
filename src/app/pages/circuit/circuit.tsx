import { useState, useCallback, useEffect } from 'react';
import { useNavigate } from 'react-router-dom';
import { toast } from 'sonner';
import { analyzeCircuit } from '@/api/methods/tool.methods';
import { CircuitAnalysisDTO, CircuitDesign, CircuitAnalysisResult } from '@/api/types/circuit.types';
import { CreateAiTaskDTO } from '@/api/types/flow.types';
import { CircuitFlowWithProvider } from './components/CircuitFlow';
import { useAppContext } from '@/app/contexts/AppContext';
import { createAiTask } from '@/api/methods/flow.methods';
import { ModelSelector } from '../blank/components/ModelSelector';
import { ModelType } from '../flow/components/input/FlowInputPanel';

// 电路分析页面
function Circuit() {
  const navigate = useNavigate();
  const [analyzing, setAnalyzing] = useState(false);
  const [circuitDesign, setCircuitDesign] = useState<CircuitDesign | null>(null);
  const [selectedModel, setSelectedModel] = useState<ModelType>('doubao'); // 默认使用豆包模型
  const { handleBlankQuery, handleAiTaskCountPlus } = useAppContext();
  
  // 处理电路分析请求
  const handleAnalyzeCircuit = useCallback(async () => {
    if (!circuitDesign) {
      toast.error('请先设计电路');
      return;
    }
    
    if (analyzing) {
      return;
    }
    
    try {
      setAnalyzing(true);
      
      // 创建分析请求DTO
      const circuitAnalysisDTO: CircuitAnalysisDTO = {
        circuitDesign
      };
      
      // 发送分析请求
      const result = await analyzeCircuit(circuitAnalysisDTO);
      
      // 生成电路分析描述，作为AI任务的prompt
      const prompt = `请分析以下电路设计:\n${JSON.stringify({
        elements: circuitDesign.elements.length,
        connections: circuitDesign.connections.length,
        metadata: circuitDesign.metadata
      }, null, 2)}`;
      
      // 创建AI任务
      const createAiTaskDTO: CreateAiTaskDTO = {
        type: 'CIRCUIT_ANALYZE',
        prompt: prompt,
        promptParams: {
          // 传递一些需要的参数
          elementCount: circuitDesign.elements.length.toString(),
          connectionCount: circuitDesign.connections.length.toString(),
          // 将整个分析结果作为JSON字符串传递给后端
          analysisResult: JSON.stringify(result)
        },
        convId: null,
        parentId: null,
        model: selectedModel // 使用用户选定的模型
      };
      
      console.log('发送电路分析AI任务', createAiTaskDTO);
      
      // 创建AI任务并获取结果
      const response = await createAiTask(createAiTaskDTO);
      
      // 计数+1
      handleAiTaskCountPlus();
      
      // 成功提示
      toast.success('电路分析完成');
      
      // 跳转到Flow页面展示结果
      handleBlankQuery(response);
      
    } catch (error) {
      console.error('电路分析失败', error);
      toast.error('电路分析失败，请重试');
    } finally {
      setAnalyzing(false);
    }
  }, [circuitDesign, analyzing, handleBlankQuery, handleAiTaskCountPlus, selectedModel]);
  
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
        <CircuitFlowWithProvider onCircuitDesignChange={handleCircuitDesignChange} />
      </div>
    </div>
  );
}

export default Circuit;