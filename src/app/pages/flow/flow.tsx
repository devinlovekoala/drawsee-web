import {Background, BackgroundVariant, ReactFlow, type Node, Panel, OnNodesChange, applyNodeChanges, applyEdgeChanges, OnEdgesChange} from "@xyflow/react";
import RootNode from "@/app/pages/flow/components/node/RootNode";
import QueryNode from "@/app/pages/flow/components/node/QueryNode";
import AnswerNode from "@/app/pages/flow/components/node/AnswerNode";
import KnowledgeHeadNode from "@/app/pages/flow/components/node/KnowledgeHeadNode";
import KnowledgeDetailNode from "@/app/pages/flow/components/node/KnowledgeDetailNode";
import CircuitCanvasNode from "@/app/pages/flow/components/node/CircuitCanvasNode";
import CircuitAnalyzeNode from "@/app/pages/flow/components/node/CircuitAnalyzeNode";
import CircuitDetailNode from "@/app/pages/flow/components/node/CircuitDetailNode";
import AnswerPointNode from "@/app/pages/flow/components/node/AnswerPointNode";
import AnswerDetailNode from "@/app/pages/flow/components/node/AnswerDetailNode";
import PdfDocumentNode from "./components/node/PdfDocumentNode";
import PdfAnalysisPointNode from "./components/node/PdfAnalysisPointNode";
import PdfAnalysisDetailNode from "./components/node/PdfAnalysisDetailNode";
import NodeDetailPanel from "./components/NodeDetailPanel";
import {useCallback, useState, useEffect, useRef, useMemo} from "react";
import {useLocation, useNavigate} from "react-router-dom";
import {useWatcher} from "alova/client";
import {getNodesByConvId, updateNodesPositionAndHeight} from "@/api/methods/flow.methods.ts";
import type { NodeVO as ApiNodeVO, NodeToUpdate, NodeType } from '@/api/types/flow.types';
import { LoadingSpinner } from './components/loading/LoadingSpinner';
import useFlowState from './hooks/useFlowState';
import { FlowInputPanel, type FlowInputPanelHandle } from './components/input/FlowInputPanel';
import '@xyflow/react/dist/style.css';
import useTempQueryNode from "./hooks/useTempQueryNode";
import useFlowTools from "./hooks/useFlowTools";
import { useAdaptiveZoom } from "./hooks/useAdaptiveZoom";
import { toast } from "sonner";
import { calculateNodeHeight } from './utils/calculateNodeHeight';
import type { NodeData } from './components/node/types/node.types';
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
const CompactCircuitAnalyzeNode = (props: any) => <CircuitAnalyzeNode {...props} compactMode={true} />;
const CompactCircuitDetailNode = (props: any) => <CircuitDetailNode {...props} compactMode={true} />;
const CompactResourceNode = (props: any) => <ResourceNode {...props} compactMode={true} />;
const CompactPdfDocumentNode = (props: any) => <PdfDocumentNode {...props} compactMode={true} />;
const CompactPdfAnalysisPointNode = (props: any) => <PdfAnalysisPointNode {...props} compactMode={true} />;
const CompactPdfAnalysisDetailNode = (props: any) => <PdfAnalysisDetailNode {...props} compactMode={true} />;

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
  'circuit-analyze': CompactCircuitAnalyzeNode,   // 电路分析节点
  'circuit-detail': CompactCircuitDetailNode,   // (legacy) 电路分析详情节点
  // PDF相关节点类型
  'PDF_DOCUMENT': CompactPdfDocumentNode,       // PDF文档节点
  'PDF_ANALYSIS_POINT': CompactPdfAnalysisPointNode, // PDF分析点节点
  'PDF_ANALYSIS_DETAIL': CompactPdfAnalysisDetailNode, // PDF分析详情节点
} as const;

// 将后端节点类型归一化为前端已支持的类型
function normalizeNodeType(apiType: string | undefined | null): string {
  if (!apiType) return 'query';
  const t = String(apiType).toUpperCase();
  switch (t) {
    case 'QUERY':
      return 'query';
    case 'PDF_CIRCUIT_POINT':
      return 'PDF_ANALYSIS_POINT';
    case 'PDF_CIRCUIT_DETAIL':
      return 'PDF_ANALYSIS_DETAIL';
    case 'PDF_CIRCUIT_DOCUMENT':
    case 'PDF_DOCUMENT':
      return 'PDF_DOCUMENT';
    case 'PDF_ANALYSIS_POINT':
      return 'PDF_ANALYSIS_POINT';
    case 'PDF_ANALYSIS_DETAIL':
      return 'PDF_ANALYSIS_DETAIL';
    case 'CIRCUIT-ANALYZE':
      return 'circuit-analyze';
    default:
      // 对于已是前端支持的小写类型，原样返回，例如 answer / answer-point / knowledge-detail 等
      return String(apiType);
  }
}

function Flow() {
  const navigate = useNavigate();
  const [isLoading, setIsLoading] = useState<boolean>(true);
  // 当前选中的节点
  const [selectedNode, setSelectedNode] = useState<Node | null>(null);
  // 用户输入
  const [userInput, setUserInput] = useState<string>('');
  const flowInputRef = useRef<FlowInputPanelHandle>(null);
  // 显示详情面板
  const [showDetailPanel, setShowDetailPanel] = useState<boolean>(true);
  // 强制会话切换标记 - 最高优先级标记，用于bypass所有保护机制
  const isForceSwitching = useRef<boolean>(false);
  
  // 获取location中的convId、taskId和classId
  const location = useLocation();
  const locationState = location.state as FlowLocationState;
  const convId = locationState?.convId;
  const taskIdFromLocation = locationState?.taskId;
  const classId = locationState?.classId || 
    (convId ? sessionStorage.getItem(`circuit_class_id_${convId}`) : null); // 从sessionStorage获取班级ID
  
    // 防护包装的setSelectedNode函数 - 防止用户在详情节点生成完毕后误切换
  const protectedSetSelectedNode = useCallback((newNode: Node | null) => {
    // 最高优先级：如果正在强制切换会话，无条件允许所有操作
    if (isForceSwitching.current) {
      console.log('🚀 强制会话切换模式，完全bypass所有保护机制');
      setSelectedNode(newNode);
      return;
    }
    
    // 在会话切换期间，完全禁用保护机制，无条件允许所有操作
    if (isLoading) {
      console.log('会话加载中，强制执行节点选择，完全忽略保护机制');
      setSelectedNode(newNode);
      return;
    }
    
    // 🔥 简化保护逻辑：直接允许所有节点选择，移除复杂的保护机制
    console.log('执行正常的节点选择，无保护机制阻挡');
    setSelectedNode(newNode);
  }, [isLoading]);

  // 使用流程图状态管理Hook，传递selectedNode和保护的setSelectedNode
  const {
    elements,
    isChatting,
    rootNodeId,
    chat,
    setElements,
    addChatTask
  } = useFlowState(convId, selectedNode, protectedSetSelectedNode);
  
  const handleApplySuggestion = useCallback((suggestion: string) => {
    if (!suggestion || !suggestion.trim()) {
      return;
    }
    flowInputRef.current?.applySuggestion(suggestion.trim());
  }, []);
  
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

      // 跟踪被拖动的节点
      const draggedNodes: NodeToUpdate[] = [];

      changes.forEach((change) => {
        if (change.type === 'select') {
          selectionChanged = true;
          if (change.selected) {
            selectedNodeId = change.id;
          } else {
            unselectedNodeId = change.id;
          }
        } else if (change.type === 'position') {
          // 处理节点位置变化（拖动）
          if (change.dragging === false && change.position) {
            // 节点拖动结束，保存新位置
            const node = nodes.find(n => n.id === change.id);
            if (node && !change.id.startsWith(TEMP_QUERY_NODE_ID_PREFIX)) {
              const nodeHeight = node.data.height as number || calculateNodeHeight(node as Node<NodeData<NodeType>>);
              draggedNodes.push({
                id: parseInt(change.id),
                position: change.position,
                height: nodeHeight
              });
            }
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

      // 判断是否需要重新布局 - 提高阈值，减少不必要的重布局
      needsRelayout = (
        // 条件1: 显著变化的节点比例超过阈值（提高到50%）
        significantChangeRatio > 0.5 ||
        // 条件2: 平均高度变化超过阈值（提高到50px）
        (changedNodesCount > 0 && averageHeightChange > 50) ||
        // 条件3: 变化的节点数量超过总节点数的一定比例，且平均变化较大（提高阈值）
        (changedNodesCount > totalNodes * 0.6 && averageHeightChange > 25)
      );

      // 处理选择变化
      if (selectionChanged) {
        window.dispatchEvent(new CustomEvent('node-selection-change'));
        if (selectedNodeId && selectedNodeId !== selectedNode?.id) {
          const selectedFlowNode = newNodes.find(node => node.id === selectedNodeId);
          
          // 🔥 移除保护机制：用户点击任何节点都应该能够正常选择和显示详情
          console.log(`正常节点选择：从 ${selectedNode?.id || 'null'} 切换到 ${selectedNodeId}`);
          
          protectedSetSelectedNode(selectedFlowNode || null);
          const tempQueryNode = newNodes.find(node => node.id.startsWith(TEMP_QUERY_NODE_ID_PREFIX));
          if (tempQueryNode) {
            newNodes = nodesAndEdgesNoneTempQueryNode.current?.nodes || newNodes;
            newEdges = nodesAndEdgesNoneTempQueryNode.current?.edges || newEdges;
            fitViewNodeId = selectedNodeId;
          }
          setUserInput('');
        } else if (unselectedNodeId) {
          const rootNode = newNodes.find(node => node.id === rootNodeId);
          protectedSetSelectedNode(selectedNode?.id === rootNodeId ? null : rootNode || null);
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
          
          // 检查是否是受保护的详情节点
        const detailTypes = ['answer-detail', 'ANSWER_DETAIL', 'circuit-analyze', 'circuit-detail', 'knowledge-detail', 'PDF_ANALYSIS_DETAIL'];
          if (updatedSelectedNode.type && detailTypes.includes(updatedSelectedNode.type) && 
              updatedSelectedNode.data.process === 'completed') {
            console.log(`详情节点 ${updatedSelectedNode.id} 已完成，确保保持选中状态`);
            detailNodeRef.current = updatedSelectedNode.id; // 设置保护锁
          }
          
          protectedSetSelectedNode(updatedSelectedNode);
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

      // 保存被拖动的节点位置到服务器
      if (draggedNodes.length > 0) {
        console.log(`保存${draggedNodes.length}个被拖动节点的位置`);
        updateNodesPositionAndHeight(draggedNodes).send()
          .then(() => {
            console.log('节点拖动位置保存成功');
          })
          .catch(error => {
            console.error('节点拖动位置保存失败', error);
            toast.error('节点位置保存失败');
          });
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
  }, [executeLayout, nodesAndEdgesNoneTempQueryNode, rootNodeId, selectedNode?.id, selectedNode, setElements, protectedSetSelectedNode, setUserInput, smartFitView]);

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

  // 监听convId变化，立即重置所有状态 - 确保会话切换正常
  useEffect(() => {
    console.log('🔄 会话切换检测到，convId变化为:', convId);
    
    // 🚀 启用最高优先级强制切换模式，bypass所有保护机制
    isForceSwitching.current = true;
    
    // 立即强制停止任何可能阻挡UI交互的状态
    setIsLoading(false); // 立即清除loading状态，防止UI被阻挡
    
    // 最高优先级强制切换：立即清除所有阻挡机制和保护状态
    detailNodeRef.current = null;
    
    // 立即同步清空所有状态，确保无任何残留
    setSelectedNode(null);
    setUserInput('');
    setElements({ nodes: [], edges: [] });
    
    // 🔥 强制关闭详情面板，确保不会阻挡新会话的加载
    setShowDetailPanel(false);
    
    // 强制清除所有React Flow的选择状态
    setTimeout(() => {
      // 触发一个空的节点变化，清除内部选择状态
      setElements(prev => ({
        nodes: prev.nodes.map(node => ({ ...node, selected: false })),
        edges: prev.edges
      }));
    }, 5);
    
    // 然后再重新设置loading状态，开始新会话的加载
    setTimeout(() => {
      setIsLoading(true);
      // 重新打开详情面板（如果需要的话）
      setShowDetailPanel(true);
    }, 10); // 极短延迟，确保UI状态先被清除
    
    // 清除所有保护事件和全局状态
    window.dispatchEvent(new CustomEvent('detail-node-protection-clear'));
    window.dispatchEvent(new CustomEvent('force-conversation-switch', { detail: { convId } }));
    
    console.log('✅ 强制会话切换状态重置完成，无条件允许新会话加载');
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
        // 关闭强制切换模式
        isForceSwitching.current = false;
        console.log('✅ 空会话加载完成，恢复正常操作模式');
        return;
      }
      // 将apiNodes转换为flowNodes
      const flowNodes = apiNodes.map((node) => {
        const normalizedType = normalizeNodeType(node.type as unknown as string);
        const data = {
          parentId: node.parentId,
          convId: node.convId,
          userId: node.userId,
          createdAt: node.createdAt,
          updatedAt: node.updatedAt,
          // 如果节点有height属性，将其添加到data中
          ...(node.height !== null ? { height: node.height } : {}),
          ...(normalizedType !== 'root' ? node.data : {})
        } as any;
  
        // 如果节点是knowledge-head或者solver-first或者solver-continue，则判断是否已经生成
        if (normalizedType === 'knowledge-head') {
          apiNodes.forEach(apiNode => {
            if (apiNode.parentId === node.id && normalizeNodeType(apiNode.type as unknown as string) === 'knowledge-detail') {
              data.isGenerated = true;
            }
          });
        }
        // 处理answer-point节点
        if (normalizedType === 'answer-point' || normalizedType === 'ANSWER_POINT') {
          apiNodes.forEach(apiNode => {
            const t = normalizeNodeType(apiNode.type as unknown as string);
            if (apiNode.parentId === node.id && (t === 'answer-detail' || t === 'ANSWER_DETAIL')) {
              data.isGenerated = true;
            }
          });
        }

        // 处理PDF_ANALYSIS_POINT节点
        if (normalizedType === 'PDF_ANALYSIS_POINT') {
          apiNodes.forEach(apiNode => {
            if (apiNode.parentId === node.id && normalizeNodeType(apiNode.type as unknown as string) === 'PDF_ANALYSIS_DETAIL') {
              data.isGenerated = true;
            }
          });
        }
        
        // 对于详情节点，如果有文本内容，设置为已完成状态
        if ((normalizedType === 'answer-detail' || normalizedType === 'ANSWER_DETAIL' || 
             normalizedType === 'circuit-analyze' || normalizedType === 'circuit-detail' || normalizedType === 'knowledge-detail' ||
             normalizedType === 'PDF_ANALYSIS_DETAIL') && 
            node.data.text && typeof node.data.text === 'string' && node.data.text.length > 0) {
          console.log(`初始化详情节点 ${node.id} 状态为已完成，类型: ${normalizedType}`);
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
          type: normalizedType as any,
          position: node.position,
          data,
          draggable: true, // 允许节点拖动
          connectable: false,
          selectable: true, // 确保节点可选择
        } as any;
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
          protectedSetSelectedNode(updatedSelectedNode);
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
        // 关闭强制切换模式，恢复正常保护机制
        isForceSwitching.current = false;
        console.log('✅ 新会话加载完成，恢复正常操作模式');
      }, 500);
    })
    .onError(() => {
      // 出错时设置加载状态为false
      setIsLoading(false);
      setSelectedNode(null); // 清空选中节点
      // 即使出错也要关闭强制切换模式
      isForceSwitching.current = false;
      console.log('❌ 会话加载失败，但仍恢复正常操作模式');
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
      
      // 检查当前是否有被保护的详情节点
      if (detailNodeRef.current && selectedNode?.id === detailNodeRef.current) {
        const detailTypes = ['answer-detail', 'ANSWER_DETAIL', 'circuit-analyze', 'circuit-detail', 'knowledge-detail', 'PDF_ANALYSIS_DETAIL'];
        if (selectedNode.type && detailTypes.includes(selectedNode.type) && 
            selectedNode.data?.process === 'completed') {
          console.log(`当前详情节点 ${selectedNode.id} 已完成且被保护，忽略自动选择事件`);
          return;
        }
      }
      
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
            protectedSetSelectedNode(detailNode);
            
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
  }, [elements.nodes, protectedSetSelectedNode, setElements, showDetailPanel, smartFitView, selectedNode]);
  
  // 监听节点变化，确保详情节点创建时自动开启详情面板
  useEffect(() => {
    // 检查是否有正在生成的详情节点
    const hasGeneratingDetailNode = elements.nodes.some(node => {
      const isDetailNode = node.type && ['answer-detail', 'ANSWER_DETAIL', 'circuit-analyze', 'circuit-detail', 'knowledge-detail', 'PDF_ANALYSIS_DETAIL'].includes(node.type);
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
  }, [chat, setElements, protectedSetSelectedNode, showDetailPanel]);

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
          protectedSetSelectedNode(rootNode);
        }
      }
    }
  }, [showDetailPanel, selectedNode, elements.nodes]);

  // 防止详情节点生成完毕后跳转到父节点的保护机制
  const detailNodeRef = useRef<string | null>(null);
  
  useEffect(() => {
    if (!selectedNode) return;
    
    // 详情节点类型
    const detailTypes = ['answer-detail', 'ANSWER_DETAIL', 'circuit-analyze', 'circuit-detail', 'knowledge-detail', 'PDF_ANALYSIS_DETAIL'];
    
    // 如果当前节点是详情节点
    if (selectedNode.type && detailTypes.includes(selectedNode.type)) {
      // 记录当前详情节点ID
      detailNodeRef.current = selectedNode.id;
      
      // 如果节点已完成生成，防止被其他逻辑切换掉
      if (selectedNode.data?.process === 'completed') {
        console.log(`详情节点 ${selectedNode.id} 已完成生成，设置保护锁防止自动跳转`);
        
        // 延迟一小段时间再设置保护，避免与其他状态更新冲突
        const protectionTimer = setTimeout(() => {
          // 再次检查是否还是同一个节点且已完成
          if (detailNodeRef.current === selectedNode.id && selectedNode.data?.process === 'completed') {
            console.log(`确认保护详情节点 ${selectedNode.id}，阻止自动跳转`);
            // 使用标记防止其他逻辑修改selectedNode
            window.dispatchEvent(new CustomEvent('detail-node-protection-active', {
              detail: { nodeId: selectedNode.id }
            }));
          }
        }, 100);
        
        return () => clearTimeout(protectionTimer);
      }
    } else {
      // 如果不是详情节点，清除保护
      detailNodeRef.current = null;
    }
  }, [selectedNode?.id, selectedNode?.type, selectedNode?.data?.process]);

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
      addChatTask,
      applySuggestion: handleApplySuggestion
    }}>
      <div className="flex w-full overflow-hidden" style={{ height: 'calc(100vh - 80px)' }}>
        {/* 左侧React Flow区域 */}
        <div 
          className={`${showDetailPanel ? 'flex-1 transition-all duration-300 ease-in-out' : 'w-full'}`} 
          style={{ 
            position: 'relative', 
            minWidth: 0,
            maxWidth: showDetailPanel ? 'calc(100% - 384px)' : '100%',
            height: '100%'
          }}
        >
          <ReactFlow 
            nodes={elements.nodes} 
            edges={elements.edges}
            onNodesChange={onNodesChange} // 节点变化监听
            onEdgesChange={onEdgesChange} // 边变化监听
            onNodeClick={(_event, node) => {
              // 🔥 用户点击任何节点就强制打开节点详情，并选中该节点
              console.log('直接点击节点:', node.id, '强制显示详情面板');
              protectedSetSelectedNode(node);
              setShowDetailPanel(true); // 强制显示详情面板
            }}
            onError={onError} // 错误处理
            onInit={onInit} // 初始化
            nodeTypes={nodeTypes} // 节点类型
            style={{
              backgroundColor: "#EEEBE8", 
              borderRadius: '8px',
              width: '100%',
              height: '100%',
              position: 'relative'
            }} // 背景样式和尺寸限制
            nodesDraggable={true} // 允许节点拖拽
            draggable={true} // 允许节点拖拽
            selectionKeyCode={null} // 取消选择快捷键
            multiSelectionKeyCode={null} // 取消多选快捷键
            deleteKeyCode={null} // 取消删除快捷键
            panActivationKeyCode={"Space"} // 平移快捷键
            onlyRenderVisibleElements={true} // 只渲染可见元素，提高性能
            maxZoom={3} // 最大缩放增大，支持更详细的查看
            minZoom={0.05} // 最小缩放减小，支持更大范围的概览
            defaultViewport={{ x: 0, y: 0, zoom: 0.8 }} // 默认视图，将由智能缩放覆盖
            defaultEdgeOptions={{ // 默认边样式
              type: 'straight', // 直线连接，避免弯折
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
            proOptions={{ hideAttribution: true }}
          >
            {/* 背景 */}
            <Background variant={BackgroundVariant.Lines} size={10}/>
            {/* 底部输入框以及悬浮追问推荐 */}
            <Panel position={"bottom-center"}>
              <FlowInputPanel
                ref={flowInputRef}
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
                onRelayout={() => handleRelayout(true)} 
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
        
        {/* 右侧详情面板 - 确保不阻塞主应用交互 */}
        {showDetailPanel && (
          <div className="flex-shrink-0" style={{ width: '384px' }}>
            <NodeDetailPanel
              selectedNode={selectedNode}
              onClose={handleCloseDetailPanel}
              getLatestNodeData={getLatestNodeData}
              onApplySuggestion={handleApplySuggestion}
            />
          </div>
        )}
      </div>
    </FlowContext.Provider>
  );
}

export default Flow;
