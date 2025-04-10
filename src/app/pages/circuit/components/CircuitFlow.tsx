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
import { analyzeCircuit, generateSpiceNetlist } from '@/api/methods/tool.methods';

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

export const CircuitFlow = () => {
  const [nodes, setNodes] = useState<Node[]>([]);
  const [edges, setEdges] = useState<Edge[]>([]);
  const [isAnalyzing, setIsAnalyzing] = useState(false);
  const [analysisResults, setAnalysisResults] = useState<CircuitAnalysisResult | null>(null);
  const [analysisModalVisible, setAnalysisModalVisible] = useState(false);
  
  const reactFlowInstance = useReactFlow();
  const reactFlowWrapper = useRef<HTMLDivElement>(null);
  
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
        animated: false,
        style: { stroke: '#555', strokeWidth: 2 },
        markerEnd: {
          type: MarkerType.ArrowClosed,
          width: 15,
          height: 15,
          color: '#555',
        },
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

    return {
      elements,
      connections,
      metadata: {
        title: '电路设计',
        description: '使用DrawSee创建的电路',
        createdAt: new Date().toISOString(),
        updatedAt: new Date().toISOString()
      }
    };
  }, [nodes, edges]);

  // 分析电路
  const handleAnalyzeCircuit = useCallback(async () => {
    try {
      setIsAnalyzing(true);
      const circuitDesign = convertToCircuitDesign();
      const results = await analyzeCircuit({ circuitDesign });
      setAnalysisResults(results as CircuitAnalysisResult);
      setAnalysisModalVisible(true);
      setIsAnalyzing(false);
    } catch (error) {
      console.error('电路分析失败:', error);
      message.error('电路分析失败，请检查电路连接是否完整');
      setIsAnalyzing(false);
    }
  }, [convertToCircuitDesign]);

  // 获取SPICE网表
  const handleGenerateNetlist = useCallback(async () => {
    try {
      setIsAnalyzing(true);
      const circuitDesign = convertToCircuitDesign();
      const response = await generateSpiceNetlist({ circuitDesign });
      
      Modal.info({
        title: 'SPICE 网表',
        content: (
          <div>
            <pre style={{ maxHeight: '400px', overflow: 'auto' }}>
              {response.netlist}
            </pre>
          </div>
        ),
        width: 600,
      });
      
      setIsAnalyzing(false);
    } catch (error) {
      console.error('生成网表失败:', error);
      message.error('生成SPICE网表失败');
      setIsAnalyzing(false);
    }
  }, [convertToCircuitDesign]);

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
        <div>
          <h3>节点电压</h3>
          <ul>
            {Object.entries(analysisResults.voltages).map(([node, value], index) => (
              <li key={index}>
                节点 {node}: {value}V
              </li>
            ))}
          </ul>
          
          {analysisResults.frequencyResponse && (
            <div>
              <h3>频率响应</h3>
              <p>图表应显示在此处 (需集成图表库)</p>
            </div>
          )}
          
          {analysisResults.transientResponse && (
            <div>
              <h3>瞬态响应</h3>
              <p>图表应显示在此处 (需集成图表库)</p>
            </div>
          )}
          
          <h3>分析摘要</h3>
          <p>{analysisResults.warnings && analysisResults.warnings.length > 0 ? 
              `警告: ${analysisResults.warnings.join(', ')}` : 
              '分析完成，无警告'}</p>
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
              分析电路
            </Button>
            
            <Button 
              icon={<SaveOutlined />} 
              onClick={handleGenerateNetlist}
              disabled={isAnalyzing}
            >
              生成SPICE网表
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
          <Spin size="large" tip="正在分析电路..." />
        </div>
      )}
    </div>
  );
};

export const CircuitFlowWithProvider = () => (
  <ReactFlowProvider>
    <CircuitFlow />
  </ReactFlowProvider>
);