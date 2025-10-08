import { FC } from 'react';
import { Modal, Form, Input, message } from 'antd';
import { CircuitDesign } from '@/api/types/circuit.types';
import { saveCircuitDesign } from '@/api/methods/circuit.methods';

interface SaveCircuitModalProps {
  visible: boolean;
  circuitDesign: CircuitDesign | null;
  onClose: () => void;
  onSuccess: () => void;
}

interface SaveCircuitFormValues {
  title: string;
  description?: string;
}

// 保存电路设计的表单弹窗
export const SaveCircuitModal: FC<SaveCircuitModalProps> = ({
  visible,
  circuitDesign,
  onClose,
  onSuccess
}) => {
  const [form] = Form.useForm<SaveCircuitFormValues>();

  // 处理表单提交
  const handleSubmit = async () => {
    try {
      // 验证表单
      const values = await form.validateFields();

      if (!circuitDesign) {
        message.error('电路设计数据为空');
        return;
      }

      // 显示加载提示
      message.loading({ content: '保存电路中...', key: 'save-circuit', duration: 0 });

      // 调用保存API
      const result = await saveCircuitDesign(
        circuitDesign,
        values.title,
        values.description || ''
      );

      // 关闭加载提示
      message.destroy('save-circuit');

      if (result.success) {
        message.success('电路设计保存成功！');
        // 重置表单
        form.resetFields();
        // 调用成功回调
        onSuccess();
        // 关闭弹窗
        onClose();
      } else {
        message.error('电路设计保存失败');
      }
    } catch (error) {
      message.destroy('save-circuit');

      // 如果是表单验证错误，不显示错误消息
      if (error && typeof error === 'object' && 'errorFields' in error) {
        return;
      }

      console.error('保存电路设计失败:', error);
      message.error('保存失败：' + (error instanceof Error ? error.message : '未知错误'));
    }
  };

  // 处理取消
  const handleCancel = () => {
    // 重置表单
    form.resetFields();
    // 关闭弹窗
    onClose();
  };

  return (
    <Modal
      title="保存电路设计"
      open={visible}
      onOk={handleSubmit}
      onCancel={handleCancel}
      okText="保存"
      cancelText="取消"
      width={500}
      destroyOnClose
    >
      <Form
        form={form}
        layout="vertical"
        autoComplete="off"
      >
        <Form.Item
          name="title"
          label="电路名称"
          rules={[
            { required: true, message: '请输入电路名称' },
            { max: 100, message: '电路名称不能超过100个字符' }
          ]}
        >
          <Input
            placeholder="请输入电路名称（例如：RC串联电路）"
            autoFocus
          />
        </Form.Item>

        <Form.Item
          name="description"
          label="电路描述"
          rules={[
            { max: 500, message: '电路描述不能超过500个字符' }
          ]}
        >
          <Input.TextArea
            placeholder="请输入电路描述（选填）"
            rows={4}
            showCount
            maxLength={500}
          />
        </Form.Item>
      </Form>
    </Modal>
  );
};

export default SaveCircuitModal;
