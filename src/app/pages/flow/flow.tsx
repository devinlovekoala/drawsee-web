import {Background, BackgroundVariant, ReactFlow, type Node, type Edge, NodeTypes, XYPosition, Panel, useReactFlow, OnNodesChange, applyNodeChanges, applyEdgeChanges, OnEdgesChange, useOnSelectionChange, SelectionMode} from "@xyflow/react";
import RootNode from "@/app/pages/flow/components/node/RootNode";
import QueryNode from "@/app/pages/flow/components/node/QueryNode";
import AnswerNode from "@/app/pages/flow/components/node/AnswerNode";
import KnowledgeHeadNode from "@/app/pages/flow/components/node/KnowledgeHeadNode";
import KnowledgeDetailNode from "@/app/pages/flow/components/node/KnowledgeDetailNode";
import {useCallback, useState, useEffect, useMemo, createContext} from "react";
import {useLocation} from "react-router-dom";
import {useWatcher} from "alova/client";
import {getNodesByConvId} from "@/api/methods/flow.methods.ts";
import type { NodeVO as ApiNodeVO, NodeType } from '@/api/types/flow.types';
import type { NodeData } from './components/node/types/node.types';
import { layoutNodes } from './utils/layoutNodes';
import { animateLayoutTransition } from './utils/nodePositionAnimator';
import { LoadingSpinner } from './components/loading/LoadingSpinner';
import useFlowState from './hooks/useFlowState';
import { FlowInputPanel } from './components/input/FlowInputPanel';

import '@xyflow/react/dist/style.css';

const nodeTypes = {
  'root': RootNode,
  'query': QueryNode,
  'answer': AnswerNode,
  'knowledge-head': KnowledgeHeadNode,
  'knowledge-detail': KnowledgeDetailNode,
} as const;

export type FlowLocationState = {
  convId: number;
  taskId?: number;
};

// 定义允许用户追问的节点类型
const ALLOWED_PARENT_TYPES: NodeType[] = ['root', 'answer', 'knowledge-detail'];

export type FlowContextType = {
  chat: (convId: number, taskId: number) => void;
  convId: number;
}
export const FlowContext = createContext<FlowContextType>({
  chat: () => {},
  convId: -1,
});

function Flow() {
  const {nodes, edges, chat, setNodes, setEdges} = useFlowState();
  const [isLoading, setIsLoading] = useState<boolean>(true);
  const [selectedNode, setSelectedNode] = useState<Node | null>(null);
  const [tempQueryNode, setTempQueryNode] = useState<Node | null>(null);
  const location = useLocation();
  const {convId, taskId: taskIdFromLocation} = location.state as FlowLocationState;
  const {fitView} = useReactFlow();

  // 监听节点选择变化
  useOnSelectionChange({
    onChange: ({ nodes }) => {
      if (nodes.length === 1) {
        setSelectedNode(nodes[0]);
      } else {
        setSelectedNode(null);
      }
    },
  });

  // 获取根节点ID
  const rootNodeId = useMemo(() => {
    const rootNode = nodes.find(node => node.type === 'root');
    return rootNode ? rootNode.id : null;
  }, [nodes]);

  // 判断当前是否可以输入（根据选中节点类型）
  const canInput = useMemo(() => {
    if (!selectedNode) {
      // 没有选中节点，但有根节点时可以输入
      return rootNodeId !== null;
    }
    return ALLOWED_PARENT_TYPES.includes(selectedNode.type as NodeType);
  }, [selectedNode, rootNodeId]);

  // 获取当前父节点ID
  const getParentNodeId = useCallback(() => {
    if (selectedNode && ALLOWED_PARENT_TYPES.includes(selectedNode.type as NodeType)) {
      return selectedNode.id;
    }
    return rootNodeId;
  }, [selectedNode, rootNodeId]);

  // 创建临时查询节点
  const createTempQueryNode = useCallback((text: string) => {
    if (!canInput) return;
    
    const parentId = getParentNodeId();
    if (!parentId) return;

    // 如果已经有临时节点，先删除
    if (tempQueryNode) {
      setNodes(nodes => nodes.filter(node => node.id !== tempQueryNode.id));
    }

    // 创建新的临时节点
    const newTempNode: Node = {
      id: `temp-query-${Date.now()}`,
      type: 'query',
      position: { x: 0, y: 0 },
      data: {
        title: '用户提问',
        text,
        parentId,
        convId,
        createdAt: Date.now(),
        updatedAt: Date.now(),
      },
    };

    // 创建新的边
    const newTempEdge: Edge = {
      id: `e${parentId}-${newTempNode.id}`,
      source: parentId,
      target: newTempNode.id,
      type: 'smoothstep',
    };

    // 更新节点和边
    const updatedNodes = [...nodes, newTempNode];
    const updatedEdges = [...edges, newTempEdge];

    // 使用布局函数计算新的节点位置
    layoutNodes(updatedNodes, updatedEdges, false).then(layoutedNodes => {
      // 使用动画过渡
      animateLayoutTransition(updatedNodes, layoutedNodes, setNodes, 300).then(() => {
        setTempQueryNode(newTempNode);
        setEdges(updatedEdges);
        
        // 聚焦到新节点
        setTimeout(() => {
          fitView({
            nodes: [{ id: newTempNode.id }],
            duration: 500,
            maxZoom: 0.7,
          });
        }, 50);
      });
    });
  }, [canInput, getParentNodeId, tempQueryNode, nodes, edges, setNodes, setEdges, convId, fitView]);

  // 更新临时查询节点文本
  const updateTempQueryNodeText = useCallback((text: string) => {
    if (!tempQueryNode) return;

    setNodes(nodes => 
      nodes.map(node => 
        node.id === tempQueryNode.id 
          ? { ...node, data: { ...node.data, text } } 
          : node
      )
    );
  }, [tempQueryNode, setNodes]);

  // 删除临时查询节点
  const removeTempQueryNode = useCallback(() => {
    if (!tempQueryNode) return;

    // 先从节点和边列表中移除临时节点
    const updatedNodes = nodes.filter(node => node.id !== tempQueryNode.id);
    const updatedEdges = edges.filter(edge => edge.target !== tempQueryNode.id);
    
    // 先进行布局，再更新节点和边
    layoutNodes(updatedNodes, updatedEdges, false).then(layoutedNodes => {
      // 使用动画过渡
      animateLayoutTransition(updatedNodes, layoutedNodes, setNodes, 300).then(() => {
        setNodes(updatedNodes);
        setEdges(updatedEdges);
        setTempQueryNode(null);
      });
    });
  }, [tempQueryNode, nodes, edges, setNodes, setEdges]);

  useWatcher(getNodesByConvId(convId), [convId], {immediate: true})
    .onSuccess((event) => {
      const apiNodes = event.data as ApiNodeVO[];
      const flowNodes = apiNodes.map((node) => {
        const data = {
          parentId: node.parentId,
          convId: node.convId,
          userId: node.userId,
          createdAt: node.createdAt,
          updatedAt: node.updatedAt,
          ...(node.type !== 'root' ? node.data : {})
        } as NodeData<typeof node.type>;
  
        return {
          id: node.id.toString(),
          type: node.type,
          position: node.position,
          data,
          draggable: true,
          connectable: false,
          selectable: true, // 确保节点可选择
        } as Node<NodeData<typeof node.type>>;
      });
  
      // 创建边
      const flowEdges = flowNodes
        .filter(node => node.data.parentId !== null)
        .map(node => ({
          id: `e${node.data.parentId!}-${node.id}`,
          source: node.data.parentId!.toString(),
          target: node.id,
          type: 'smoothstep',
        }));
        
      console.log('flowNodes', flowNodes);
      console.log('flowEdges', flowEdges);

      // 使用布局函数计算新的节点位置，并更新服务器
      layoutNodes(flowNodes, flowEdges, true).then(layoutedNodes => {
        // 使用动画过渡
        animateLayoutTransition(flowNodes, layoutedNodes, setNodes, 500).then(() => {
          setEdges(flowEdges);
          setIsLoading(false);
          
          // fitview
          setTimeout(() => {
            // 找到id最小的前两个节点
            const minIdNodes = flowNodes.sort((a, b) => parseInt(a.id) - parseInt(b.id)).slice(0, 2);
            fitView({
              nodes: minIdNodes.map(node => ({id: node.id})),
              duration: 1000
            });
          }, 350);
          
          // 如果是新创建的conv，那么就chat
          setTimeout(() => {
            if (taskIdFromLocation) {
              chat(convId, taskIdFromLocation);
            }
          }, 300);
        });
      }).catch((error) => {
        console.error('Failed to layout nodes:', error);
        setNodes(flowNodes);
        setEdges(flowEdges);
        setIsLoading(false);
      });
    });

  const onNodesChange: OnNodesChange = useCallback(
    (changes) => setNodes((nds) => applyNodeChanges(changes, nds)),
    [setNodes],
  );
  const onEdgesChange: OnEdgesChange = useCallback(
    (changes) => setEdges((eds) => applyEdgeChanges(changes, eds)),
    [setEdges],
  );

  if (isLoading) {
    return <LoadingSpinner />;
  }

  return (
    <FlowContext.Provider value={{chat, convId} as FlowContextType}>
      <ReactFlow 
        nodes={nodes} 
        edges={edges} 
        nodeTypes={nodeTypes} 
        onNodesChange={onNodesChange} 
        onEdgesChange={onEdgesChange}
        style={{backgroundColor: "#EEEBE8"}}
        selectionOnDrag={true}
        selectionMode={SelectionMode.Partial}
        multiSelectionKeyCode="Control"
      >
        <Background variant={BackgroundVariant.Lines} size={10}/>
        <Panel position={"bottom-center"}>
          <FlowInputPanel
            canInput={canInput}
            createTempQueryNode={createTempQueryNode}
            updateTempQueryNodeText={updateTempQueryNodeText}
            removeTempQueryNode={removeTempQueryNode}
            getParentNodeId={getParentNodeId}
          />
        </Panel>
      </ReactFlow>
    </FlowContext.Provider>
  );
}

export default Flow;