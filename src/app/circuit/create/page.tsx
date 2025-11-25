'use client';

import { CircuitFlowWithProvider } from '@/app/pages/circuit/components/CircuitFlow';
import { Button, Card, Modal } from 'antd';
import { useState, useCallback, useEffect } from 'react';
import { CircuitDesign } from '@/api/types/circuit.types';
import { useNavigate } from 'react-router-dom';

interface NavigationEvent {
  path: string;
  state?: any;
  callback?: (canProceed: boolean) => void;
}

/**
 * 新建电路设计页面
 */
export default function CircuitCreatePage() {
  const [, setCircuitDesign] = useState<CircuitDesign | null>(null);
  const navigate = useNavigate();
  const [hasUnsavedChanges, setHasUnsavedChanges] = useState(false);
  const [pendingNavigation, setPendingNavigation] = useState<NavigationEvent | null>(null);
  const [unsavedModalVisible, setUnsavedModalVisible] = useState(false);

  // 处理电路设计变更
  const handleCircuitDesignChange = (updatedDesign: CircuitDesign) => {
    setCircuitDesign(updatedDesign);
  };

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
    <div className="w-full h-full">
      <Card 
        title="新建电路设计"
        className="h-full"
        styles={{
          body: {
            padding: '12px',
            display: 'flex',
            flexDirection: 'column',
            overflow: 'hidden', // 确保内容不会溢出
            flex: 1,
            minHeight: 0
          }
        }}
        style={{ 
          zIndex: 10, // 确保Card不会遮挡其他UI元素
          position: 'relative' // 启用z-index生效
        }}
        extra={
          <div className="flex gap-2">
            <Button
              onClick={() => handleGuardedNavigation('/circuit/list')}
            >
              返回列表
            </Button>
          </div>
        }
      >
        <div className="flex-1 min-h-0">
          <CircuitFlowWithProvider 
            isReadOnly={false}
            onCircuitDesignChange={handleCircuitDesignChange}
            onUnsavedChange={setHasUnsavedChanges}
          />
        </div>
      </Card>
      <Modal
        title="检测到未保存的电路"
        open={unsavedModalVisible}
        onOk={confirmNavigation}
        onCancel={cancelNavigation}
        okText="仍要离开"
        cancelText="返回保存"
      >
        <p>当前画布存在未保存的更改。请先保存，或确认直接离开。</p>
      </Modal>
    </div>
  );
} 
