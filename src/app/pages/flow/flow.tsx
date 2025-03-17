import {Background, BackgroundVariant, ReactFlow, type Node, Panel, OnNodesChange, applyNodeChanges, applyEdgeChanges, OnEdgesChange, useOnSelectionChange, SelectionMode} from "@xyflow/react";
import RootNode from "@/app/pages/flow/components/node/RootNode";
import QueryNode from "@/app/pages/flow/components/node/QueryNode";
import AnswerNode from "@/app/pages/flow/components/node/AnswerNode";
import KnowledgeHeadNode from "@/app/pages/flow/components/node/KnowledgeHeadNode";
import KnowledgeDetailNode from "@/app/pages/flow/components/node/KnowledgeDetailNode";
import {useCallback, useState, useEffect, createContext, useRef} from "react";
import {useLocation} from "react-router-dom";
import {useWatcher} from "alova/client";
import {getNodesByConvId} from "@/api/methods/flow.methods.ts";
import type { NodeVO as ApiNodeVO, NodeToUpdate } from '@/api/types/flow.types';
import type { NodeData } from './components/node/types/node.types';
import { LoadingSpinner } from './components/loading/LoadingSpinner';
import useFlowState from './hooks/useFlowState';
import { FlowInputPanel } from './components/input/FlowInputPanel';
import '@xyflow/react/dist/style.css';
import useTempQueryNode from "./hooks/useTempQueryNode";
import useFlowTools from "./hooks/useFlowTools";
import { toast } from "sonner";
// 导入优化后的CSS样式
import './styles/index.css';
import { TEMP_QUERY_NODE_ID_PREFIX } from "./constants";

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

export type FlowContextType = {
  chat: (taskId: number) => void;
  convId: number;
}
export const FlowContext = createContext<FlowContextType>({
  chat: () => {},
  convId: -1,
});

function Flow() {
  const [isLoading, setIsLoading] = useState<boolean>(true);
  // 当前选中的节点
  const [selectedNode, setSelectedNode] = useState<Node | null>(null);
  // 用户输入
  const [userInput, setUserInput] = useState<string>('');
  // 获取location中的convId和taskId
  const {convId, taskId: taskIdFromLocation} = useLocation().state as FlowLocationState;
  // 使用FlowState Hook
  const {elements, setElements, isChatting, rootNodeId, chat} = useFlowState(convId);
  // 使用临时查询节点Hook
  const {
    canInput,
    canNotInputReason,
    parentIdOfTempQueryNode,
    addTempQueryNodeTask,
    nodesAndEdgesNoneTempQueryNode
  } = useTempQueryNode(convId, isChatting, selectedNode, rootNodeId, elements, setElements);

  const {executeLayout, executeFitView} = useFlowTools();

  const onSelectionChange = useCallback(({ nodes }: { nodes: Node[] }) => {
  }, []);

  const onNodesChange: OnNodesChange = useCallback((changes) => {
    console.log('onNodesChange', changes);
    
    setElements(({nodes, edges}) => {
      let newNodes = nodes;
      let newEdges = edges;

      // 处理节点选择变化
      let selectedNodeId: string | null = null;
      let unselectedNodeId: string | null = null;
      let fitViewNodeId: string | null = null;
      changes.forEach((change) => {
        if (change.type === 'select') {
          if (change.selected) {
            selectedNodeId = change.id;
          } else {
            unselectedNodeId = change.id;
          }
        }
      });
      if (selectedNodeId) {
        // 如果选中节点发生变化，则更新选中节点
        if (selectedNodeId !== selectedNode?.id) {
          setSelectedNode(newNodes.find(node => node.id === selectedNodeId) || null);
          // 如果存在临时提问节点则删除临时提问节点
          const tempQueryNode = newNodes.find(node => node.id.startsWith(TEMP_QUERY_NODE_ID_PREFIX));
          if (tempQueryNode) {
            newNodes = nodesAndEdgesNoneTempQueryNode.current?.nodes || newNodes;
            newEdges = nodesAndEdgesNoneTempQueryNode.current?.edges || newEdges;
            fitViewNodeId = selectedNodeId;
          }
          setUserInput('');
        }
      } else if (unselectedNodeId) {
        // 如果取消选中节点，则取消选中
        setSelectedNode(null);
        // 如果存在临时提问节点则删除临时提问节点
        const tempQueryNode = newNodes.find(node => node.id.startsWith(TEMP_QUERY_NODE_ID_PREFIX));
        if (tempQueryNode) {
          newNodes = nodesAndEdgesNoneTempQueryNode.current?.nodes || newNodes;
          newEdges = nodesAndEdgesNoneTempQueryNode.current?.edges || newEdges;
          fitViewNodeId = unselectedNodeId;
        }
        setUserInput('');
      }

      newNodes = applyNodeChanges(changes, newNodes);

      // 处理节点高度变化
      let updateHeightNodeCount = 0;
      changes.forEach((change) => {
        if (change.type === 'dimensions') {
          // 修改newNodes中id相同的节点
          newNodes.forEach((node) => {
            if (node.id === change.id) {
              const curHeight = node.data.height as number | undefined;
              const newHeight = change.dimensions?.height;
              //console.log('curHeight', curHeight, 'newHeight', newHeight);
              if (!node.id.startsWith(TEMP_QUERY_NODE_ID_PREFIX) && (
                ( curHeight === undefined && newHeight !== undefined ) ||
                ( curHeight !== undefined && newHeight !== undefined && 
                  Math.abs(newHeight - curHeight) > 5 )
              )) {
                node.data.height = newHeight;
                updateHeightNodeCount++;
              }
            }
          });
        }
      });
      if (updateHeightNodeCount > 0) {
        console.log('实际渲染时height变化了', updateHeightNodeCount, '次，进行布局');
        // 进行布局
        executeLayout(newNodes, edges, true);
      }
      if (fitViewNodeId) {
        console.log('执行fitView', fitViewNodeId);
        executeFitView([fitViewNodeId], 350);
      }
      return {
        nodes: newNodes,
        edges: newEdges,
      };
    });
  },[setElements]);

  const onEdgesChange: OnEdgesChange = useCallback((changes) => {
    setElements(({nodes, edges}) => {
      return {
        nodes,
        edges: applyEdgeChanges(changes, edges),
      };
    });
  }, [setElements]);

  // 监听convId变化，立即重置状态
  useEffect(() => {
    setIsLoading(true);
    setSelectedNode(null);
    setUserInput('');
  }, [convId]);

  useWatcher(getNodesByConvId(convId), [convId], {immediate: true, force: true})
    .onSuccess(async (event) => {
      const apiNodes = event.data as ApiNodeVO[];
      // 如果没有节点数据，直接设置为空并结束加载
      if (!apiNodes || apiNodes.length === 0) {
        setElements({nodes: [], edges: []});
        setIsLoading(false);
        return;
      }
      // 将apiNodes转换为flowNodes
      const flowNodes = apiNodes.map((node) => {
        const data = {
          parentId: node.parentId,
          convId: node.convId,
          userId: node.userId,
          createdAt: node.createdAt,
          updatedAt: node.updatedAt,
          // 如果节点有height属性，将其添加到data中
          ...(node.height !== null ? { height: node.height } : {}),
          ...(node.type !== 'root' ? node.data : {})
        } as NodeData<typeof node.type>;
  
        return {
          id: node.id.toString(),
          type: node.type,
          position: node.position,
          data,
          draggable: false,
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

      // 执行布局 - 但不使用动画，提高性能
      const layoutedNodes = executeLayout(flowNodes, flowEdges, true);
      setElements({nodes: layoutedNodes, edges: flowEdges});
      setIsLoading(false);
      
      executeFitView(layoutedNodes.sort((a, b) => parseInt(a.id) - parseInt(b.id)).slice(0, 1).map(node => node.id), 500);
      // 如果是新创建的conv，那么就chat
      if (taskIdFromLocation) {
        setTimeout(() => {
          chat(taskIdFromLocation);
        }, 100);
      }
    })
    .onError(() => {
      // 出错时设置加载状态为false
      setIsLoading(false);
      toast.error('获取节点数据失败');
    });

  if (isLoading) {
    return <LoadingSpinner />;
  }

  return (
    <FlowContext.Provider value={{
      convId,
      chat: (taskId: number) => {
        // 将当前选中的节点的selected设置为false
        setSelectedNode(null);
        setElements(({nodes, edges}) => {
          return {
            nodes: nodes.map(node => ({
              ...node,
              selected: false
            })),
            edges
          };
        });
        chat(taskId);
      }
    } as FlowContextType}>
      <ReactFlow 
        nodes={elements.nodes} 
        edges={elements.edges} 
        onNodesChange={onNodesChange}
        onEdgesChange={onEdgesChange}
        onSelectionChange={onSelectionChange}
        nodeTypes={nodeTypes} 
        style={{backgroundColor: "#EEEBE8"}}
        nodesDraggable={false}
        draggable={false}
        selectionKeyCode={null}
        multiSelectionKeyCode={null}
        deleteKeyCode={null}
        //onlyRenderVisibleElements={true} 会很卡
        maxZoom={2}
        minZoom={0.01}
        defaultViewport={{ x: 0, y: 0, zoom: 0.5 }}
        defaultEdgeOptions={{
          type: 'smoothstep',
          animated: false,
          selectable: false,
          style: {
            stroke: '#999', // 灰色
            strokeWidth: 2,
            strokeLinecap: 'round',
            strokeLinejoin: 'round',
            strokeDasharray: '10 10',
            strokeDashoffset: 0,
            strokeOpacity: 1,
          }
        }}
      >
        <Background variant={BackgroundVariant.Lines} size={10}/>
        <Panel position={"bottom-center"}>
          <FlowInputPanel
            prompt={userInput}
            setPrompt={setUserInput}
            canInput={canInput}
            canNotInputReason={canNotInputReason}
            addTempQueryNodeTask={addTempQueryNodeTask}
            parentIdOfTempQueryNode={parentIdOfTempQueryNode}
          />
        </Panel>
      </ReactFlow>
    </FlowContext.Provider>
  );
}

export default Flow;