import { useState, useCallback, useEffect } from 'react';
import { useNavigate } from 'react-router-dom';
import { toast } from 'sonner';
import { analyzeCircuit } from '@/api/methods/tool.methods';
import { CircuitAnalysisDTO, CircuitDesign, CircuitAnalysisResult } from '@/api/types/circuit.types';
import CircuitCanvas from './components/CircuitCanvas';

// 电路分析页面
function Circuit() {
  const navigate = useNavigate();
  const [analyzing, setAnalyzing] = useState(false);
  const [circuitDesign, setCircuitDesign] = useState<CircuitDesign | null>(null);
  const [analysisResult, setAnalysisResult] = useState<CircuitAnalysisResult | null>(null);
  
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
      
      // 设置分析结果
      setAnalysisResult(result as unknown as CircuitAnalysisResult);
      
      // 创建AI任务，显示分析结果
      const prompt = `请分析以下电路设计:\n${JSON.stringify({
        elements: circuitDesign.elements.length,
        connections: circuitDesign.connections.length,
        metadata: circuitDesign.metadata
      }, null, 2)}`;
      
      // 成功提示
      toast.success('电路分析完成');
      
      // 跳转到对话页面展示结果
      navigate('/blank', {
        state: {
          agentType: 'circuit-analyze',
          agentName: '电路分析',
          circuitResult: result,
          circuitDesign
        }
      });
      
    } catch (error) {
      console.error('电路分析失败', error);
      toast.error('电路分析失败，请重试');
    } finally {
      setAnalyzing(false);
    }
  }, [circuitDesign, analyzing, navigate]);
  
  // 更新电路设计数据
  const handleCircuitDesignChange = useCallback((design: CircuitDesign) => {
    setCircuitDesign(design);
  }, []);
  
  return (
    <div className="w-full h-full bg-white flex flex-col">
      {/* 页面标题区域 */}
      <div className="bg-white border-b border-neutral-100 py-4 px-6 flex justify-between items-center">
        <div>
          <h1 className="text-xl font-semibold text-neutral-800">AI电子电路分析</h1>
          <p className="text-sm text-neutral-500">设计电路并获取AI智能分析</p>
        </div>
        
        {/* 控制按钮 */}
        <div className="flex gap-3">
          <button 
            onClick={handleAnalyzeCircuit}
            disabled={analyzing || !circuitDesign}
            className={`px-4 py-2 rounded-lg text-sm font-medium transition-all
              ${analyzing || !circuitDesign 
                ? 'bg-neutral-100 text-neutral-400 cursor-not-allowed' 
                : 'bg-blue-600 text-white hover:bg-blue-700'}`}
          >
            {analyzing ? (
              <>
                <span className="inline-block w-4 h-4 border-2 border-white/20 border-t-white/80 rounded-full animate-spin mr-2"></span>
                分析中...
              </>
            ) : '开始分析'}
          </button>
        </div>
      </div>
      
      {/* 主要内容区域 */}
      <div className="flex-1 overflow-hidden">
        <CircuitCanvas onCircuitDesignChange={handleCircuitDesignChange} />
      </div>
    </div>
  );
}

export default Circuit;