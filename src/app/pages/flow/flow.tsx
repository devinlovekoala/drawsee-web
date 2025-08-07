import {Background, BackgroundVariant, ReactFlow, type Node, Panel, OnNodesChange, applyNodeChanges, applyEdgeChanges, OnEdgesChange, MiniMap} from "@xyflow/react";
import RootNode from "@/app/pages/flow/components/node/RootNode";
import QueryNode from "@/app/pages/flow/components/node/QueryNode";
import AnswerNode from "@/app/pages/flow/components/node/AnswerNode";
import KnowledgeHeadNode from "@/app/pages/flow/components/node/KnowledgeHeadNode";
import KnowledgeDetailNode from "@/app/pages/flow/components/node/KnowledgeDetailNode";
import CircuitCanvasNode from "@/app/pages/flow/components/node/CircuitCanvasNode";
import CircuitPointNode from "@/app/pages/flow/components/node/CircuitPointNode";
import CircuitDetailNode from "@/app/pages/flow/components/node/CircuitDetailNode";
import AnswerPointNode from "@/app/pages/flow/components/node/AnswerPointNode";
import AnswerDetailNode from "@/app/pages/flow/components/node/AnswerDetailNode";
import PdfDocumentNode from "./components/node/PdfDocumentNode";
import PdfAnalysisPointNode from "./components/node/PdfAnalysisPointNode";
import NodeDetailPanel from "./components/NodeDetailPanel";
import {useCallback, useState, useEffect} from "react";
import {useLocation, useNavigate} from "react-router-dom";
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
import { useAdaptiveZoom } from "./hooks/useAdaptiveZoom";
import { toast } from "sonner";
// 导入优化后的CSS样式
import './styles/index.css';
import { TEMP_QUERY_NODE_ID_PREFIX } from "./constants";
import { FlowContext, FlowLocationState } from "@/app/contexts/FlowContext";
import FlowRightToolBar from "./components/FlowRightToolBar";
import ResourceNode from "./components/node/resource/ResourceNode";
import FlowLeftToolBar from "./components/FlowLeftToolBar";
import { TASK_KEY_PREFIX } from "@/common/constant/storage-key.constant";
import { useViewportChange } from "./hooks/useViewportChange";

// 创建紧凑模式的节点类型
const CompactRootNode = (props: any) => <RootNode {...props} compactMode={true} />;
const CompactQueryNode = (props: any) => <QueryNode {...props} compactMode={true} />;
const CompactAnswerNode = (props: any) => <AnswerNode {...props} compactMode={true} />;
const CompactAnswerPointNode = (props: any) => <AnswerPointNode {...props} compactMode={true} />;
const CompactAnswerDetailNode = (props: any) => <AnswerDetailNode {...props} compactMode={true} />;
const CompactKnowledgeHeadNode = (props: any) => <KnowledgeHeadNode {...props} compactMode={true} />;
const CompactKnowledgeDetailNode = (props: any) => <KnowledgeDetailNode {...props} compactMode={true} />;
const CompactCircuitCanvasNode = (props: any) => <CircuitCanvasNode {...props} compactMode={true} />;
const CompactCircuitPointNode = (props: any) => <CircuitPointNode {...props} compactMode={true} />;
const CompactCircuitDetailNode = (props: any) => <CircuitDetailNode {...props} compactMode={true} />;
const CompactResourceNode = (props: any) => <ResourceNode {...props} compactMode={true} />;
const CompactPdfDocumentNode = (props: any) => <PdfDocumentNode {...props} compactMode={true} />;
const CompactPdfAnalysisPointNode = (props: any) => <PdfAnalysisPointNode {...props} compactMode={true} />;

const nodeTypes = {
  'root': CompactRootNode,
  'query': CompactQueryNode,
  'answer': CompactAnswerNode,
  'answer-point': CompactAnswerPointNode,
  'answer-detail': CompactAnswerDetailNode,
  'ANSWER_POINT': CompactAnswerPointNode,
  'ANSWER_DETAIL': CompactAnswerDetailNode,
  'knowledge-head': CompactKnowledgeHeadNode,
  'knowledge-detail': CompactKnowledgeDetailNode,
  'resource': CompactResourceNode,
  // 电路分析节点类型 - 统一使用小写中划线形式
  'circuit-canvas': CompactCircuitCanvasNode,   // 电路画布节点
  'circuit-point': CompactCircuitPointNode,     // 电路分析点节点
  'circuit-detail': CompactCircuitDetailNode,   // 电路分析详情节点
  // PDF相关节点类型
  'PDF_DOCUMENT': CompactPdfDocumentNode,       // PDF文档节点
  'PDF_ANALYSIS_POINT': CompactPdfAnalysisPointNode, // PDF分析点节点
} as const;

function Flow() {
  const navigate = useNavigate();
  const [isLoading, setIsLoading] = useState<boolean>(true);
  // 当前选中的节点
  const [selectedNode, setSelectedNode] = useState<Node | null>(null);
  // 用户输入
  const [userInput, setUserInput] = useState<string>('');
  // 展示小地图
  const [showMiniMap, setShowMiniMap] = useState<boolean>(true);
  // 显示详情面板
  const [showDetailPanel, setShowDetailPanel] = useState<boolean>(true);
  
  // 获取location中的convId、taskId和classId
  const location = useLocation();
  const locationState = location.state as FlowLocationState;
  const convId = locationState?.convId;
  const taskIdFromLocation = locationState?.taskId;
  const classId = locationState?.classId || 
    (convId ? sessionStorage.getItem(`circuit_class_id_${convId}`) : null); // 从sessionStorage获取班级ID
  
  // 使用流程图状态管理Hook，传递selectedNode和setSelectedNode
  const {
    elements,
    isChatting,
    rootNodeId,
    chat,
    setElements,
    addChatTask
  } = useFlowState(convId, selectedNode, setSelectedNode);
  
  // 处理返回班级列表
  const handleBackToCourses = useCallback(() => {
    // 如果有班级ID，返回到课程页面
    if (classId) {
      navigate('/course');
    } else {
      // 否则返回到主页
      navigate('/');
    }
  }, [navigate, classId]);
  
  // 使用临时查询节点Hook
  const {
    canInput,
    canNotInputReason,
    parentIdOfTempQueryNode,
    addTempQueryNodeTask,
    nodesAndEdgesNoneTempQueryNode
  } = useTempQueryNode(convId, isChatting, selectedNode, rootNodeId, elements, setElements);

  // 使用FlowTools Hook
  const {executeLayout} = useFlowTools();
  
  // 使用自适应缩放Hook
  const { smartFitView } = useAdaptiveZoom();

  // 获取最新的节点数据的函数
  const getLatestNodeData = useCallback((nodeId: string): Node | null => {
    return elements.nodes.find(node => node.id === nodeId) || null;
  }, [elements.nodes]);

  // 节点变化监听
  const onNodesChange: OnNodesChange = useCallback((changes) => {
    setElements(({nodes, edges}) => {
      let newNodes = nodes;
      let newEdges = edges;
      let needsRelayout = false;
      let significantChanges = 0;
      const totalNodes = nodes.length;

      // 处理节点选择变化
      let selectedNodeId: string | null = null;
      let unselectedNodeId: string | null = null;
      let fitViewNodeId: string | null = null;
      let selectionChanged = false;

      // 节点高度变化的累计值
      let totalHeightChange = 0;
      let changedNodesCount = 0;

      changes.forEach((change) => {
        if (change.type === 'select') {
          selectionChanged = true;
          if (change.selected) {
            selectedNodeId = change.id;
          } else {
            unselectedNodeId = change.id;
          }
        } else if (change.type === 'dimensions') {
          const node = newNodes.find(n => n.id === change.id);
          if (node) {
            const curHeight = node.data.height as number | undefined;
            const newHeight = change.dimensions?.height;

            if (curHeight !== undefined && newHeight !== undefined) {
              const heightDiff = Math.abs(newHeight - curHeight);
              totalHeightChange += heightDiff;
              changedNodesCount++;

              // 更新节点高度
              node.data.height = newHeight;

              // 检查是否是显著变化
              if (heightDiff > 20) { // 显著变化阈值
                significantChanges++;
              }
            }
          }
        }
      });

      // 计算是否需要重新布局的条件
      const averageHeightChange = changedNodesCount > 0 ? totalHeightChange / changedNodesCount : 0;
      const significantChangeRatio = significantChanges / totalNodes;

      // 判断是否需要重新布局
      needsRelayout = (
        // 条件1: 显著变化的节点比例超过阈值
        significantChangeRatio > 0.3 ||
        // 条件2: 平均高度变化超过阈值
        (changedNodesCount > 0 && averageHeightChange > 30) ||
        // 条件3: 变化的节点数量超过总节点数的一定比例，且平均变化较大
        (changedNodesCount > totalNodes * 0.4 && averageHeightChange > 15)
      );

      // 处理选择变化
      if (selectionChanged) {
        window.dispatchEvent(new CustomEvent('node-selection-change'));
        if (selectedNodeId && selectedNodeId !== selectedNode?.id) {
          const selectedFlowNode = newNodes.find(node => node.id === selectedNodeId);
          setSelectedNode(selectedFlowNode || null);
          const tempQueryNode = newNodes.find(node => node.id.startsWith(TEMP_QUERY_NODE_ID_PREFIX));
          if (tempQueryNode) {
            newNodes = nodesAndEdgesNoneTempQueryNode.current?.nodes || newNodes;
            newEdges = nodesAndEdgesNoneTempQueryNode.current?.edges || newEdges;
            fitViewNodeId = selectedNodeId;
          }
          setUserInput('');
        } else if (unselectedNodeId) {
          const rootNode = newNodes.find(node => node.id === rootNodeId);
          setSelectedNode(selectedNode?.id === rootNodeId ? null : rootNode || null);
          if (rootNode) {
            newNodes = newNodes.map(node => ({
              ...node,
              selected: node.id === rootNodeId
            }));
          }
          const tempQueryNode = newNodes.find(node => node.id.startsWith(TEMP_QUERY_NODE_ID_PREFIX));
          if (tempQueryNode) {
            newNodes = nodesAndEdgesNoneTempQueryNode.current?.nodes || newNodes;
            newEdges = nodesAndEdgesNoneTempQueryNode.current?.edges || newEdges;
            fitViewNodeId = unselectedNodeId;
          }
          setUserInput('');
        }
      }

      // 应用节点变化
      newNodes = applyNodeChanges(changes, newNodes);

      // 同步更新selectedNode以支持流式内容更新
      if (selectedNode && !selectionChanged) {
        const updatedSelectedNode = newNodes.find(node => node.id === selectedNode.id);
        if (updatedSelectedNode && (
          updatedSelectedNode.data.text !== selectedNode.data.text ||
          updatedSelectedNode.data.updatedAt !== selectedNode.data.updatedAt ||
          updatedSelectedNode.data.process !== selectedNode.data.process
        )) {
          console.log(`检测到选中节点内容变化，立即同步更新: ${selectedNode.id}`);
          setSelectedNode(updatedSelectedNode);
        }
      }

      // 如果需要重新布局，执行布局计算
      if (needsRelayout) {
        console.log('检测到显著布局变化，进行重新布局', {
          totalNodes,
          changedNodes: changedNodesCount,
          averageHeightChange,
          significantChanges,
          significantChangeRatio
        });
        newNodes = executeLayout(newNodes, edges, true);
      }

      // 执行视图调整
      if (fitViewNodeId) {
        console.log('执行智能fitView', fitViewNodeId);
        setTimeout(() => {
          smartFitView([fitViewNodeId], newNodes, 0, 350);
        }, 50);
      }

      return {
        nodes: newNodes,
        edges: newEdges,
      };
    });
  }, [executeLayout, nodesAndEdgesNoneTempQueryNode, rootNodeId, selectedNode?.id, selectedNode, setElements, setSelectedNode, setUserInput, smartFitView]);

  // 边变化监听
  const onEdgesChange: OnEdgesChange = useCallback((changes) => {
    setElements(({nodes, edges}) => {
      return {
        nodes,
        edges: applyEdgeChanges(changes, edges),
      };
    });
  }, [setElements]);

  // 使用视口变化监听hook - 解决缩放时节点布局问题
  useViewportChange(elements.nodes, elements.edges, isChatting, setElements);

  // 监听节点缩放变化事件 - 补充处理BaseNode组件发出的缩放变化事件
  useEffect(() => {
    const handleNodeScaleChanged = (event: CustomEvent) => {
      // 避免在聊天或加载过程中处理
      if (isChatting || isLoading || elements.nodes.length === 0) return;
      
      // 获取缩放值
      const { zoom } = event.detail;
      console.log('检测到节点缩放变化，缩放值:', zoom);
      
      // 在小缩放值时进行更精细的布局优化
      if (zoom < 0.3) {
        // 使用低缩放专用的布局参数进行重布局
        setElements(({nodes, edges}) => {
          const layoutedNodes = executeLayout(nodes, edges, false, false);
          return { nodes: layoutedNodes, edges };
        });
      }
    };
    
    // 添加事件监听
    window.addEventListener('node-scale-changed', handleNodeScaleChanged as EventListener);
    
    // 清理函数
    return () => {
      window.removeEventListener('node-scale-changed', handleNodeScaleChanged as EventListener);
    };
  }, [isChatting, isLoading, elements.nodes.length, executeLayout, setElements]);

  // 监听convId变化，立即重置状态
  useEffect(() => {
    setIsLoading(true);
    setSelectedNode(null);
    setUserInput('');
  }, [convId]);

  // 获取节点数据，当convId变化时，重新发送请求
  const {send} = useWatcher(getNodesByConvId(convId), [convId], {immediate: true, force: true})
    .onSuccess(async (event) => {
      const apiNodes = event.data as ApiNodeVO[];
      // 如果没有节点数据，直接设置为空并结束加载
      if (!apiNodes || apiNodes.length === 0) {
        setElements({nodes: [], edges: []});
        setSelectedNode(null); // 清空选中节点
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
        // 处理answer-point节点
        if (node.type === 'answer-point' || node.type === 'ANSWER_POINT') {
          apiNodes.forEach(apiNode => {
            if (apiNode.parentId === node.id && (apiNode.type === 'answer-detail' || apiNode.type === 'ANSWER_DETAIL')) {
              data.isGenerated = true;
            }
          });
        }
        
        // 处理circuit-point节点
        if (node.type === 'circuit-point') {
          apiNodes.forEach(apiNode => {
            if (apiNode.parentId === node.id && apiNode.type === 'circuit-detail') {
              data.isGenerated = true;
            }
          });
        }
        
        // 对于详情节点，如果有文本内容，设置为已完成状态
        if ((node.type === 'answer-detail' || node.type === 'ANSWER_DETAIL' || 
             node.type === 'circuit-detail' || node.type === 'knowledge-detail') && 
            node.data.text && typeof node.data.text === 'string' && node.data.text.length > 0) {
          console.log(`初始化详情节点 ${node.id} 状态为已完成，类型: ${node.type}`);
          data.isGenerated = true;
          data.process = 'completed';
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

      // 如果当前有选中的节点，更新selectedNode以反映最新数据
      if (selectedNode && selectedNode.id) {
        const updatedSelectedNode = layoutedNodes.find(node => node.id === selectedNode.id);
        if (updatedSelectedNode) {
          setSelectedNode(updatedSelectedNode);
        }
      }

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
    })
    .onError(() => {
      // 出错时设置加载状态为false
      setIsLoading(false);
      setSelectedNode(null); // 清空选中节点
      toast.error('获取节点数据失败');
    });
  
  // 监听节点删除事件
  useEffect(() => {
    const handleNodeDeleted = () => {
      setIsLoading(true);
      setSelectedNode(null);
      setUserInput('');
      send();
    };
    // 添加事件监听
    window.addEventListener('node-deleted', handleNodeDeleted as EventListener);
    // 清理函数
    return () => {
      window.removeEventListener('node-deleted', handleNodeDeleted as EventListener);
    };
  }, [send]);

  // 监听自动选中详情节点事件
  useEffect(() => {
    const handleAutoSelectDetailNode = (event: CustomEvent) => {
      const { parentNodeId, detailNodeType, detailNodeTypes } = event.detail;
      console.log('收到自动选中详情节点事件:', { parentNodeId, detailNodeType, detailNodeTypes });
      
      // 延迟一段时间执行，确保详情节点已经创建和渲染
      const attemptSelectDetailNode = (attempt = 1, maxAttempts = 10) => {
        setTimeout(() => {
          // 查找对应的详情节点
          const supportedTypes = detailNodeTypes || [detailNodeType];
          const detailNode = elements.nodes.find(node => {
            // 检查节点类型是否匹配
            const typeMatches = supportedTypes.includes(node.type);
            // 检查父节点ID是否匹配
            const parentMatches = node.data.parentId && node.data.parentId.toString() === parentNodeId;
            return typeMatches && parentMatches;
          });
          
          if (detailNode) {
            console.log(`找到详情节点 ${detailNode.id}，自动选中并开启右侧面板实时显示`);
            
            // 确保右侧详情面板是打开的
            if (!showDetailPanel) {
              setShowDetailPanel(true);
            }
            
            // 设置选中的节点
            setSelectedNode(detailNode);
            
            // 确保节点被选中的视觉状态
            setElements(({ nodes, edges }) => ({
              nodes: nodes.map(node => ({
                ...node,
                selected: node.id === detailNode.id
              })),
              edges
            }));
            
            // 聚焦到该节点 - 使用智能缩放
            setTimeout(() => {
              smartFitView(
                [detailNode.id], 
                elements.nodes,
                200,
                500,
                detailNode.type
              );
            }, 200);
            
          } else if (attempt < maxAttempts) {
            console.log(`第${attempt}次未找到详情节点，重试中...`);
            attemptSelectDetailNode(attempt + 1, maxAttempts);
          } else {
            console.warn(`尝试${maxAttempts}次后仍未找到详情节点`);
          }
        }, attempt * 100); // 减少重试间隔，提高响应速度
      };
      
      attemptSelectDetailNode();
    };
    
    // 添加事件监听
    window.addEventListener('auto-select-detail-node', handleAutoSelectDetailNode as EventListener);
    
    // 清理函数
    return () => {
      window.removeEventListener('auto-select-detail-node', handleAutoSelectDetailNode as EventListener);
    };
  }, [elements.nodes, setSelectedNode, setElements, showDetailPanel, smartFitView]);
  
  // 监听节点变化，确保详情节点创建时自动开启详情面板
  useEffect(() => {
    // 检查是否有正在生成的详情节点
    const hasGeneratingDetailNode = elements.nodes.some(node => {
      const isDetailNode = node.type && ['answer-detail', 'ANSWER_DETAIL', 'circuit-detail', 'knowledge-detail'].includes(node.type);
      const isGenerating = node.data?.process === 'generating';
      return isDetailNode && isGenerating;
    });
    
    // 如果有正在生成的详情节点但详情面板未打开，自动打开
    if (hasGeneratingDetailNode && !showDetailPanel) {
      console.log('检测到正在生成的详情节点，自动打开详情面板');
      setShowDetailPanel(true);
    }
  }, [elements.nodes, showDetailPanel]);
  
  const handleRelayout = useCallback((resetHeight: boolean = false) => {
    if (isChatting) return;
    console.log('handleRelayout');
    setElements(({nodes, edges}) => {
      const layoutedNodes = executeLayout(nodes, edges, true, resetHeight);
      
      // 使用智能fitView进行重布局后的视图调整
      setTimeout(() => {
        smartFitView(layoutedNodes.map(node => node.id), layoutedNodes, 100, 600);
      }, 50);
      
      return {
        nodes: layoutedNodes,
        edges
      };
    });
  }, [executeLayout, isChatting, setElements, smartFitView]);

  // 处理对话
  const flowChat = useCallback((taskId: number) => {
    // 确保详情面板是打开的，便于观察流式内容
    if (!showDetailPanel) {
      setShowDetailPanel(true);
    }
    
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
  }, [chat, setElements, setSelectedNode, showDetailPanel]);

  // 错误处理
  const onError = useCallback((code: string, message: string) => {
    console.error('reactflow onError', code, message);
  }, []);

  // 初始化
  const onInit = useCallback(() => {
    if (elements.nodes.length === 0) return;
    
    console.log(`智能初始化: 节点数量=${elements.nodes.length}`);
    
    // 使用智能fitView进行初始化
    smartFitView(
      elements.nodes.map(node => node.id), 
      elements.nodes,
      250,
      650
    );
  }, [elements.nodes, smartFitView]);

  // 关闭详情面板
  const handleCloseDetailPanel = useCallback(() => {
    setShowDetailPanel(false);
    setSelectedNode(null);
  }, []);

  // 切换详情面板显示
  const toggleDetailPanel = useCallback(() => {
    setShowDetailPanel(!showDetailPanel);
    if (!showDetailPanel) {
      // 如果要显示面板，但没有选中节点，则选中根节点
      if (!selectedNode && elements.nodes.length > 0) {
        const rootNode = elements.nodes.find(node => node.type === 'root');
        if (rootNode) {
          setSelectedNode(rootNode);
        }
      }
    }
  }, [showDetailPanel, selectedNode, elements.nodes]);

  // 加载中
  if (isLoading) {
    return <LoadingSpinner />;
  }

  // 返回
  return (
    <FlowContext.Provider value={{
      isChatting,
      convId,
      chat: flowChat,
      addChatTask
    }}>
      <div className="flex h-full">
        {/* 左侧React Flow区域 */}
        <div className={`flex-1 ${showDetailPanel ? 'transition-all duration-300 ease-in-out' : ''}`}>
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
            maxZoom={3} // 最大缩放增大，支持更详细的查看
            minZoom={0.05} // 最小缩放减小，支持更大范围的概览
            defaultViewport={{ x: 0, y: 0, zoom: 0.8 }} // 默认视图，将由智能缩放覆盖
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
                showDetailPanel={showDetailPanel}
                onToggleDetailPanel={toggleDetailPanel}
              />
            </Panel>
            {/* 顶部左侧工具栏 */}
            <Panel position={"top-left"}>
              <FlowLeftToolBar 
                onBack={classId ? handleBackToCourses : undefined}
              />
            </Panel>
          </ReactFlow>
        </div>
        
        {/* 右侧详情面板 */}
        {showDetailPanel && (
          <NodeDetailPanel
            selectedNode={selectedNode}
            onClose={handleCloseDetailPanel}
            getLatestNodeData={getLatestNodeData}
          />
        )}
      </div>
    </FlowContext.Provider>
  );
}

export default Flow;