"use client";

import { useState, useEffect } from 'react';
import { getCircuitDesignById } from '@/api/methods/circuit.methods';
import { EnhancedCircuitCanvasWithProvider } from '@/app/pages/circuit/components/EnhancedCircuitCanvas';
import { Button, Spin, Result, Card, message, Tag, Descriptions, Modal } from 'antd';
import { CircuitDesign } from '@/api/types/circuit.types';
import { useParams, useNavigate } from 'react-router-dom';
import { ArrowLeft, Edit, Download, Share2, Copy, Eye, EyeOff, Info } from 'lucide-react';
import dayjs from 'dayjs';

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
  const [showInfo, setShowInfo] = useState<boolean>(false);
  const [showElementLibrary, setShowElementLibrary] = useState<boolean>(false);

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

  // 处理复制链接
  const handleCopyLink = () => {
    const url = window.location.href;
    navigator.clipboard.writeText(url).then(() => {
      message.success('链接已复制到剪贴板');
    }).catch(() => {
      message.error('复制失败');
    });
  };

  // 处理导出
  const handleExport = () => {
    message.info('导出功能开发中...');
  };

  // 处理分享
  const handleShare = () => {
    message.info('分享功能开发中...');
  };

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
            onClick={() => navigate('/circuit/list')}
          >
            返回列表
          </Button>
          <div className="h-6 w-px bg-gray-300"></div>
          <h1 className="text-lg font-semibold text-gray-800">
            {circuitDesign.metadata.title || '电路设计'}
          </h1>
          <Tag color="blue">只读模式</Tag>
        </div>
        
        <div className="flex items-center space-x-2">
          <Button
            icon={<Info size={16} />}
            onClick={() => setShowInfo(true)}
            title="查看详情"
          >
            详情
          </Button>
          
          <Button
            icon={showElementLibrary ? <Eye size={16} /> : <EyeOff size={16} />}
            onClick={() => setShowElementLibrary(!showElementLibrary)}
            title={showElementLibrary ? "隐藏元件库" : "显示元件库"}
          >
            {showElementLibrary ? "隐藏库" : "显示库"}
          </Button>
          
          <Button
            icon={<Copy size={16} />}
            onClick={handleCopyLink}
            title="复制链接"
          >
            复制链接
          </Button>
          
          <Button
            icon={<Download size={16} />}
            onClick={handleExport}
            title="导出"
          >
            导出
          </Button>
          
          <Button
            icon={<Share2 size={16} />}
            onClick={handleShare}
            title="分享"
          >
            分享
          </Button>
          
          <Button 
            type="primary"
            icon={<Edit size={16} />}
            onClick={() => navigate(`/circuit/edit/${id}`)}
          >
            编辑此电路
          </Button>
        </div>
      </div>

      {/* 主要内容区域 */}
      <div className="flex-1 overflow-hidden">
        <EnhancedCircuitCanvasWithProvider />
      </div>

      {/* 电路设计详情对话框 */}
      <Modal
        title="电路设计详情"
        open={showInfo}
        onCancel={() => setShowInfo(false)}
        footer={[
          <Button key="close" onClick={() => setShowInfo(false)}>
            关闭
          </Button>,
          <Button 
            key="edit" 
            type="primary"
            onClick={() => {
              setShowInfo(false);
              navigate(`/circuit/edit/${id}`);
            }}
          >
            编辑设计
          </Button>,
        ]}
        width={600}
      >
        <Descriptions column={1} bordered>
          <Descriptions.Item label="设计名称">
            {circuitDesign.metadata.title || '未命名'}
          </Descriptions.Item>
          
          <Descriptions.Item label="设计描述">
            {circuitDesign.metadata.description || '无描述'}
          </Descriptions.Item>
          
          <Descriptions.Item label="创建时间">
            {dayjs(circuitDesign.metadata.createdAt).format('YYYY-MM-DD HH:mm:ss')}
          </Descriptions.Item>
          
          <Descriptions.Item label="更新时间">
            {dayjs(circuitDesign.metadata.updatedAt).format('YYYY-MM-DD HH:mm:ss')}
          </Descriptions.Item>
          
          <Descriptions.Item label="元件数量">
            {circuitDesign.elements.length} 个
          </Descriptions.Item>
          
          <Descriptions.Item label="连接数量">
            {circuitDesign.connections.length} 个
          </Descriptions.Item>
          
          <Descriptions.Item label="元件类型">
            <div className="flex flex-wrap gap-1">
              {Array.from(new Set(circuitDesign.elements.map(el => el.type))).map(type => (
                <Tag key={type} color="blue">{type}</Tag>
              ))}
            </div>
          </Descriptions.Item>
        </Descriptions>
      </Modal>
    </div>
  );
} 