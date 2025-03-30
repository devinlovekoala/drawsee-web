import { useCallback, useMemo, useEffect, useState } from 'react';
import ReactFlow, {
    Background,
    Controls,
    MiniMap,
    useNodesState,
    useEdgesState,
    addEdge,
    Connection,
    NodeChange,
    EdgeChange,
    ConnectionMode,
    Node,
    useReactFlow,
    ReactFlowProvider,
} from 'reactflow';
import 'reactflow/dist/style.css';
import { useCircuitStore } from '../../../stores/useCircuitStore';
import { CircuitElement } from '../../../api/types/element.types';
import { CircuitConnection } from '../../../api/types/connection.types';
import { createElementTemplate } from '../toolbar/palette-item';
import { validateConnection } from '../../../utils/connectionValidation';
import ComponentForm from '../toolbar/component-form';
import CircuitNode from './circuit-node';

// 节点类型映射 - 移到组件外部
const NODE_TYPES = {
    circuitNode: CircuitNode,
} as const;

// Wrap the main component with ReactFlowProvider
const CircuitFlowWithProvider = () => {
    return (
        <ReactFlowProvider>
            <CircuitFlow />
        </ReactFlowProvider>
    );
};

const CircuitFlow = () => {
    const { elements, connections, actions } = useCircuitStore();
    const [nodes, setNodes, onNodesChange] = useNodesState([]);
    const [edges, setEdges, onEdgesChange] = useEdgesState([]);
    const { getNodes } = useReactFlow();
    
    // 添加状态来管理表单显示和当前编辑的元件
    const [editingElement, setEditingElement] = useState<CircuitElement | null>(null);
    const [showForm, setShowForm] = useState(false);

    // 处理节点点击事件
    const handleNodeClick = useCallback((nodeId: string) => {
        const element = elements.find(el => el.id === nodeId);
        if (element && Object.keys(element.properties).length > 0) {
            setEditingElement(element);
            setShowForm(true);
        }
    }, [elements]);

    // 关闭表单的处理函数
    const handleCloseForm = useCallback(() => {
        setShowForm(false);
        setEditingElement(null);
    }, []);

    // 将电路元素转换为 React Flow 节点
    const convertElementsToNodes = useCallback((elements: CircuitElement[]) => {
        return elements.map((element) => ({
            id: element.id,
            type: 'circuitNode',
            position: element.position,
            data: { 
                element,
                onNodeClick: handleNodeClick // 传入点击处理函数
            },
        }));
    }, [handleNodeClick]);

    // 将连接转换为 React Flow 边
    const convertConnectionsToEdges = useCallback((connections: CircuitConnection[]) => {
        return connections.map((connection) => ({
            id: connection.id,
            source: connection.source.elementId,
            target: connection.target.elementId,
            sourceHandle: connection.source.portId,
            targetHandle: connection.target.portId,
            type: 'smoothstep',
            animated: true,
            style: { stroke: '#334155', strokeWidth: 2 }
        }));
    }, []);

    // 处理节点变化
    const handleNodesChange = useCallback((changes: NodeChange[]) => {
        onNodesChange(changes);
        // 更新电路状态
        changes.forEach((change) => {
            if (change.type === 'position' && change.position) {
                actions.updateElementPosition(change.id, change.position);
            }
        });
    }, [onNodesChange, actions]);

    // 处理边变化
    const handleEdgesChange = useCallback((changes: EdgeChange[]) => {
        onEdgesChange(changes);
        // 更新连接状态
        changes.forEach((change) => {
            if (change.type === 'remove') {
                actions.removeConnection(change.id);
            }
        });
    }, [onEdgesChange, actions]);

    // 处理连接
    const handleConnect = useCallback(
        (connection: Connection) => {
            if (!connection.source || !connection.target) return;
            
            // 使用独立的验证函数
            const validation = validateConnection(
                connection,
                useCircuitStore.getState().connections
            );

            if (!validation.isValid) {
                validation.errors.forEach(error => console.warn(error));
                return;
            }

            const newConnection = {
                id: `edge-${Date.now()}`,
                source: {
                    elementId: connection.source,
                    portId: connection.sourceHandle || '',
                },
                target: {
                    elementId: connection.target,
                    portId: connection.targetHandle || '',
                },
            };
            
            actions.addConnection(newConnection);
            setEdges((eds) => addEdge(connection, eds));
        },
        [setEdges, actions]
    );

    // 处理拖放
    const handleDrop = useCallback(
        (event: React.DragEvent) => {
            event.preventDefault();

            const type = event.dataTransfer.getData('application/reactflow');
            if (!type) return;

            const template = createElementTemplate(type as CircuitElement['type']);
            const position = {
                x: event.clientX - 100,
                y: event.clientY - 100,
            };

            const element = {
                ...template,
                id: `element-${Date.now()}`,
                position,
            };

            actions.addElement(element);
        },
        [actions]
    );

    // 处理拖拽开始
    const handleDragOver = useCallback((event: React.DragEvent) => {
        event.preventDefault();
        event.dataTransfer.dropEffect = 'move';
    }, []);

    // 处理节点删除
    const handleNodesDelete = useCallback(
        (nodesToDelete: Node[]) => {
            nodesToDelete.forEach((node) => {
                actions.removeElement(node.id);
            });
        },
        [actions]
    );

    // 处理键盘事件
    useEffect(() => {
        const handleKeyDown = (event: KeyboardEvent) => {
            if (event.key === 'Backspace' || event.key === 'Delete') {
                const selectedNodes = getNodes().filter(node => node.selected);
                if (selectedNodes.length > 0) {
                    handleNodesDelete(selectedNodes);
                }
            }
        };

        window.addEventListener('keydown', handleKeyDown);
        return () => window.removeEventListener('keydown', handleKeyDown);
    }, [getNodes, handleNodesDelete]);

    // 使用 useMemo 缓存节点和边
    const currentNodes = useMemo(() => convertElementsToNodes(elements), [elements, convertElementsToNodes]);
    const currentEdges = useMemo(() => convertConnectionsToEdges(connections), [connections, convertConnectionsToEdges]);

    return (
        <div className="w-full h-full">
            <ReactFlow
                nodes={currentNodes}
                edges={currentEdges}
                onNodesChange={handleNodesChange}
                onEdgesChange={handleEdgesChange}
                onConnect={handleConnect}
                onDrop={handleDrop}
                onDragOver={handleDragOver}
                onNodesDelete={handleNodesDelete}
                nodeTypes={NODE_TYPES}
                fitView
                className="bg-gray-50"
                defaultEdgeOptions={{
                    type: 'smoothstep',
                    style: { stroke: '#334155', strokeWidth: 2 }
                }}
                connectionMode={ConnectionMode.Loose}
                nodesDraggable
                elementsSelectable
                snapToGrid
                snapGrid={[15, 15]}
            >
                <Background />
                <Controls />
                <MiniMap />
            </ReactFlow>
            
            {/* 条件渲染编辑表单 */}
            {showForm && editingElement && (
                <ComponentForm 
                    type={editingElement.type} 
                    element={editingElement}
                    onClose={handleCloseForm} 
                />
            )}
        </div>
    );
};

export default CircuitFlowWithProvider;