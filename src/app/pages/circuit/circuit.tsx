import { useState, useCallback } from 'react';
import { useLocation, useNavigate } from 'react-router-dom';
import { CircuitDesign } from '@/api/types/circuit.types';
import { EnhancedCircuitCanvasWithProvider } from './components/EnhancedCircuitCanvas';
import { ModelType } from '../flow/components/input/FlowInputPanel';
import { Button, Tooltip } from 'antd';
import { BrainCircuit, InfoIcon, Save } from 'lucide-react';
import { SettingOutlined } from '@ant-design/icons';

// 电路分析页面 - 提供电路设计可视化界面
function Circuit() {
  // 获取location，用于获取班级ID
  const location = useLocation();
  const navigate = useNavigate();
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
          <div className="flex items-center">
            <BrainCircuit size={24} className="text-blue-600 mr-2" />
            <div>
              <h1 className="text-xl font-semibold text-gray-800">增强电路设计平台</h1>
              <p className="text-sm text-gray-500">
                {classId ? '班级电路分析学习 - ' : ''}
                点对点连接的专业电路搭建、仿真与分析系统
              </p>
            </div>
          </div>
          
          <div className="flex items-center gap-3">
            <Tooltip title="电路设计指南">
              <Button 
                icon={<InfoIcon size={16} />} 
                type="text"
              >
                指南
              </Button>
            </Tooltip>
            
            <Tooltip title="系统设置">
              <Button 
                icon={<SettingOutlined />} 
                type="text"
              >
                设置
              </Button>
            </Tooltip>
            
            <Button 
              type="primary"
              icon={<Save size={16} />}
              onClick={() => navigate('/circuit/list')}
            >
              我的电路库
            </Button>
          </div>
        </div>
      </div>
      
      {/* 专业级电路设计画布 */}
      <div className="flex-1 overflow-hidden">
        <EnhancedCircuitCanvasWithProvider 
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