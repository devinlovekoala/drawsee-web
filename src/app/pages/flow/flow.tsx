import {Background, BackgroundVariant, ReactFlow, type Node, Panel, OnNodesChange, applyNodeChanges, applyEdgeChanges, OnEdgesChange, MiniMap} from "@xyflow/react";
import RootNode from "@/app/pages/flow/components/node/RootNode";
import QueryNode from "@/app/pages/flow/components/node/QueryNode";
import AnswerNode from "@/app/pages/flow/components/node/AnswerNode";
import KnowledgeHeadNode from "@/app/pages/flow/components/node/KnowledgeHeadNode";
import KnowledgeDetailNode from "@/app/pages/flow/components/node/KnowledgeDetailNode";
import {useCallback, useState, useEffect, useMemo} from "react";
import {useLocation, useParams} from "react-router-dom";
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
import FlowRightToolBar from "./components/FlowRightToolBar";
import { useAppContext } from "@/app/contexts/AppContext";
import ResourceNode from "./components/node/resource/ResourceNode";
import FlowLeftToolBar from "./components/FlowLeftToolBar";
import { TASK_KEY_PREFIX } from "@/common/constant/storage-key.constant";
import { ChatTask } from "./types/ChatTask.types";

const nodeTypes = {
  'root': RootNode,
  'query': QueryNode,
  'answer': AnswerNode,
  'knowledge-head': KnowledgeHeadNode,
  'knowledge-detail': KnowledgeDetailNode,
  'resource': ResourceNode,
} as const;

function Flow() {
  const [isLoading, setIsLoading] = useState<boolean>(true);
  // 当前选中的节点
  const [selectedNode, setSelectedNode] = useState<Node | null>(null);
  // 用户输入
  const [userInput, setUserInput] = useState<string>('');
  // 展示小地图
  const [showMiniMap, setShowMiniMap] = useState<boolean>(true);

  // 获取路由参数中的courseId
  const { courseId } = useParams<{ courseId: string }>();
  
  // 获取location中的convId和taskId
  const locationState = useLocation().state as FlowLocationState | null;
  const convId = locationState?.convId || null;
  const taskIdFromLocation = locationState?.taskId || null;

  // 使用FlowState Hook
  const {elements, setElements, isChatting, rootNodeId, chat, addChatTask} = useFlowState(convId || undefined);
  
  // 使用临时查询节点Hook
  const {
    canInput,
    canNotInputReason,
    parentIdOfTempQueryNode,
    addTempQueryNodeTask: origAddTempQueryNodeTask,
    nodesAndEdgesNoneTempQueryNode
  } = useTempQueryNode(convId || undefined, isChatting, selectedNode, rootNodeId, elements, setElements);

  // 封装addTempQueryNodeTask以兼容FlowInputPanel接口
  const addTempQueryNodeTask = useCallback((task: any) => {
    if (typeof task === 'string') {
      origAddTempQueryNodeTask(task);
    } else if (task && typeof task === 'object') {
      // 兼容老接口
      if (task.type === 'create' || task.type === 'update') {
        origAddTempQueryNodeTask(task.text);
      }
    }
  }, [origAddTempQueryNodeTask]);

  // 使用FlowTools Hook
  const {executeLayout, executeFitView} = useFlowTools();

  // 使用AppContext Hook
  const {nodeWidth, setNodeWidth} = useAppContext();

  // 节点变化监听
  const onNodesChange: OnNodesChange = useCallback((changes) => {
    //console.log('onNodesChange', changes);
    
    setElements(({nodes, edges}) => {
      let newNodes = nodes;
      let newEdges = edges;

      // 处理节点选择变化
      let selectedNodeId: string | null = null;
      let unselectedNodeId: string | null = null;
      let fitViewNodeId: string | null = null;
      let selectionChanged = false;
      changes.forEach((change) => {
        if (change.type === 'select') {
          selectionChanged = true;
          if (change.selected) {
            selectedNodeId = change.id;
          } else {
            unselectedNodeId = change.id;
          }
        }
      });
      if (selectionChanged) {
        // 触发自定义事件，通知选择变化
        window.dispatchEvent(new CustomEvent('node-selection-change'));
      }
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

  // 边变化监听
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

  // 加载节点数据的函数
  const loadNodes = useCallback(() => {
    if (!convId) {
      setIsLoading(false);
      return;
    }

    const fetchData = async () => {
      try {
        const response = await getNodesByConvId(convId).send();
        const apiNodes = response as ApiNodeVO[];
        
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
    
          // 如果节点是knowledge-head或者solver-first或者solver-continue，则判断是否已经生成
          if (node.type === 'knowledge-head') {
            apiNodes.forEach(apiNode => {
              if (apiNode.parentId === node.id && apiNode.type === 'knowledge-detail') {
                data.isGenerated = true;
              }
            });
          }
          if (node.data.subtype === 'solver-first' || node.data.subtype === 'solver-continue') {
            apiNodes.forEach(apiNode => {
              if (
                apiNode.parentId === node.id && 
                (apiNode.data.subtype === 'solver-continue' || apiNode.data.subtype === 'solver-summary')
              ) {
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
          // 检查该taskId是否已经执行过
          const hasExecuted = sessionStorage.getItem(TASK_KEY_PREFIX+taskIdFromLocation);
          if (!hasExecuted) {
            // 标记该taskId已经执行过
            sessionStorage.setItem(TASK_KEY_PREFIX+taskIdFromLocation, 'true');
            setTimeout(() => {
              chat(taskIdFromLocation);
            }, 100);
          } else {
            console.log(`Task:${taskIdFromLocation}已经执行过，不重复执行`);
          }
        }

        setTimeout(() => {
          setIsLoading(false);
        }, 500);
      } catch (error) {
        // 出错时设置加载状态为false
        setIsLoading(false);
        toast.error('获取节点数据失败');
      }
    };

    fetchData();
  }, [convId, chat, executeLayout, setElements, taskIdFromLocation]);
  
  // 初始加载
  useEffect(() => {
    loadNodes();
  }, [loadNodes]);

  // 监听节点删除事件
  useEffect(() => {
    const handleNodeDeleted = () => {
      setIsLoading(true);
      setSelectedNode(null);
      setUserInput('');
      loadNodes();
    };
    // 添加事件监听
    window.addEventListener('node-deleted', handleNodeDeleted as EventListener);
    // 清理函数
    return () => {
      window.removeEventListener('node-deleted', handleNodeDeleted as EventListener);
    };
  }, [loadNodes]);

  // 处理从课程页面进入时自动创建对话
  useEffect(() => {
    if (courseId && !convId && !isLoading) {
      // TODO: 这里可以根据courseId创建一个新的对话或获取课程关联的对话
      console.log('从课程页面进入，courseId:', courseId);
      // 可以在这里添加获取课程相关对话的逻辑
    }
  }, [courseId, convId, isLoading]);
  
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

  // 处理节点宽度变化
  const handleNodeWidthChange = useCallback((width: number) => {
    setNodeWidth(width);
    setTimeout(() => {
      handleRelayout(true, width);
    }, 100);
  }, [handleRelayout, setNodeWidth]);

  // 处理对话
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

  // 错误处理
  const onError = useCallback((code: string, message: string) => {
    console.error('reactflow onError', code, message);
  }, []);

  // 初始化
  const onInit = useCallback(() => {
    if (elements.nodes.length > 0) {
      executeFitView(elements.nodes.sort((a, b) => parseInt(a.id) - parseInt(b.id)).slice(0, 1).map(node => node.id), 250);
    }
  }, [elements.nodes, executeFitView]);

  // 创建FlowContext的值
  const flowContextValue = useMemo(() => ({
    isChatting,
    convId,
    chat: flowChat,
    addChatTask: async (convId: number, parentId: number | null, type: 'knowledge', question?: string, callback?: (taskId: number) => void) => {
      if (!convId) {
        toast.error('未找到对话ID');
        return;
      }
      
      return await addChatTask(convId, parentId, type, question, callback);
    }
  }), [isChatting, convId, flowChat, addChatTask]);

  // 加载中
  if (isLoading) {
    return <LoadingSpinner />;
  }

  // 返回
  return (
    <FlowContext.Provider value={flowContextValue}>
      <ReactFlow 
        nodes={elements.nodes} 
        edges={elements.edges}
        onNodesChange={onNodesChange} // 节点变化监听
        onEdgesChange={onEdgesChange} // 边变化监听
        onError={onError} // 错误处理
        onInit={onInit} // 初始化
        nodeTypes={nodeTypes} // 节点类型
        style={{backgroundColor: "#EEEBE8", borderRadius: '8px'}} // 背景样式
        nodesDraggable={false} // 节点不可拖拽
        draggable={false} // 节点不可拖拽
        selectionKeyCode={null} // 取消选择快捷键
        multiSelectionKeyCode={null} // 取消多选快捷键
        deleteKeyCode={null} // 取消删除快捷键
        panActivationKeyCode={"Space"} // 平移快捷键
        onlyRenderVisibleElements={true} // 只渲染可见元素，提高性能
        maxZoom={2} // 最大缩放
        minZoom={0.01} // 最小缩放
        defaultViewport={{ x: 0, y: 0, zoom: 0.5 }} // 默认视图
        defaultEdgeOptions={{ // 默认边样式
          type: 'smoothstep', // 平滑曲线
          animated: false, // 动画
          selectable: false, // 不可选择
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
        {/* 背景 */}
        <Background variant={BackgroundVariant.Lines} size={10}/>
        {/* 小地图 */}
        {showMiniMap && (
          <MiniMap nodeStrokeWidth={3} nodeColor={'#b8b8b8'} style={{borderRadius: '10px'}} />
        )}
        {/* 底部输入框 */}
        <Panel position={"bottom-center"}>
          <FlowInputPanel
            selectedNode={selectedNode}
            prompt={userInput}
            setPrompt={setUserInput}
            canInput={canInput}
            canNotInputReason={canNotInputReason}
            addTempQueryNodeTask={addTempQueryNodeTask}
            parentIdOfTempQueryNode={parentIdOfTempQueryNode}
          />
        </Panel>
        {/* 顶部右侧工具栏 */}
        <Panel position={"top-right"}>
          <FlowRightToolBar
            showMiniMap={showMiniMap}
            setShowMiniMap={setShowMiniMap}
            onRelayout={handleRelayout} 
            onNodeWidthChange={handleNodeWidthChange} 
            nodeWidth={nodeWidth} 
          />
        </Panel>
        {/* 顶部左侧工具栏 */}
        <Panel position={"top-left"}>
          <FlowLeftToolBar />
        </Panel>
      </ReactFlow>
    </FlowContext.Provider>
  );
}

export default Flow;