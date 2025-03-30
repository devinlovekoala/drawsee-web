import { useState } from 'react';
import CircuitAnalysisModal from '../modal/CircuitAnalysisModal';
import { toast } from 'sonner';

const CircuitTest = () => {
  const [isModalOpen, setIsModalOpen] = useState(false);

  const handleSubmit = (circuitId: string, prompt: string) => {
    toast.success(`电路分析请求已提交: ID=${circuitId}, 提示=${prompt}`);
    console.log('电路分析请求已提交:', { circuitId, prompt });
  };

  return (
    <div className="p-4">
      <h1 className="text-xl font-bold mb-4">电路分析测试</h1>
      <button
        className="px-4 py-2 bg-blue-600 text-white rounded hover:bg-blue-700"
        onClick={() => setIsModalOpen(true)}
      >
        打开电路分析模态框
      </button>
      
      <CircuitAnalysisModal
        isOpen={isModalOpen}
        onClose={() => setIsModalOpen(false)}
        onSubmit={handleSubmit}
      />
    </div>
  );
};

export default CircuitTest;