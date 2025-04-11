'use client';

import React, { useCallback, useState, useMemo, useRef, useEffect } from 'react';
import ReactFlow, {
  addEdge,
  Background,
  Controls,
  Connection,
  Edge,
  Node,
  NodeChange,
  EdgeChange,
  applyNodeChanges,
  applyEdgeChanges,
  MarkerType,
  useReactFlow,
  ReactFlowProvider,
  Panel
} from 'reactflow';
import { Button, Dropdown, message, Space, Modal, Spin } from 'antd';
import { DownOutlined, PlusOutlined, SaveOutlined, PlayCircleOutlined } from '@ant-design/icons';
import 'reactflow/dist/style.css';
import { CircuitNode } from './CircuitNode';
import { ConnectionLine } from './ConnectionLine';
import { CircuitElement, CircuitElementType, CircuitDesign, CircuitAnalysisResult } from '@/api/types/circuit.types';
// 导入创建AI任务的方法，不再使用废弃的tool.methods
import { createAiTask } from '@/api/methods/flow.methods';
import { useAppContext } from '@/app/contexts/AppContext';
import { CreateAiTaskDTO } from '@/api/types/flow.types';
import { useNavigate } from 'react-router-dom';

// 唯一节点ID生成
let nodeIdCounter = 1;
const getNewNodeId = () => `node-${nodeIdCounter++}`;

// 定义节点类型
const nodeTypes = {
  circuitNode: CircuitNode,
};

// 电路元件菜单配置
const elementMenuItems = [
  {
    key: CircuitElementType.RESISTOR,
    label: '电阻器 (R)',
  },
  {
    key: CircuitElementType.CAPACITOR,
    label: '电容器 (C)',
  },
  {
    key: CircuitElementType.INDUCTOR,
    label: '电感器 (L)',
  },
  {
    key: CircuitElementType.VOLTAGE_SOURCE,
    label: '电压源 (V)',
  },
  {
    key: CircuitElementType.CURRENT_SOURCE,
    label: '电流源 (I)',
  },
  {
    key: CircuitElementType.DIODE,
    label: '二极管 (D)',
  },
  {
    key: CircuitElementType.TRANSISTOR_NPN,
    label: 'NPN 晶体管',
  },
  {
    key: CircuitElementType.TRANSISTOR_PNP,
    label: 'PNP 晶体管',
  },
  {
    key: CircuitElementType.GROUND,
    label: '接地 (GND)',
  },
];

// 在文件顶部添加接口定义
interface CircuitFlowProps {
  onCircuitDesignChange?: (design: CircuitDesign) => void;
  selectedModel?: string;
}

export const CircuitFlow = ({ onCircuitDesignChange, selectedModel = 'doubao' }: CircuitFlowProps) => {
  const [nodes, setNodes] = useState<Node[]>([]);
  const [edges, setEdges] = useState<Edge[]>([]);
  const [isAnalyzing, setIsAnalyzing] = useState(false);
  const [analysisResults, setAnalysisResults] = useState<CircuitAnalysisResult | null>(null);
  const [analysisModalVisible, setAnalysisModalVisible] = useState(false);
  
  const reactFlowInstance = useReactFlow();
  const reactFlowWrapper = useRef<HTMLDivElement>(null);
  const navigate = useNavigate();
  const { handleBlankQuery, handleAiTaskCountPlus } = useAppContext();
  
  // 处理节点变更
  const onNodesChange = useCallback(
    (changes: NodeChange[]) => setNodes((nds) => applyNodeChanges(changes, nds)),
    []
  );

  // 处理边变更
  const onEdgesChange = useCallback(
    (changes: EdgeChange[]) => setEdges((eds) => applyEdgeChanges(changes, eds)),
    []
  );

  // 处理连接创建
  const onConnect = useCallback(
    (connection: Connection) => {
      const newEdge = {
        ...connection,
        id: `edge-${connection.source}-${connection.sourceHandle}-${connection.target}-${connection.targetHandle}`,
        type: 'default',
        animated: true,
        style: { stroke: '#334155', strokeWidth: 2 },
      };
      setEdges((eds) => addEdge(newEdge, eds));
    },
    []
  );

  // 创建新节点
  const addNewNode = useCallback(
    (type: CircuitElementType) => {
      const position = reactFlowInstance.project({
        x: Math.random() * 400 + 50,
        y: Math.random() * 400 + 50,
      });

      const newNode: Node = {
        id: getNewNodeId(),
        type: 'circuitNode',
        position,
        data: {
          type,
          label: `${type}${nodeIdCounter}`,
          value: type === CircuitElementType.RESISTOR ? '1k' : 
                 type === CircuitElementType.CAPACITOR ? '1u' : 
                 type === CircuitElementType.INDUCTOR ? '1m' : 
                 type === CircuitElementType.VOLTAGE_SOURCE ? '5V' : 
                 type === CircuitElementType.CURRENT_SOURCE ? '10mA' : '',
        },
      };

      setNodes((nds) => [...nds, newNode]);
    },
    [reactFlowInstance]
  );

  // 将Flow画布数据转换为CircuitDesign格式
  const convertToCircuitDesign = useCallback((): CircuitDesign => {
    const elements = nodes.map(node => {
      return {
        id: node.id,
        type: node.data.type as CircuitElementType,
        label: node.data.label,
        value: node.data.value,
        position: {
          x: node.position.x,
          y: node.position.y
        },
        rotation: 0,
        properties: {
          value: node.data.value,
          label: node.data.label
        },
        ports: [
          {
            id: 'input',
            name: 'Input',
            type: 'input',
            position: {
              side: 'left',
              x: 0,
              y: 25,
              align: 'center'
            }
          },
          {
            id: 'output',
            name: 'Output',
            type: 'output',
            position: {
              side: 'right',
              x: 100, 
              y: 25,
              align: 'center'
            }
          }
        ]
      };
    });

    const connections = edges.map(edge => {
      return {
        id: edge.id,
        source: {
          elementId: edge.source,
          portId: edge.sourceHandle || 'output'
        },
        target: {
          elementId: edge.target,
          portId: edge.targetHandle || 'input'
        }
      };
    });

    const circuitDesign = {
      elements,
      connections,
      metadata: {
        title: '电路设计',
        description: '使用DrawSee创建的电路',
        createdAt: new Date().toISOString(),
        updatedAt: new Date().toISOString()
      }
    };
    
    // 如果提供了回调函数，则调用它通知父组件电路设计已经改变
    if (onCircuitDesignChange) {
      onCircuitDesignChange(circuitDesign);
    }
    
    return circuitDesign;
  }, [nodes, edges, onCircuitDesignChange]);

  // 每当节点或边发生变化时，更新电路设计
  useEffect(() => {
    if (nodes.length > 0 || edges.length > 0) {
      convertToCircuitDesign();
    }
  }, [nodes, edges, convertToCircuitDesign]);

  // 分析电路
  const handleAnalyzeCircuit = useCallback(async () => {
    try {
      setIsAnalyzing(true);
      const circuitDesign = convertToCircuitDesign();
      
      // 检查电路是否为空
      if (circuitDesign.elements.length === 0) {
        message.error('电路中没有元件，请先添加元件');
        setIsAnalyzing(false);
        return;
      }
      
      // 检查电路连接
      if (circuitDesign.connections.length === 0) {
        message.error('电路中没有连接，请先连接元件');
        setIsAnalyzing(false);
        return;
      }

      // 不再需要生成文本描述，直接使用CircuitDesign对象作为prompt
      
      // 创建AI任务，直接使用createAiTask接口
      const createAiTaskDTO: CreateAiTaskDTO = {
        type: 'CIRCUIT_ANALYSIS',
        // 将CircuitDesign对象转为字符串作为prompt
        prompt: JSON.stringify(circuitDesign),
        // 不再需要使用promptParams传递电路数据
        promptParams: null,
        convId: null,
        parentId: null,
        model: selectedModel
      };
      
      console.log('发送电路分析AI任务', createAiTaskDTO);
      
      // 创建AI任务并获取结果
      const response = await createAiTask(createAiTaskDTO);
      
      // 计数+1
      handleAiTaskCountPlus();
      
      // 成功提示
      message.success('电路分析已发送，正在处理...');
      
      // 跳转到Flow页面展示结果
      handleBlankQuery(response);
      
      // 关闭分析弹窗
      setAnalysisModalVisible(false);
      setIsAnalyzing(false);
    } catch (error) {
      console.error('电路分析失败:', error);
      if (error instanceof Error) {
        // 对于参数错误，给出更具体的提示
        if (error.message.includes('参数错误')) {
          Modal.error({
            title: '电路分析请求发送失败',
            content: (
              <div>
                <p>服务器拒绝了分析请求，可能是因为电路设计不完整或存在错误：</p>
                <ul>
                  <li>检查电路是否有完整的闭合回路</li>
                  <li>确保所有元件的参数设置合理</li>
                  <li>您可能需要连接接地或补充缺失的元件</li>
                </ul>
                <p>技术错误信息: {error.message}</p>
              </div>
            )
          });
        } else {
          message.error(`电路分析失败: ${error.message || '未知错误'}`);
        }
      } else {
        message.error('电路分析失败，请检查电路连接是否完整');
      }
      setIsAnalyzing(false);
    }
  }, [convertToCircuitDesign, selectedModel, handleBlankQuery, handleAiTaskCountPlus]);

  // SPICE网表生成功能已废弃，现在通过AI任务分析电路

  // 分析结果弹窗
  const renderAnalysisResults = () => {
    if (!analysisResults) return null;
    
    return (
      <Modal
        title="电路分析结果"
        open={analysisModalVisible}
        onCancel={() => setAnalysisModalVisible(false)}
        width={800}
        footer={[
          <Button key="close" onClick={() => setAnalysisModalVisible(false)}>
            关闭
          </Button>
        ]}
      >
        <div className="circuit-analysis-results">
          {/* 统计信息 */}
          {analysisResults.statistics && (
            <div style={{ marginBottom: '20px', backgroundColor: '#f5f5f5', padding: '16px', borderRadius: '4px' }}>
              <h3>电路统计</h3>
              <div style={{ display: 'flex', justifyContent: 'space-between' }}>
                <div>
                  <p><strong>节点数:</strong> {analysisResults.statistics.nodes}</p>
                  <p><strong>元件数:</strong> {analysisResults.statistics.components}</p>
                </div>
                <div>
                  <p><strong>方程数:</strong> {analysisResults.statistics.equations || 'N/A'}</p>
                  <p><strong>求解时间:</strong> {analysisResults.statistics.solveTime ? `${analysisResults.statistics.solveTime}ms` : 'N/A'}</p>
                </div>
              </div>
            </div>
          )}

          {/* 节点电压 */}
          <div style={{ marginBottom: '20px' }}>
            <h3>节点电压</h3>
            {analysisResults.voltages && Object.keys(analysisResults.voltages).length > 0 ? (
              <ul style={{ listStyleType: 'none', padding: 0 }}>
                {Object.entries(analysisResults.voltages).map(([node, value], index) => (
                  <li key={index} style={{ padding: '8px', backgroundColor: index % 2 === 0 ? '#f9f9f9' : 'white', borderRadius: '4px' }}>
                    <strong>节点 {node}:</strong> {typeof value === 'number' ? value.toFixed(3) : value}V
                  </li>
                ))}
              </ul>
            ) : (
              <p>无节点电压数据</p>
            )}
          </div>
          
          {/* 分支电流 */}
          {analysisResults.currents && Object.keys(analysisResults.currents).length > 0 && (
            <div style={{ marginBottom: '20px' }}>
              <h3>分支电流</h3>
              <ul style={{ listStyleType: 'none', padding: 0 }}>
                {Object.entries(analysisResults.currents).map(([branch, value], index) => (
                  <li key={index} style={{ padding: '8px', backgroundColor: index % 2 === 0 ? '#f9f9f9' : 'white', borderRadius: '4px' }}>
                    <strong>分支 {branch}:</strong> {typeof value === 'number' ? value.toFixed(6) : value}A
                  </li>
                ))}
              </ul>
            </div>
          )}
          
          {/* 功率消耗 */}
          {analysisResults.powerConsumption && Object.keys(analysisResults.powerConsumption).length > 0 && (
            <div style={{ marginBottom: '20px' }}>
              <h3>功率消耗</h3>
              <ul style={{ listStyleType: 'none', padding: 0 }}>
                {Object.entries(analysisResults.powerConsumption).map(([component, value], index) => (
                  <li key={index} style={{ padding: '8px', backgroundColor: index % 2 === 0 ? '#f9f9f9' : 'white', borderRadius: '4px' }}>
                    <strong>元件 {component}:</strong> {typeof value === 'number' ? value.toFixed(3) : value}W
                  </li>
                ))}
              </ul>
            </div>
          )}
          
          {/* 频率响应 */}
          {analysisResults.frequencyResponse && (
            <div style={{ marginBottom: '20px' }}>
              <h3>频率响应</h3>
              <div style={{ border: '1px solid #ddd', padding: '16px', borderRadius: '4px', backgroundColor: '#fafafa' }}>
                <p style={{ textAlign: 'center', color: '#666' }}>频率响应图表将显示在此处 (需集成图表库)</p>
              </div>
            </div>
          )}
          
          {/* 瞬态响应 */}
          {analysisResults.transientResponse && (
            <div style={{ marginBottom: '20px' }}>
              <h3>瞬态响应</h3>
              <div style={{ border: '1px solid #ddd', padding: '16px', borderRadius: '4px', backgroundColor: '#fafafa' }}>
                <p style={{ textAlign: 'center', color: '#666' }}>瞬态响应图表将显示在此处 (需集成图表库)</p>
              </div>
            </div>
          )}
          
          {/* 分析摘要 - 警告和错误 */}
          <div style={{ marginTop: '20px' }}>
            <h3>分析摘要</h3>
            {/* 警告信息 */}
            {analysisResults.warnings && analysisResults.warnings.length > 0 ? (
              <div style={{ padding: '8px 16px', backgroundColor: '#fffbe6', border: '1px solid #ffe58f', borderRadius: '4px', marginBottom: '10px' }}>
                <h4 style={{ color: '#d4b106', margin: '8px 0' }}>警告</h4>
                <ul>
                  {analysisResults.warnings.map((warning, index) => (
                    <li key={index}>{warning}</li>
                  ))}
                </ul>
              </div>
            ) : (
              <p style={{ color: 'green' }}>分析完成，无警告</p>
            )}
            
            {/* 错误信息 */}
            {analysisResults.errors && analysisResults.errors.length > 0 && (
              <div style={{ padding: '8px 16px', backgroundColor: '#fff2f0', border: '1px solid #ffccc7', borderRadius: '4px' }}>
                <h4 style={{ color: '#cf1322', margin: '8px 0' }}>错误</h4>
                <ul>
                  {analysisResults.errors.map((error, index) => (
                    <li key={index}>{error}</li>
                  ))}
                </ul>
              </div>
            )}
          </div>
        </div>
      </Modal>
    );
  };

  return (
    <div style={{ width: '100%', height: '80vh' }} ref={reactFlowWrapper}>
      <ReactFlow
        nodes={nodes}
        edges={edges}
        onNodesChange={onNodesChange}
        onEdgesChange={onEdgesChange}
        onConnect={onConnect}
        nodeTypes={nodeTypes}
        connectionLineComponent={ConnectionLine}
        fitView
      >
        <Background color="#aaa" gap={16} />
        <Controls />
        
        <Panel position="top-left">
          <Space wrap>
            <Dropdown
              menu={{
                items: elementMenuItems,
                onClick: ({ key }) => addNewNode(key as CircuitElementType),
              }}
            >
              <Button type="primary">
                <Space>
                  <PlusOutlined />
                  添加元件
                  <DownOutlined />
                </Space>
              </Button>
            </Dropdown>
            
            <Button 
              icon={<PlayCircleOutlined />} 
              onClick={handleAnalyzeCircuit}
              loading={isAnalyzing}
            >
              发送分析任务
            </Button>
          </Space>
        </Panel>
      </ReactFlow>
      
      {renderAnalysisResults()}
      
      {isAnalyzing && (
        <div style={{ 
          position: 'absolute', 
          top: 0, 
          left: 0, 
          width: '100%', 
          height: '100%', 
          display: 'flex', 
          justifyContent: 'center', 
          alignItems: 'center',
          backgroundColor: 'rgba(255, 255, 255, 0.7)',
          zIndex: 1000
        }}>
          <Spin size="large" spinning={true} fullscreen tip="正在发送电路分析任务..." />
        </div>
      )}
    </div>
  );
};

interface CircuitFlowWithProviderProps extends CircuitFlowProps {}

export const CircuitFlowWithProvider = ({ onCircuitDesignChange, selectedModel }: CircuitFlowWithProviderProps) => (
  <ReactFlowProvider>
    <CircuitFlow 
      onCircuitDesignChange={onCircuitDesignChange}
      selectedModel={selectedModel}
    />
  </ReactFlowProvider>
);