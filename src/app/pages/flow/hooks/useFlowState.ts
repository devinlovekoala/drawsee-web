import { NodeVO } from "@/api/types/flow.types";
import { Edge, Node, useReactFlow } from "@xyflow/react";
import { useCallback, useEffect, useRef, useState } from "react";
import { NodeData } from "../components/node/types/node.types";
import { layoutNodes } from "../utils/layoutNodes";
import { animateLayoutTransition } from "../utils/nodePositionAnimator";
import { ChatMessage, MediaData, TextData } from "../types/ChatMessage.types";
import { AppContext } from "@/app/app";
import { useOutletContext } from "react-router-dom";
import { toast } from "sonner";
import { BASE_URL } from "@/api";
import {SSE} from "sse.js";
import { TOKEN_KEY } from "@/common/constant/storage-key.constant";
import { NODE_WIDTH } from "../constants";

function useFlowState() {
	const [nodes, setNodes] = useState<Node[]>([]);
	const [edges, setEdges] = useState<Edge[]>([]);

	// nodes和edges的副本，同步更新，可实时获取最新值
  const nodesRef = useRef<Node[]>([]);
  const edgesRef = useRef<Edge[]>([]);
  // SSE处理消息缓冲队列
  const processingQueue = useRef<ChatMessage[]>([]);
  // 是否正在处理消息（锁）
  const isProcessing = useRef(false);
  // 当前正在更新文本的节点ID
  const currentTextNodeId = useRef<string | null>(null);

	const {fitView, getNodes, setViewport, getViewport} = useReactFlow();
	const {handleTitleUpdate} = useOutletContext<AppContext>();

  useEffect(() => {
    nodesRef.current = nodes;
  }, [nodes]);

  useEffect(() => {
    edgesRef.current = edges;
  }, [edges]);

	// 处理消息缓冲队列
  const processQueue = async (convId: number) => {
    if (isProcessing.current) return;
    isProcessing.current = true;

    while (processingQueue.current.length > 0) {
      const message = processingQueue.current.shift();
      if (!message) continue;
      switch (message.type) {
        // 新增节点
        case 'node': {
          // 将NodeVO转变为reactflow的Node，先进行布局，再插入新节点和新边
          const nodeVO = message.data as NodeVO;
          const newNode = {
            id: nodeVO.id.toString(),
            type: nodeVO.type,
            position: nodeVO.position,
            data: {
              ...nodeVO.data,
              parentId: nodeVO.parentId,
              convId: nodeVO.convId,
              userId: nodeVO.userId,
              createdAt: nodeVO.createdAt,
              updatedAt: nodeVO.updatedAt,
            },
          } as Node<NodeData<typeof nodeVO.type>>;
          const newEdge = {
            id: `e${nodeVO.parentId!}-${nodeVO.id}`,
            source: nodeVO.parentId!.toString(),
            target: nodeVO.id.toString(),
            type: 'smoothstep',
          } as Edge;
          
          console.log('新增节点：', newNode);
          console.log('新增边：', newEdge);
          const currentNodes = [...nodesRef.current, newNode];
          const currentEdges = [...edgesRef.current, newEdge];
          
          // 进行布局
          const layoutedNodes = await layoutNodes(currentNodes, currentEdges, false);
          
          // 使用动画过渡
          const animatedNodes = await animateLayoutTransition(
            currentNodes, 
            layoutedNodes, 
            setNodes,
            500
          );
          
          // 更新edges
          setEdges(currentEdges);
          edgesRef.current = currentEdges;
          
          // 移动视角
          fitView({
            nodes: [{id: newNode.id}],
            duration: 1000
          });
          
          // 记录当前正在更新文本的节点ID
          currentTextNodeId.current = newNode.id;
          break;
        }
        // 新增文本
        case 'text': {
          const textData = message.data as TextData;
          // 将特定id的节点文本更新
          const currentNodes = nodesRef.current.map(node =>
            node.id === textData.nodeId.toString() ? 
            {...node, data: {...node.data, text: node.data.text + textData.content}} : node
          );
          setNodes(currentNodes);
          nodesRef.current = currentNodes;
          
          // 更新当前正在更新文本的节点ID
          currentTextNodeId.current = textData.nodeId.toString();
          
          // 如果节点文本更新，调整视角以显示最新内容
          if (currentTextNodeId.current) {
            adjustViewportToShowLatestText(currentTextNodeId.current);
          }
          break;
        }
        // 新增媒体
        case 'media': {
          const mediaData = message.data as MediaData;
          // 将特定id的节点媒体更新
          const currentNodes = nodesRef.current.map(node => 
            node.id === mediaData.nodeId.toString() ? 
            {...node, data: {...node.data, media: {
              animationObjectNames: mediaData.animationObjectNames,
              bilibiliUrls: mediaData.bilibiliUrls,
            }}} : node
          );
          setNodes(currentNodes);
          nodesRef.current = currentNodes;
          break;
        }
        // 新增标题
        case 'title':
          const title = message.data as string;
          handleTitleUpdate(convId, title);
          break;
        // 完成
        case 'done': {
          // 进行重新布局，并更新服务器
          console.log('完成对话，进行重新布局: ', nodesRef.current, edgesRef.current);
          const layoutedNodes = await layoutNodes(nodesRef.current, edgesRef.current, true);
          console.log('重新布局完成: ', layoutedNodes);
          
          // 使用动画过渡
          const animatedNodes = await animateLayoutTransition(
            nodesRef.current, 
            layoutedNodes, 
            setNodes,
            800
          );
          
          // 重置当前正在更新文本的节点ID
          currentTextNodeId.current = null;
          break;
        }
        // 错误
        case 'error': {
          const errorMessage = message.data as string;
          toast.error(`对话出错：${errorMessage}`);
          break;
        }
      }
    }

    isProcessing.current = false;
  }

  // 调整视角以显示最新文本
  const adjustViewportToShowLatestText = useCallback((nodeId: string) => {
    const node = nodesRef.current.find(n => n.id === nodeId);
    if (!node) return;
    
    // 获取当前视口
    const viewport = getViewport();
    
		console.log('当前viewport: ', viewport);

    // 计算节点在视口中的位置
    const nodeX = node.position.x * viewport.zoom + viewport.x;
    const nodeY = node.position.y * viewport.zoom + viewport.y;
    
    // 获取视口尺寸
    const viewportWidth = window.innerWidth;
    const viewportHeight = window.innerHeight;
    
    // 计算节点底部位置
    const nodeHeight = node.measured?.height ?? 200; // 估计节点高度
    const nodeBottom = nodeY + nodeHeight * viewport.zoom;
    
    // 如果节点底部超出视口，调整视口位置
    if (nodeBottom > viewportHeight - 100) {
      const newY = viewport.y - (nodeBottom - viewportHeight + 150);
      setViewport({ x: viewport.x, y: newY, zoom: viewport.zoom }, { duration: 300 });
    }
  }, [getViewport, setViewport]);

  const chat = useCallback((convId: number, taskId: number) => {
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
      const message = JSON.parse(event.data) as ChatMessage;
      // 将新消息入队
      processingQueue.current.push(message);
      // 触发处理流程
      processQueue(convId);
    });
    // 处理错误情况
    source.addEventListener("error", (event: MessageEvent<string>) => {
      if (event.data === "waiting") {
        // 1秒后重试
        setTimeout(() => {
          chat(convId, taskId);
        }, 1000);
      } else {
        // 错误处理
        toast.error(`请求出错了：${event.data}`);
      }
    });
  }, []);

	return {
		nodes,
		setNodes,
		edges,
		setEdges,
		chat,
	};

}

export default useFlowState;