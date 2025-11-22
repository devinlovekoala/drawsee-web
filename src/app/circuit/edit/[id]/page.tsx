'use client';

import { useState, useEffect, useCallback, useRef } from 'react';
import { getCircuitDesignById } from '@/api/methods/circuit.methods';
import { CircuitFlowWithProvider } from '@/app/pages/circuit/components/CircuitFlow';
import { Button, Spin, Result, Card, Modal } from 'antd';
import { CircuitDesign } from '@/api/types/circuit.types';
import { useParams, useNavigate, useLocation } from 'react-router-dom';

// 导航事件类型定义
interface NavigationEvent {
  path: string;
  state?: any;
  callback?: (canProceed: boolean) => void;
}

/**
 * 电路设计编辑页面
 */
export default function CircuitEditPage() {
  // 使用useParams钩子获取URL参数
  const params = useParams();
  const id = params.id as string;
  const navigate = useNavigate();
  const location = useLocation();
  
  const [circuitDesign, setCircuitDesign] = useState<CircuitDesign | null>(null);
  const [loading, setLoading] = useState<boolean>(true);
  const [error, setError] = useState<string | null>(null);
  const [hasUnsavedChanges, setHasUnsavedChanges] = useState<boolean>(false);
  const [navigationTarget, setNavigationTarget] = useState<string | null>(null);
  const [navigationState, setNavigationState] = useState<any>(null);
  const [navigationCallback, setNavigationCallback] = useState<((canProceed: boolean) => void) | null>(null);
  const [showConfirmModal, setShowConfirmModal] = useState<boolean>(false);
  const originalDesignRef = useRef<CircuitDesign | null>(null);

  useEffect(() => {
    const fetchCircuitDesign = async () => {
      try {
        setLoading(true);
        const design = await getCircuitDesignById(id);
        setCircuitDesign(design);
        // 保存原始设计，用于比较是否有未保存的更改
        originalDesignRef.current = JSON.parse(JSON.stringify(design));
        setError(null);
      } catch (error) {
        console.error('获取电路设计失败:', error);
        setError('获取电路设计失败，可能是ID无效或已被删除');
      } finally {
        setLoading(false);
      }
    };

    if (id) {
      fetchCircuitDesign();
    } else {
      setError('无效的电路设计ID');
      setLoading(false);
    }
  }, [id]);

  // 处理电路设计变更
  const handleCircuitDesignChange = useCallback((updatedDesign: CircuitDesign) => {
    setCircuitDesign(updatedDesign);
    
    // 如果原始设计已加载，则判断是否有未保存的更改
    if (originalDesignRef.current) {
      const hasChanges = JSON.stringify(updatedDesign.elements) !== JSON.stringify(originalDesignRef.current.elements);
      setHasUnsavedChanges(hasChanges);
    }
  }, []);

  // 拦截导航请求，如果有未保存的更改则显示确认对话框
  const handleNavigation = useCallback((path: string, state?: any, callback?: (canProceed: boolean) => void) => {
    if (hasUnsavedChanges) {
      setNavigationTarget(path);
      setNavigationState(state);
      if (callback) {
        setNavigationCallback(() => callback);
      } else {
        setNavigationCallback(null);
      }
      setShowConfirmModal(true);
      return false; // 表示导航被拦截
    } else {
      if (callback) {
        callback(true);
      } else {
        navigate(path, { state });
      }
      return true; // 表示导航被允许
    }
  }, [hasUnsavedChanges, navigate]);

  // 监听来自AppSideBar的导航事件
  useEffect(() => {
    const handleAppNavigation = (event: CustomEvent<NavigationEvent>) => {
      const { path, state, callback } = event.detail;
      
      // 如果有未保存的更改，拦截导航
      if (hasUnsavedChanges) {
        // 阻止默认行为
        event.preventDefault();
        
        // 使用我们自己的导航处理逻辑
        handleNavigation(path, state, callback);
      } else if (callback) {
        // 如果没有未保存的更改，通知可以继续导航
        callback(true);
      }
    };
    
    // 添加导航事件监听器
    document.addEventListener('app:navigation-request', handleAppNavigation as EventListener);
    
    // 组件卸载时移除事件监听器
    return () => {
      document.removeEventListener('app:navigation-request', handleAppNavigation as EventListener);
    };
  }, [hasUnsavedChanges, handleNavigation]);

  // 确认导航离开
  const confirmNavigation = useCallback(() => {
    setShowConfirmModal(false);
    
    if (navigationCallback) {
      // 如果有回调函数，通知可以继续导航
      navigationCallback(true);
      setNavigationCallback(null);
    } else if (navigationTarget) {
      // 否则直接导航
      navigate(navigationTarget, { state: navigationState });
    }
    
    // 清理状态
    setNavigationTarget(null);
    setNavigationState(null);
  }, [navigationTarget, navigationState, navigationCallback, navigate]);

  // 取消导航离开
  const cancelNavigation = useCallback(() => {
    setShowConfirmModal(false);
    
    if (navigationCallback) {
      // 通知不能继续导航
      navigationCallback(false);
      setNavigationCallback(null);
    }
    
    // 清理状态
    setNavigationTarget(null);
    setNavigationState(null);
  }, [navigationCallback]);

  if (loading) {
    return (
      <div className="flex justify-center items-center h-full">
        <Spin size="large" />
      </div>
    );
  }

  if (error || !circuitDesign) {
    return (
      <Result
        status="404"
        title="未找到电路设计"
        subTitle={error || '请检查电路ID是否正确'}
        extra={
          <Button 
            type="primary"
            onClick={() => navigate('/circuit/list')}
          >
            返回电路列表
          </Button>
        }
      />
    );
  }

  return (
    <div className="w-full h-full flex flex-col">
      <Card 
        title={`编辑: ${circuitDesign.metadata.title || '电路设计'}`} 
        className="flex-grow flex flex-col overflow-hidden"
        bodyStyle={{ 
          height: 'calc(100vh - 170px)', 
          padding: '12px',
          display: 'flex',
          flexDirection: 'column',
          overflow: 'hidden'
        }}
        style={{ 
          zIndex: 10,
          position: 'relative'
        }}
        extra={
          <div className="flex gap-2">
            <Button
              onClick={() => handleNavigation('/circuit/list')}
            >
              返回列表
            </Button>
            <Button
              onClick={() => handleNavigation(`/circuit/view/${id}`)}
            >
              查看模式
            </Button>
          </div>
        }
      >
        <div className="flex-grow h-full">
          <CircuitFlowWithProvider 
            initialCircuitDesign={circuitDesign}
            isReadOnly={false}
            onCircuitDesignChange={handleCircuitDesignChange}
          />
        </div>
      </Card>

      {/* 未保存更改确认对话框 */}
      <Modal
        title="未保存的更改"
        open={showConfirmModal}
        onOk={confirmNavigation}
        onCancel={cancelNavigation}
        okText="继续离开"
        cancelText="返回编辑"
      >
        <p>您有未保存的电路更改，确定要离开此页面吗？</p>
        <p>离开后未保存的更改将会丢失。</p>
      </Modal>
    </div>
  );
} 