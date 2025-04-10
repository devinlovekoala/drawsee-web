'use client';

import React from 'react';
import { Layout, Typography, Divider } from 'antd';
import CircuitCanvas from './components/CircuitCanvas';

const { Content } = Layout;
const { Title, Paragraph } = Typography;

export default function CircuitPage() {
  return (
    <Layout className="min-h-screen bg-white">
      <Content className="p-6">
        <div className="max-w-6xl mx-auto">
          <Typography>
            <Title level={2}>AI电子电路分析</Title>
            <Paragraph>
              使用AI电子电路分析工具设计和分析您的电路。绘制电路图，添加组件，并获取详细的电路分析结果。
            </Paragraph>
            <Divider />
          </Typography>
          
          <div className="mb-6 bg-white p-4 border border-gray-200 rounded-lg shadow-sm">
            <CircuitCanvas />
          </div>
          
          <div className="mt-8">
            <Typography>
              <Title level={4}>使用说明</Title>
              <Paragraph>
                <ul className="list-disc pl-6">
                  <li>从顶部工具栏选择电路元件并添加到画布</li>
                  <li>拖动元件调整位置，连接元件端口创建电路</li>
                  <li>确保添加接地点以完成电路</li>
                  <li>点击"分析电路"按钮获取分析结果</li>
                  <li>可以导出SPICE网表用于其他模拟工具</li>
                </ul>
              </Paragraph>
            </Typography>
          </div>
        </div>
      </Content>
    </Layout>
  );
}