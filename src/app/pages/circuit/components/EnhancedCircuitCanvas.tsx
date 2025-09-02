/**
 * 集成增强连接系统的专业电路画布
 * 提供完整的点对点连接功能和用户体验
 */

'use client';

import { useState, useCallback, useMemo, useRef } from 'react';
import ReactFlow, {
  Node,
  Edge,
  addEdge,
  useNodesState,
  useEdgesState,
  Connection,
  ReactFlowProvider,
  Background,
  Controls,
  MiniMap,
  Panel,
  MarkerType,
  NodeTypes,
  EdgeTypes,
  ConnectionMode,
} from 'reactflow';
// import { toast } from 'react-toastify';

// 临时toast实现
const toast = {
  info: (message: string) => console.log('INFO:', message),
  success: (message: string) => console.log('SUCCESS:', message),
  error: (message: string) => console.log('ERROR:', message),
  warning: (message: string) => console.log('WARNING:', message),
};

import { CircuitElementType } from '@/api/types/circuit.types';
import { EnhancedCircuitNode } from './EnhancedCircuitNode';
import { EnhancedConnectionEdge, EnhancedConnectionPreview } from './EnhancedConnectionEdge';
import { ConnectionManager } from './EnhancedConnectionSystem';
import ElementLibrary from './ElementLibrary';

import 'reactflow/dist/style.css';

// 节点类型映射
const nodeTypes: NodeTypes = {
  enhancedCircuitNode: EnhancedCircuitNode,
};

// 边类型映射
const edgeTypes: EdgeTypes = {
  default: EnhancedConnectionEdge,
};

// 定义有效的边类型
type EnhancedEdgeType = 'default';


// 初始节点数据
const initialNodes: Node[] = [
  {
    id: 'demo-resistor-1',
    type: 'enhancedCircuitNode',
    position: { x: 200, y: 100 },
    data: {
      id: 'demo-resistor-1',
      type: CircuitElementType.RESISTOR,
      label: 'R1',
      value: '10kΩ',
    },
  },
  {
    id: 'demo-voltage-source-1',
    type: 'enhancedCircuitNode',
    position: { x: 50, y: 100 },
    data: {
      id: 'demo-voltage-source-1',
      type: CircuitElementType.VOLTAGE_SOURCE,
      label: 'V1',
      value: '5V',
    },
  },
  {
    id: 'demo-ground-1',
    type: 'enhancedCircuitNode',
    position: { x: 350, y: 200 },
    data: {
      id: 'demo-ground-1',
      type: CircuitElementType.GROUND,
      label: 'GND',
      value: '0V',
    },
  },
];

const initialEdges: Edge[] = [];

// 主画布组件
function EnhancedCircuitCanvasComponent() {
  // React Flow 状态
  const [nodes, setNodes, onNodesChange] = useNodesState(initialNodes);
  const [edges, setEdges, onEdgesChange] = useEdgesState(initialEdges);

  // 连接管理器
  const [connectionManager] = useState(() => new ConnectionManager({
    allowMultipleConnections: true,
    autoValidateConnections: true,
    showConnectionHints: true,
    animateConnections: true,
    snapToGrid: true,
    gridSize: 20,
  }));

  // 画布状态
  const [isConnecting, setIsConnecting] = useState(false);
  const [showGrid, setShowGrid] = useState(true);
  const [snapToGrid, setSnapToGrid] = useState(true);
  const [selectedElements, setSelectedElements] = useState<string[]>([]);
  const [showElementLibrary, setShowElementLibrary] = useState(true);

  // 引用
  const reactFlowWrapper = useRef<HTMLDivElement>(null);

  // 处理连接事件
  const handleConnectionEvent = useCallback((event: string, data: unknown) => {
    console.log('连接事件:', event, data);

    switch (event) {
      case 'connectionStart':
        setIsConnecting(true);
        toast.info('开始连接，请点击目标连接点');
        break;

      case 'connectionComplete':
        if ((data as { edge?: Edge }).edge) {
          setEdges(eds => addEdge({
            ...(data as { edge: Edge }).edge,
            type: 'default' as EnhancedEdgeType,
            animated: true,
            markerEnd: {
              type: MarkerType.ArrowClosed,
              width: 20,
              height: 20,
              color: '#3B82F6',
            },
          }, eds));
          toast.success('连接创建成功');
        }
        setIsConnecting(false);
        break;

      case 'connectionCancel':
        setIsConnecting(false);
        toast.info('连接已取消');
        break;

      case 'connectionError':
        toast.error(`连接失败: ${(data as { error: string }).error}`);
        setIsConnecting(false);
        break;

      default:
        console.log('未处理的连接事件:', event);
    }
  }, [setEdges]);

  // 更新节点数据以包含连接管理器
  const enhancedNodes = useMemo(() => {
    return nodes.map(node => ({
      ...node,
      data: {
        ...node.data,
        connectionManager,
        onConnectionEvent: handleConnectionEvent,
      },
    }));
  }, [nodes, connectionManager, handleConnectionEvent]);

  // 处理元件添加
  const handleAddElement = useCallback((elementType: CircuitElementType) => {
    const newId = `element-${Date.now()}`;
    const position = {
      x: Math.random() * 400 + 100,
      y: Math.random() * 300 + 100,
    };

    const typeLabels = {
      [CircuitElementType.RESISTOR]: { label: 'R', value: '1kΩ' },
      [CircuitElementType.CAPACITOR]: { label: 'C', value: '100μF' },
      [CircuitElementType.INDUCTOR]: { label: 'L', value: '1mH' },
      [CircuitElementType.VOLTAGE_SOURCE]: { label: 'V', value: '5V' },
      [CircuitElementType.CURRENT_SOURCE]: { label: 'I', value: '1A' },
      [CircuitElementType.DIODE]: { label: 'D', value: '' },
      [CircuitElementType.TRANSISTOR_NPN]: { label: 'Q', value: 'NPN' },
      [CircuitElementType.TRANSISTOR_PNP]: { label: 'Q', value: 'PNP' },
      [CircuitElementType.GROUND]: { label: 'GND', value: '0V' },
      [CircuitElementType.OPAMP]: { label: 'U', value: 'OP-AMP' },
      [CircuitElementType.WIRE]: { label: 'W', value: '' },
      [CircuitElementType.JUNCTION]: { label: 'J', value: '' },
    };

    const elementInfo = typeLabels[elementType] || { label: 'E', value: '' };
    const elementCount = nodes.filter(n => n.data.type === elementType).length + 1;

    const newNode: Node = {
      id: newId,
      type: 'enhancedCircuitNode',
      position,
      data: {
        id: newId,
        type: elementType,
        label: `${elementInfo.label}${elementCount}`,
        value: elementInfo.value,
        connectionManager,
        onConnectionEvent: handleConnectionEvent,
      },
    };

    setNodes(nds => [...nds, newNode]);
    toast.success(`添加了 ${elementInfo.label}${elementCount}`);
  }, [nodes, setNodes, connectionManager, handleConnectionEvent]);

  // 处理元件删除
  const handleDeleteSelected = useCallback(() => {
    if (selectedElements.length === 0) {
      toast.warning('请先选择要删除的元件');
      return;
    }

    // 删除选中的节点和相关边
    setNodes(nds => nds.filter(node => !selectedElements.includes(node.id)));
    setEdges(eds => eds.filter(edge => 
      !selectedElements.includes(edge.source) && 
      !selectedElements.includes(edge.target)
    ));

    // 从连接管理器中移除连接点
    selectedElements.forEach(elementId => {
      const connectionPoints = connectionManager.getNodeConnectionPoints(elementId);
      connectionPoints.forEach(point => {
        connectionManager.removeConnectionPoint(point.id);
      });
    });

    setSelectedElements([]);
    toast.success(`删除了 ${selectedElements.length} 个元件`);
  }, [selectedElements, setNodes, setEdges, connectionManager]);

  // 处理选择变化
  const handleSelectionChange = useCallback(({ nodes, edges }: { nodes: Node[]; edges: Edge[] }) => {
    const selectedIds = [...nodes.map(n => n.id), ...edges.map(e => e.id)];
    setSelectedElements(selectedIds);
  }, []);

  // 处理连接创建（ReactFlow原生）- 修复点击连接功能
  const onConnect = useCallback((params: Connection) => {
    console.log('ReactFlow onConnect called:', params);
    
    if (!params.source || !params.target || !params.sourceHandle || !params.targetHandle) {
      console.warn('连接参数不完整:', params);
      return;
    }
    
    // 检查是否连接到自身
    if (params.source === params.target) {
      toast.error('不能连接到自身');
      return;
    }
    
    // 使用增强连接系统创建连接
    const result = connectionManager.createConnection(params.sourceHandle, params.targetHandle);
    
    if (result.success && result.edge) {
      // 更新边状态
      setEdges(eds => addEdge({
        ...result.edge,
        type: 'default' as EnhancedEdgeType,
        animated: true,
        markerEnd: {
          type: MarkerType.ArrowClosed,
          width: 20,
          height: 20,
          color: '#3B82F6',
        },
      }, eds));
      
      toast.success('连接创建成功');
      
      // 触发连接事件
      handleConnectionEvent('connectionComplete', { edge: result.edge });
    } else {
      toast.error(`连接失败: ${result.error}`);
      handleConnectionEvent('connectionError', { error: result.error });
    }
  }, [connectionManager, setEdges, handleConnectionEvent]);

  // 工具栏组件 - 优化的元件库样式
  const ElementToolbar = () => {
    const [isCollapsed, setIsCollapsed] = useState(false);
    const [showQuickStart, setShowQuickStart] = useState(true);
    
    return (
      <Panel position="top-left" className="m-2">
        <div className="bg-white rounded-xl shadow-xl border border-gray-100 overflow-hidden">
          {/* 工具栏标题 */}
          <div className="bg-gradient-to-r from-blue-600 to-indigo-600 px-4 py-3 flex items-center justify-between">
            <div className="flex items-center gap-2">
              <div className="w-2 h-2 bg-white rounded-full opacity-75 animate-pulse"></div>
              <h3 className="text-white font-semibold text-sm tracking-wide">快速元件库</h3>
            </div>
            <div className="flex items-center gap-2">
              <button
                onClick={() => setShowQuickStart(!showQuickStart)}
                className="text-white hover:text-blue-100 transition-colors duration-200"
                title={showQuickStart ? "隐藏引导" : "显示引导"}
              >
                <svg className="w-4 h-4" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                  <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M13 16h-1v-4h-1m1-4h.01M21 12a9 9 0 11-18 0 9 9 0 0118 0z" />
                </svg>
              </button>
              <button
                onClick={() => setIsCollapsed(!isCollapsed)}
                className="text-white hover:text-blue-100 transition-colors duration-200"
                title={isCollapsed ? "展开元件库" : "折叠元件库"}
              >
                <svg 
                  className={`w-4 h-4 transform transition-transform duration-200 ${isCollapsed ? 'rotate-180' : ''}`} 
                  fill="none" 
                  stroke="currentColor" 
                  viewBox="0 0 24 24"
                >
                  <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M19 9l-7 7-7-7" />
                </svg>
              </button>
            </div>
          </div>
          
          {/* 快速入门提示 */}
          {showQuickStart && !isCollapsed && (
            <div className="bg-blue-50 border-b border-blue-200 px-4 py-2">
              <p className="text-xs text-blue-700">
                🚀 <strong>快速开始：</strong>拖放元件到画布，点击连接点创建连线
              </p>
            </div>
          )}
          
          {/* 元件内容 */}
          <div className={`transition-all duration-300 ${isCollapsed ? 'max-h-0' : 'max-h-96'} overflow-hidden`}>
            <div className="p-4 space-y-4">
              {/* 基础元件组 */}
              <div className="space-y-2">
                <h4 className="text-xs font-semibold text-gray-500 uppercase tracking-wider px-1">基础元件</h4>
                <div className="grid grid-cols-3 gap-2">
                  <button
                    onClick={() => handleAddElement(CircuitElementType.RESISTOR)}
                    className="group relative p-3 bg-gradient-to-br from-blue-50 to-blue-100 hover:from-blue-100 hover:to-blue-200 rounded-lg border border-blue-200 text-sm font-medium text-blue-900 transition-all duration-200 shadow-sm hover:shadow-md transform hover:-translate-y-0.5 hover:scale-105"
                    title="添加电阻 - 用于限制电流 (快捷键: R)"
                  >
                    <div className="flex flex-col items-center gap-1">
                      <svg className="w-5 h-5 text-blue-600 group-hover:text-blue-700 transition-colors" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2">
                        <rect x="3" y="11" width="18" height="2" rx="1" />
                        <path d="M7 9v6m4-6v6m4-6v6" strokeWidth="1" />
                      </svg>
                      <span className="text-xs">电阻</span>
                      <span className="text-[10px] text-blue-400 font-mono">R</span>
                    </div>
                    <div className="absolute inset-0 bg-blue-600 opacity-0 group-hover:opacity-5 rounded-lg transition-opacity"></div>
                  </button>
                  <button
                    onClick={() => handleAddElement(CircuitElementType.CAPACITOR)}
                    className="group relative p-3 bg-gradient-to-br from-green-50 to-green-100 hover:from-green-100 hover:to-green-200 rounded-lg border border-green-200 text-sm font-medium text-green-900 transition-all duration-200 shadow-sm hover:shadow-md transform hover:-translate-y-0.5 hover:scale-105"
                    title="添加电容 - 用于储存电荷 (快捷键: C)"
                  >
                    <div className="flex flex-col items-center gap-1">
                      <svg className="w-5 h-5 text-green-600 group-hover:text-green-700 transition-colors" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2">
                        <path d="M8 3v18m8-18v18" />
                      </svg>
                      <span className="text-xs">电容</span>
                      <span className="text-[10px] text-green-400 font-mono">C</span>
                    </div>
                    <div className="absolute inset-0 bg-green-600 opacity-0 group-hover:opacity-5 rounded-lg transition-opacity"></div>
                  </button>
                  <button
                    onClick={() => handleAddElement(CircuitElementType.INDUCTOR)}
                    className="group relative p-3 bg-gradient-to-br from-purple-50 to-purple-100 hover:from-purple-100 hover:to-purple-200 rounded-lg border border-purple-200 text-sm font-medium text-purple-900 transition-all duration-200 shadow-sm hover:shadow-md transform hover:-translate-y-0.5 hover:scale-105"
                    title="添加电感 - 用于储存磁能 (快捷键: L)"
                  >
                    <div className="flex flex-col items-center gap-1">
                      <svg className="w-5 h-5 text-purple-600 group-hover:text-purple-700 transition-colors" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2">
                        <path d="M3 12c0-3 2-5 5-5s5 2 5 5-2 5-5 5" />
                        <path d="M13 12c0-3 2-5 5-5s5 2 5 5-2 5-5 5" />
                      </svg>
                      <span className="text-xs">电感</span>
                      <span className="text-[10px] text-purple-400 font-mono">L</span>
                    </div>
                    <div className="absolute inset-0 bg-purple-600 opacity-0 group-hover:opacity-5 rounded-lg transition-opacity"></div>
                  </button>
                </div>
              </div>

              {/* 电源元件组 */}
              <div className="space-y-2">
                <h4 className="text-xs font-semibold text-gray-500 uppercase tracking-wider px-1">电源元件</h4>
                <div className="grid grid-cols-2 gap-2">
                  <button
                    onClick={() => handleAddElement(CircuitElementType.VOLTAGE_SOURCE)}
                    className="group relative p-3 bg-gradient-to-br from-red-50 to-red-100 hover:from-red-100 hover:to-red-200 rounded-lg border border-red-200 text-sm font-medium text-red-900 transition-all duration-200 shadow-sm hover:shadow-md transform hover:-translate-y-0.5 hover:scale-105"
                    title="添加电压源 - 提供恒定电压 (快捷键: V)"
                  >
                    <div className="flex flex-col items-center gap-1">
                      <svg className="w-5 h-5 text-red-600 group-hover:text-red-700 transition-colors" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2">
                        <circle cx="12" cy="12" r="6" />
                        <path d="M12 8v8m-4-4h8" strokeWidth="1.5" />
                      </svg>
                      <span className="text-xs">电压源</span>
                      <span className="text-[10px] text-red-400 font-mono">V</span>
                    </div>
                    <div className="absolute inset-0 bg-red-600 opacity-0 group-hover:opacity-5 rounded-lg transition-opacity"></div>
                  </button>
                  <button
                    onClick={() => handleAddElement(CircuitElementType.GROUND)}
                    className="group relative p-3 bg-gradient-to-br from-gray-50 to-gray-100 hover:from-gray-100 hover:to-gray-200 rounded-lg border border-gray-200 text-sm font-medium text-gray-900 transition-all duration-200 shadow-sm hover:shadow-md transform hover:-translate-y-0.5 hover:scale-105"
                    title="添加接地 - 电路参考点 (快捷键: G)"
                  >
                    <div className="flex flex-col items-center gap-1">
                      <svg className="w-5 h-5 text-gray-600 group-hover:text-gray-700 transition-colors" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2">
                        <path d="M12 2v20m-8-6h16m-12-4h8m-6-4h4" strokeWidth="1" />
                      </svg>
                      <span className="text-xs">接地</span>
                      <span className="text-[10px] text-gray-400 font-mono">G</span>
                    </div>
                    <div className="absolute inset-0 bg-gray-600 opacity-0 group-hover:opacity-5 rounded-lg transition-opacity"></div>
                  </button>
                </div>
              </div>

              {/* 半导体元件组 */}
              <div className="space-y-2">
                <h4 className="text-xs font-semibold text-gray-500 uppercase tracking-wider px-1">半导体</h4>
                <div className="grid grid-cols-2 gap-2">
                  <button
                    onClick={() => handleAddElement(CircuitElementType.DIODE)}
                    className="group relative p-3 bg-gradient-to-br from-yellow-50 to-yellow-100 hover:from-yellow-100 hover:to-yellow-200 rounded-lg border border-yellow-200 text-sm font-medium text-yellow-900 transition-all duration-200 shadow-sm hover:shadow-md transform hover:-translate-y-0.5 hover:scale-105"
                    title="添加二极管 - 单向导通 (快捷键: D)"
                  >
                    <div className="flex flex-col items-center gap-1">
                      <svg className="w-5 h-5 text-yellow-600 group-hover:text-yellow-700 transition-colors" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2">
                        <polygon points="8,12 16,6 16,18" />
                        <path d="M16 6v12" />
                      </svg>
                      <span className="text-xs">二极管</span>
                      <span className="text-[10px] text-yellow-400 font-mono">D</span>
                    </div>
                    <div className="absolute inset-0 bg-yellow-600 opacity-0 group-hover:opacity-5 rounded-lg transition-opacity"></div>
                  </button>
                  <button
                    onClick={() => handleAddElement(CircuitElementType.TRANSISTOR_NPN)}
                    className="group relative p-3 bg-gradient-to-br from-indigo-50 to-indigo-100 hover:from-indigo-100 hover:to-indigo-200 rounded-lg border border-indigo-200 text-sm font-medium text-indigo-900 transition-all duration-200 shadow-sm hover:shadow-md transform hover:-translate-y-0.5 hover:scale-105"
                    title="添加NPN晶体管 - 电流放大 (快捷键: N)"
                  >
                    <div className="flex flex-col items-center gap-1">
                      <svg className="w-5 h-5 text-indigo-600 group-hover:text-indigo-700 transition-colors" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2">
                        <circle cx="12" cy="12" r="6" />
                        <path d="M12 6v12m-6 0l6-6m0 0l6-6" strokeWidth="1.5" />
                      </svg>
                      <span className="text-xs">晶体管</span>
                      <span className="text-[10px] text-indigo-400 font-mono">N</span>
                    </div>
                    <div className="absolute inset-0 bg-indigo-600 opacity-0 group-hover:opacity-5 rounded-lg transition-opacity"></div>
                  </button>
                </div>
              </div>

              {/* 集成电路组 */}
              <div className="space-y-2">
                <h4 className="text-xs font-semibold text-gray-500 uppercase tracking-wider px-1">集成电路</h4>
                <button
                  onClick={() => handleAddElement(CircuitElementType.OPAMP)}
                  className="group relative w-full p-3 bg-gradient-to-br from-cyan-50 to-cyan-100 hover:from-cyan-100 hover:to-cyan-200 rounded-lg border border-cyan-200 text-sm font-medium text-cyan-900 transition-all duration-200 shadow-sm hover:shadow-md transform hover:-translate-y-0.5 hover:scale-105"
                  title="添加运算放大器 - 模拟信号处理 (快捷键: O)"
                >
                  <div className="flex flex-col items-center gap-1">
                    <svg className="w-5 h-5 text-cyan-600 group-hover:text-cyan-700 transition-colors" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2">
                      <polygon points="6,6 6,18 18,12" />
                      <path d="M9 9h2m-2 6h2" strokeWidth="1" />
                    </svg>
                    <span className="text-xs">运放</span>
                    <span className="text-[10px] text-cyan-400 font-mono">O</span>
                  </div>
                  <div className="absolute inset-0 bg-cyan-600 opacity-0 group-hover:opacity-5 rounded-lg transition-opacity"></div>
                </button>
              </div>
            </div>
          </div>
        </div>
      </Panel>
    );
  };

  // 状态面板 - 优化样式
  const StatusPanel = () => {
    const stats = connectionManager.getConnectionStats();
    
    return (
      <Panel position="bottom-right" className="m-2">
        <div className="bg-white rounded-xl shadow-xl border border-gray-100 p-4 min-w-48">
          <div className="flex items-center gap-2 mb-3">
            <div className={`w-2 h-2 rounded-full ${isConnecting ? 'bg-orange-500 animate-pulse' : 'bg-green-500'}`}></div>
            <span className="text-sm font-semibold text-gray-800">电路状态</span>
            {isConnecting && (
              <span className="text-xs text-orange-600 animate-pulse font-medium">连接中...</span>
            )}
          </div>
          
          <div className="space-y-2">
            <div className="flex justify-between items-center py-1">
              <span className="text-xs text-gray-500">元件数量</span>
              <span className="text-sm font-mono text-blue-600 bg-blue-50 px-2 py-0.5 rounded">{nodes.length}</span>
            </div>
            <div className="flex justify-between items-center py-1">
              <span className="text-xs text-gray-500">连接点数</span>
              <span className="text-sm font-mono text-purple-600 bg-purple-50 px-2 py-0.5 rounded">{stats.totalPoints}</span>
            </div>
            <div className="flex justify-between items-center py-1">
              <span className="text-xs text-gray-500">连接数</span>
              <span className="text-sm font-mono text-green-600 bg-green-50 px-2 py-0.5 rounded">{stats.totalConnections}</span>
            </div>
            <div className="flex justify-between items-center py-1">
              <span className="text-xs text-gray-500">已选择</span>
              <span className="text-sm font-mono text-indigo-600 bg-indigo-50 px-2 py-0.5 rounded">{selectedElements.length}</span>
            </div>
            
            {/* 连接质量指示 */}
            <div className="border-t border-gray-100 pt-2 mt-2">
              <div className="flex justify-between items-center">
                <span className="text-xs text-gray-500">连接质量</span>
                <div className="flex items-center gap-1">
                  {Array.from({ length: 5 }).map((_, i) => {
                    const quality = Math.min(5, Math.max(1, Math.round((stats.totalConnections / Math.max(1, nodes.length)) * 2)));
                    return (
                      <div
                        key={i}
                        className={`w-2 h-2 rounded-full ${
                          i < quality ? 'bg-green-400' : 'bg-gray-200'
                        }`}
                      />
                    );
                  })}
                </div>
              </div>
            </div>
            
            {/* 新手提示 */}
            {nodes.length === 0 && (
              <div className="border-t border-gray-100 pt-2 mt-2">
                <div className="text-xs text-gray-500">
                  💡 <strong>提示：</strong>从左侧元件库拖放元件开始设计
                </div>
              </div>
            )}
          </div>
        </div>
      </Panel>
    );
  };

  // 控制面板 - 增加缩放控制功能
  const ControlPanel = () => {
    const [currentZoom, setCurrentZoom] = useState(0.8);
    
    const handleZoomChange = useCallback((newZoom: number) => {
      setCurrentZoom(newZoom);
      // 使用ReactFlow的zoomTo方法而不是直接操作DOM
      const viewport = reactFlowWrapper.current?.querySelector('.react-flow__viewport') as HTMLElement;
      if (viewport) {
        viewport.style.transform = `translate(0px, 0px) scale(${newZoom})`;
      }
    }, []);
    
    // 处理画布居中
    const handleFitView = useCallback(() => {
      const viewport = reactFlowWrapper.current?.querySelector('.react-flow__viewport') as HTMLElement;
      if (viewport) {
        viewport.style.transform = 'translate(0px, 0px) scale(1)';
        setCurrentZoom(1);
      }
    }, []);
    
    return (
      <Panel position="top-right" className="m-2">
        <div className="bg-white rounded-xl shadow-xl border border-gray-100 p-4 min-w-64">
          <div className="flex items-center gap-2 mb-4">
            <div className="w-2 h-2 bg-indigo-500 rounded-full"></div>
            <h3 className="text-sm font-semibold text-gray-800">控制面板</h3>
          </div>
          
          {/* 缩放控制 */}
          <div className="space-y-3 mb-4">
            <h4 className="text-xs font-semibold text-gray-500 uppercase tracking-wider">视图控制</h4>
            <div className="space-y-2">
              <div className="flex items-center justify-between">
                <span className="text-sm text-gray-600">缩放比例</span>
                <span className="text-sm font-mono text-indigo-600">{Math.round(currentZoom * 100)}%</span>
              </div>
              <div className="flex items-center gap-2">
                <button
                  onClick={() => handleZoomChange(Math.max(0.2, currentZoom - 0.1))}
                  className="w-8 h-8 bg-gray-100 hover:bg-gray-200 rounded-lg flex items-center justify-center text-gray-600 hover:text-gray-800 transition-all duration-200"
                  title="缩小"
                >
                  <svg className="w-4 h-4" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                    <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M20 12H4" />
                  </svg>
                </button>
                <div className="flex-1">
                  <input
                    type="range"
                    min="0.2"
                    max="3"
                    step="0.1"
                    value={currentZoom}
                    onChange={(e) => handleZoomChange(parseFloat(e.target.value))}
                    className="w-full h-2 bg-gray-200 rounded-lg appearance-none cursor-pointer slider"
                  />
                </div>
                <button
                  onClick={() => handleZoomChange(Math.min(3, currentZoom + 0.1))}
                  className="w-8 h-8 bg-gray-100 hover:bg-gray-200 rounded-lg flex items-center justify-center text-gray-600 hover:text-gray-800 transition-all duration-200"
                  title="放大"
                >
                  <svg className="w-4 h-4" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                    <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M12 6v6m0 0v6m0-6h6m-6 0H6" />
                  </svg>
                </button>
              </div>
              <div className="flex gap-2">
                <button
                  onClick={() => handleZoomChange(1)}
                  className="flex-1 px-2 py-1 text-xs bg-gray-100 hover:bg-gray-200 text-gray-700 rounded transition-colors"
                >
                  重置(100%)
                </button>
                <button
                  onClick={() => handleZoomChange(0.5)}
                  className="flex-1 px-2 py-1 text-xs bg-gray-100 hover:bg-gray-200 text-gray-700 rounded transition-colors"
                >
                  适中(50%)
                </button>
                <button
                  onClick={handleFitView}
                  className="flex-1 px-2 py-1 text-xs bg-blue-100 hover:bg-blue-200 text-blue-700 rounded transition-colors"
                >
                  居中
                </button>
              </div>
            </div>
          </div>
          
          {/* 网格控制 */}
          <div className="space-y-3 mb-4">
            <h4 className="text-xs font-semibold text-gray-500 uppercase tracking-wider">网格设置</h4>
            <div className="space-y-2">
              <label className="flex items-center gap-2 cursor-pointer">
                <input
                  type="checkbox"
                  checked={showGrid}
                  onChange={(e) => setShowGrid(e.target.checked)}
                  className="w-4 h-4 text-indigo-600 bg-gray-100 border-gray-300 rounded focus:ring-indigo-500 focus:ring-2"
                />
                <span className="text-sm text-gray-700">显示网格</span>
              </label>
              
              <label className="flex items-center gap-2 cursor-pointer">
                <input
                  type="checkbox"
                  checked={snapToGrid}
                  onChange={(e) => setSnapToGrid(e.target.checked)}
                  className="w-4 h-4 text-indigo-600 bg-gray-100 border-gray-300 rounded focus:ring-indigo-500 focus:ring-2"
                />
                <span className="text-sm text-gray-700">网格吸附</span>
              </label>
            </div>
          </div>
          
          {/* 操作按钮 */}
          <div className="space-y-2">
            <button
              onClick={handleDeleteSelected}
              disabled={selectedElements.length === 0}
              className="w-full px-3 py-2 bg-red-500 hover:bg-red-600 disabled:bg-gray-300 disabled:cursor-not-allowed text-white text-sm rounded-lg transition-all duration-200 font-medium shadow-sm hover:shadow"
            >
              删除选中 ({selectedElements.length})
            </button>
            
            <button
              onClick={() => {
                setNodes([]);
                setEdges([]);
                setSelectedElements([]);
                toast.success('电路已清空');
              }}
              className="w-full px-3 py-2 bg-gray-500 hover:bg-gray-600 text-white text-sm rounded-lg transition-all duration-200 font-medium shadow-sm hover:shadow"
            >
              清空电路
            </button>
            
            <button
              onClick={() => {
                // 自动布局功能
                const updatedNodes = nodes.map((node, index) => ({
                  ...node,
                  position: { 
                    x: 100 + (index % 3) * 200, 
                    y: 100 + Math.floor(index / 3) * 150 
                  }
                }));
                setNodes(updatedNodes);
                toast.success('电路已自动布局');
              }}
              className="w-full px-3 py-2 bg-green-500 hover:bg-green-600 text-white text-sm rounded-lg transition-all duration-200 font-medium shadow-sm hover:shadow"
            >
              自动布局
            </button>
          </div>
        </div>
        
        {/* 样式 */}
        <style>
          {`
            .slider::-webkit-slider-thumb {
              appearance: none;
              width: 16px;
              height: 16px;
              border-radius: 50%;
              background: #4f46e5;
              cursor: pointer;
              box-shadow: 0 2px 4px rgba(0, 0, 0, 0.2);
            }
            .slider::-moz-range-thumb {
              width: 16px;
              height: 16px;
              border-radius: 50%;
              background: #4f46e5;
              cursor: pointer;
              border: none;
              box-shadow: 0 2px 4px rgba(0, 0, 0, 0.2);
            }
          `}
        </style>
      </Panel>
    );
  };

  return (
    <div className="w-full h-full flex" ref={reactFlowWrapper}>
      {/* 左侧元件库 */}
      {showElementLibrary && (
        <div className="w-64 h-full border-r border-gray-200 bg-white shadow-sm">
          <ElementLibrary onSelectElement={handleAddElement} />
        </div>
      )}
      
      {/* 主画布区域 */}
      <div className="flex-1 h-full relative">
        <ReactFlow
          nodes={enhancedNodes}
          edges={edges}
          onNodesChange={onNodesChange}
          onEdgesChange={onEdgesChange}
          onConnect={onConnect}
          onSelectionChange={handleSelectionChange}
          nodeTypes={nodeTypes}
          edgeTypes={edgeTypes}
          connectionMode={ConnectionMode.Loose}
          snapToGrid={snapToGrid}
          snapGrid={[20, 20]}
          defaultViewport={{ x: 0, y: 0, zoom: 0.6 }}
          minZoom={0.1}
          maxZoom={5}
          connectionLineComponent={EnhancedConnectionPreview}
          deleteKeyCode="Delete"
          multiSelectionKeyCode="Shift"
          panOnScroll={true}
          selectionOnDrag={true}
          panOnDrag={[0, 1]} // 允许鼠标左键拖拽
          selectNodesOnDrag={true}
          fitViewOptions={{ padding: 0.2, duration: 500, maxZoom: 1.2 }}
          zoomOnScroll={true}
          zoomOnPinch={true}
          zoomOnDoubleClick={true}
        >
          {/* 背景 */}
          {showGrid && <Background color="#f0f0f0" gap={20} />}
          
          {/* 控制器 */}
          <Controls showInteractive={false} position="top-left" />
          
          {/* 小地图 */}
          <MiniMap 
            nodeColor="#3B82F6"
            maskColor="rgba(255, 255, 255, 0.7)"
            position="bottom-left"
            style={{ left: '16px', bottom: '16px' }}
          />

          {/* 状态面板 */}
          <div style={{ position: 'absolute', right: '16px', bottom: '16px', zIndex: 1000 }}>
            <StatusPanel />
          </div>
          
          {/* 控制面板 */}
          <div style={{ position: 'absolute', right: '16px', top: '320px', zIndex: 1000 }}>
            <ControlPanel />
          </div>
          
          {/* 元件工具栏 - 移动到右侧 */}
          <div style={{ position: 'absolute', right: '16px', top: '16px', zIndex: 1000 }}>
            <ElementToolbar />
          </div>
          
          {/* 元件库切换按钮 */}
          <div style={{ position: 'absolute', left: '16px', top: '16px', zIndex: 1000 }}>
            <button
              onClick={() => setShowElementLibrary(!showElementLibrary)}
              className="bg-white p-2 rounded-lg shadow-md border border-gray-200 hover:bg-gray-50 transition-colors"
              title={showElementLibrary ? "隐藏元件库" : "显示元件库"}
            >
              <svg className="w-5 h-5 text-gray-600" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M4 6h16M4 12h16M4 18h16" />
              </svg>
            </button>
          </div>
        </ReactFlow>
      </div>
    </div>
  );
}

// 带Provider的导出组件
export function EnhancedCircuitCanvasWithProvider() {
  return (
    <ReactFlowProvider>
      <EnhancedCircuitCanvasComponent />
    </ReactFlowProvider>
  );
}

// export default EnhancedCircuitCanvasComponent;