import type { Edge, Node } from '@xyflow/react';

const FOLLOW_UP_RESPONSE_TYPES = new Set([
  'answer',
  'answer-detail',
  'ANSWER_DETAIL',
  'circuit-analyze',
  'circuit-detail',
  'knowledge-detail',
  'PDF_ANALYSIS_DETAIL',
  'pdf-circuit-detail',
]);

const REDUNDANT_CIRCUIT_COMPANION_TYPES = new Set([
  'circuit-analyze',
  'circuit-detail',
]);

const FOLDED_NODE_ID_FIELDS = [
  'qaAnswerNodeId',
  'circuitAnalyzeNodeId',
  'circuitCanvasNodeId',
];

const getNodeParentId = (node: Node | undefined | null): string | null => {
  const parentId = node?.data?.parentId;
  if (parentId === undefined || parentId === null || parentId === '') return null;
  return String(parentId);
};

const isRootNode = (node: Node | undefined | null): boolean => {
  return node?.type === 'root';
};

const isFollowUpQueryNode = (node: Node | undefined | null, nodes: Node[]): boolean => {
  if (!node || node.type !== 'query') return false;
  const queryParentId = getNodeParentId(node);
  if (!queryParentId) return false;

  const queryParentNode = nodes.find(item => item.id === queryParentId);
  return !isRootNode(queryParentNode);
};

const getNodeText = (node: Node | undefined | null): string => {
  const text = node?.data?.text;
  return typeof text === 'string' ? text.trim() : '';
};

const isRedundantCircuitCompanionNode = (
  node: Node,
  parentNode: Node | undefined | null,
): boolean => {
  const nodeType = typeof node.type === 'string' ? node.type : '';
  if (parentNode?.type !== 'circuit-canvas') return false;
  if (!REDUNDANT_CIRCUIT_COMPANION_TYPES.has(nodeType)) return false;

  const text = getNodeText(node);
  return text.includes('电路图已生成') || text.includes('可继续追问工作原理');
};

const isFoldableCircuitCanvasNode = (
  node: Node,
  parentNode: Node | undefined | null,
): boolean => {
  return node.type === 'circuit-canvas' && Boolean(parentNode) && !isRootNode(parentNode);
};

export const presentFollowUpAnswerNodes = (nodes: Node[]): Node[] => {
  const nodeMap = new Map(nodes.map(node => [node.id, node]));
  const responseByQueryId = new Map<string, Node>();
  const circuitCanvasByParentId = new Map<string, Node>();
  const circuitCompanionByOwnerId = new Map<string, Node>();
  const hiddenNodeToVisibleParentId = new Map<string, string>();

  nodes.forEach(node => {
    FOLDED_NODE_ID_FIELDS.forEach(field => {
      const foldedId = node.data?.[field];
      if (foldedId !== undefined && foldedId !== null && foldedId !== '') {
        hiddenNodeToVisibleParentId.set(String(foldedId), node.id);
      }
    });
  });

  nodes.forEach(node => {
    const nodeType = typeof node.type === 'string' ? node.type : '';
    const parentId = getNodeParentId(node);
    const parentNode = parentId ? nodeMap.get(parentId) : null;

    if (isFoldableCircuitCanvasNode(node, parentNode)) {
      circuitCanvasByParentId.set(parentNode!.id, node);
      hiddenNodeToVisibleParentId.set(node.id, parentNode!.id);
      return;
    }

    if (isRedundantCircuitCompanionNode(node, parentNode)) {
      circuitCompanionByOwnerId.set(parentNode!.id, node);
      hiddenNodeToVisibleParentId.set(node.id, parentNode!.id);
      return;
    }

    if (!FOLLOW_UP_RESPONSE_TYPES.has(nodeType)) return;

    if (!isFollowUpQueryNode(parentNode, nodes)) return;

    responseByQueryId.set(parentNode!.id, node);
    hiddenNodeToVisibleParentId.set(node.id, parentNode!.id);
  });

  const resolveVisibleOwnerId = (nodeId: string): string => {
    let currentId = nodeId;
    const visited = new Set<string>();
    while (hiddenNodeToVisibleParentId.has(currentId) && !visited.has(currentId)) {
      visited.add(currentId);
      currentId = hiddenNodeToVisibleParentId.get(currentId)!;
    }
    return currentId;
  };

  const circuitCanvasByVisibleOwnerId = new Map<string, Node>();
  circuitCanvasByParentId.forEach((node, parentId) => {
    circuitCanvasByVisibleOwnerId.set(resolveVisibleOwnerId(parentId), node);
  });

  const circuitCompanionByVisibleOwnerId = new Map<string, Node>();
  circuitCompanionByOwnerId.forEach((node, parentId) => {
    circuitCompanionByVisibleOwnerId.set(resolveVisibleOwnerId(parentId), node);
  });

  return nodes.reduce<Node[]>((result, node) => {
    if (hiddenNodeToVisibleParentId.has(node.id)) {
      return result;
    }

    const responseNode = responseByQueryId.get(node.id);
    const circuitCanvasNode = circuitCanvasByVisibleOwnerId.get(node.id);
    const circuitCompanionNode = circuitCompanionByVisibleOwnerId.get(node.id);
    const parentId = getNodeParentId(node);
    const visibleParentId = parentId && hiddenNodeToVisibleParentId.has(parentId)
      ? hiddenNodeToVisibleParentId.get(parentId)!
      : parentId;

    if (responseNode || circuitCanvasNode || circuitCompanionNode) {
      result.push({
        ...node,
        data: {
          ...node.data,
          parentId: visibleParentId,
          ...(responseNode ? {
            qaAnswerNodeId: responseNode.id,
            qaAnswerText: responseNode.data?.text,
            qaAnswerTitle: responseNode.data?.title,
            qaAnswerOriginalType: responseNode.type,
            followUps: responseNode.data?.followUps || node.data?.followUps,
            isGenerated: responseNode.data?.isGenerated ?? node.data?.isGenerated,
            process: responseNode.data?.process || node.data?.process,
            allowFollowup: true,
            updatedAt: responseNode.data?.updatedAt || node.data?.updatedAt,
          } : {}),
          ...(circuitCanvasNode ? {
            circuitCanvasNodeId: circuitCanvasNode.id,
            circuitDesign: circuitCanvasNode.data?.circuitDesign || node.data?.circuitDesign,
            circuitCanvasText: circuitCanvasNode.data?.text,
            circuitCanvasTitle: circuitCanvasNode.data?.title,
            circuitCanvasOriginalType: circuitCanvasNode.type,
            followUps: circuitCanvasNode.data?.followUps || node.data?.followUps,
            isGenerated: circuitCanvasNode.data?.isGenerated ?? node.data?.isGenerated,
            process: circuitCanvasNode.data?.process || node.data?.process,
            allowFollowup: true,
            updatedAt: circuitCanvasNode.data?.updatedAt || node.data?.updatedAt,
          } : {}),
          ...(circuitCompanionNode ? {
            circuitAnalyzeNodeId: circuitCompanionNode.id,
            circuitAnalyzeText: circuitCompanionNode.data?.text,
            circuitAnalyzeTitle: circuitCompanionNode.data?.title,
            circuitAnalyzeOriginalType: circuitCompanionNode.type,
            followUps: circuitCompanionNode.data?.followUps || node.data?.followUps,
            allowFollowup: true,
            updatedAt: circuitCompanionNode.data?.updatedAt || node.data?.updatedAt,
          } : {}),
        },
      });
      return result;
    }

    result.push({
      ...node,
      data: {
        ...node.data,
        parentId: visibleParentId,
      },
    });
    return result;
  }, []);
};

export const buildPresentedFlowEdges = (nodes: Node[]): Edge[] => {
  const visibleNodeIds = new Set(nodes.map(node => node.id));
  return nodes
    .filter(node => {
      const parentId = getNodeParentId(node);
      return Boolean(parentId && visibleNodeIds.has(parentId));
    })
    .map(node => {
      const parentId = getNodeParentId(node)!;
      return {
        id: `e${parentId}-${node.id}`,
        source: parentId,
        target: node.id,
        type: 'smoothstep',
      };
    });
};
