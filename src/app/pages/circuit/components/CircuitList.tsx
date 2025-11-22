import { useState, useEffect, useCallback } from 'react';
import { getCircuitDesigns, deleteCircuitDesign } from '@/api/methods/circuit.methods';
import { Table, Button, Card, Space, message, Modal, Empty, Typography, Spin } from 'antd';
import { DeleteOutlined, EditOutlined, EyeOutlined, PlusOutlined } from '@ant-design/icons';
import dayjs from 'dayjs';
import { Link, useNavigate } from 'react-router-dom';

const { Title } = Typography;

export interface CircuitDesignListItem {
  id: string;
  title: string;
  createdAt: string;
  updatedAt: string;
}

/**
 * 电路设计列表组件
 * 展示用户保存的所有电路设计，并提供编辑和删除功能
 */
export const CircuitList = () => {
  const [designs, setDesigns] = useState<CircuitDesignListItem[]>([]);
  const [loading, setLoading] = useState<boolean>(true);
  const [deleteLoading, setDeleteLoading] = useState<boolean>(false);
  const navigate = useNavigate();

  // 获取电路设计列表
  const fetchCircuitDesigns = useCallback(async (options?: { forceRefresh?: boolean }) => {
    try {
      setLoading(true);
      const response = await getCircuitDesigns(options);
      setDesigns(response.designs);
      return response;
    } catch (error) {
      console.error('获取电路设计列表失败:', error);
      message.error('获取电路设计列表失败');
      throw error;
    } finally {
      setLoading(false);
    }
  }, []);

  // 组件加载时获取列表
  useEffect(() => {
    fetchCircuitDesigns();
  }, [fetchCircuitDesigns]);

  // 删除电路设计
  const handleDelete = async (id: string) => {
    Modal.confirm({
      title: '确认删除',
      content: '确定要删除这个电路设计吗？此操作不可恢复。',
      okText: '删除',
      okType: 'danger',
      cancelText: '取消',
      onOk: async () => {
        try {
          setDeleteLoading(true);
          await deleteCircuitDesign(id);
          message.success('删除成功');
          // 乐观更新以便立即在列表中移除
          setDesigns((prev) => prev.filter((design) => String(design.id) !== String(id)));
          // 重新获取列表确保数据与服务器同步并规避缓存
          await fetchCircuitDesigns({ forceRefresh: true });
        } catch (error) {
          console.error('删除电路设计失败:', error);
          message.error('删除电路设计失败');
        } finally {
          setDeleteLoading(false);
        }
      }
    });
  };

  // 表格列定义
  const columns = [
    {
      title: '名称',
      dataIndex: 'title',
      key: 'title',
    },
    {
      title: '创建时间',
      dataIndex: 'createdAt',
      key: 'createdAt',
      render: (text: string) => dayjs(text).format('YYYY-MM-DD HH:mm:ss'),
    },
    {
      title: '更新时间',
      dataIndex: 'updatedAt',
      key: 'updatedAt',
      render: (text: string) => dayjs(text).format('YYYY-MM-DD HH:mm:ss'),
    },
    {
      title: '操作',
      key: 'action',
      render: (_: any, record: CircuitDesignListItem) => (
        <Space size="middle">
          <Button 
            type="text" 
            icon={<EyeOutlined />} 
            disabled={deleteLoading}
            onClick={() => navigate(`/circuit/view/${record.id}`)}
          >
            查看
          </Button>
          <Button 
            type="text" 
            icon={<EditOutlined />} 
            disabled={deleteLoading}
            onClick={() => navigate(`/circuit/edit/${record.id}`)}
          >
            编辑
          </Button>
          <Button 
            type="text" 
            danger 
            icon={<DeleteOutlined />} 
            onClick={() => handleDelete(record.id)}
            disabled={deleteLoading}
          >
            删除
          </Button>
        </Space>
      ),
    },
  ];

  return (
    <div className="p-6">
      <Card>
        <div className="flex justify-between items-center mb-4">
          <Title level={4}>我的电路设计</Title>
          <Button 
            type="primary" 
            icon={<PlusOutlined />}
            onClick={() => navigate('/circuit/create')}
          >
            新建电路设计
          </Button>
        </div>

        {loading ? (
          <div className="flex justify-center items-center py-12">
            <Spin size="large" />
          </div>
        ) : designs.length > 0 ? (
          <Table 
            columns={columns} 
            dataSource={designs} 
            rowKey="id"
            pagination={{ 
              pageSize: 10,
              showSizeChanger: true,
              showQuickJumper: true,
              showTotal: (total) => `共 ${total} 条`
            }}
          />
        ) : (
          <Empty 
            description="暂无电路设计" 
            image={Empty.PRESENTED_IMAGE_SIMPLE}
          >
            <Button 
              type="primary"
              onClick={() => navigate('/circuit/create')}
            >
              立即创建
            </Button>
          </Empty>
        )}
      </Card>
    </div>
  );
};

export default CircuitList; 
