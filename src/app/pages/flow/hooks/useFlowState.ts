import { NodeVO } from "@/api/types/flow.types";
import { getNodesByConvId } from "@/api/methods/flow.methods";
import { Edge, Node } from "@xyflow/react";
import { useCallback, useMemo, useRef, useState } from "react";
import { ChatTask, TextData } from "../types/ChatTask.types";
import { useAppContext } from "@/app/contexts/AppContext";
import { toast } from "sonner";
import { BASE_URL } from "@/api";
import {SSE} from "sse.js";
import { TOKEN_KEY } from "@/common/constant/storage-key.constant";
import useFlowTools from "./useFlowTools";
import { COMPACT_NODE_HEIGHT, COMPACT_NODE_WIDTH, FLOW_HORIZONTAL_SPACING, FLOW_VERTICAL_SPACING, ROOT_NODE_SIZE, TEMP_QUERY_NODE_ID_PREFIX } from "../constants";
import { processTextUpdate } from "../utils/sectionParser";
import { buildPresentedFlowEdges, presentFollowUpAnswerNodes, FOLLOW_UP_RESPONSE_TYPES } from "../utils/followUpAnswerNode";
import { resolveNonOverlappingNodePosition } from "../utils/nodePlacement";

// 将后端节点类型归一化为前端可识别的类型
const normalizeNodeType = (apiType: string | undefined | null): string => {
  if (!apiType) return 'query';
  const t = String(apiType).toUpperCase();
  switch (t) {
    case 'QUERY':
      return 'query';
    case 'PDF_CIRCUIT_POINT':
    case 'PDF-CIRCUIT-POINT':
      return 'pdf-circuit-point';
    case 'PDF_CIRCUIT_DETAIL':
    case 'PDF-CIRCUIT-DETAIL':
      return 'pdf-circuit-detail';
    case 'PDF_CIRCUIT_DOCUMENT':
    case 'PDF_DOCUMENT':
      return 'PDF_DOCUMENT';
    case 'PDF_ANALYSIS_POINT':
      return 'PDF_ANALYSIS_POINT';
    case 'PDF_ANALYSIS_DETAIL':
      return 'PDF_ANALYSIS_DETAIL';
    case 'CIRCUIT_CANVAS':
    case 'CIRCUIT-CANVAS':
      return 'circuit-canvas';
    case 'CIRCUIT_ANALYZE':
    case 'CIRCUIT-ANALYZE':
      return 'circuit-analyze';
    case 'CIRCUIT_DETAIL':
    case 'CIRCUIT-DETAIL':
      return 'circuit-detail';
    default:
      return String(apiType);
  }
};

const AUTO_FOCUS_GENERATING_NODE_TYPES = new Set([
  'answer',
  'answer-detail',
  'ANSWER_DETAIL',
  'circuit-canvas',
  'circuit-analyze',
  'circuit-detail',
  'knowledge-detail',
  'PDF_ANALYSIS_DETAIL',
  'pdf-circuit-detail',
]);

const collectFocusContextNodeIds = (nodes: Node[], edges: Edge[], targetNodeId: string): string[] => {
  if (nodes.length <= 10) {
    return nodes.map(node => node.id);
  }

  const nodeMap = new Map(nodes.map(node => [node.id, node]));
  const contextIds = new Set<string>([targetNodeId]);
  const targetNode = nodeMap.get(targetNodeId);
  const parentId = targetNode?.data?.parentId ? String(targetNode.data.parentId) : null;

  if (parentId && nodeMap.has(parentId)) {
    contextIds.add(parentId);
    const grandParentId = nodeMap.get(parentId)?.data?.parentId;
    if (grandParentId && nodeMap.has(String(grandParentId))) {
      contextIds.add(String(grandParentId));
    }
  }

  edges.forEach(edge => {
    if (edge.source === targetNodeId || edge.target === targetNodeId) {
      contextIds.add(edge.source);
      contextIds.add(edge.target);
    }
    if (parentId && edge.source === parentId) {
      contextIds.add(edge.target);
    }
  });

  return Array.from(contextIds);
};

/**
 * 流程图状态管理Hook
 * 负责管理节点、边、消息处理和临时节点操作
 */
function useFlowState(convId: number | null, selectedNode?: Node | null, setSelectedNode?: (node: Node | null) => void) {

  // 工具函数
  const {executeFitView, adjustViewportToShowLatestContent, executeLayout} = useFlowTools();
  const {handleTitleUpdate} = useAppContext();

  // 节点和边的状态
  const [elements, setElements] = useState<{nodes: Node[], edges: Edge[]}>(
    { nodes: [], edges: [] }
  );

  // 获取根节点ID
  const rootNodeId = useMemo(() => {
    const rootNode = elements.nodes.find(node => node.type === 'root');
    return rootNode ? rootNode.id : null;
  }, [elements.nodes]);

  // 是否正在处理SSE消息
  const [isChatting, setIsChatting] = useState<boolean>(false);
  // 消息处理状态
  const chatTaskQueue = useRef<ChatTask[]>([]);
  const isChatTaskProcessing = useRef(false);
  // 最后需要聚焦的节点id
  const lastFocusNodeId = useRef<string | null>(null);
  const streamingFocusNodeId = useRef<string | null>(null);
  // 跟踪正在生成内容的节点
  const activeNodeIds = useRef<Set<string>>(new Set());
  // 限次补偿轮询（SSE遗漏时兜底）
  const pollTimer = useRef<number | null>(null);
  const pollAttempts = useRef<number>(0);
  const lastNodeCount = useRef<number>(0);

  const hasMeaningfulFlowProgress = useCallback((nodesFromApi: NodeVO[]) => {
    return nodesFromApi.some((node) => {
      if (!node || String(node.type).toUpperCase() === 'ROOT') {
        return false;
      }

      const data = node.data as Record<string, unknown> | undefined;
      const text = typeof data?.text === 'string' ? data.text.trim() : '';
      const process = typeof data?.process === 'string' ? data.process : '';
      const isGenerated = data?.isGenerated === true;
      const followUps = Array.isArray(data?.followUps) ? data.followUps : [];

      return text.length > 0 || process === 'completed' || isGenerated || followUps.length > 0;
    });
  }, []);

  // 主动拉取最新节点（用于处理无nodeId的DATA进度消息）
  const refreshNodesFromServer = useCallback(async () => {
    if (!convId) return [] as NodeVO[];
    try {
      // 加入时间戳避免alova命中缓存
      const nodesFromApi = await getNodesByConvId(convId, { _ts: Date.now() });
      setElements(({ nodes: currentNodes }) => {
        const currentNodeMap = new Map(currentNodes.map(node => [node.id, node]));
        // 将服务器节点转换为前端节点
        const rawIncomingNodes = nodesFromApi.map(node => {
          const id = node.id.toString();
          const currentNode = currentNodeMap.get(id);
          return {
            id,
            type: normalizeNodeType(node.type),
            position: currentNode?.position || node.position,
            selected: currentNode?.selected,
            data: {
              ...currentNode?.data,
              ...node.data,
              parentId: node.parentId,
              convId: node.convId,
              userId: node.userId,
              createdAt: node.createdAt,
              updatedAt: node.updatedAt
            }
          };
        }) as Node[];
        const incomingNodes = presentFollowUpAnswerNodes(rawIncomingNodes);

        // 合并：服务端数据优先，但保留本地节点中服务端尚未持久化的折叠字段
        // circuit-canvas 由后端异步生成，done 后的 refresh 可能拿不到它，
        // 此时不能用服务端版本覆盖本地已折叠好的 circuitCanvasNodeId 等字段
        const LOCALLY_OWNED_FOLDED_FIELDS = [
          'circuitCanvasNodeId', 'circuitDesign', 'circuitCanvasText',
          'circuitCanvasTitle', 'circuitCanvasOriginalType', 'circuitCanvasRagSources',
        ] as const;
        // rawIncomingNodes 包含服务端所有节点（折叠前），用它判断"服务端已知哪些 ID"。
        // incomingNodes 是折叠后的展示节点，其中被折叠的 answer 等节点 ID 已消失，
        // 不能用它做权威 ID 集合，否则会把本地的 answer 节点误判为"服务端未返回"而重复保留。
        const rawIncomingIdSet = new Set(rawIncomingNodes.map(n => n.id));
        const mergedMap = new Map<string, Node>();
        // 优先写入折叠后的服务端节点，保留本地持有的折叠字段
        incomingNodes.forEach(n => {
          const local = currentNodes.find(cn => cn.id === n.id);
          if (local) {
            const preservedData: Record<string, unknown> = {};
            for (const field of LOCALLY_OWNED_FOLDED_FIELDS) {
              if (local.data?.[field] != null && n.data?.[field] == null) {
                preservedData[field] = local.data[field];
              }
            }
            mergedMap.set(n.id, {
              ...n,
              data: { ...n.data, ...preservedData },
            });
          } else {
            mergedMap.set(n.id, n);
          }
        });
        // 保留本地持有的、服务端原始列表中完全没有的节点（SSE 先于 DB 落库到达的节点）
        // 被折叠掉的 answer 节点在 rawIncomingIdSet 里，不会被误保留
        currentNodes
          .filter(n => !rawIncomingIdSet.has(n.id) && !n.id.startsWith(TEMP_QUERY_NODE_ID_PREFIX))
          .forEach(n => { if (!mergedMap.has(n.id)) mergedMap.set(n.id, n); });
        // 保留本地临时 query 节点（TEMP_QUERY_NODE_ID_PREFIX 前缀），避免闪烁
        currentNodes
          .filter(n => n.id.startsWith(TEMP_QUERY_NODE_ID_PREFIX))
          .forEach(n => mergedMap.set(n.id, n));
        const flowNodes = Array.from(mergedMap.values());

        const flowEdges = buildPresentedFlowEdges(flowNodes);

        lastNodeCount.current = flowNodes.length;

        if (selectedNode && setSelectedNode) {
          const selectedNodeId = selectedNode.id;
          const refreshedSelectedNode = flowNodes.find(node => node.id === selectedNodeId) ||
            flowNodes.find(node =>
              node.data?.qaAnswerNodeId === selectedNodeId ||
              node.data?.circuitAnalyzeNodeId === selectedNodeId ||
              node.data?.circuitCanvasNodeId === selectedNodeId
            );

          if (refreshedSelectedNode) {
            const previousData = selectedNode.data || {};
            const refreshedData = refreshedSelectedNode.data || {};
            const shouldSyncSelectedNode =
              refreshedSelectedNode.id !== selectedNode.id ||
              previousData.updatedAt !== refreshedData.updatedAt ||
              previousData.process !== refreshedData.process ||
              previousData.isGenerated !== refreshedData.isGenerated ||
              previousData.qaAnswerText !== refreshedData.qaAnswerText ||
              previousData.circuitAnalyzeText !== refreshedData.circuitAnalyzeText ||
              previousData.circuitCanvasNodeId !== refreshedData.circuitCanvasNodeId ||
              previousData.circuitDesign !== refreshedData.circuitDesign;

            if (shouldSyncSelectedNode) {
              setSelectedNode({
                ...refreshedSelectedNode,
                selected: true,
                data: {
                  ...refreshedSelectedNode.data,
                  forceRefresh: Date.now(),
                  updatedAt: refreshedSelectedNode.data?.updatedAt || Date.now(),
                },
              });
            }
          }
        }

        return { nodes: flowNodes, edges: flowEdges };
      });
      return nodesFromApi;
    } catch (e) {
      console.error('刷新节点失败', e);
      return [] as NodeVO[];
    }
  }, [convId, selectedNode, setElements, setSelectedNode]);

  /**
   * 处理聊天消息
   */
  const processChatTask = useCallback(() => {
    if (isChatTaskProcessing.current) return;
    // 加锁
    isChatTaskProcessing.current = true;
    while (chatTaskQueue.current.length > 0) {
      const task = chatTaskQueue.current.shift();
      if (!task) continue;
      switch (task.type) {
        // 新增节点
        case 'node': {
          const nodeVO = task.data as NodeVO;
          
          // 验证节点数据完整性
          if (!nodeVO || !nodeVO.id || !nodeVO.type) {
            console.error('处理node任务时数据不完整:', task);
            toast.error('处理节点数据时发生错误');
            break;
          }
          
          const normalizedType = normalizeNodeType(nodeVO.type as unknown as string);
          console.log(`[SSE] 接收到节点，ID: ${nodeVO.id}, 原始类型: ${nodeVO.type}, 归一化类型: ${normalizedType}, parentId: ${nodeVO.parentId}`);

          const shouldAutoFocusGeneratingNode = AUTO_FOCUS_GENERATING_NODE_TYPES.has(normalizedType);

          // 设置节点为正在生成状态
          if (shouldAutoFocusGeneratingNode) {
            lastFocusNodeId.current = nodeVO.id.toString();
            streamingFocusNodeId.current = nodeVO.id.toString();
            // 添加到活跃节点跟踪列表
            activeNodeIds.current.add(nodeVO.id.toString());

            if (!nodeVO.data) nodeVO.data = {};
            nodeVO.data.process = 'generating';
            nodeVO.data.isGenerated = false;
          }
          
          // 如果是详情节点，也添加到活跃节点列表，并准备自动选中
      if (normalizedType === 'answer-detail' || normalizedType === 'ANSWER_DETAIL' || 
        normalizedType === 'circuit-analyze' || normalizedType === 'knowledge-detail' ||
        normalizedType === 'PDF_ANALYSIS_DETAIL') {
            console.log(`创建详情节点 ${nodeVO.id}，准备自动选中并开始流式显示`);
            lastFocusNodeId.current = nodeVO.id.toString();
            activeNodeIds.current.add(nodeVO.id.toString());
            
            // 确保新创建的详情节点标记为正在生成状态
            if (!nodeVO.data) nodeVO.data = {};
            nodeVO.data.process = 'generating';
            nodeVO.data.isGenerated = false;
          }
          setElements(({nodes, edges}) => {
            const tempQueryNode = nodes.find(node => node.id.startsWith(TEMP_QUERY_NODE_ID_PREFIX));
            const isUserQueryNode = normalizedType === 'query' && tempQueryNode;
            const newNode = {
              id: nodeVO.id.toString(),
              type: normalizedType as any,
              position: isUserQueryNode ? tempQueryNode.position : nodeVO.position,
              data: {
                ...nodeVO.data,
                parentId: nodeVO.parentId,
                convId: nodeVO.convId,
                userId: nodeVO.userId,
                createdAt: nodeVO.createdAt,
                updatedAt: nodeVO.updatedAt,
                ...(nodeVO.height !== null ? { height: nodeVO.height } : {}),
                ...(normalizedType !== 'root' ? {
                  layoutWidth: COMPACT_NODE_WIDTH,
                  layoutHeight: COMPACT_NODE_HEIGHT
                } : {})
              },
            } as any;
            
            // 验证parentId是否存在，如果不存在则尝试使用根节点
            if (!nodeVO.parentId && nodeVO.type !== 'root') {
              console.warn(`节点 ${nodeVO.id} 缺少parentId，尝试使用根节点`);
              const rootNode = nodes.find(node => node.type === 'root');
              if (rootNode) {
                nodeVO.parentId = parseInt(rootNode.id);
              } else {
                console.error('找不到根节点作为缺少parentId的节点的父节点');
                return { nodes, edges }; // 如果找不到根节点则不处理
              }
            }
            
            const newEdge = !nodeVO.parentId ? null : {
              id: `e${nodeVO.parentId}-${nodeVO.id}`,
              source: nodeVO.parentId.toString(),
              target: nodeVO.id.toString(),
              type: 'smoothstep',
            } as Edge;
            
            // 添加新节点和边，去除临时查询节点
            const currentNodes = [...nodes.filter(node => !node.id.startsWith(TEMP_QUERY_NODE_ID_PREFIX)), newNode];
            const currentEdges = [
              ...edges.filter(edge => !edge.target.startsWith(TEMP_QUERY_NODE_ID_PREFIX)), 
              ...(newEdge ? [newEdge] : [])
            ];
            
            const parentNodeId = nodeVO.parentId?.toString();
            const parentNode = parentNodeId
              ? currentNodes.find(node =>
                  node.id === parentNodeId ||
                  node.data?.qaAnswerNodeId === parentNodeId ||
                  node.data?.circuitAnalyzeNodeId === parentNodeId ||
                  node.data?.circuitCanvasNodeId === parentNodeId
                )
              : null;
            const existingSiblingCount = nodeVO.parentId
              ? currentEdges.filter(edge => edge.source === (parentNode?.id || nodeVO.parentId!.toString()) && edge.target !== newNode.id).length
              : 0;
            const parentWidth = parentNode?.type === 'root' ? ROOT_NODE_SIZE : COMPACT_NODE_WIDTH;
            const locallyPlacedNodes = !isUserQueryNode && parentNode
              ? currentNodes.map(node =>
                  node.id === newNode.id
                    ? {
                        ...node,
                        position: resolveNonOverlappingNodePosition({
                          nodes: currentNodes,
                          movingNodeId: newNode.id,
                          basePosition: {
                            x: parentNode.position.x + parentWidth + FLOW_HORIZONTAL_SPACING,
                            y: parentNode.position.y + existingSiblingCount * (COMPACT_NODE_HEIGHT + FLOW_VERTICAL_SPACING)
                          },
                          anchorY: parentNode.position.y,
                        })
                      }
                    : node
                )
              : currentNodes;
            // 响应类型节点（answer/circuit-analyze 等）需要 query 父节点已存在才能正确折叠；
            // 若父节点尚未出现（SSE 乱序），跳过 presentFollowUpAnswerNodes 避免节点被误过滤，
            // 等父节点到来后下一次渲染会自动完成折叠。
            const isFollowUpResponse = FOLLOW_UP_RESPONSE_TYPES.has(normalizedType);
            const parentQueryId = nodeVO.parentId?.toString();
            const parentQueryExists = parentQueryId
              ? locallyPlacedNodes.some(n => n.id === parentQueryId)
              : true;
            const layoutedNodes = (!isFollowUpResponse || parentQueryExists)
              ? presentFollowUpAnswerNodes(locallyPlacedNodes)
              : locallyPlacedNodes;
            // 获得新节点布局后的位置
            const newNodeLayoutedPosition = layoutedNodes.find(node => node.id === newNode.id)?.position;
            console.log('newNodeLayoutedPosition', newNodeLayoutedPosition);
            // 如果节点是knowledge-detail，则修改knowledge-head的isGenerated为true
            if (normalizedType === 'knowledge-detail') {
              const knowledgeHeadNode = layoutedNodes.find(node => 
                node.type === 'knowledge-head' && 
                nodeVO.parentId && 
                node.id === nodeVO.parentId.toString()
              );
              if (knowledgeHeadNode) {
                knowledgeHeadNode.data.isGenerated = true;
              }
            }
            
            // 如果节点类型是answer-detail或ANSWER_DETAIL，则修改其父节点(answer-point)的isGenerated为true
            if (normalizedType === 'answer-detail' || normalizedType === 'ANSWER_DETAIL') {
              const answerPointNode = layoutedNodes.find(node => 
                (node.type === 'answer-point' || node.type === 'ANSWER_POINT') && 
                nodeVO.parentId && 
                node.id === nodeVO.parentId.toString()
              );
              if (answerPointNode) {
                answerPointNode.data.isGenerated = true;
              }
            }
            
            // 如果节点类型是PDF_ANALYSIS_DETAIL，则修改其父节点(PDF_ANALYSIS_POINT)的isGenerated为true
            if (normalizedType === 'PDF_ANALYSIS_DETAIL') {
              const pdfAnalysisPointNode = layoutedNodes.find(node => 
                node.type === 'PDF_ANALYSIS_POINT' && 
                nodeVO.parentId && 
                node.id === nodeVO.parentId.toString()
              );
              if (pdfAnalysisPointNode) {
                pdfAnalysisPointNode.data.isGenerated = true;
              }
            }

            const focusedNode = isUserQueryNode
              ? layoutedNodes.find(node => node.id === newNode.id)
              : shouldAutoFocusGeneratingNode
                ? layoutedNodes.find(node =>
                    node.id === newNode.id ||
                    node.data?.qaAnswerNodeId === newNode.id ||
                    node.data?.circuitAnalyzeNodeId === newNode.id ||
                    node.data?.circuitCanvasNodeId === newNode.id
                  )
                : null;
            const nodesWithSelection = focusedNode
              ? layoutedNodes.map(node => ({
                  ...node,
                  selected: node.id === focusedNode.id
                }))
              : layoutedNodes;

            if (focusedNode && setSelectedNode) {
              console.log(`自动选中生成节点 ${focusedNode.id}，类型: ${normalizedType}`);
              setSelectedNode(focusedNode);
              const focusEdges = buildPresentedFlowEdges(nodesWithSelection);
              const contextNodeIds = collectFocusContextNodeIds(nodesWithSelection, focusEdges, focusedNode.id);
              executeFitView(contextNodeIds, 80, 450, 0.95, 0.42, 0.18);
            }

            return {
              nodes: nodesWithSelection,
              edges: buildPresentedFlowEdges(nodesWithSelection),
            };
          });
          break;
        }
        // 新增文本
        case 'text': {
          const textData = task.data as TextData;
          
          // 验证nodeId和content是否存在
          if (!textData || typeof textData.nodeId === 'undefined' || typeof textData.content === 'undefined') {
            console.error('处理text任务时数据不完整:', task);
            toast.error('处理文本数据时发生错误');
            break;
          }
          
          console.log(`接收文本数据，nodeId: ${textData.nodeId}，内容长度: ${textData.content.length}`);
          
          setElements(({nodes, edges}) => {
            // 使用processTextUpdate更新节点文本内容
            let { nodes: updatedNodes, edges: updatedEdges } =
              processTextUpdate(textData, nodes, edges);
              
            // 找到更新的节点进行视图调整
            const nodeId = textData.nodeId.toString();
            let targetNode = updatedNodes.find(node => node.id === nodeId);

            if (!targetNode) {
              updatedNodes = updatedNodes.map(node => {
                const isFoldedAnswerNode = node.data?.qaAnswerNodeId === nodeId;
                const isFoldedCircuitAnalyzeNode = node.data?.circuitAnalyzeNodeId === nodeId;
                const isFoldedCircuitCanvasNode = node.data?.circuitCanvasNodeId === nodeId;
                if (!isFoldedAnswerNode && !isFoldedCircuitAnalyzeNode && !isFoldedCircuitCanvasNode) return node;

                const textKey = isFoldedCircuitCanvasNode
                  ? 'circuitCanvasText'
                  : isFoldedCircuitAnalyzeNode ? 'circuitAnalyzeText' : 'qaAnswerText';
                const currentText = typeof node.data?.[textKey] === 'string'
                  ? node.data[textKey] as string
                  : '';
                return {
                  ...node,
                  data: {
                    ...node.data,
                    [textKey]: currentText + textData.content,
                    process: 'generating',
                    isGenerated: false,
                    updatedAt: Date.now(),
                    forceRefresh: Date.now(),
                  },
                };
              });
              targetNode = updatedNodes.find(node =>
                node.data?.qaAnswerNodeId === nodeId ||
                node.data?.circuitAnalyzeNodeId === nodeId ||
                node.data?.circuitCanvasNodeId === nodeId
              );
            }
            
            if (targetNode) {
              console.log(`更新节点文本内容，ID: ${nodeId}，内容长度: ${textData.content.length}，时间戳: ${targetNode.data.updatedAt}`);
              
              // 立即同步更新selectedNode状态，确保右侧面板实时显示
              const shouldSyncSelectedNode = Boolean(
                setSelectedNode &&
                ((selectedNode && (selectedNode.id === targetNode.id || selectedNode.id === nodeId)) || streamingFocusNodeId.current === nodeId)
              );
              if (shouldSyncSelectedNode && setSelectedNode) {
                console.log(`立即更新选中节点状态，确保右侧面板实时显示，文本长度: ${(targetNode.data.text as string || '').length}`);
                // 强制触发状态更新 - 立即执行，不延迟
                const updatedSelectedNode = {
                  ...targetNode,
                  data: {
                    ...targetNode.data,
                    // 确保有时间戳变化以触发UI更新
                    updatedAt: Date.now(),
                    forceRefresh: Date.now() // 添加强制刷新标识
                  }
                };
                setSelectedNode(updatedSelectedNode);
              }
              
              // 减少视口调整延迟，提高响应速度
              setTimeout(() => {
                adjustViewportToShowLatestContent(targetNode);
              }, 50);
            } else {
              // 数据可能先于节点到达，这是正常的
              console.log(`尚未找到节点ID: ${nodeId} 对应的节点，文本数据可能先于节点到达`);
              void refreshNodesFromServer();
            }
            
            return {
              nodes: updatedNodes,
              edges: updatedEdges,
            };
          });
          break;
        }
        // 修改节点data
        case 'data': {
          const data = task.data as {
            nodeId: number;
            [key: string]: unknown;
          };
          
          // 验证nodeId是否存在
          if (!data || typeof data.nodeId === 'undefined') {
            // 无nodeId的数据（进度/统计），主动刷新一次节点列表
            void refreshNodesFromServer();
            break;
          }
          
          const nodeId = data.nodeId.toString();
          console.log(`处理节点数据更新，nodeId: ${nodeId}`, data);
          
          // 如果标记为删除，则移除节点
          if (data.isDeleted === true) {
            setElements(({nodes, edges}) => {
              const updatedNodes = nodes.filter(node => node.id !== nodeId);
              const updatedEdges = edges.filter(edge => edge.source !== nodeId && edge.target !== nodeId);
              if (selectedNode && selectedNode.id === nodeId && setSelectedNode) {
                setSelectedNode(null);
              }
              return {
                nodes: updatedNodes,
                edges: updatedEdges
              };
            });
            break;
          }
          
          // 更新对应id节点的data
          setElements(({nodes, edges}) => {
            // 尝试找到目标节点
            const targetNode = nodes.find(node => node.id === nodeId);
            const foldedTargetNode = targetNode || nodes.find(node =>
              node.data?.qaAnswerNodeId === nodeId ||
              node.data?.circuitAnalyzeNodeId === nodeId ||
              node.data?.circuitCanvasNodeId === nodeId
            );
            
            // 如果找不到节点，不要显示警告，因为可能是数据先于节点到达
            // 这是正常的流程，节点可能尚未创建
            if (!foldedTargetNode) {
              console.log(`尚未找到节点ID: ${nodeId} 对应的节点，数据可能先于节点到达`);
              void refreshNodesFromServer();
              return {nodes, edges};
            }
            
            // 检查是否为动画渲染完成的更新
            const isAnimationCompleted = 
              foldedTargetNode.type === 'resource' &&
              foldedTargetNode.data.subtype === 'generated-animation' &&
              'objectName' in data && 
              data.objectName;
            
            if (isAnimationCompleted) {
              console.log(`动画渲染已完成，节点ID: ${nodeId}，objectName: ${data.objectName}`);
            }

            const isFoldedAnswerUpdate = !targetNode && foldedTargetNode.data?.qaAnswerNodeId === nodeId;
            const isFoldedCircuitAnalyzeUpdate = !targetNode && foldedTargetNode.data?.circuitAnalyzeNodeId === nodeId;
            const isFoldedCircuitCanvasUpdate = !targetNode && foldedTargetNode.data?.circuitCanvasNodeId === nodeId;
            const dataUpdates = Object.fromEntries(
              Object.entries(data)
                .filter(([key]) => key !== 'nodeId')
                .map(([key, value]) => {
                  if (isFoldedCircuitCanvasUpdate) {
                    if (key === 'text') return ['circuitCanvasText', value];
                    if (key === 'title') return ['circuitCanvasTitle', value];
                    return [key, value];
                  }
                  if (isFoldedCircuitAnalyzeUpdate) {
                    if (key === 'text') return ['circuitAnalyzeText', value];
                    if (key === 'title') return ['circuitAnalyzeTitle', value];
                    return [key, value];
                  }
                  if (!isFoldedAnswerUpdate) return [key, value];
                  if (key === 'text') return ['qaAnswerText', value];
                  if (key === 'title') return ['qaAnswerTitle', value];
                  return [key, value];
                })
            );
            
            // 更新节点数据
            const updatedNodes = nodes.map(node =>
              node.id === foldedTargetNode.id ?
              {
                ...node, 
                data: {
                  ...node.data,
                  // 去除nodeId
                  ...dataUpdates,
                  // 如果是动画渲染完成，移除progress状态以强制组件显示视频
                  ...(isAnimationCompleted ? { progress: undefined } : {})
                }
              } : node
            );
            
            // 同步更新selectedNode状态 - 立即更新确保右侧面板实时显示
            if (selectedNode && (selectedNode.id === nodeId || selectedNode.id === foldedTargetNode.id) && setSelectedNode) {
              const updatedSelectedNode = updatedNodes.find(node => node.id === foldedTargetNode.id);
              if (updatedSelectedNode) {
                console.log(`立即同步更新选中节点数据，节点ID: ${nodeId}`);
                setSelectedNode(updatedSelectedNode);
              }
            }
            
            // 只有在实际更新了节点的情况下才执行布局，避免不必要的重新布局
            if (JSON.stringify(nodes) !== JSON.stringify(updatedNodes)) {
              // 执行布局时不重置高度，防止布局变形
              const layoutedNodes = executeLayout(updatedNodes, edges, false, false);
              
              // 如果是动画渲染完成，延迟后聚焦到该节点
              if (isAnimationCompleted) {
                setTimeout(() => {
                  executeFitView([nodeId], 500);
                }, 500);
              }
              
              return {
                nodes: layoutedNodes,
                edges,
              };
            }
            
            return {
              nodes: updatedNodes,
              edges,
            };
          });
          break;
        }
        // 新增标题
        case 'title': {
          const title = task.data as string;
          // 直接更新标题，不需要通过任务队列
          if (convId) {
            handleTitleUpdate(convId, title);
          }
          break;
        }
        // 完成
        case 'done': {
          console.log('接收到done消息，准备完成对话');
          
          // 兜底刷新，防止有延迟节点未到
          void refreshNodesFromServer();
          window.setTimeout(() => void refreshNodesFromServer(), 300);
          window.setTimeout(() => void refreshNodesFromServer(), 1200);
          window.setTimeout(() => void refreshNodesFromServer(), 2500);

          // 将所有活跃节点状态设置为已完成
          setElements(({nodes, edges}) => {
            const updatedNodes = nodes.map(node => {
              // 如果节点正在生成中或者是最后活跃的节点，设置为已完成
              if (activeNodeIds.current.has(node.id) || 
                  (lastFocusNodeId.current && node.id === lastFocusNodeId.current) ||
                  (typeof node.data?.qaAnswerNodeId === 'string' && activeNodeIds.current.has(node.data.qaAnswerNodeId)) ||
                  (typeof node.data?.circuitAnalyzeNodeId === 'string' && activeNodeIds.current.has(node.data.circuitAnalyzeNodeId)) ||
                  (typeof node.data?.circuitCanvasNodeId === 'string' && activeNodeIds.current.has(node.data.circuitCanvasNodeId)) ||
                  (lastFocusNodeId.current && node.data?.qaAnswerNodeId === lastFocusNodeId.current) ||
                  (lastFocusNodeId.current && node.data?.circuitAnalyzeNodeId === lastFocusNodeId.current) ||
                  (lastFocusNodeId.current && node.data?.circuitCanvasNodeId === lastFocusNodeId.current) ||
                  node.data.process === 'generating') {
                console.log(`设置节点 ${node.id} 状态为已完成`);
                return {
                  ...node,
                  data: {
                    ...node.data,
                    process: 'completed',
                    isGenerated: true
                  }
                };
              }
              return node;
            });
            
            // 如果当前选中的节点状态发生了变化，同步更新selectedNode
            if (selectedNode && setSelectedNode) {
              const updatedSelectedNode = updatedNodes.find(node => node.id === selectedNode.id);
              if (updatedSelectedNode && 
                  (updatedSelectedNode.data.process !== selectedNode.data.process ||
                   updatedSelectedNode.data.isGenerated !== selectedNode.data.isGenerated)) {
                console.log(`同步更新选中节点 ${selectedNode.id} 的状态为已完成`);
                // 立即更新，不使用setTimeout延迟
                setSelectedNode({
                  ...updatedSelectedNode,
                  data: {
                    ...updatedSelectedNode.data,
                    // 确保状态同步
                    process: 'completed',
                    isGenerated: true,
                    // 添加时间戳确保UI更新
                    updatedAt: Date.now(),
                    forceRefresh: Date.now()
                  }
                });
              }
            }
            
            return { nodes: updatedNodes, edges };
          });
          
          // 将最后聚焦的节点从活跃列表中移除
          if (lastFocusNodeId.current) {
            activeNodeIds.current.delete(lastFocusNodeId.current);
          }
          
          // 延时执行布局
          setTimeout(() => {
            setElements(({nodes, edges}) => {
              // 使用更保守的布局方式，避免布局变形
              // 保持节点高度和宽度不变，只调整位置
              const layoutedNodes = executeLayout(nodes, edges, false, false);
              
              if (layoutedNodes.length > 0) {
                console.log('最终布局调整，总节点数:', layoutedNodes.length);
                executeFitView(layoutedNodes.map(node => node.id), 100, 600, 0.95, 0.42, 0.12);
              }
              
              return {
                nodes: layoutedNodes,
                edges,
              };
            });
            
            // 设置聊天状态为false
            setIsChatting(false);
          }, 300);
          
          console.log('流式生成完成，最终布局后回到可读总览视角');
          
          // 清理lastFocusNodeId以避免后续误操作
          lastFocusNodeId.current = null;
          streamingFocusNodeId.current = null;
          if (pollTimer.current) {
            window.clearInterval(pollTimer.current);
            pollTimer.current = null;
          }
          break;
        }
        // 错误
        case 'error': {
          const errorMessage = task.data as string;
          toast.error(`对话出错：${errorMessage}`);
          // 设置聊天状态为false
          setIsChatting(false);
          if (pollTimer.current) {
            window.clearInterval(pollTimer.current);
            pollTimer.current = null;
          }
          break;
        }
      }
    }
    // 释放锁
    isChatTaskProcessing.current = false;
  }, [executeLayout, executeFitView, adjustViewportToShowLatestContent, handleTitleUpdate, convId, selectedNode, setSelectedNode, refreshNodesFromServer]);

  /**
   * 添加消息到队列
   */
  const addChatTask = useCallback((task: ChatTask) => {
    chatTaskQueue.current.push(task);
    // 如果没有正在处理的消息，启动处理
    processChatTask();
  }, [processChatTask]);

  /**
   * 启动聊天
   */
  const chat = useCallback((taskId: number) => {
    if (!convId) return;
    // 如果正在聊天，则不进行处理
    if (isChatting) {
      toast.error('正在聊天中，请先完成当前对话');
      return;
    }
    // 设置处理SSE状态为true
    setIsChatting(true);
    // 设置最后需要聚焦的节点id
    lastFocusNodeId.current = null;
    // 清空活跃节点列表
    activeNodeIds.current.clear();
    // 立即拉取一次节点，防止首帧只有ROOT
    void refreshNodesFromServer();
    // 启动限次补偿轮询。不要用节点总数作为停止条件：
    // 已有多节点会话在新分支生成电路图时，节点数本来就大于3，过早停止会漏掉后续落库节点。
    if (pollTimer.current) {
      window.clearInterval(pollTimer.current);
    }
    pollAttempts.current = 0;
    lastNodeCount.current = 0;
    pollTimer.current = window.setInterval(() => {
      pollAttempts.current += 1;
      void refreshNodesFromServer();
      if (pollAttempts.current >= 60) {
        window.clearInterval(pollTimer.current!);
        pollTimer.current = null;
      }
    }, 1200);

    // SSE请求
    const source = new SSE(
      `${BASE_URL}/flow/completion?taskId=${taskId}`,
      {
				method: 'GET',
				headers: {
					'Content-Type': 'application/json',
					'Authorization': `Bearer ${localStorage.getItem(TOKEN_KEY)}`
				}
      }
    );
    
    let hasReceivedMessage = false;
    let hasReceivedRenderableContent = false;
    let hasCompleted = false;
    let isClosingIntentionally = false;
    let idleTimeout: number | null = null;

    const isRenderableChatTask = (task: ChatTask) => {
      return task.type === 'node' ||
        task.type === 'text' ||
        task.type === 'title' ||
        task.type === 'done' ||
        task.type === 'error';
    };

    const clearIdleTimeout = () => {
      if (idleTimeout !== null) {
        window.clearTimeout(idleTimeout);
        idleTimeout = null;
      }
    };

    const resetIdleTimeout = () => {
      clearIdleTimeout();
      idleTimeout = window.setTimeout(async () => {
        isClosingIntentionally = true;
        const latestNodes = await refreshNodesFromServer();
        const hasServerProgress = hasMeaningfulFlowProgress(latestNodes);
        const hasEnoughNodes = latestNodes.length >= 3;

        const idleSeconds = hasReceivedRenderableContent ? 90 : 150;
        console.warn(
          hasReceivedMessage
            ? `SSE连接长时间空闲（${idleSeconds}秒），强制关闭`
            : `SSE连接首包等待超时（${idleSeconds}秒），强制关闭`
        );
        source.close();

        if (!hasServerProgress && !hasEnoughNodes) {
          toast.error(
            hasReceivedMessage
              ? '分析连接已中断，已停止等待新内容，请重试或刷新当前会话'
              : '分析任务长时间没有返回内容，可能后端执行异常或仍在排队，请稍后重试'
          );
        } else {
          console.log('SSE空闲超时，但服务端节点已同步完成，忽略中断提示');
        }

        setIsChatting(false);
        if (pollTimer.current) {
          window.clearInterval(pollTimer.current);
          pollTimer.current = null;
        }
      }, hasReceivedRenderableContent ? 90000 : 150000);
    };

    resetIdleTimeout();

    // 流式获取响应
    source.addEventListener("message", async (event: MessageEvent<string>) => {
      try {
        hasReceivedMessage = true;
        const task = JSON.parse(event.data) as ChatTask;
        if (isRenderableChatTask(task)) {
          hasReceivedRenderableContent = true;
        }
        resetIdleTimeout();
        // 添加消息到队列
        addChatTask(task);
        
        // 如果接收到done消息，确保SSE连接关闭
        if (task.type === 'done') {
          hasCompleted = true;
          isClosingIntentionally = true;
          setTimeout(() => {
            source.close();
          }, 500);
        }
      } catch (error) {
        console.error('处理SSE消息出错:', error, event.data);
        clearIdleTimeout();
        toast.error('处理响应数据时出错');
        setIsChatting(false);
      }
    });

    source.addEventListener("heartbeat", () => {
      hasReceivedMessage = true;
      resetIdleTimeout();
    });
    
    // 处理错误情况
    source.addEventListener("error", (event: MessageEvent<string>) => {
      const eventData = typeof event.data === 'string' ? event.data.trim() : '';

      if (event.data === "waiting") {
        // 1秒后重试
				// TODO 多次重试后直接失败处理
        setTimeout(() => {
          chat(taskId);
        }, 1000);
      } else if (hasCompleted || isClosingIntentionally) {
        console.log('忽略SSE关闭阶段的尾部错误事件', event);
      } else if (hasReceivedMessage && !eventData) {
        console.log('忽略已收到内容后的空SSE错误事件', event);
      } else {
        // 错误处理
        console.error('SSE连接错误:', event);
        clearIdleTimeout();
        toast.error(`请求出错了：${eventData || '连接异常'}`);
        // 设置聊天状态为false
        setIsChatting(false);
      }
    });
    
    // 添加连接关闭事件处理
    source.addEventListener("close", () => {
      console.log('SSE连接已关闭');
      clearIdleTimeout();
      // 确保isChatting被设置为false
      setTimeout(() => {
        setIsChatting(false);
        if (pollTimer.current) {
          window.clearInterval(pollTimer.current);
          pollTimer.current = null;
        }
      }, 200);
    });
  }, [addChatTask, convId, hasMeaningfulFlowProgress, isChatting, refreshNodesFromServer]);

  return {
    // 状态
    elements,
    isChatting,
    rootNodeId,

    // 方法
    chat,
    setElements,
    addChatTask
  };
}

export default useFlowState;
