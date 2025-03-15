import ELK from 'elkjs/lib/elk-api';
import type { ElkNode, ElkExtendedEdge } from 'elkjs';
import { Node, Edge } from '@xyflow/react';
import { NODE_WIDTH, ROOT_NODE_WIDTH } from '../constants';
import { calculateNodeHeight } from './calculateNodeHeight';
import { NodeType } from '@/api/types/flow.types';
import { NodeData } from '../components/node/types/node.types';
import { updateNodesPosition } from '@/api/methods/flow.methods';
import type { nodeToUpdate } from '@/api/types/flow.types';

const elk = new ELK({
  workerUrl: '/node_modules/elkjs/lib/elk-worker.min.js'
});

export async function layoutNodes(nodes: Node[], edges: Edge[], shouldUpdateServer: boolean = false): Promise<Node[]> {
  console.log('进入layoutNodes');
  try {
    // 准备ELK节点
    const elkNodes = nodes.map(node => {
      const width = node.type !== 'root' ? NODE_WIDTH : ROOT_NODE_WIDTH;
      const height = calculateNodeHeight(node as Node<NodeData<NodeType>>);
      return {
        id: node.id,
        x: node.position.x,
        y: node.position.y,
        width: width,
        height: height,
        layoutOptions: {
          'org.eclipse.elk.portLabels.placement': '[OUTSIDE]',
          'org.eclipse.elk.nodeSize.constraints': '[MINIMUM_SIZE]',
          //'org.eclipse.elk.mrtree.positionConstraint': '1',
          'org.eclipse.elk.nodeLabels.placement': '[]',
          'org.eclipse.elk.nodeSize.options': '[DEFAULT_MINIMUM_SIZE]',
          //'org.eclipse.elk.mrtree.treeLevel': '0',
          'org.eclipse.elk.margins': '[top=0.0,left=0.0,bottom=0.0,right=0.0]',
          'org.eclipse.elk.nodeSize.minimum': `(${width},${height})`,
          //'org.eclipse.elk.padding': '[top=20.0,left=20.0,bottom=20.0,right=20.0]'
        }
      };
    });
    // 准备ELK边
    const elkEdges = edges.map(edge => ({
      id: edge.id,
      sources: [edge.source],
      targets: [edge.target]
    })) as ElkExtendedEdge[];
    // 准备ELK图
    const graph = {
      id: "root",
      layoutOptions: {
        "elk.interactiveLayout": "true",
        "elk.direction": "DOWN",
        "elk.algorithm": "mrtree",
        //"elk.childAreaHeight": "140.0",
        //"elk.padding": "[top=20.0,left=20.0,bottom=20.0,right=20.0]",
        "elk.nodeSize.constraints": "[]",
        "elk.interactive": "true",
        //"elk.spacing.portsSurrounding": "[top=0.0,left=0.0,bottom=0.0,right=0.0]",
        //"elk.childAreaWidth": "50.0",
        "elk.spacing.nodeNode": "40.0",
        //"elk.mrtree.weighting": "CONSTRAINT",
        "elk.mrtree.edgeRoutingMode": "AVOID_OVERLAP",
        //"elk.resolvedAlgorithm": "Layout Algorithm: org.eclipse.elk.mrtree",
        //"elk.hierarchyHandling": "SEPARATE_CHILDREN",
        //"elk.nodeLabels.padding": "[top=5.0,left=5.0,bottom=5.0,right=5.0]"
      },
      children: elkNodes,
      edges: elkEdges
    };
    const result = await elk.layout(graph);
    if (!result.children) {
      return nodes;
    }

    const nodesToUpdate: nodeToUpdate[] = [];

    const layoutedNodes = result.children.map((layoutedNode: ElkNode) => {
      const originalNode = nodes.find(n => n.id === layoutedNode.id);
      if (!originalNode) return null;

      // 取整数
      const newPosition = { x: Math.round(layoutedNode.x || 0), y: Math.round(layoutedNode.y || 0) };
      
      // 如果需要更新服务器且位置发生变化
      if (shouldUpdateServer && 
          (originalNode.position.x !== newPosition.x || 
           originalNode.position.y !== newPosition.y)) {
        const nodeToUpdate: nodeToUpdate = {
          id: parseInt(layoutedNode.id),
          position: newPosition
        };
        nodesToUpdate.push(nodeToUpdate);
      }
      
      return {
        ...originalNode,
        position: newPosition,
      } as Node;
    }).filter((node: Node | null): node is Node => node !== null);

    if (nodesToUpdate.length > 0) {
      try {
        updateNodesPosition(nodesToUpdate).send();
      } catch {
        console.error('Failed to update nodes position');
      }
    }

    return layoutedNodes;
  } catch (error) {
    console.error('Layout calculation failed:', error);
    return nodes;
  }
} 