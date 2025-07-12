import { NodeVO } from "@/api/types/flow.types";
import { Edge, Node } from "@xyflow/react";
import { useCallback, useMemo, useRef, useState } from "react";
import { NodeData } from "../components/node/types/node.types";
import { ChatTask, TextData } from "../types/ChatTask.types";
import { useAppContext } from "@/app/contexts/AppContext";
import { toast } from "sonner";
import { BASE_URL } from "@/api";
import {SSE} from "sse.js";
import { TOKEN_KEY } from "@/common/constant/storage-key.constant";
import useFlowTools from "./useFlowTools";
import { TEMP_QUERY_NODE_ID_PREFIX } from "../constants";
import { processTextUpdate } from "../utils/sectionParser";

/**
 * 流程图状态管理Hook
 * 负责管理节点、边、消息处理和临时节点操作
 */
function useFlowState(convId: number, selectedNode?: Node | null, setSelectedNode?: (node: Node | null) => void) {

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
  // 跟踪正在生成内容的节点
  const activeNodeIds = useRef<Set<string>>(new Set());

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
          
          if (nodeVO.type === 'answer' || nodeVO.type === 'knowledge-detail') {
            lastFocusNodeId.current = nodeVO.id.toString();
            // 添加到活跃节点跟踪列表
            activeNodeIds.current.add(nodeVO.id.toString());
          }
          setElements(({nodes, edges}) => {
            const tempQueryNode = nodes.find(node => node.id.startsWith(TEMP_QUERY_NODE_ID_PREFIX));
            const isUserQueryNode = nodeVO.type === 'query' && tempQueryNode;
            const newNode = {
              id: nodeVO.id.toString(),
              type: nodeVO.type,
              position: isUserQueryNode ? tempQueryNode.position : nodeVO.position,
              data: {
                ...nodeVO.data,
                parentId: nodeVO.parentId,
                convId: nodeVO.convId,
                userId: nodeVO.userId,
                createdAt: nodeVO.createdAt,
                updatedAt: nodeVO.updatedAt,
                ...(nodeVO.height !== null ? { height: nodeVO.height } : {}),
              },
            } as Node<NodeData<typeof nodeVO.type>>;
            
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
            
            // 执行布局
            const layoutedNodes = isUserQueryNode ? currentNodes : executeLayout(currentNodes, currentEdges, false);
            // 获得新节点布局后的位置
            const newNodeLayoutedPosition = layoutedNodes.find(node => node.id === newNode.id)?.position;
            console.log('newNodeLayoutedPosition', newNodeLayoutedPosition);
            // 调整视口以显示最新内容
            executeFitView([newNode.id], 500);

            // 如果节点是knowledge-detail，则修改knowledge-head的isGenerated为true
            if (nodeVO.type === 'knowledge-detail') {
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
            if (nodeVO.type === 'answer-detail' || nodeVO.type === 'ANSWER_DETAIL') {
              const answerPointNode = layoutedNodes.find(node => 
                (node.type === 'answer-point' || node.type === 'ANSWER_POINT') && 
                nodeVO.parentId && 
                node.id === nodeVO.parentId.toString()
              );
              if (answerPointNode) {
                answerPointNode.data.isGenerated = true;
              }
            }
            
            // 如果节点类型是circuit-detail，则修改其父节点(circuit-point)的isGenerated为true
            if (nodeVO.type === 'circuit-detail') {
              const circuitPointNode = layoutedNodes.find(node => 
                node.type === 'circuit-point' && 
                nodeVO.parentId && 
                node.id === nodeVO.parentId.toString()
              );
              if (circuitPointNode) {
                circuitPointNode.data.isGenerated = true;
              }
            }

            return {
              nodes: layoutedNodes,
              edges: currentEdges,
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
            const { nodes: updatedNodes, edges: updatedEdges } = 
              processTextUpdate(textData, nodes, edges);
              
            // 找到更新的节点进行视图调整
            const nodeId = textData.nodeId.toString();
            const targetNode = updatedNodes.find(node => node.id === nodeId);
            
            if (targetNode) {
              console.log(`更新节点文本内容，ID: ${nodeId}`);
              
              // 同步更新selectedNode状态
              if (selectedNode && selectedNode.id === nodeId && setSelectedNode) {
                setSelectedNode(targetNode);
              }
              
              setTimeout(() => {
                adjustViewportToShowLatestContent(targetNode);
              }, 300);
            } else {
              // 数据可能先于节点到达，这是正常的
              console.log(`尚未找到节点ID: ${nodeId} 对应的节点，文本数据可能先于节点到达`);
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
            console.error('处理data任务时nodeId不存在:', task);
            toast.error('处理数据时发生错误');
            break;
          }
          
          const nodeId = data.nodeId.toString();
          console.log(`处理节点数据更新，nodeId: ${nodeId}`, data);
          
          // 更新对应id节点的data
          setElements(({nodes, edges}) => {
            // 尝试找到目标节点
            const targetNode = nodes.find(node => node.id === nodeId);
            
            // 如果找不到节点，不要显示警告，因为可能是数据先于节点到达
            // 这是正常的流程，节点可能尚未创建
            if (!targetNode) {
              console.log(`尚未找到节点ID: ${nodeId} 对应的节点，数据可能先于节点到达`);
              return {nodes, edges};
            }
            
            // 检查是否为动画渲染完成的更新
            const isAnimationCompleted = 
              targetNode.type === 'resource' && 
              targetNode.data.subtype === 'generated-animation' && 
              'objectName' in data && 
              data.objectName;
            
            if (isAnimationCompleted) {
              console.log(`动画渲染已完成，节点ID: ${nodeId}，objectName: ${data.objectName}`);
            }
            
            // 更新节点数据
            const updatedNodes = nodes.map(node =>
              node.id === nodeId ? 
              {
                ...node, 
                data: {
                  ...node.data,
                  // 去除nodeId
                  ...Object.fromEntries(
                    Object.entries(data).filter(([key]) => key !== 'nodeId')
                  ),
                  // 如果是动画渲染完成，移除progress状态以强制组件显示视频
                  ...(isAnimationCompleted ? { progress: undefined } : {})
                }
              } : node
            );
            
            // 同步更新selectedNode状态
            if (selectedNode && selectedNode.id === nodeId && setSelectedNode) {
              const updatedSelectedNode = updatedNodes.find(node => node.id === nodeId);
              if (updatedSelectedNode) {
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
          handleTitleUpdate(convId, title);
          break;
        }
        // 完成
        case 'done': {
          console.log('接收到done消息，准备完成对话');
          
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
              
              // 确保所有节点都能在视图中展现
              if (layoutedNodes.length > 0) {
                console.log('最终布局调整，总节点数:', layoutedNodes.length);
                // 添加一个小延迟以确保布局应用
                setTimeout(() => {
                  executeFitView(
                    layoutedNodes.map(node => node.id),
                    500,   // 动画时长
                    200,   // 内边距
                    0.9,   // 最大缩放
                    0.1    // 最小缩放
                  );
                }, 50);
              }
              
              return {
                nodes: layoutedNodes,
                edges,
              };
            });
            
            // 设置聊天状态为false
            setIsChatting(false);
          }, 300);
          
          // 执行fitView - 聚焦到最后活跃的节点
          if (lastFocusNodeId.current) {
            console.log('执行fitView，聚焦最后活跃节点:', lastFocusNodeId.current);
            executeFitView([lastFocusNodeId.current], 800);
          }
          break;
        }
        // 错误
        case 'error': {
          const errorMessage = task.data as string;
          toast.error(`对话出错：${errorMessage}`);
          // 设置聊天状态为false
          setIsChatting(false);
          break;
        }
      }
    }
    // 释放锁
    isChatTaskProcessing.current = false;
  }, [executeLayout, executeFitView, adjustViewportToShowLatestContent, handleTitleUpdate, convId, selectedNode, setSelectedNode]);

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
    
    // 流式获取响应
    source.addEventListener("message", async (event: MessageEvent<string>) => {
      try {
        const task = JSON.parse(event.data) as ChatTask;
        // 添加消息到队列
        addChatTask(task);
        
        // 如果接收到done消息，确保SSE连接关闭
        if (task.type === 'done') {
          setTimeout(() => {
            source.close();
          }, 500);
        }
      } catch (error) {
        console.error('处理SSE消息出错:', error, event.data);
        toast.error('处理响应数据时出错');
        setIsChatting(false);
      }
    });
    
    // 处理错误情况
    source.addEventListener("error", (event: MessageEvent<string>) => {
      if (event.data === "waiting") {
        // 1秒后重试
				// TODO 多次重试后直接失败处理
        setTimeout(() => {
          chat(taskId);
        }, 1000);
      } else {
        // 错误处理
        console.error('SSE连接错误:', event);
        toast.error(`请求出错了：${event.data || '连接异常'}`);
        // 设置聊天状态为false
        setIsChatting(false);
      }
    });
    
    // 添加连接关闭事件处理
    source.addEventListener("close", () => {
      console.log('SSE连接已关闭');
      // 确保isChatting被设置为false
      setTimeout(() => {
        setIsChatting(false);
      }, 200);
    });
    
    // 添加安全超时，防止连接长时间未响应
    const safetyTimeout = setTimeout(() => {
      console.warn('SSE连接超时（20秒），强制关闭');
      source.close();
      setIsChatting(false);
    }, 20000);
    
    // 在消息处理后清除安全超时
    source.addEventListener("message", () => {
      clearTimeout(safetyTimeout);
    });
  }, [addChatTask, isChatting]);

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