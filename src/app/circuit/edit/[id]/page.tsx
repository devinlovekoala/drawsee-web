'use client';

import { useState, useEffect, useCallback, useRef } from 'react';
import { getCircuitDesignById, saveCircuitDesign } from '@/api/methods/circuit.methods';
import { EnhancedCircuitCanvasWithProvider } from '@/app/pages/circuit/components/EnhancedCircuitCanvas';
import { Button, Spin, Result, Card, Modal, message, Input, Form } from 'antd';
import { CircuitDesign } from '@/api/types/circuit.types';
import { useParams, useNavigate } from 'react-router-dom';
import { Save, ArrowLeft, Eye, EyeOff, Settings, Download, Share2 } from 'lucide-react';

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
  
  const [circuitDesign, setCircuitDesign] = useState<CircuitDesign | null>(null);
  const [loading, setLoading] = useState<boolean>(true);
  const [error, setError] = useState<string | null>(null);
  const [hasUnsavedChanges, setHasUnsavedChanges] = useState<boolean>(false);
  const [navigationTarget, setNavigationTarget] = useState<string | null>(null);
  const [navigationState, setNavigationState] = useState<any>(null);
  const [navigationCallback, setNavigationCallback] = useState<((canProceed: boolean) => void) | null>(null);
  const [showConfirmModal, setShowConfirmModal] = useState<boolean>(false);
  const [showSaveModal, setShowSaveModal] = useState<boolean>(false);
  const [saving, setSaving] = useState<boolean>(false);
  const [showElementLibrary, setShowElementLibrary] = useState<boolean>(true);
  const originalDesignRef = useRef<CircuitDesign | null>(null);
  const [form] = Form.useForm();

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
      const hasChanges = JSON.stringify(updatedDesign.elements) !== JSON.stringify(originalDesignRef.current.elements) ||
                        JSON.stringify(updatedDesign.connections) !== JSON.stringify(originalDesignRef.current.connections);
      setHasUnsavedChanges(hasChanges);
    }
  }, []);

  // 处理保存电路设计
  const handleSaveCircuit = async (values: { title: string; description: string }) => {
    if (!circuitDesign) {
      message.error('没有可保存的电路设计');
      return;
    }

    try {
      setSaving(true);
      const updatedDesign = {
        ...circuitDesign,
        metadata: {
          ...circuitDesign.metadata,
          title: values.title,
          description: values.description,
          updatedAt: new Date().toISOString()
        }
      };

      const result = await saveCircuitDesign(
        updatedDesign,
        values.title,
        values.description
      );
      
      if (result.success) {
        message.success('电路设计保存成功');
        setShowSaveModal(false);
        setHasUnsavedChanges(false);
        // 更新原始设计引用
        originalDesignRef.current = JSON.parse(JSON.stringify(updatedDesign));
      } else {
        message.error('保存失败');
      }
    } catch (error) {
      console.error('保存电路设计失败:', error);
      message.error('保存失败，请重试');
    } finally {
      setSaving(false);
    }
  };

  // 处理快速保存
  const handleQuickSave = async () => {
    if (!circuitDesign) {
      message.error('没有可保存的电路设计');
      return;
    }

    try {
      setSaving(true);
      const result = await saveCircuitDesign(
        circuitDesign,
        circuitDesign.metadata.title,
        circuitDesign.metadata.description
      );
      
      if (result.success) {
        message.success('电路设计已保存');
        setHasUnsavedChanges(false);
        // 更新原始设计引用
        originalDesignRef.current = JSON.parse(JSON.stringify(circuitDesign));
      } else {
        message.error('保存失败');
      }
    } catch (error) {
      console.error('保存电路设计失败:', error);
      message.error('保存失败，请重试');
    } finally {
      setSaving(false);
    }
  };

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
        <Spin size="large" tip="加载中..." />
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
      {/* 顶部工具栏 */}
      <div className="bg-white border-b border-gray-200 px-4 py-3 flex items-center justify-between">
        <div className="flex items-center space-x-4">
          <Button
            icon={<ArrowLeft size={16} />}
            onClick={() => handleNavigation('/circuit/list')}
          >
            返回列表
          </Button>
          <div className="h-6 w-px bg-gray-300"></div>
          <h1 className="text-lg font-semibold text-gray-800">
            编辑: {circuitDesign.metadata.title || '电路设计'}
            {hasUnsavedChanges && <span className="text-orange-500 ml-2">*</span>}
          </h1>
        </div>
        
        <div className="flex items-center space-x-2">
          <Button
            icon={showElementLibrary ? <Eye size={16} /> : <EyeOff size={16} />}
            onClick={() => setShowElementLibrary(!showElementLibrary)}
            title={showElementLibrary ? "隐藏元件库" : "显示元件库"}
          >
            {showElementLibrary ? "隐藏库" : "显示库"}
          </Button>
          
          <Button
            icon={<Settings size={16} />}
            title="设置"
          >
            设置
          </Button>
          
          <Button
            icon={<Download size={16} />}
            title="导出"
          >
            导出
          </Button>
          
          <Button
            icon={<Share2 size={16} />}
            title="分享"
          >
            分享
          </Button>
          
          <Button
            onClick={handleQuickSave}
            icon={<Save size={16} />}
            loading={saving}
            disabled={!hasUnsavedChanges}
          >
            保存
          </Button>
          
          <Button
            onClick={() => setShowSaveModal(true)}
            icon={<Save size={16} />}
            type="primary"
            loading={saving}
          >
            另存为
          </Button>
        </div>
      </div>

      {/* 主要内容区域 */}
      <div className="flex-1 overflow-hidden">
        <EnhancedCircuitCanvasWithProvider 
          onCircuitDesignChange={handleCircuitDesignChange}
        />
      </div>

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

      {/* 保存对话框 */}
      <Modal
        title="保存电路设计"
        open={showSaveModal}
        onCancel={() => setShowSaveModal(false)}
        footer={[
          <Button key="cancel" onClick={() => setShowSaveModal(false)}>
            取消
          </Button>,
          <Button key="save" type="primary" form="saveForm" htmlType="submit" loading={saving}>
            保存
          </Button>,
        ]}
      >
        <Form
          id="saveForm"
          form={form}
          layout="vertical"
          onFinish={handleSaveCircuit}
          initialValues={{
            title: circuitDesign.metadata.title,
            description: circuitDesign.metadata.description
          }}
        >
          <Form.Item
            label="设计名称"
            name="title"
            rules={[{ required: true, message: '请输入设计名称' }]}
          >
            <Input placeholder="请输入电路设计名称" />
          </Form.Item>
          
          <Form.Item
            label="设计描述"
            name="description"
          >
            <Input.TextArea 
              placeholder="请输入电路设计描述（可选）"
              rows={3}
            />
          </Form.Item>
        </Form>
      </Modal>
    </div>
  );
} 