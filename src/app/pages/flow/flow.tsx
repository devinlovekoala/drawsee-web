import {Background, BackgroundVariant, ReactFlow, type Node, Panel, OnNodesChange, applyNodeChanges, applyEdgeChanges, OnEdgesChange, MiniMap} from "@xyflow/react";
import RootNode from "@/app/pages/flow/components/node/RootNode";
import QueryNode from "@/app/pages/flow/components/node/QueryNode";
import AnswerNode from "@/app/pages/flow/components/node/AnswerNode";
import KnowledgeHeadNode from "@/app/pages/flow/components/node/KnowledgeHeadNode";
import KnowledgeDetailNode from "@/app/pages/flow/components/node/KnowledgeDetailNode";
import {useCallback, useState, useEffect} from "react";
import {useLocation} from "react-router-dom";
import {useWatcher} from "alova/client";
import {getNodesByConvId} from "@/api/methods/flow.methods.ts";
import type { NodeVO as ApiNodeVO } from '@/api/types/flow.types';
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
import { FlowContext, FlowLocationState } from "@/app/contexts/FlowContext";
import FlowToolBar from "./components/FlowToolBar";
import { useAppContext } from "@/app/contexts/AppContext";

const nodeTypes = {
  'root': RootNode,
  'query': QueryNode,
  'answer': AnswerNode,
  'knowledge-head': KnowledgeHeadNode,
  'knowledge-detail': KnowledgeDetailNode,
} as const;

function Flow() {
  const [isLoading, setIsLoading] = useState<boolean>(true);
  // 当前选中的节点
  const [selectedNode, setSelectedNode] = useState<Node | null>(null);
  // 用户输入
  const [userInput, setUserInput] = useState<string>('');
  // 展示小地图
  const [showMiniMap, setShowMiniMap] = useState<boolean>(true);
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

  const {nodeWidth, setNodeWidth} = useAppContext();

  const onNodesChange: OnNodesChange = useCallback((changes) => {
    //console.log('onNodesChange', changes);
    
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
        // 如果取消选中节点，则选中根节点，除非当前选中节点就是根节点
        const rootNode = newNodes.find(node => node.id === rootNodeId);
        setSelectedNode(selectedNode?.id === rootNodeId ? null : rootNode || null);
        if (rootNode) {
          newNodes = newNodes.map(node => ({
            ...node,
            selected: node.id === rootNodeId
          }));
        }
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
          newNodes.forEach((node, index) => {
            if (node.id === change.id) {
              const curHeight = node.data.height as number | undefined;
              const newHeight = change.dimensions?.height;
              //console.log('curHeight', curHeight, 'newHeight', newHeight);
              newNodes[index].data.height = newHeight;
              if (!node.id.startsWith(TEMP_QUERY_NODE_ID_PREFIX) && (
                ( curHeight === undefined && newHeight !== undefined ) ||
                ( curHeight !== undefined && newHeight !== undefined && 
                  Math.abs(newHeight - curHeight) > 10 )
              )) {
                updateHeightNodeCount++;
              }
            }
          });
        }
      });
      // updateHeightNodeCount 超过node总数的一半
      //console.log('updateHeightNodeCount', updateHeightNodeCount, 'newNodes.length', newNodes.length);
      if (updateHeightNodeCount > (newNodes.length / 2)) {
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
  },[executeFitView, executeLayout, nodesAndEdgesNoneTempQueryNode, rootNodeId, selectedNode?.id, setElements]);

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
  
        // 如果节点是knowledge-head，则判断是否已经生成
        if (node.type === 'knowledge-head') {
          apiNodes.forEach(apiNode => {
            if (apiNode.parentId === node.id && apiNode.type === 'knowledge-detail') {
              data.isGenerated = true;
            }
          });
        }

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

      // 如果是新创建的conv，那么就chat
      if (taskIdFromLocation) {
        setTimeout(() => {
          chat(taskIdFromLocation);
        }, 100);
      }

      setTimeout(() => {
        setIsLoading(false);
      }, 500);
    })
    .onError(() => {
      // 出错时设置加载状态为false
      setIsLoading(false);
      toast.error('获取节点数据失败');
    });
  
  const handleRelayout = useCallback((resetHeight: boolean = false, newNodeWidth?: number) => {
    if (isChatting) return;
    console.log('handleRelayout');
    setElements(({nodes, edges}) => {
      const layoutedNodes = executeLayout(nodes, edges, true, resetHeight, newNodeWidth);
      executeFitView(layoutedNodes.map(node => node.id), 350, 600, 0.8, 0.2);
      return {
        nodes: layoutedNodes,
        edges
      };
    });
  }, [executeFitView, executeLayout, isChatting, setElements]);

  const handleNodeWidthChange = useCallback((width: number) => {
    setNodeWidth(width);
    setTimeout(() => {
      handleRelayout(true, width);
    }, 100);
  }, [handleRelayout, setNodeWidth]);

  const flowChat = useCallback((taskId: number) => {
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
  }, [chat, setElements, setSelectedNode]);

  const onError = useCallback((code: string, message: string) => {
    console.error('reactflow onError', code, message);
  }, []);

  const onInit = useCallback(() => {
    executeFitView(elements.nodes.sort((a, b) => parseInt(a.id) - parseInt(b.id)).slice(0, 1).map(node => node.id), 250);
  }, [elements.nodes, executeFitView]);

  if (isLoading) {
    return <LoadingSpinner />;
  }

  return (
    <FlowContext.Provider value={{
      isChatting,
      convId,
      chat: flowChat
    }}>
      <ReactFlow 
        nodes={elements.nodes} 
        edges={elements.edges}
        onNodesChange={onNodesChange}
        onEdgesChange={onEdgesChange}
        onError={onError}
        onInit={onInit}
        nodeTypes={nodeTypes} 
        style={{backgroundColor: "#EEEBE8"}}
        nodesDraggable={false}
        draggable={false}
        selectionKeyCode={null}
        multiSelectionKeyCode={null}
        deleteKeyCode={null}
        panActivationKeyCode={"Space"}
        onlyRenderVisibleElements={true} // 只渲染可见元素，提高性能
        maxZoom={2}
        minZoom={0.01}
        defaultViewport={{ x: 0, y: 0, zoom: 0.5 }}
        defaultEdgeOptions={{
          type: 'smoothstep',
          animated: false,
          selectable: false,
          style: {
            stroke: '#999', // 线条的颜色，使用十六进制表示法，这里是灰色
            strokeWidth: 5, // 线条的宽度，单位是像素
            strokeLinecap: 'round', // 线条的端点样式，这里是圆形的端点
            strokeLinejoin: 'round', // 线条的连接点样式，这里是圆形的连接
            strokeDasharray: '25 30', // 线条的虚线样式，表示线段和空白的长度，这里是每段线段和空白各10个单位
            strokeDashoffset: 0, // 虚线的偏移量，控制虚线的起始位置，这里是0，表示从起始位置开始
            strokeOpacity: 0.85, // 线条的透明度，范围从0（完全透明）到1（完全不透明），这里是完全不透明
          }
        }}
      >
        <Background variant={BackgroundVariant.Lines} size={10}/>
        {showMiniMap && (
          <MiniMap nodeStrokeWidth={3} nodeColor={'#b8b8b8'} style={{borderRadius: '10px'}} />
        )}
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
        <Panel position={"top-right"}>
          <FlowToolBar
            showMiniMap={showMiniMap}
            setShowMiniMap={setShowMiniMap}
            onRelayout={handleRelayout} 
            onNodeWidthChange={handleNodeWidthChange} 
            nodeWidth={nodeWidth} 
          />
        </Panel>
      </ReactFlow>
    </FlowContext.Provider>
  );
}

export default Flow;