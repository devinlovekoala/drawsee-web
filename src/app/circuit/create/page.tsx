'use client';

import { CircuitFlowWithProvider } from '@/app/pages/circuit/components/CircuitFlow';
import { Button, Card } from 'antd';
import { useState } from 'react';
import { CircuitDesign } from '@/api/types/circuit.types';
import { useNavigate } from 'react-router-dom';

/**
 * 新建电路设计页面
 */
export default function CircuitCreatePage() {
  const [circuitDesign, setCircuitDesign] = useState<CircuitDesign | null>(null);
  const navigate = useNavigate();

  // 处理电路设计变更
  const handleCircuitDesignChange = (updatedDesign: CircuitDesign) => {
    setCircuitDesign(updatedDesign);
  };

  return (
    <div className="w-full h-full">
      <Card 
        title="新建电路设计"
        className="h-full"
        bodyStyle={{ 
          height: 'calc(100vh - 170px)', 
          padding: '12px',
          display: 'flex',
          flexDirection: 'column',
          overflow: 'hidden' // 确保内容不会溢出
        }}
        style={{ 
          zIndex: 10, // 确保Card不会遮挡其他UI元素
          position: 'relative' // 启用z-index生效
        }}
        extra={
          <div className="flex gap-2">
            <Button
              onClick={() => navigate('/circuit/list')}
            >
              返回列表
            </Button>
          </div>
        }
      >
        <div className="h-full flex-grow">
          <CircuitFlowWithProvider 
            isReadOnly={false}
            onCircuitDesignChange={handleCircuitDesignChange}
          />
        </div>
      </Card>
    </div>
  );
} 