"use client";

import { useState, useEffect } from 'react';
import { getCircuitDesignById } from '@/api/methods/circuit.methods';
import { CircuitFlowWithProvider } from '@/app/pages/circuit/components/CircuitFlow';
import { Button, Spin, Result, Card } from 'antd';
import { CircuitDesign } from '@/api/types/circuit.types';
import { useParams, useNavigate } from 'react-router-dom';

/**
 * 电路设计查看页面
 */
export default function CircuitViewPage() {
  // 使用useParams钩子获取URL参数
  const params = useParams();
  const id = params.id as string;
  const navigate = useNavigate();
  
  const [circuitDesign, setCircuitDesign] = useState<CircuitDesign | null>(null);
  const [loading, setLoading] = useState<boolean>(true);
  const [error, setError] = useState<string | null>(null);

  useEffect(() => {
    const fetchCircuitDesign = async () => {
      try {
        setLoading(true);
        const design = await getCircuitDesignById(id);
        setCircuitDesign(design);
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
      <Card 
        title={circuitDesign.metadata.title || '电路设计'} 
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
              onClick={() => navigate('/circuit/list')}
            >
              返回列表
            </Button>
            <Button 
              type="primary"
              onClick={() => navigate(`/circuit/edit/${id}`)}
            >
              编辑此电路
            </Button>
          </div>
        }
      >
        <div className="flex-grow h-full">
          <CircuitFlowWithProvider 
            initialCircuitDesign={circuitDesign}
            isReadOnly={true}
          />
        </div>
      </Card>
    </div>
  );
} 