/**
 * 集成增强连接系统的专业电路画布
 * 提供完整的点对点连接功能和用户体验
 */

'use client';

import { useState, useCallback, useRef } from 'react';
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
import { message } from 'antd';

import { CircuitElementType } from '@/api/types/circuit.types';
import { EnhancedCircuitNode } from './EnhancedCircuitNode';
import { EnhancedConnectionEdge, EnhancedConnectionPreview } from './EnhancedConnectionEdge';
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

// 初始节点数据 - 空画布，不预置任何元件
const initialNodes: Node[] = [];

const initialEdges: Edge[] = [];

// 主画布组件
function EnhancedCircuitCanvasComponent() {
  // React Flow 状态
  const [nodes, setNodes, onNodesChange] = useNodesState(initialNodes);
  const [edges, setEdges, onEdgesChange] = useEdgesState(initialEdges);

  // 画布状态
  const [showGrid, setShowGrid] = useState(true);
  const [snapToGrid, setSnapToGrid] = useState(true);
  const [selectedElements, setSelectedElements] = useState<string[]>([]);
  const [showElementLibrary, setShowElementLibrary] = useState(true);

  // 引用
  const reactFlowWrapper = useRef<HTMLDivElement>(null);

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
      },
    };

    setNodes(nds => [...nds, newNode]);
    message.success(`添加了 ${elementInfo.label}${elementCount}`);
  }, [nodes, setNodes]);

  // 处理元件删除
  const handleDeleteSelected = useCallback(() => {
    if (selectedElements.length === 0) {
      message.warning('请先选择要删除的元件');
      return;
    }

    // 删除选中的节点和相关边
    setNodes(nds => nds.filter(node => !selectedElements.includes(node.id)));
    setEdges(eds => eds.filter(edge =>
      !selectedElements.includes(edge.source) &&
      !selectedElements.includes(edge.target)
    ));

    setSelectedElements([]);
    message.success(`删除了 ${selectedElements.length} 个元件`);
  }, [selectedElements, setNodes, setEdges]);

  // 处理选择变化
  const handleSelectionChange = useCallback(({ nodes, edges }: { nodes: Node[]; edges: Edge[] }) => {
    const selectedIds = [...nodes.map(n => n.id), ...edges.map(e => e.id)];
    setSelectedElements(selectedIds);
  }, []);

  // 处理连接创建 - 简化版本，使用ReactFlow原生连接
  const onConnect = useCallback((params: Connection) => {
    console.log('ReactFlow onConnect called:', params);

    if (!params.source || !params.target || !params.sourceHandle || !params.targetHandle) {
      console.warn('连接参数不完整:', params);
      return;
    }

    // 清理targetHandle的-target后缀（如果存在）
    let cleanSourceHandle = params.sourceHandle.replace('-target', '');
    let cleanTargetHandle = params.targetHandle.replace('-target', '');

    // 检查是否连接到自身的同一个端口
    if (params.source === params.target && cleanSourceHandle === cleanTargetHandle) {
      message.warning('不能连接到自身的同一个端口');
      return;
    }

    // 检查连接是否已存在
    const connectionExists = edges.some(edge =>
      (edge.source === params.source && edge.target === params.target &&
       edge.sourceHandle?.replace('-target', '') === cleanSourceHandle &&
       edge.targetHandle?.replace('-target', '') === cleanTargetHandle) ||
      (edge.source === params.target && edge.target === params.source &&
       edge.sourceHandle?.replace('-target', '') === cleanTargetHandle &&
       edge.targetHandle?.replace('-target', '') === cleanSourceHandle)
    );

    if (connectionExists) {
      message.warning('此连接已存在');
      return;
    }

    // 创建新的边
    const newEdge: Edge = {
      id: `edge-${params.source}-${cleanSourceHandle}-${params.target}-${cleanTargetHandle}-${Date.now()}`,
      source: params.source,
      target: params.target,
      sourceHandle: params.sourceHandle,
      targetHandle: params.targetHandle,
      type: 'default',
      animated: false,
      style: {
        stroke: '#3B82F6',
        strokeWidth: 2.5
      },
      markerEnd: {
        type: MarkerType.ArrowClosed,
        width: 20,
        height: 20,
        color: '#3B82F6',
      },
    };

    setEdges(eds => addEdge(newEdge, eds));
    message.success('连接创建成功');
  }, [edges, setEdges]);

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
          nodes={nodes}
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