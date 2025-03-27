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

/**
 * 流程图状态管理Hook
 * 负责管理节点、边、消息处理和临时节点操作
 */
function useFlowState(convId: number) {

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
          if (nodeVO.type === 'answer' || nodeVO.type === 'knowledge-detail') {
            lastFocusNodeId.current = nodeVO.id.toString();
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
            const newEdge = {
              id: `e${nodeVO.parentId!}-${nodeVO.id}`,
              source: nodeVO.parentId!.toString(),
              target: nodeVO.id.toString(),
              type: 'smoothstep',
            } as Edge;
            // 添加新节点和边，去除临时查询节点
            const currentNodes = [...nodes.filter(node => !node.id.startsWith(TEMP_QUERY_NODE_ID_PREFIX)), newNode];
            const currentEdges = [...edges.filter(edge => !edge.target.startsWith(TEMP_QUERY_NODE_ID_PREFIX)), newEdge];
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

            // 更新节点和边
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
          const nodeId = textData.nodeId.toString();
          setElements(({nodes, edges}) => {
            const targetNode = nodes.find(node => node.id === nodeId);
            if (!targetNode) return {nodes, edges};
            // 更新节点数据
            const updatedNodes = nodes.map(node =>
              node.id === nodeId ? 
              {
                ...node, 
                data: {
                  ...node.data, 
                  text: node.data.text + textData.content
                }
              } : node
            );
            // 调整视口以显示最新内容
            setTimeout(() => {
              adjustViewportToShowLatestContent(targetNode);
            }, 300);
            return {
              nodes: updatedNodes,
              edges,
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
          const nodeId = data.nodeId.toString();
          // 更新对应id节点的data
          setElements(({nodes, edges}) => {
            const targetNode = nodes.find(node => node.id === nodeId);
            if (!targetNode) return {nodes, edges};
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
                  )
                }
              } : node
            );
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
          // 延时执行布局
          setTimeout(() => {
            setElements(({nodes, edges}) => {
              const layoutedNodes = executeLayout(nodes, edges, true);
              return {
                nodes: layoutedNodes,
                edges,
              };
            });
            // 设置聊天状态为false
            setIsChatting(false);
          }, 400);
          // 执行fitView
          if (lastFocusNodeId.current) {
            console.log('最终布局执行fitView', lastFocusNodeId.current);
            executeFitView([lastFocusNodeId.current], 1000);
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
  }, [executeLayout, executeFitView, adjustViewportToShowLatestContent, handleTitleUpdate, convId]);

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
      const task = JSON.parse(event.data) as ChatTask;
      // 添加消息到队列
      addChatTask(task);
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
        toast.error(`请求出错了：${event.data}`);
        // 设置聊天状态为false
        setIsChatting(false);
      }
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