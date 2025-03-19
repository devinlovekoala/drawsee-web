import { useMemo, useRef, useCallback, useState } from "react";
import { Node, Edge } from "@xyflow/react";
import { NodeType } from "@/api/types/flow.types";
import useFlowTools from "./useFlowTools";
import { TEMP_QUERY_NODE_ID_PREFIX } from "../constants";

// 定义临时节点任务数据类型
export type TempQueryNodeTask = { 
  type: 'create' | 'update';
  text: string;
} | {
  type: 'delete';
  fitViewNodeIds?: string[];
};

// 定义允许用户追问的节点类型
const ALLOWED_PARENT_TYPES: NodeType[] = ['root', 'answer', 'knowledge-detail'];

function useTempQueryNode(
	convId: number,
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
    // 如果正在处理SSE消息，禁止输入
    if (isChatting) {
      setCanNotInputReason('正在chatting，无法追问');
      return false;
    }
    // 没有选中节点，但有根节点时可以输入
    if (!selectedNode) {
      if (rootNodeId === null) setCanNotInputReason('没有选中节点，无法追问');
      return rootNodeId !== null;
    }
    // 选中节点是允许用户追问的节点类型
    if (!ALLOWED_PARENT_TYPES.includes(selectedNode.type as NodeType)) {
      setCanNotInputReason('当前节点不允许追问');
      return false;
    }
    setCanNotInputReason(null);
    return true;
  }, [selectedNode, rootNodeId, isChatting]);
  // 获取临时查询节点的父节点ID
  const parentIdOfTempQueryNode = useMemo(() => {
    if (selectedNode && ALLOWED_PARENT_TYPES.includes(selectedNode.type as NodeType)) {
      return selectedNode.id;
    }
    return rootNodeId;
  }, [selectedNode, rootNodeId]);
	// 有临时查询节点的节点和边
  const nodesAndEdgesWithTempQueryNode = useMemo(() => {
    if (!parentIdOfTempQueryNode || !canInput) return elements;
    // 创建新的临时节点
    const newTempNode: Node = {
      id: `${TEMP_QUERY_NODE_ID_PREFIX}pre`,
      type: 'query',
      position: { x: 0, y: 0 },
      data: {
        title: '用户提问',
        text: '',
        parentId: parentIdOfTempQueryNode,
        convId,
        createdAt: Date.now(),
        updatedAt: Date.now(),
      },
      selectable: false
    };
    // 创建新的边
    const newTempEdge: Edge = {
      id: `e${parentIdOfTempQueryNode}-${newTempNode.id}`,
      source: parentIdOfTempQueryNode,
      target: newTempNode.id,
      type: 'smoothstep',
    };
    // 如果已有临时节点，先将其移除       
    const updatedNodes = [...elements.nodes.filter(n => n.id !== tempQueryNodeId.current), newTempNode];
    const updatedEdges = [...elements.edges.filter(e => e.target !== tempQueryNodeId.current), newTempEdge];
    // 执行布局
    const layoutedNodes = executeLayout(updatedNodes, updatedEdges, false);
    return { nodes: layoutedNodes, edges: updatedEdges };
  }, [parentIdOfTempQueryNode, canInput]);

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
          if (!canInput || !parentIdOfTempQueryNode) continue;
          
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
                data: { ...node.data, text: task.text },
                selectable: false
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
            executeFitView(fitViewNodeIds);
            
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
  }, [canInput, parentIdOfTempQueryNode, nodesAndEdgesWithTempQueryNode]);

  /**
   * 添加临时查询节点任务
   */
  const addTempQueryNodeTask = useCallback((task: TempQueryNodeTask) => {
    tempQueryNodeTaskQueue.current.push(task);
    processTempQueryNodeTask();
  }, [processTempQueryNodeTask]);

	return {
		canInput,
		canNotInputReason,
		parentIdOfTempQueryNode,
    nodesAndEdgesNoneTempQueryNode,
		addTempQueryNodeTask,
	}

}

export default useTempQueryNode;
