'use client';

import React, { useCallback, useState, useRef, useEffect } from 'react';
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
  useReactFlow,
  ReactFlowProvider,
  Panel
} from 'reactflow';
import { Button, Dropdown, message, Space, Modal, Spin } from 'antd';
import { DownOutlined, PlusOutlined, PlayCircleOutlined } from '@ant-design/icons';
import 'reactflow/dist/style.css';
import { CircuitNode } from './CircuitNode';
import ConnectionEdge, { ConnectionPreview } from './ConnectionEdge';
import ComponentConfig from './ComponentConfig';
import { 
  CircuitElementType, 
  CircuitDesign, 
  Port,
  CircuitElement
} from '@/api/types/circuit.types';
import { createAiTask } from '@/api/methods/flow.methods';
import { CircuitNodeData, ModelType } from '../types';
import { useAppContext } from '@/app/contexts/AppContext';
import { CreateAiTaskDTO } from '@/api/types/flow.types';
import { useHotkeys } from 'react-hotkeys-hook';
import { ModelSelector } from '@/app/pages/blank/components/ModelSelector';
import { ModelType as FlowModelType } from '@/app/pages/flow/components/input/FlowInputPanel';
import ElementLibrary from './ElementLibrary';
import CircuitToolbar from './CircuitToolbar';

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
  initialCircuitDesign?: CircuitDesign; // 添加初始电路设计数据
  isReadOnly?: boolean; // 是否为只读模式，禁用编辑功能
  classId?: string | null; // 添加班级ID参数
  onModelChange?: (model: FlowModelType) => void; // 修改为使用 FlowModelType
}

export const CircuitFlow = ({ onCircuitDesignChange, selectedModel = 'deepseekV3', initialCircuitDesign, isReadOnly = false, classId = null, onModelChange }: CircuitFlowProps) => {
  const [nodes, setNodes] = useState<Node[]>([]);
  const [edges, setEdges] = useState<Edge[]>([]);
  const [isAnalyzing, setIsAnalyzing] = useState(false);
  const [selectedNodeId, setSelectedNodeId] = useState<string | null>(null);
  const [currentModel, setCurrentModel] = useState<FlowModelType>(selectedModel as FlowModelType);
  const [selectedEdgeId, setSelectedEdgeId] = useState<string | null>(null);
  const [showElementLibrary, setShowElementLibrary] = useState<boolean>(true);
  const [canUndo, setCanUndo] = useState<boolean>(false);
  const [canRedo, setCanRedo] = useState<boolean>(false);
  const [fullScreenMode, setFullScreenMode] = useState<boolean>(false);
  const [historyState, setHistoryState] = useState<{
    past: any[],
    present: any,
    future: any[]
  }>({ past: [], present: null, future: [] });
  // 添加配置面板状态
  const [configVisible, setConfigVisible] = useState<boolean>(false);
  const [selectedElement, setSelectedElement] = useState<CircuitNodeData | null>(null);
  
  const reactFlowInstance = useReactFlow();
  const reactFlowWrapper = useRef<HTMLDivElement>(null);
  const { handleBlankQuery, handleAiTaskCountPlus } = useAppContext();
  
  // 监视节点变化
  useEffect(() => {
    console.log(`节点数组已更新，当前有 ${nodes.length} 个节点:`);
    nodes.forEach((node, index) => {
      console.log(`节点 ${index + 1}:`, node.id, '类型:', node.type);
    });
  }, [nodes]);
  
  // 显示班级ID信息（如果有）
  useEffect(() => {
    if (classId) {
      console.log('当前班级ID:', classId);
    }
  }, [classId]);
  
  // 加载初始电路设计数据
  useEffect(() => {
    if (initialCircuitDesign && initialCircuitDesign.elements.length > 0) {
      console.log('加载初始电路设计数据', initialCircuitDesign);
      
      // 将电路设计元素转换为节点
      const newNodes = initialCircuitDesign.elements.map(element => {
        // 创建完整的结构化节点数据
        const completeNodeData = {
          id: element.id,
          type: element.type,
          label: element.label || `${element.type}`,
          value: element.value || '',
          element: element,
          description: '',
          ports: element.ports || []
        };
        
        return {
          id: element.id,
          type: 'circuitNode',
          position: element.position,
          data: completeNodeData
        };
      });
      
      // 将电路设计连接转换为边
      const newEdges = initialCircuitDesign.connections.map(connection => {
        const edgeId = `edge-${connection.source.elementId}-${connection.source.portId}-${connection.target.elementId}-${connection.target.portId}`;
        return {
          id: edgeId,
          source: connection.source.elementId,
          sourceHandle: connection.source.portId,
          target: connection.target.elementId,
          targetHandle: connection.target.portId,
          type: 'default',
          animated: false,
          style: { stroke: '#3B82F6', strokeWidth: 2 },
          data: {}
        };
      });
      
      setNodes(newNodes);
      setEdges(newEdges);
      
      // 稍微延迟后重新计算视图，确保所有节点都已渲染
      setTimeout(() => {
        reactFlowInstance.fitView({ padding: 0.2 });
      }, 100);
    }
  }, [initialCircuitDesign, reactFlowInstance]);
  
  // 监听节点旋转事件，更新连线
  useEffect(() => {
    const handleNodeRotated = (event: CustomEvent) => {
      const { nodeId, rotation } = event.detail;
      
      // 找到与旋转节点相关的所有边
      const relatedEdges = edges.filter(
        edge => edge.source === nodeId || edge.target === nodeId
      );
      
      if (relatedEdges.length > 0) {
        // 强制边重新渲染
        setEdges(currentEdges => {
          return currentEdges.map(edge => {
            if (edge.source === nodeId || edge.target === nodeId) {
              return {
                ...edge,
                data: {
                  ...edge.data,
                  updateRotation: rotation,
                  updateTimestamp: Date.now()
                }
              };
            }
            return edge;
          });
        });
        
        // 轻微延迟后重新计算流程图视图
        setTimeout(() => {
          reactFlowInstance.setNodes([...reactFlowInstance.getNodes()]);
        }, 10);
      }
    };
    
    // 添加自定义事件监听
    document.addEventListener('circuit-node-rotated', handleNodeRotated as EventListener);
    
    return () => {
      document.removeEventListener('circuit-node-rotated', handleNodeRotated as EventListener);
    };
  }, [edges, reactFlowInstance]);
  
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
        data: {}
      };
      
      setEdges((eds) => addEdge(newEdge, eds));
      message.success('连接成功', 0.5);
    },
    [edges]
  );

  // 添加一个函数来处理元件双击事件
  const handleNodeDoubleClick = useCallback((nodeId: string) => {
    console.log('CircuitFlow.handleNodeDoubleClick 被调用，nodeId:', nodeId);
    console.log('当前所有节点:', nodes);
    
    const node = nodes.find(n => n.id === nodeId);
    if (node) {
      console.log('找到节点数据:', node.data);
      
      // 创建一个完整的数据对象，只包含 CircuitNodeData 支持的属性
      const nodeData = {
        id: node.id,
        label: node.data.label || '',
        value: node.data.value || '',
        element: node.data.element,
        description: '',
        ports: node.data.ports || [],
      };
      
      console.log('设置 selectedElement:', nodeData);
      setSelectedElement(nodeData);
      
      console.log('设置 configVisible = true');
      setConfigVisible(true);
    } else {
      console.warn('未找到节点数据 id:', nodeId);
      console.warn('请确认节点ID是否正确，所有节点ID:', nodes.map(n => n.id));
    }
  }, [nodes]);

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
      
      // 获取枚举键名，用于节点标签
      const elementTypeKey = Object.keys(CircuitElementType).find(
        key => CircuitElementType[key as keyof typeof CircuitElementType] === type
      ) || String(type);
      
      // 节点标签 - 使用枚举名称作为前缀
      const elementLabel = `${elementTypeKey}${nodeIdCounter - 1}`;
      
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
        type, // 直接使用 CircuitElementType 枚举值，这是合法的
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

      // 创建完整的结构化节点数据
      const completeNodeData = {
        type,
        label: elementLabel,
        value: elementValue,
        element: element,
        id: nodeId,
        ports: ports,
        description: ''
      };

      // 创建ReactFlow节点
      const newNode: Node = {
        id: nodeId,
        type: 'circuitNode',
        position,
        data: {
          ...completeNodeData,
          // 不需要单独的回调函数，直接通过 ReactFlow 的 onNodeDoubleClick 处理
        },
      };

      console.log('添加新节点，完整数据:', newNode);
      
      // 使用函数形式更新状态，确保获取最新的节点列表
      setNodes(currentNodes => {
        const updatedNodes = [...currentNodes, newNode];
        console.log('更新后的节点列表:', updatedNodes.map(n => ({ id: n.id, type: n.data.type })));
        return updatedNodes;
      });
      
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
          const elementData = { 
            ...node.data.element,
            position: node.position, // 确保位置是最新的
          };
          
          // 确保元件类型正确
          const validTypes = Object.values(CircuitElementType);
          if (!validTypes.includes(elementData.type as CircuitElementType)) {
            console.warn(`元件类型 ${elementData.type} 不在预定义类型中，请检查`);
          }
          
          // 确保element.properties中必须有resistance/voltage等标准属性
          if (!elementData.properties.hasOwnProperty('value') && elementData.value) {
            elementData.properties.value = elementData.value;
          }
          
          if (!elementData.properties.hasOwnProperty('label') && elementData.label) {
            elementData.properties.label = elementData.label;
          }
          
          // 确保每个端口都有正确的position属性
          elementData.ports = elementData.ports.map((port: Port) => {
            if (!port.position.hasOwnProperty('align')) {
              port.position.align = 'center';
            }
            return port;
          });
          
          return elementData;
        }
        
        // 获取节点类型，确保类型符合后端期望
        const nodeType = node.data.type;
        
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
        
        // 根据节点类型获取默认端口配置
        const ports = (nodeType in defaultPorts) 
          ? [...(defaultPorts[nodeType as keyof typeof defaultPorts] || [])]
          : [];
        
        // 确保端口配置符合文档规范
        const standardizedPorts = ports.map((port: Port) => ({
          ...port,
          position: {
            ...port.position,
            align: port.position.align || 'center'
          }
        }));
        
        // 构造符合文档规范的CircuitElement对象
        const elementValue = node.data.value || defaultValues[nodeType as CircuitElementType] || '';
        const elementLabel = node.data.label || `${nodeType}${node.id.replace('node-', '')}`;
        
        return {
          id: node.id,
          type: nodeType,
          position: node.position,
          rotation: node.data.element?.rotation || 0,
          ports: standardizedPorts,
          properties: {
            value: elementValue,  // 元件值（如电阻值、电压值）
            label: elementLabel   // 元件标签
          },
          label: elementLabel,
          value: elementValue
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

      // 创建符合文档规范的电路设计对象
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
      
      // 深拷贝电路设计，以便修改而不影响原始对象
      const processedCircuitDesign = JSON.parse(JSON.stringify(circuitDesign));
      
      // 确保所有元件类型在 CircuitElementType 枚举中
      const validTypes = Object.values(CircuitElementType);
      
      // 检查是否有无效的元件类型
      const invalidElements = processedCircuitDesign.elements.filter(
        (element: any) => !validTypes.includes(element.type)
      );
      
      if (invalidElements.length > 0) {
        const invalidTypes = invalidElements.map((e: any) => e.type).join(', ');
        message.error(`电路包含无效的元件类型：${invalidTypes}`);
        console.error('无效的元件类型：', invalidElements);
        setIsAnalyzing(false);
        return;
      }
      
      // 按照文档规范构造电路分析任务数据
      const createAiTaskDTO: CreateAiTaskDTO = {
        type: 'CIRCUIT_ANALYSIS',
        // 按照文档规范，prompt需要是具有特定格式的对象
        prompt: JSON.stringify(processedCircuitDesign),
        promptParams: {},
        convId: null,
        parentId: null,
        model: currentModel,
        classId: classId // 添加班级ID
      };
      
      console.log('发送电路分析AI任务', createAiTaskDTO);
      
      // 创建AI任务并获取结果
      const response = await createAiTask(createAiTaskDTO);
      
      // 计数+1
      handleAiTaskCountPlus();
      
      // 成功提示
      message.success('电路分析已发送，正在处理...');
      
      // 将classId存储到sessionStorage，以便在flow页面获取
      if (classId) {
        sessionStorage.setItem(`circuit_class_id_${response.conversation.id}`, classId);
      }
      
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
                  <li>您可能需要补充缺失的元件（如接地元件）</li>
                  <li>检查元件类型是否与API预期一致</li>
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
  }, [convertToCircuitDesign, currentModel, handleBlankQuery, handleAiTaskCountPlus, classId]);

  // 旋转选中的节点
  const rotateSelectedNode = useCallback(() => {
    if (!selectedNodeId) return;

    // 先更新节点的旋转状态
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
    
    // 等待DOM更新并处理连线重绘
    setTimeout(() => {
      // 强制触发ReactFlow内部更新
      reactFlowInstance.setNodes(reactFlowInstance.getNodes());
      
      // 找到与选中节点相关的所有边
      const relatedEdges = edges.filter(
        edge => edge.source === selectedNodeId || edge.target === selectedNodeId
      );
      
      if (relatedEdges.length > 0) {
        // 首先删除所有相关的边，稍后会重新创建它们
        setEdges(currentEdges => 
          currentEdges.filter(edge => 
            edge.source !== selectedNodeId && edge.target !== selectedNodeId
          )
        );
        
        // 稍微延迟后重新创建这些边，以便ReactFlow能重新计算连接点位置
        setTimeout(() => {
          setEdges(currentEdges => [
            ...currentEdges,
            ...relatedEdges.map(edge => ({
              ...edge,
              id: `${edge.id}-${Date.now()}`, // 创建新的ID以确保ReactFlow重新渲染
              // 强制标记为需要重新计算
              data: {
                ...edge.data,
                forceRefresh: true,
                updateTimestamp: Date.now(),
              }
            }))
          ]);
          
          // 再次强制ReactFlow重新计算所有位置
          setTimeout(() => {
            reactFlowInstance.fitView({ duration: 0, padding: 0.1 });
          }, 50);
        }, 50);
      } else {
        // 即使没有相关边，也强制刷新视图以确保端口位置正确
        reactFlowInstance.fitView({ duration: 0, padding: 0.1 });
      }
    }, 100);
  }, [selectedNodeId, setNodes, edges, setEdges, reactFlowInstance]);
  
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

  // 添加一个函数来处理元件配置更新
  const handleElementUpdate = useCallback((id: string, updates: Partial<CircuitNodeData>) => {
    setNodes(currentNodes => 
      currentNodes.map(node => {
        if (node.id === id) {
          const updatedData = {
            ...node.data,
            ...updates,
            label: updates.label || node.data.label,
            value: updates.value || node.data.value
          };
          
          // 如果有 element 属性，也要更新它
          if (node.data.element) {
            updatedData.element = {
              ...node.data.element,
              label: updates.label || node.data.element.label,
              value: updates.value || node.data.element.value
            };
          }
          
          return {
            ...node,
            data: updatedData
          };
        }
        return node;
      })
    );
    
    message.success('元件已更新', 1);
  }, []);

  // 监控配置面板显示状态的变化
  useEffect(() => {
    console.log('配置面板显示状态变更:', configVisible ? '显示' : '隐藏');
    if (configVisible) {
      console.log('当前选中的元素:', selectedElement);
    }
  }, [configVisible, selectedElement]);

  return (
    <div ref={reactFlowWrapper} className="flex flex-row w-full h-full bg-white">
      {/* 左侧元件库面板 */}
      {!isReadOnly && showElementLibrary && (
        <div className="w-64 h-full overflow-auto border-r border-gray-200">
          <ElementLibrary onSelectElement={addNewNode} />
        </div>
      )}
      
      {/* 主画布区域 */}
      <div className="flex-1 flex flex-col h-full">
        {/* 工具栏 */}
        {!isReadOnly && (
          <CircuitToolbar 
            onSave={() => console.log('保存电路设计')}
            onUndo={() => {
              // Undo逻辑
              if (historyState.past.length > 0) {
                // TODO: 实现Undo功能
              }
            }}
            onRedo={() => {
              // Redo逻辑
              if (historyState.future.length > 0) {
                // TODO: 实现Redo功能
              }
            }}
            onCopy={() => {
              // 复制选中节点
              if (selectedNodeId) {
                // TODO: 实现复制功能
              }
            }}
            onDelete={deleteSelectedNode}
            onRotate={rotateSelectedNode}
            onZoomIn={() => reactFlowInstance.zoomIn()}
            onZoomOut={() => reactFlowInstance.zoomOut()}
            onFitView={() => reactFlowInstance.fitView()}
            onFullScreen={() => setFullScreenMode(!fullScreenMode)}
            onExport={() => {
              // TODO: 实现导出功能
            }}
            onClearAll={() => {
              // 清除所有节点和边
              setNodes([]);
              setEdges([]);
            }}
            onAnalyze={handleAnalyzeCircuit}
            isAnalyzing={isAnalyzing}
            selectedModel={currentModel}
            onModelChange={(model) => {
              setCurrentModel(model);
              if (onModelChange) {
                onModelChange(model);
              }
            }}
            canUndo={canUndo}
            canRedo={canRedo}
            hasSelectedNode={!!selectedNodeId}
            hasContent={nodes.length > 0}
          />
        )}
      
        {/* 流程图区域 */}
        <div className="flex-1">
          <ReactFlow
            nodes={nodes}
            edges={edges}
            onNodesChange={isReadOnly ? undefined : onNodesChange}
            onEdgesChange={isReadOnly ? undefined : onEdgesChange}
            onConnect={isReadOnly ? undefined : onConnect}
            nodeTypes={nodeTypes}
            edgeTypes={edgeTypes}
            connectionLineComponent={ConnectionPreview}
            deleteKeyCode={isReadOnly ? null : ['Backspace', 'Delete']}
            multiSelectionKeyCode={isReadOnly ? null : ['Control', 'Meta']}
            snapToGrid={true}
            snapGrid={[15, 15]}
            defaultViewport={{ x: 0, y: 0, zoom: 1 }}
            fitView
            attributionPosition="bottom-left"
            // @ts-ignore
            connectionMode="loose"
            defaultMarkerColor="#3B82F6"
            connectOnClick={!isReadOnly}
            connectionRadius={20}
            isValidConnection={() => !isReadOnly}
            onNodeClick={isReadOnly ? undefined : (_, node) => setSelectedNodeId(node.id)}
            onNodeDoubleClick={isReadOnly ? undefined : (event, node) => {
              console.log('ReactFlow onNodeDoubleClick 事件触发，node.id:', node.id);
              // 阻止事件传播，避免与ReactFlow内置行为冲突
              event.preventDefault();
              event.stopPropagation();
              
              // 直接在这里处理节点双击，不通过回调
              console.log('直接处理双击事件，节点数据:', node);
              
              const nodeData = {
                id: node.id,
                label: node.data.label || '',
                value: node.data.value || '',
                element: node.data.element,
                description: '',
                ports: node.data.ports || [],
              };
              
              console.log('直接设置 selectedElement:', nodeData);
              setSelectedElement(nodeData);
              console.log('直接设置 configVisible = true');
              setConfigVisible(true);
            }}
            onEdgeClick={isReadOnly ? undefined : onEdgeClick}
            onPaneClick={onPaneClick}
            elementsSelectable={!isReadOnly}
            selectNodesOnDrag={!isReadOnly}
            edgesFocusable={!isReadOnly}
            edgesUpdatable={!isReadOnly}
            nodesDraggable={!isReadOnly}
            nodesConnectable={!isReadOnly}
            zoomOnScroll={true}
            panOnScroll={false}
            zoomOnDoubleClick={false}
            disableKeyboardA11y={true}
            className="circuit-flow-canvas"
          >
            <Background />
            <Controls />
          </ReactFlow>
        </div>
        
        {/* 状态信息栏 */}
        <div className="bg-gray-50 border-t border-gray-200 p-2 text-xs text-gray-600 flex justify-between">
          <div>元件: {nodes.length} | 连接: {edges.length}</div>
          
          {selectedNodeId && (
            <div className="text-blue-600">
              已选择: {nodes.find(node => node.id === selectedNodeId)?.data.label || selectedNodeId}
            </div>
          )}
          
          <div>
            <button 
              className="text-gray-500 hover:text-gray-800 transition-colors"
              onClick={() => setShowElementLibrary(!showElementLibrary)}
            >
              {showElementLibrary ? '隐藏元件库' : '显示元件库'}
            </button>
          </div>
        </div>
      </div>
      
      {/* 元件配置面板 */}
      <ComponentConfig 
        element={selectedElement}
        visible={configVisible}
        onClose={() => setConfigVisible(false)}
        onUpdate={handleElementUpdate}
      />
      
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
          backgroundColor: 'rgba(255, 255, 255, 0.8)',
          zIndex: 1000
        }}>
          <Spin size="large" spinning={true} tip="正在分析电路，请稍候..." />
        </div>
      )}
    </div>
  );
};

export const CircuitFlowWithProvider = ({ onCircuitDesignChange, selectedModel, initialCircuitDesign, isReadOnly, classId, onModelChange }: CircuitFlowProps) => (
  <ReactFlowProvider>
    <CircuitFlow 
      onCircuitDesignChange={onCircuitDesignChange}
      selectedModel={selectedModel}
      initialCircuitDesign={initialCircuitDesign}
      isReadOnly={isReadOnly}
      classId={classId}
      onModelChange={onModelChange}
    />
  </ReactFlowProvider>
);