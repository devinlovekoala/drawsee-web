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
import ConnectionEdge, { ConnectionPreview } from './ConnectionEdge';
import { 
  CircuitElement, 
  CircuitElementType, 
  CircuitDesign, 
  Port,
  ComponentVisualConfig
} from '@/api/types/circuit.types';
import { createAiTask } from '@/api/methods/flow.methods';
import { useAppContext } from '@/app/contexts/AppContext';
import { CreateAiTaskDTO } from '@/api/types/flow.types';
import { useNavigate } from 'react-router-dom';
import { useHotkeys } from 'react-hotkeys-hook';
import { ModelSelector } from '@/app/pages/blank/components/ModelSelector';
import { ModelType } from '@/app/pages/flow/components/input/FlowInputPanel';

// 唯一节点ID生成
let nodeIdCounter = 1;
const getNewNodeId = () => `node-${nodeIdCounter++}`;

// 定义节点类型
const nodeTypes = {
  circuitNode: CircuitNode,
};

// 定义边类型
const edgeTypes = {
  default: ConnectionEdge,
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
  {
    key: CircuitElementType.OPAMP,
    label: '运算放大器',
  },
];

// 默认端口配置
const defaultPorts = {
  [CircuitElementType.RESISTOR]: [
    { id: 'port1', name: '端口1', type: 'bidirectional' as const, position: { side: 'left' as const, x: 0, y: 50, align: 'center' as const } },
    { id: 'port2', name: '端口2', type: 'bidirectional' as const, position: { side: 'right' as const, x: 100, y: 50, align: 'center' as const } }
  ],
  [CircuitElementType.CAPACITOR]: [
    { id: 'port1', name: '端口1', type: 'bidirectional' as const, position: { side: 'left' as const, x: 0, y: 50, align: 'center' as const } },
    { id: 'port2', name: '端口2', type: 'bidirectional' as const, position: { side: 'right' as const, x: 100, y: 50, align: 'center' as const } }
  ],
  [CircuitElementType.INDUCTOR]: [
    { id: 'port1', name: '端口1', type: 'bidirectional' as const, position: { side: 'left' as const, x: 0, y: 50, align: 'center' as const } },
    { id: 'port2', name: '端口2', type: 'bidirectional' as const, position: { side: 'right' as const, x: 100, y: 50, align: 'center' as const } }
  ],
  [CircuitElementType.VOLTAGE_SOURCE]: [
    { id: 'positive', name: '正极', type: 'output' as const, position: { side: 'right' as const, x: 100, y: 50, align: 'center' as const } },
    { id: 'negative', name: '负极', type: 'input' as const, position: { side: 'left' as const, x: 0, y: 50, align: 'center' as const } }
  ],
  [CircuitElementType.CURRENT_SOURCE]: [
    { id: 'positive', name: '正极', type: 'output' as const, position: { side: 'right' as const, x: 100, y: 50, align: 'center' as const } },
    { id: 'negative', name: '负极', type: 'input' as const, position: { side: 'left' as const, x: 0, y: 50, align: 'center' as const } }
  ],
  [CircuitElementType.DIODE]: [
    { id: 'anode', name: '阳极', type: 'input' as const, position: { side: 'left' as const, x: 0, y: 50, align: 'center' as const } },
    { id: 'cathode', name: '阴极', type: 'output' as const, position: { side: 'right' as const, x: 100, y: 50, align: 'center' as const } }
  ],
  [CircuitElementType.TRANSISTOR_NPN]: [
    { id: 'base', name: '基极', type: 'input' as const, position: { side: 'left' as const, x: 0, y: 50, align: 'center' as const } },
    { id: 'collector', name: '集电极', type: 'input' as const, position: { side: 'right' as const, x: 100, y: 15, align: 'center' as const } },
    { id: 'emitter', name: '发射极', type: 'output' as const, position: { side: 'right' as const, x: 100, y: 85, align: 'center' as const } }
  ],
  [CircuitElementType.TRANSISTOR_PNP]: [
    { id: 'base', name: '基极', type: 'input' as const, position: { side: 'left' as const, x: 0, y: 50, align: 'center' as const } },
    { id: 'collector', name: '集电极', type: 'output' as const, position: { side: 'right' as const, x: 100, y: 15, align: 'center' as const } },
    { id: 'emitter', name: '发射极', type: 'input' as const, position: { side: 'right' as const, x: 100, y: 85, align: 'center' as const } }
  ],
  [CircuitElementType.GROUND]: [
    { id: 'ground', name: '接地点', type: 'input' as const, position: { side: 'top' as const, x: 50, y: 0, align: 'center' as const } }
  ],
  [CircuitElementType.OPAMP]: [
    { id: 'input1', name: '输入1', type: 'input' as const, position: { side: 'left' as const, x: 0, y: 30, align: 'center' as const } },
    { id: 'input2', name: '输入2', type: 'input' as const, position: { side: 'left' as const, x: 0, y: 70, align: 'center' as const } },
    { id: 'output', name: '输出', type: 'output' as const, position: { side: 'right' as const, x: 100, y: 50, align: 'center' as const } }
  ],
};

// 在文件顶部添加接口定义
interface CircuitFlowProps {
  onCircuitDesignChange?: (design: CircuitDesign) => void;
  selectedModel?: string;
}

export const CircuitFlow = ({ onCircuitDesignChange, selectedModel = 'doubao' }: CircuitFlowProps) => {
  const [nodes, setNodes] = useState<Node[]>([]);
  const [edges, setEdges] = useState<Edge[]>([]);
  const [isAnalyzing, setIsAnalyzing] = useState(false);
  const [selectedNodeId, setSelectedNodeId] = useState<string | null>(null);
  const [currentModel, setCurrentModel] = useState<ModelType>(selectedModel as ModelType);
  const [selectedEdgeId, setSelectedEdgeId] = useState<string | null>(null);
  
  const reactFlowInstance = useReactFlow();
  const reactFlowWrapper = useRef<HTMLDivElement>(null);
  const navigate = useNavigate();
  const { handleBlankQuery, handleAiTaskCountPlus, userInfo } = useAppContext();
  
  // 处理节点变更
  const onNodesChange = useCallback(
    (changes: NodeChange[]) => setNodes((nds) => applyNodeChanges(changes, nds)),
    []
  );

  // 处理边变更
  const onEdgesChange = useCallback(
    (changes: EdgeChange[]) => {
      setEdges((eds) => {
        const newEdges = applyEdgeChanges(changes, eds);
        // 如果选中的边被删除，清除选中状态
        if (selectedEdgeId && !newEdges.some(edge => edge.id === selectedEdgeId)) {
          setSelectedEdgeId(null);
        }
        return newEdges;
      });
    },
    [selectedEdgeId]
  );

  // 处理连接创建
  const onConnect = useCallback(
    (connection: Connection) => {
      // 检查连接是否有效
      if (!connection.source || !connection.target || !connection.sourceHandle || !connection.targetHandle) {
        message.warning('无效的连接，请确保正确连接两个端口');
        return;
      }

      // 清除之前选中的边缘
      setSelectedEdgeId(null);

      // 检查是否已存在相同的连接
      const connectionExists = edges.some(
        edge => 
          edge.source === connection.source && 
          edge.sourceHandle === connection.sourceHandle && 
          edge.target === connection.target && 
          edge.targetHandle === connection.targetHandle
      );

      if (connectionExists) {
        message.warning('此连接已存在');
        return;
      }

      // 检查是否连接到同一个节点上的不同端口
      if (connection.source === connection.target) {
        // 允许同一节点上的端口相连，适用于某些电路设计（如电阻自连）
        console.log('同一节点上的端口相连:', connection);
      }

      // 创建新的边对象
      const newEdge = {
        ...connection,
        id: `edge-${connection.source}-${connection.sourceHandle}-${connection.target}-${connection.targetHandle}`,
        type: 'default',
        animated: false,
        style: { stroke: '#3B82F6', strokeWidth: 2 },
        data: { label: '连线' }
      };
      
      setEdges((eds) => addEdge(newEdge, eds));
      message.success('连接成功', 0.5);
    },
    [edges]
  );

  // 创建新节点
  const addNewNode = useCallback(
    (type: CircuitElementType) => {
      // 使用ReactFlow实例计算新节点的位置
      const position = reactFlowInstance.project({
        x: Math.random() * 400 + 50,
        y: Math.random() * 400 + 50,
      });

      // 生成唯一ID
      const nodeId = getNewNodeId();
      
      // 节点标签
      const elementLabel = `${type}${nodeIdCounter - 1}`;
      
      // 获取节点默认值
      const defaultValues: Record<string, string> = {
        [CircuitElementType.RESISTOR]: '1kΩ',
        [CircuitElementType.CAPACITOR]: '1μF',
        [CircuitElementType.INDUCTOR]: '1mH',
        [CircuitElementType.VOLTAGE_SOURCE]: '5V',
        [CircuitElementType.CURRENT_SOURCE]: '10mA',
        [CircuitElementType.DIODE]: '',
        [CircuitElementType.TRANSISTOR_NPN]: '',
        [CircuitElementType.TRANSISTOR_PNP]: '',
        [CircuitElementType.GROUND]: '',
        [CircuitElementType.OPAMP]: '',
      };
      
      const elementValue = defaultValues[type] || '';
      
      // 获取节点默认端口配置
      const ports = (type in defaultPorts) 
        ? [...(defaultPorts[type as keyof typeof defaultPorts] || [])]
        : [];
      
      // 创建完整的CircuitElement对象
      const element: CircuitElement = {
        id: nodeId,
        type,
        position: { x: position.x, y: position.y },
        rotation: 0,
        ports,
        properties: {
          value: elementValue,
          label: elementLabel
        },
        label: elementLabel,
        value: elementValue
      };

      // 创建ReactFlow节点
      const newNode: Node = {
        id: nodeId,
        type: 'circuitNode',
        position,
        data: {
          type,
          label: elementLabel,
          value: elementValue,
          element
        },
      };

      setNodes((nds) => [...nds, newNode]);
      
      // 添加元件后显示简短提示
      message.success(`已添加${elementMenuItems.find(item => item.key === type)?.label || type}`, 1);
    },
    [reactFlowInstance]
  );

  // 将Flow画布数据转换为CircuitDesign格式
  const convertToCircuitDesign = useCallback((): CircuitDesign => {
    try {
      // 从节点中提取电路元件数据
      const elements = nodes.map(node => {
        // 如果节点已经包含完整的element数据，直接使用
        if (node.data.element) {
          return {
            ...node.data.element,
            position: node.position // 确保位置是最新的
          };
        }
        
        // 获取节点类型
        const nodeType = node.data.type as CircuitElementType;
        
        // 默认值设置
        const defaultValues: Record<string, string> = {
          [CircuitElementType.RESISTOR]: '1kΩ',
          [CircuitElementType.CAPACITOR]: '1μF',
          [CircuitElementType.INDUCTOR]: '1mH',
          [CircuitElementType.VOLTAGE_SOURCE]: '5V',
          [CircuitElementType.CURRENT_SOURCE]: '10mA',
          [CircuitElementType.DIODE]: '',
          [CircuitElementType.TRANSISTOR_NPN]: '',
          [CircuitElementType.TRANSISTOR_PNP]: '',
          [CircuitElementType.GROUND]: '',
          [CircuitElementType.OPAMP]: '',
        };
        
        // 获取默认端口配置
        const nodePorts = nodeType in defaultPorts 
          ? [...(defaultPorts[nodeType as keyof typeof defaultPorts] || [])]
          : [];
        
        // 构造元件对象
        return {
          id: node.id,
          type: nodeType,
          position: node.position,
          rotation: 0,
          label: node.data.label,
          value: node.data.value || defaultValues[nodeType] || '',
          ports: nodePorts,
          properties: {
            value: node.data.value || defaultValues[nodeType] || '',
            label: node.data.label
          }
        };
      });

      // 从边中提取连接数据
      const connections = edges.map(edge => ({
        id: edge.id,
        source: {
          elementId: edge.source,
          portId: edge.sourceHandle || ''
        },
        target: {
          elementId: edge.target,
          portId: edge.targetHandle || ''
        }
      }));

      // 创建电路设计对象
      const circuitDesign: CircuitDesign = {
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
    } catch (error) {
      console.error('转换电路设计时出错:', error);
      message.error('转换电路设计时出错');
      return {
        elements: [],
        connections: [],
        metadata: {
          title: '电路设计',
          description: '使用DrawSee创建的电路',
          createdAt: new Date().toISOString(),
          updatedAt: new Date().toISOString()
        }
      };
    }
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
      
      // 验证电路是否有接地元件
      const hasGround = circuitDesign.elements.some(el => el.type === CircuitElementType.GROUND);
      if (!hasGround) {
        message.error('电路中没有接地元件(GND)，请先添加接地点');
        setIsAnalyzing(false);
        return;
      }
      
      // 创建AI任务
      const createAiTaskDTO: CreateAiTaskDTO = {
        type: 'CIRCUIT_ANALYSIS',
        prompt: JSON.stringify(circuitDesign),
        promptParams: {},
        convId: null,
        parentId: null,
        model: currentModel
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
                  <li>确保电路有接地点(GND)元件</li>
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
  }, [convertToCircuitDesign, currentModel, handleBlankQuery, handleAiTaskCountPlus]);

  // 旋转选中的节点
  const rotateSelectedNode = useCallback(() => {
    if (!selectedNodeId) return;

    setNodes((nds) =>
      nds.map((node) => {
        if (node.id === selectedNodeId) {
          // 获取当前旋转角度
          const currentRotation = node.data.element?.rotation || 0;
          // 计算新的旋转角度 (0 -> 90 -> 180 -> 270 -> 0)
          const newRotation = (currentRotation + 90) % 360;
          
          // 更新节点数据
          return {
            ...node,
            data: {
              ...node.data,
              element: {
                ...node.data.element,
                rotation: newRotation,
              },
            },
          };
        }
        return node;
      })
    );
  }, [selectedNodeId, setNodes]);
  
  // 删除选中的节点
  const deleteSelectedNode = useCallback(() => {
    if (!selectedNodeId) return;
    
    // 删除连接到该节点的所有边
    setEdges((edges) => 
      edges.filter(
        (edge) => edge.source !== selectedNodeId && edge.target !== selectedNodeId
      )
    );
    
    // 删除节点
    setNodes((nodes) => nodes.filter((node) => node.id !== selectedNodeId));
    
    // 清除选中状态
    setSelectedNodeId(null);
    
    message.info('元件已删除');
  }, [selectedNodeId]);
  
  // 处理节点选择
  const onNodeClick = useCallback((event: React.MouseEvent, node: Node) => {
    setSelectedNodeId(node.id);
  }, []);
  
  // 处理边点击
  const onEdgeClick = useCallback((e: React.MouseEvent, edge: Edge) => {
    setSelectedEdgeId(edge.id);
    // 取消选中节点
    setSelectedNodeId(null);
    e.stopPropagation();
  }, []);
  
  // 处理删除键按下
  const handleKeyDown = useCallback((e: KeyboardEvent) => {
    if ((e.key === 'Delete' || e.key === 'Backspace') && selectedEdgeId) {
      setEdges((eds) => eds.filter((edge) => edge.id !== selectedEdgeId));
      setSelectedEdgeId(null);
      message.info('连线已删除');
    }
  }, [selectedEdgeId]);
  
  // 添加键盘事件监听
  useEffect(() => {
    window.addEventListener('keydown', handleKeyDown);
    return () => {
      window.removeEventListener('keydown', handleKeyDown);
    };
  }, [handleKeyDown]);
  
  // 添加画布点击处理以取消选择
  const onPaneClick = useCallback(() => {
    setSelectedNodeId(null);
    setSelectedEdgeId(null);
  }, []);
  
  // 注册快捷键
  useHotkeys('ctrl+r', (event) => {
    event.preventDefault();
    rotateSelectedNode();
  }, [rotateSelectedNode]);
  
  useHotkeys('ctrl+d, delete', (event) => {
    event.preventDefault();
    deleteSelectedNode();
  }, [deleteSelectedNode]);

  // 添加边缘选中状态的更新逻辑
  useEffect(() => {
    if (selectedEdgeId) {
      setEdges((eds) =>
        eds.map((edge) => ({
          ...edge,
          selected: edge.id === selectedEdgeId,
        }))
      );
    }
  }, [selectedEdgeId]);

  return (
    <div ref={reactFlowWrapper} style={{ width: '100%', height: '100%' }}>
      <ReactFlow
        nodes={nodes}
        edges={edges}
        onNodesChange={onNodesChange}
        onEdgesChange={onEdgesChange}
        onConnect={onConnect}
        nodeTypes={nodeTypes}
        edgeTypes={edgeTypes}
        connectionLineComponent={ConnectionPreview}
        deleteKeyCode={['Backspace', 'Delete']}
        multiSelectionKeyCode={['Control', 'Meta']}
        snapToGrid={true}
        snapGrid={[15, 15]}
        defaultViewport={{ x: 0, y: 0, zoom: 1 }}
        fitView
        attributionPosition="bottom-left"
        // @ts-ignore
        connectionMode="loose"
        defaultMarkerColor="#3B82F6"
        connectOnClick={true}
        connectionRadius={20}
        isValidConnection={() => true}
        onNodeClick={(_, node) => setSelectedNodeId(node.id)}
        onEdgeClick={onEdgeClick}
        onPaneClick={onPaneClick}
        elementsSelectable={true}
        selectNodesOnDrag={false}
        edgesFocusable={true}
        edgesUpdatable={true}
      >
        <Background />
        <Controls />
        <Panel position="top-left" style={{ marginLeft: '10px', marginTop: '10px' }}>
          <Space wrap direction="horizontal">
            <Dropdown
              menu={{
                items: elementMenuItems.map(item => ({
                  key: item.key,
                  label: item.label,
                  onClick: () => addNewNode(item.key as CircuitElementType)
                })),
              }}
              placement="bottomLeft"
            >
              <Button type="primary" icon={<PlusOutlined />}>
                添加元件 <DownOutlined />
              </Button>
            </Dropdown>
            <Button onClick={() => setEdges([])} danger>清除所有连接</Button>
            <ModelSelector
              selectedModel={currentModel}
              onModelChange={setCurrentModel}
            />
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
      
      {/* 快捷键说明 */}
      <div style={{ 
        position: 'absolute', 
        bottom: 10, 
        right: 10, 
        padding: '5px 10px',
        background: 'rgba(255, 255, 255, 0.8)',
        borderRadius: '4px',
        fontSize: '12px',
        color: '#666'
      }}>
        <div>Ctrl+R: 旋转元件</div>
        <div>Delete/Ctrl+D: 删除元件</div>
        <div>Delete/Backspace: 删除选中连线</div>
      </div>
      
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
          <Spin size="large" spinning={true} tip="正在发送电路分析任务..." />
        </div>
      )}
    </div>
  );
};

export const CircuitFlowWithProvider = ({ onCircuitDesignChange, selectedModel }: CircuitFlowProps) => (
  <ReactFlowProvider>
    <CircuitFlow 
      onCircuitDesignChange={onCircuitDesignChange}
      selectedModel={selectedModel}
    />
  </ReactFlowProvider>
);