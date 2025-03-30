import { useState, useEffect, useCallback } from 'react';
import { useCircuitStore } from '../../../stores/useCircuitStore';
import CircuitCanvas from '../canvas/circuit-canvas';
import ComponentPalette from '../toolbar/component-palette';
import { saveCircuitDesign, startAnalysis } from '../../../api/circuit/circuit-api';
import { toast } from 'sonner';
import { AiTaskType } from '@/api/types/flow.types';

interface CircuitAnalysisModalProps {
  isOpen: boolean;
  onClose: () => void;
  onSubmit: (circuitId: string, prompt: string) => void;
}

const CircuitAnalysisModal = ({ isOpen, onClose, onSubmit }: CircuitAnalysisModalProps) => {
  const [isSubmitting, setIsSubmitting] = useState(false);
  const [analysisPrompt, setAnalysisPrompt] = useState('');
  const { elements, connections, actions } = useCircuitStore();
  
  // 当模态框关闭时重置状态
  useEffect(() => {
    if (!isOpen) {
      actions.clearAll();
      setAnalysisPrompt('');
      setIsSubmitting(false);
    }
  }, [isOpen, actions]);

  const handleSubmit = useCallback(async () => {
    // 验证电路是否有组件
    if (elements.length === 0) {
      toast.error('请先在画布上添加电路元件');
      return;
    }

    // 验证是否有连接
    if (connections.length === 0) {
      toast.error('请连接电路元件');
      return;
    }

    // 验证是否有分析提示
    if (!analysisPrompt.trim()) {
      toast.error('请输入电路分析需求');
      return;
    }

    try {
      setIsSubmitting(true);
      
      // 准备电路设计数据
      const circuitDesign = {
        elements,
        connections,
        metadata: {
          title: `电路分析 - ${new Date().toLocaleString()}`,
          description: analysisPrompt,
          createdAt: new Date().toISOString(),
          updatedAt: new Date().toISOString()
        }
      };

      // 保存电路设计
      const saveResponse = await saveCircuitDesign(circuitDesign);
      const circuitId = saveResponse.circuit_id;
      
      // 启动分析
      await startAnalysis(circuitId);
      
      // 调用onSubmit，将电路分析请求提交到对话系统
      onSubmit(circuitId, analysisPrompt);
      
      // 关闭模态框
      onClose();
      
      // 清空状态
      actions.clearAll();
      setAnalysisPrompt('');
    } catch (error) {
      console.error('电路分析提交失败:', error);
      toast.error('电路分析提交失败，请重试');
    } finally {
      setIsSubmitting(false);
    }
  }, [elements, connections, analysisPrompt, actions, onClose, onSubmit]);

  if (!isOpen) return null;

  return (
    <div className="fixed inset-0 bg-black bg-opacity-50 flex items-center justify-center z-50">
      <div className="bg-white rounded-lg shadow-xl w-[90vw] h-[85vh] max-w-7xl flex flex-col">
        {/* 模态框头部 */}
        <div className="flex items-center justify-between p-4 border-b">
          <h2 className="text-xl font-bold text-gray-800">电路分析画板</h2>
          <button 
            className="text-gray-500 hover:text-gray-700"
            onClick={onClose}
          >
            <svg xmlns="http://www.w3.org/2000/svg" className="h-6 w-6" fill="none" viewBox="0 0 24 24" stroke="currentColor">
              <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M6 18L18 6M6 6l12 12" />
            </svg>
          </button>
        </div>
        
        {/* 工具栏 */}
        <div className="p-4 border-b bg-gray-50">
          <ComponentPalette className="w-full" />
        </div>
        
        {/* 画布区域 */}
        <div className="flex-1 overflow-hidden">
          <CircuitCanvas />
        </div>
        
        {/* 底部输入和提交区域 */}
        <div className="p-4 border-t bg-gray-50">
          <div className="flex items-center gap-4">
            <div className="flex-1">
              <input
                type="text"
                className="w-full px-4 py-2 border border-gray-300 rounded-md focus:outline-none focus:ring-2 focus:ring-blue-500 focus:border-blue-500"
                placeholder="请输入电路分析需求，例如：分析这个RC电路的频率响应..."
                value={analysisPrompt}
                onChange={(e) => setAnalysisPrompt(e.target.value)}
              />
            </div>
            <button
              className={`px-6 py-2 rounded bg-blue-600 hover:bg-blue-700 text-white transition-colors ${isSubmitting ? 'opacity-50 cursor-not-allowed' : ''}`}
              onClick={handleSubmit}
              disabled={isSubmitting}
            >
              {isSubmitting ? '提交中...' : '提交分析'}
            </button>
          </div>
        </div>
      </div>
    </div>
  );
};

export default CircuitAnalysisModal;