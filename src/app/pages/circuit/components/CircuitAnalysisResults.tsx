'use client';

import React, { useState } from 'react';
import { Card, Tabs, Typography, Divider, Table, Spin } from 'antd';
import { Line } from '@ant-design/charts';
import type { FrequencyResponse, TransientResponse, CircuitAnalysisResult } from '@/api/types/circuit.types';

const { Title, Text } = Typography;
const { TabPane } = Tabs;

interface CircuitAnalysisResultsProps {
  results: CircuitAnalysisResult | null;
  loading: boolean;
}

export const CircuitAnalysisResults: React.FC<CircuitAnalysisResultsProps> = ({ 
  results,
  loading
}) => {
  const [activeTab, setActiveTab] = useState('1');

  // 频率响应图表配置
  const getFrequencyResponseConfig = (data: FrequencyResponse) => {
    // 处理数据为图表格式
    const chartData = data.frequencies.map((freq, index) => ({
      frequency: freq,
      magnitude: data.magnitudes[index],
      phase: data.phases[index],
    }));

    return {
      data: chartData,
      xField: 'frequency',
      yField: 'magnitude',
      seriesField: 'type',
      xAxis: {
        type: 'log',
        label: {
          formatter: (v: number) => `${v} Hz`,
        },
        title: {
          text: '频率 (Hz)',
        },
      },
      yAxis: {
        title: {
          text: '幅度 (dB)',
        },
      },
      smooth: true,
    };
  };

  // 瞬态响应图表配置
  const getTransientResponseConfig = (data: TransientResponse) => {
    // 处理数据为图表格式
    const chartData = data.timePoints.map((time, index) => ({
      time,
      voltage: data.voltages[index],
    }));

    return {
      data: chartData,
      xField: 'time',
      yField: 'voltage',
      xAxis: {
        label: {
          formatter: (v: number) => `${v}s`,
        },
        title: {
          text: '时间 (s)',
        },
      },
      yAxis: {
        title: {
          text: '电压 (V)',
        },
      },
      smooth: true,
    };
  };

  // 节点电压表格列定义
  const nodeVoltageColumns = [
    {
      title: '节点',
      dataIndex: 'node',
      key: 'node',
    },
    {
      title: '电压 (V)',
      dataIndex: 'voltage',
      key: 'voltage',
    },
  ];

  // 分支电流表格列定义
  const branchCurrentColumns = [
    {
      title: '元件',
      dataIndex: 'element',
      key: 'element',
    },
    {
      title: '电流 (A)',
      dataIndex: 'current',
      key: 'current',
    },
  ];

  // 生成节点电压数据
  const getNodeVoltageData = () => {
    if (!results || !results.dcAnalysis || !results.dcAnalysis.nodeVoltages) {
      return [];
    }
    
    return Object.entries(results.dcAnalysis.nodeVoltages).map(([node, voltage], index) => ({
      key: index,
      node,
      voltage: voltage.toFixed(4),
    }));
  };

  // 生成分支电流数据
  const getBranchCurrentData = () => {
    if (!results || !results.dcAnalysis || !results.dcAnalysis.branchCurrents) {
      return [];
    }
    
    return Object.entries(results.dcAnalysis.branchCurrents).map(([element, current], index) => ({
      key: index,
      element,
      current: current.toFixed(6),
    }));
  };

  if (loading) {
    return (
      <Card style={{ marginTop: 16, minHeight: 300 }}>
        <div style={{ display: 'flex', justifyContent: 'center', alignItems: 'center', height: 300 }}>
          <Spin size="large" tip="分析中..." />
        </div>
      </Card>
    );
  }

  if (!results) {
    return (
      <Card style={{ marginTop: 16, minHeight: 300 }}>
        <div style={{ textAlign: 'center', padding: 24 }}>
          <Text type="secondary">点击"分析电路"按钮开始分析</Text>
        </div>
      </Card>
    );
  }

  return (
    <Card style={{ marginTop: 16 }}>
      <Title level={4}>电路分析结果</Title>
      <Divider />

      <Tabs activeKey={activeTab} onChange={setActiveTab}>
        <TabPane tab="直流分析" key="1">
          <div style={{ display: 'flex', justifyContent: 'space-between', marginTop: 16 }}>
            <Card title="节点电压" style={{ width: '48%' }}>
              <Table 
                dataSource={getNodeVoltageData()} 
                columns={nodeVoltageColumns} 
                pagination={false}
                size="small"
              />
            </Card>
            <Card title="分支电流" style={{ width: '48%' }}>
              <Table 
                dataSource={getBranchCurrentData()} 
                columns={branchCurrentColumns} 
                pagination={false}
                size="small"
              />
            </Card>
          </div>
        </TabPane>

        <TabPane tab="频率响应" key="2">
          {results.frequencyResponse ? (
            <div style={{ marginTop: 16 }}>
              <Card title="频率响应">
                <Line {...getFrequencyResponseConfig(results.frequencyResponse)} />
              </Card>
            </div>
          ) : (
            <div style={{ textAlign: 'center', padding: 24 }}>
              <Text type="secondary">无频率响应数据</Text>
            </div>
          )}
        </TabPane>

        <TabPane tab="瞬态分析" key="3">
          {results.transientResponse ? (
            <div style={{ marginTop: 16 }}>
              <Card title="瞬态响应">
                <Line {...getTransientResponseConfig(results.transientResponse)} />
              </Card>
            </div>
          ) : (
            <div style={{ textAlign: 'center', padding: 24 }}>
              <Text type="secondary">无瞬态分析数据</Text>
            </div>
          )}
        </TabPane>
      </Tabs>
    </Card>
  );
};