import { useState, useCallback, useEffect } from 'react';
import { useLocation, useNavigate } from 'react-router-dom';
import { CircuitDesign } from '@/api/types/circuit.types';
import { CircuitFlowWithProvider } from './components/CircuitFlow';
import { ModelType } from '../flow/components/input/FlowInputPanel';
import { Button, Tooltip, Modal } from 'antd';
import { BrainCircuit, InfoIcon, Save, Cpu } from 'lucide-react';

interface NavigationEvent {
  path: string;
  state?: any;
  callback?: (canProceed: boolean) => void;
}

// 电路分析页面 - 提供电路设计可视化界面
function Circuit() {
  // 获取location，用于获取班级ID
  const location = useLocation();
  const navigate = useNavigate();
  const classId = location.state?.classId as string || null;

  // eslint-disable-next-line @typescript-eslint/no-unused-vars
  const [_circuitDesign, setCircuitDesign] = useState<CircuitDesign | null>(null);
  const [selectedModel, setSelectedModel] = useState<ModelType>('deepseekV3'); // 默认使用DeepSeekV3模型
  const [hasUnsavedChanges, setHasUnsavedChanges] = useState(false);
  const [pendingNavigation, setPendingNavigation] = useState<NavigationEvent | null>(null);
  const [unsavedModalVisible, setUnsavedModalVisible] = useState(false);
  
  // 更新电路设计数据
  const handleCircuitDesignChange = useCallback((design: CircuitDesign) => {
    setCircuitDesign(design);
  }, []);
  
  // 处理模型切换
  const handleModelChange = useCallback((model: ModelType) => {
    setSelectedModel(model);
  }, []);

  const handleGuardedNavigation = useCallback((path: string, state?: any, callback?: (canProceed: boolean) => void) => {
    if (hasUnsavedChanges) {
      setPendingNavigation({ path, state, callback });
      setUnsavedModalVisible(true);
      return false;
    }
    if (callback) {
      callback(true);
    } else {
      navigate(path, { state });
    }
    return true;
  }, [hasUnsavedChanges, navigate]);

  const confirmNavigation = useCallback(() => {
    if (pendingNavigation?.callback) {
      pendingNavigation.callback(true);
    } else if (pendingNavigation?.path) {
      navigate(pendingNavigation.path, { state: pendingNavigation.state });
    }
    setPendingNavigation(null);
    setUnsavedModalVisible(false);
  }, [navigate, pendingNavigation]);

  const cancelNavigation = useCallback(() => {
    if (pendingNavigation?.callback) {
      pendingNavigation.callback(false);
    }
    setPendingNavigation(null);
    setUnsavedModalVisible(false);
  }, [pendingNavigation]);

  useEffect(() => {
    const handleAppNavigation = (event: CustomEvent<NavigationEvent>) => {
      const { path, state, callback } = event.detail;
      if (hasUnsavedChanges) {
        event.preventDefault();
        handleGuardedNavigation(path, state, callback);
      } else if (callback) {
        callback(true);
      }
    };
    document.addEventListener('app:navigation-request', handleAppNavigation as EventListener);
    return () => {
      document.removeEventListener('app:navigation-request', handleAppNavigation as EventListener);
    };
  }, [hasUnsavedChanges, handleGuardedNavigation]);

  useEffect(() => {
    const handleBeforeUnload = (event: BeforeUnloadEvent) => {
      if (!hasUnsavedChanges) return;
      event.preventDefault();
      event.returnValue = '';
    };
    window.addEventListener('beforeunload', handleBeforeUnload);
    return () => window.removeEventListener('beforeunload', handleBeforeUnload);
  }, [hasUnsavedChanges]);
  
  return (
    <div className="w-full h-full bg-gray-50 flex flex-col">
      {/* 页面标题区域 */}
      <div className="bg-white border-b border-gray-200 py-4 px-6 shadow-sm">
        <div className="flex items-center justify-between">
          <div className="flex items-center">
            <BrainCircuit size={24} className="text-blue-600 mr-2" />
            <div>
              <h1 className="text-xl font-semibold text-gray-800">电路智能分析</h1>
              <p className="text-sm text-gray-500">
                {classId ? '班级电路分析学习 - ' : ''}
                设计电路并获取AI智能分析
              </p>
            </div>
          </div>
          
          <div className="flex items-center gap-3">
            <Tooltip title="保存的电路设计会显示在电路库中，您可以随时查看和编辑">
              <Button 
                icon={<InfoIcon size={16} />} 
                type="text"
              >
                帮助
              </Button>
            </Tooltip>
            
            <Button
              type="default"
              icon={<Cpu size={16} />}
              onClick={() => handleGuardedNavigation('/digital')}
            >
              数字电路工作台
            </Button>
            
            <Button 
              type="primary"
              icon={<Save size={16} />}
              onClick={() => handleGuardedNavigation('/circuit/list')}
            >
              我的电路库
            </Button>
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
          onUnsavedChange={setHasUnsavedChanges}
        />
      </div>
      
      {/* 底部提示 */}
      <div className="bg-blue-50 border-t border-blue-100 p-2 text-blue-700 text-xs flex justify-between items-center">
        <div>
          <span className="font-medium">提示：</span> 
          保存电路设计后可以在电路库中查看。电路分析结果将在AI分析完成后显示。
        </div>
      <div>
        <Button 
          size="small" 
          type="link" 
          className="text-blue-600 hover:text-blue-800"
          onClick={() => handleGuardedNavigation('/circuit/list')}
        >
          查看电路库
        </Button>
      </div>
      </div>
      <Modal
        title="检测到未保存的电路"
        open={unsavedModalVisible}
        onOk={confirmNavigation}
        onCancel={cancelNavigation}
        okText="仍要离开"
        cancelText="返回保存"
      >
        <p>画布上存在尚未保存的更改，离开后这些修改将会丢失。</p>
        <p>请先保存当前电路设计，或确认要直接离开。</p>
      </Modal>
    </div>
  );
}

export default Circuit;
