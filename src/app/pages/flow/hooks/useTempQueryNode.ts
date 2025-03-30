import { useMemo, useRef, useCallback, useState, useEffect } from "react";
import { Node, Edge } from "@xyflow/react";
import { AiTaskType, NodeType } from "@/api/types/flow.types";
import useFlowTools from "./useFlowTools";
import { TEMP_QUERY_NODE_ID_PREFIX } from "../constants";
import { useAppContext } from "@/app/contexts/AppContext.tsx";
import { nanoid } from "nanoid";
import { createAiTask } from "@/api/methods/flow.methods.ts";
import { NodeData } from "@/app/pages/flow/components/node/types/node.types";
import toast from "react-hot-toast";

// 定义临时节点任务数据类型
export type TempQueryNodeTask = { 
  type: 'create' | 'update';
  text: string;
  mode?: AiTaskType;
} | {
  type: 'delete';
  fitViewNodeIds?: string[];
};

// 定义允许用户追问的节点类型
const ALLOWED_PARENT_TYPES: NodeType[] = ['root', 'answer', 'knowledge-detail'];

// 防抖函数
function debounce<F extends (...args: Parameters<F>) => ReturnType<F>>(func: F, wait: number): (...args: Parameters<F>) => void {
  let timeout: ReturnType<typeof setTimeout> | null = null;
  
  return function(...args: Parameters<F>): void {
    if (timeout) clearTimeout(timeout);
    timeout = setTimeout(() => func(...args), wait);
  };
}

function useTempQueryNode(
	convId: number | undefined,
	isChatting: boolean,
	selectedNode: Node | null,
	rootNodeId: string | null,
  elements: {nodes: Node[], edges: Edge[]},
  setElements: React.Dispatch<React.SetStateAction<{
    nodes: Node[];
    edges: Edge[];
  }>>
) {
	const { executeFitView, executeLayout } = useFlowTools();
	const { nodeWidth } = useAppContext();
	// 临时查询节点ID
	const tempQueryNodeId = useRef<string | null>(null);
	// 没有临时查询节点的节点和边
	const nodesAndEdgesNoneTempQueryNode = useRef<{nodes: Node[], edges: Edge[]}|null>(null);
	// 临时查询节点任务队列
	const tempQueryNodeTaskQueue = useRef<TempQueryNodeTask[]>([]);
	// 是否正在处理临时查询节点任务
	const isProcessingTempQueryNodeTask = useRef<boolean>(false);
	// 无法追问的原因
  const [canNotInputReason, setCanNotInputReason] = useState<string | null>(null);
  // 判断当前是否可以输入（根据选中节点类型和SSE处理状态）
  const canInput = useMemo(() => {
    if (isChatting) {
      return {can: false, reason: '请等待当前对话完成'};
    }
    if (!convId) {
      return {can: false, reason: '请先创建对话'};
    }
    if (!selectedNode) {
      return {can: false, reason: '请先选择一个节点'};
    }
    // 检查selectedNode是否可以继续提问
    if (selectedNode.type === 'answer' && selectedNode.data.subtype === 'solver') {
      if (!selectedNode.data.isDone) {
        return {can: false, reason: '解题过程还未完成，请等待完成后继续'};
      }
    }

    return {can: true, reason: ''};
  }, [convId, isChatting, selectedNode]);
  // 获取临时查询节点的父节点ID
  const parentIdOfTempQueryNode = useMemo(() => {
    if (!canInput.can) return null;

    // 如果是根节点，直接返回根节点ID
    if (selectedNode?.type === 'root') {
      return selectedNode.id;
    }

    // 如果是知识头部节点，直接返回知识头部节点ID
    if (selectedNode?.type === 'knowledge-head') {
      return selectedNode.id;
    }

    // 如果是答案节点，返回答案节点ID
    if (selectedNode?.type === 'answer') {
      return selectedNode.id;
    }

    // 如果是查询节点，则返回上一级的答案节点ID（如果存在）
    if (selectedNode?.type === 'query') {
      const edges = elements.edges.filter(edge => edge.target === selectedNode.id);
      if (edges.length > 0) {
        const sourceNode = elements.nodes.find(node => node.id === edges[0].source);
        if (sourceNode) {
          return sourceNode.id;
        }
      }
      // 如果没有上级节点或上级不是答案节点，就返回根节点ID
      return rootNodeId;
    }

    // 默认返回根节点ID
    return rootNodeId;
  }, [canInput.can, elements.edges, elements.nodes, rootNodeId, selectedNode]);
  
  // 存储最新计算结果的ref
  const latestNodesAndEdgesWithTempQueryNode = useRef<{nodes: Node[], edges: Edge[]}>(elements);
  
  // 用于强制触发重新渲染的状态
  const [updateCounter, setUpdateCounter] = useState(0);
  
  // 定义用于防抖的更新函数类型
  type UpdateNodesAndEdgesFunc = (
    parentId: string | null, 
    canInputValue: boolean, 
    elementsValue: {nodes: Node[], edges: Edge[]},
    convIdValue: number | undefined,
    executeLayoutFn: typeof executeLayout
  ) => void;
  
  // 创建更新函数
  const updateNodesAndEdges: UpdateNodesAndEdgesFunc = useCallback((
    parentId, 
    canInputValue, 
    elementsValue,
    convIdValue,
    executeLayoutFn
  ) => {
    if (!parentId || !canInputValue || !convIdValue) {
      latestNodesAndEdgesWithTempQueryNode.current = elementsValue;
      setUpdateCounter(prev => prev + 1); // 触发重新渲染
      return;
    }
    
    console.log('重新计算有临时查询节点的节点和边');
    // 创建新的临时节点
    const newTempNode: Node = {
      id: `${TEMP_QUERY_NODE_ID_PREFIX}pre`,
      type: 'query',
      position: { x: 0, y: 0 },
      data: {
        title: '用户提问',
        text: '',
        parentId: parentId,
        convId: convIdValue,
        createdAt: Date.now(),
        updatedAt: Date.now(),
      },
      selectable: false
    };
    // 创建新的边
    const newTempEdge: Edge = {
      id: `e${parentId}-${newTempNode.id}`,
      source: parentId,
      target: newTempNode.id,
      type: 'smoothstep',
    };
    // 如果已有临时节点，先将其移除       
    const updatedNodes = [...elementsValue.nodes.filter(n => n.id !== tempQueryNodeId.current), newTempNode];
    const updatedEdges = [...elementsValue.edges.filter(e => e.target !== tempQueryNodeId.current), newTempEdge];
    // 执行布局
    const layoutedNodes = executeLayoutFn(updatedNodes, updatedEdges, false);
    
    latestNodesAndEdgesWithTempQueryNode.current = { nodes: layoutedNodes, edges: updatedEdges };
    setUpdateCounter(prev => prev + 1); // 触发重新渲染
  }, []);
  
  // 创建防抖版本的更新函数
  const debouncedUpdateNodesAndEdges = useRef(
    debounce(updateNodesAndEdges, 300)
  ).current;
  
  // 当依赖项变化时，触发防抖更新
  useEffect(() => {
    debouncedUpdateNodesAndEdges(
      parentIdOfTempQueryNode, 
      canInput.can, 
      elements,
      convId,
      executeLayout
    );
  }, [parentIdOfTempQueryNode, canInput.can, elements, convId, executeLayout, debouncedUpdateNodesAndEdges]);

  // 有临时查询节点的节点和边 - 使用最新计算结果
  const nodesAndEdgesWithTempQueryNode = useMemo(() => {
    return latestNodesAndEdgesWithTempQueryNode.current;
  }, [updateCounter]); // 使用updateCounter作为依赖项，而不是ref本身

  /**
   * 处理临时查询节点任务
   */
  const processTempQueryNodeTask = useCallback(() => {
    if (isProcessingTempQueryNodeTask.current) return;
    // 加锁
    isProcessingTempQueryNodeTask.current = true;
    while (tempQueryNodeTaskQueue.current.length > 0) {
      // 单个处理
      const task = tempQueryNodeTaskQueue.current.shift();
      if (!task) continue;
      switch (task.type) {
        case 'create': {
          if (!canInput.can || !parentIdOfTempQueryNode) continue;
          
          setElements(({nodes, edges}) => {
            // 保存没有临时查询节点的节点和边
            nodesAndEdgesNoneTempQueryNode.current = {nodes, edges};
            // 使用预先布局好的节点和边
            const { nodes: nodesWithPreTempNode, edges: edgesWithPreTempNode } = nodesAndEdgesWithTempQueryNode;
            const newTempQueryNodeId =  `${TEMP_QUERY_NODE_ID_PREFIX}${Date.now()}`;
            const updatedNodes = nodesWithPreTempNode.map(node => 
              node.id === `${TEMP_QUERY_NODE_ID_PREFIX}pre` ? {
                ...node,
                id: newTempQueryNodeId,
                data: { 
                  ...node.data, 
                  text: task.text,
                  ...(task.mode ? {mode: task.mode} : {})
                },
                selectable: false,
              } : node
            );
            const updatedEdges = edgesWithPreTempNode.map(edge => 
              edge.target === `${TEMP_QUERY_NODE_ID_PREFIX}pre` ? {
                ...edge,
                id: `e${edge.source}-${newTempQueryNodeId}`,
                target: newTempQueryNodeId
              } : edge
            );
            // 更新临时节点引用
            tempQueryNodeId.current = newTempQueryNodeId;
            // 延迟执行fitView，确保节点已更新
            executeFitView([newTempQueryNodeId], 300);
            
            return { nodes: updatedNodes, edges: updatedEdges };
          });
          
          break;
        }
        case 'update': {
          if (!tempQueryNodeId.current) continue;
          setElements(({nodes, edges}) => {
            const updatedNodes = nodes.map(n => 
              n.id === tempQueryNodeId.current ? { ...n, data: { ...n.data, text: task.text } } : n
            );
            return { nodes: updatedNodes, edges };
          });
          break;
        }
        case 'delete': {
          if (!tempQueryNodeId.current) continue;
          console.log('tempQueryNodeTask delete');
          
          // 恢复没有临时查询节点的节点和边
          setElements(({nodes, edges}) => {
            // 清除临时节点引用
            tempQueryNodeId.current = null;
            // 执行fitView
            const fitViewNodeIds = task.fitViewNodeIds || [parentIdOfTempQueryNode].filter(Boolean) as string[];
            executeFitView(fitViewNodeIds, 100);
            
            if (nodesAndEdgesNoneTempQueryNode.current) {
              return nodesAndEdgesNoneTempQueryNode.current;
            }
            return { nodes, edges };
          });
          
          break;
        }
      }
    }
    // 释放锁
    isProcessingTempQueryNodeTask.current = false;
  }, [canInput.can, parentIdOfTempQueryNode, setElements, nodesAndEdgesWithTempQueryNode, executeFitView]);

  /**
   * 添加临时查询节点任务
   */
  const addTempQueryNodeTask = useCallback(async (prompt: string) => {
    if (!canInput.can || !convId) {
      toast.error(canInput.reason || '无法发送消息');
      return;
    }

    try {
      if (!parentIdOfTempQueryNode) {
        toast.error('父节点ID不存在');
        return;
      }

      // 分析消息类型
      let mode: AiTaskType = 'general'; // 默认为general
      
      if (prompt.trim().toLowerCase().startsWith('/knowledge')) {
        mode = 'knowledge';
        prompt = prompt.replace(/^\/knowledge/i, '').trim();
      }

      // 添加临时节点任务，使用为参数创建任务
      tempQueryNodeTaskQueue.current.push({
        type: 'create',
        text: prompt,
        mode: mode
      });
      processTempQueryNodeTask();
      const tempNodeId = tempQueryNodeId.current;

      // 创建任务
      const res = await createAiTask({
        type: mode,
        prompt: prompt,
        promptParams: null,
        convId: convId,
        parentId: parseInt(parentIdOfTempQueryNode),
        model: null
      });

      if (res.taskId) {
        const taskId = res.taskId;
        // 通知任务创建成功，并触发聊天
        const chatEvent = new CustomEvent('chat-task-created', { detail: { taskId } });
        window.dispatchEvent(chatEvent);
      }
    } catch (error) {
      toast.error('发送消息失败');
      console.error('发送消息失败', error);
      
      // 恢复原始节点和边
      if (nodesAndEdgesNoneTempQueryNode.current) {
        setElements(nodesAndEdgesNoneTempQueryNode.current);
      }
    }
  }, [canInput, convId, parentIdOfTempQueryNode, processTempQueryNodeTask, setElements]);

	return {
		canInput: canInput.can,
		canNotInputReason: canInput.reason,
		parentIdOfTempQueryNode,
    nodesAndEdgesNoneTempQueryNode,
		addTempQueryNodeTask,
	}

}

export default useTempQueryNode;
