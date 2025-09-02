'use client';

import { EnhancedCircuitCanvasWithProvider } from '@/app/pages/circuit/components/EnhancedCircuitCanvas';
import { Button, message, Modal, Input, Form } from 'antd';
import { useState } from 'react';
import { CircuitDesign } from '@/api/types/circuit.types';
import { useNavigate } from 'react-router-dom';
import { saveCircuitDesign } from '@/api/methods/circuit.methods';
import { Save, ArrowLeft, Eye, EyeOff } from 'lucide-react';

/**
 * 新建电路设计页面
 */
export default function CircuitCreatePage() {
  const [circuitDesign, setCircuitDesign] = useState<CircuitDesign | null>(null);
  const [saving, setSaving] = useState<boolean>(false);
  const [showSaveModal, setShowSaveModal] = useState<boolean>(false);
  const [showElementLibrary, setShowElementLibrary] = useState<boolean>(true);
  const navigate = useNavigate();
  const [form] = Form.useForm();

  // 处理电路设计变更
  const handleCircuitDesignChange = (updatedDesign: CircuitDesign) => {
    setCircuitDesign(updatedDesign);
  };

  // 处理保存电路设计
  const handleSaveCircuit = async (values: { title: string; description: string }) => {
    if (!circuitDesign) {
      message.error('没有可保存的电路设计');
      return;
    }

    try {
      setSaving(true);
      const result = await saveCircuitDesign(
        circuitDesign,
        values.title,
        values.description
      );
      
      if (result.success) {
        message.success('电路设计保存成功');
        setShowSaveModal(false);
        navigate(`/circuit/edit/${result.id}`);
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
        '新建电路设计',
        '使用DrawSee创建的电路设计'
      );
      
      if (result.success) {
        message.success('电路设计已保存');
        navigate(`/circuit/edit/${result.id}`);
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

  return (
    <div className="w-full h-full flex flex-col">
      {/* 顶部工具栏 */}
      <div className="bg-white border-b border-gray-200 px-4 py-3 flex items-center justify-between">
        <div className="flex items-center space-x-4">
          <Button
            icon={<ArrowLeft size={16} />}
            onClick={() => navigate('/circuit/list')}
          >
            返回列表
          </Button>
          <div className="h-6 w-px bg-gray-300"></div>
          <h1 className="text-lg font-semibold text-gray-800">新建电路设计</h1>
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
            onClick={() => setShowSaveModal(true)}
            icon={<Save size={16} />}
            type="primary"
            loading={saving}
          >
            保存设计
          </Button>
        </div>
      </div>

      {/* 主要内容区域 */}
      <div className="flex-1 overflow-hidden">
        <EnhancedCircuitCanvasWithProvider 
          onCircuitDesignChange={handleCircuitDesignChange}
        />
      </div>

      {/* 保存对话框 */}
      <Modal
        title="保存电路设计"
        open={showSaveModal}
        onCancel={() => setShowSaveModal(false)}
        footer={[
          <Button key="cancel" onClick={() => setShowSaveModal(false)}>
            取消
          </Button>,
          <Button key="quick" onClick={handleQuickSave} loading={saving}>
            快速保存
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
            title: '新建电路设计',
            description: '使用DrawSee创建的电路设计'
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