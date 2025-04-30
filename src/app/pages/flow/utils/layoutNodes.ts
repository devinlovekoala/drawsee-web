import ELK from 'elkjs/lib/elk-api';
import type { ElkNode, ElkExtendedEdge } from 'elkjs';
import { Node, Edge } from '@xyflow/react';
import { NODE_WIDTH, ROOT_NODE_SIZE, TEMP_QUERY_NODE_HEIGHT, TEMP_QUERY_NODE_ID_PREFIX } from '../constants';
import { calculateNodeHeight } from './calculateNodeHeight';
import { NodeType } from '@/api/types/flow.types';
import { NodeData } from '../components/node/types/node.types';
import { updateNodesPositionAndHeight } from '@/api/methods/flow.methods';
import type { NodeToUpdate } from '@/api/types/flow.types';
import dagre from '@dagrejs/dagre';
import { layoutFromMap } from "entitree-flex"
import { Settings } from 'entitree-flex/dist/Settings';

const elk = new ELK({
  workerUrl: '/node_modules/elkjs/lib/elk-worker.min.js'
});

export async function mrtreeLayout(nodes: Node[], edges: Edge[], shouldUpdateServer: boolean = false): Promise<Node[]> {
  console.log('进入layoutNodes');
  // 记录开始时间
  const startTime = performance.now();
  
  try {
    // 性能统计
    let heightCalculationTime = 0;
    let cachedHeightCount = 0;
    
    // 准备ELK节点
    const elkNodes = nodes.map(node => {
      const width = node.type !== 'root' ? NODE_WIDTH : ROOT_NODE_SIZE;
      
      let height: number;
      // 获取节点高度
      if (node.id.startsWith(TEMP_QUERY_NODE_ID_PREFIX)) {
        height = TEMP_QUERY_NODE_HEIGHT;
      } else if (node.data.height !== undefined) {
        height = node.data.height as number;
        cachedHeightCount++;
      } else {
        // 计算节点高度
        const calcStartTime = performance.now();
        height = calculateNodeHeight(node as Node<NodeData<NodeType>>);
        const calcEndTime = performance.now();
        heightCalculationTime += (calcEndTime - calcStartTime);
        console.log(`${node.type}节点进行calculateNodeHeight，结果：${height}，用时: ${calcEndTime - calcStartTime}毫秒`);
        
        // 更新节点的高度信息
        (node.data as NodeData<NodeType>).height = height;
      }
      
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

    const nodesToUpdate: NodeToUpdate[] = [];

    const layoutedNodes = result.children.map((layoutedNode: ElkNode) => {
      const originalNode = nodes.find(n => n.id === layoutedNode.id);
      if (!originalNode) return null;

      // 取整数
      const newPosition = { x: Math.round(layoutedNode.x || 0), y: Math.round(layoutedNode.y || 0) };
      
      // 如果需要更新服务器且位置发生变化
      if (shouldUpdateServer && 
          (originalNode.position.x !== newPosition.x || 
           originalNode.position.y !== newPosition.y)) {
        // 获取节点高度
        const height = originalNode.data.height as number || 
                      calculateNodeHeight(originalNode as Node<NodeData<NodeType>>);
        
        const nodeToUpdate: NodeToUpdate = {
          id: parseInt(layoutedNode.id),
          position: newPosition,
          height: height
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
        updateNodesPositionAndHeight(nodesToUpdate).send()
          .then(() => {
            console.log('节点位置和高度更新成功');
          })
          .catch(error => {
            console.error('节点位置和高度更新失败', error);
          });
      } catch (error) {
        console.error('Failed to update nodes position', error);
      }
    }
    
    // 输出性能统计
    const endTime = performance.now();
    const totalTime = endTime - startTime;
    console.log(`布局计算总耗时: ${totalTime.toFixed(2)}ms`);
    console.log(`高度计算耗时: ${heightCalculationTime.toFixed(2)}ms (${(heightCalculationTime / totalTime * 100).toFixed(2)}%)`);
    console.log(`使用缓存高度的节点数: ${cachedHeightCount}/${nodes.length} (${(cachedHeightCount / nodes.length * 100).toFixed(2)}%)`);

    return layoutedNodes;
  } catch (error) {
    console.error('Layout calculation failed:', error);
    return nodes;
  }
}

const dagreGraph = new dagre.graphlib.Graph().setDefaultEdgeLabel(() => ({}));
dagreGraph.setGraph({ rankdir: 'TB' });

export function dagreLayout(nodes: Node[], edges: Edge[], shouldUpdateServer: boolean = false): { nodes: Node[], edges: Edge[] } {
  // 记录开始时间
  const startTime = performance.now();
  
  try {
    // 性能统计
    let heightCalculationTime = 0;
    let cachedHeightCount = 0;
    
    const nodesWithDimensions = nodes.map((node) => {
      const width = node.type !== 'root' ? NODE_WIDTH : ROOT_NODE_SIZE;
      
      let height: number;
      // 获取节点高度
      if (node.id.startsWith(TEMP_QUERY_NODE_ID_PREFIX)) {
        height = TEMP_QUERY_NODE_HEIGHT;
      } else if (node.data.height !== undefined) {
        height = node.data.height as number;
        cachedHeightCount++;
      } else {
        // 计算节点高度
        const calcStartTime = performance.now();
        height = calculateNodeHeight(node as Node<NodeData<NodeType>>);
        const calcEndTime = performance.now();
        heightCalculationTime += (calcEndTime - calcStartTime);
        console.log(`${node.type}节点进行calculateNodeHeight，结果：${height}，用时: ${calcEndTime - calcStartTime}毫秒`);
        
        // 更新节点的高度信息
        (node.data as NodeData<NodeType>).height = height;
      }
      
      return {
        ...node,
        width,
        height
      };
    });
    
    nodesWithDimensions.forEach((node) => {
      dagreGraph.setNode(node.id, { width: node.width, height: node.height });
    });
    
    edges.forEach((edge) => {
      dagreGraph.setEdge(edge.source, edge.target);
    });
    
    dagre.layout(dagreGraph);

    const nodesToUpdate: NodeToUpdate[] = [];
    const newNodes = nodes.map((node) => {
      const nodeWithPosition = dagreGraph.node(node.id);
      const nodeWithDimensions = nodesWithDimensions.find((n) => n.id === node.id);
      if (!nodeWithDimensions) return node;
      const newNode = {
        ...node,
        position: {
          x: nodeWithPosition.x - nodeWithDimensions.width / 2,
          y: nodeWithPosition.y - nodeWithDimensions.height / 2,
        },
      };
      if (
        shouldUpdateServer && 
        (node.position.x !== newNode.position.x || node.position.y !== newNode.position.y)
      ) {
        // 获取节点高度
        const height = node.data.height as number || nodeWithDimensions.height;
        
        nodesToUpdate.push({
          id: parseInt(node.id),
          position: newNode.position,
          height: height
        });
      }
      return newNode;
    });

    if (nodesToUpdate.length > 0) {
      try {
        updateNodesPositionAndHeight(nodesToUpdate).send()
          .then(() => {
            console.log('节点位置和高度更新成功');
          })
          .catch(error => {
            console.error('节点位置和高度更新失败', error);
          });
      } catch (error) {
        console.error('Failed to update nodes position', error);
      }
    }
    
    // 输出性能统计
    const endTime = performance.now();
    const totalTime = endTime - startTime;
    console.log(`布局计算总耗时: ${totalTime.toFixed(2)}ms`);
    console.log(`高度计算耗时: ${heightCalculationTime.toFixed(2)}ms (${(heightCalculationTime / totalTime * 100).toFixed(2)}%)`);
    console.log(`使用缓存高度的节点数: ${cachedHeightCount}/${nodes.length} (${(cachedHeightCount / nodes.length * 100).toFixed(2)}%)`);
    
    return { nodes: newNodes, edges };
  } catch (error) {
    console.error('dagreLayout error', error);
    return { nodes, edges };
  }
}

export function entitreeFlexLayout(nodes: Node[], edges: Edge[], nodeWidth: number, shouldUpdateServer: boolean = false, resetHeight: boolean = false): { nodes: Node[], edges: Edge[] } {
  try {
    if (nodes.length === 0) {
      return { nodes, edges };
    }
    
    const rootId = nodes.find(node => node.type === 'root')?.id || nodes[0].id;
    
    const childrenMap: Record<string, string[]> = {};
    edges.forEach(edge => {
      const parentId = edge.source;
      const childId = edge.target;
      if (!childrenMap[parentId]) {
        childrenMap[parentId] = [];
      }
      childrenMap[parentId].push(childId);
    });
    
    // 收集需要更新的节点（位置变化或缺少高度信息的节点）
    const nodesToUpdate: NodeToUpdate[] = [];
    
    // 构建扁平树结构
    const flatTree = {} as Record<string, { width: number, height: number, children: string[], parents: string[] }>;
    
    // 保存节点类型和高度的映射，确保相同类型的节点高度一致性
    const nodeTypeHeightMap: Record<string, number> = {};
    
    // 保存特殊类型节点的ID和高度，避免重复计算导致高度变化
    const specialNodeHeights: Record<string, number> = {};
    
    nodes.forEach(node => {
      const width = node.type !== 'root' ? nodeWidth : ROOT_NODE_SIZE;
      let height: number;
      
      // 特殊处理特定类型节点以保持其高度稳定
      if (node.type === 'circuit-point' || node.type === 'answer-point' || node.type === 'ANSWER_POINT' || 
          node.type === 'knowledge-head') {
        // 如果是这些特殊类型节点，尽量保持其高度稳定
        if (specialNodeHeights[node.id] !== undefined) {
          // 如果已经在本次布局中计算过，使用缓存值
          height = specialNodeHeights[node.id];
        } else if (node.data.height !== undefined && !resetHeight) {
          // 如果节点有高度且不需要重置，使用已有高度
          height = node.data.height as number;
          specialNodeHeights[node.id] = height;
        } else if (nodeTypeHeightMap[node.type] !== undefined) {
          // 如果相同类型已经计算过，使用相同类型的高度
          height = nodeTypeHeightMap[node.type];
          specialNodeHeights[node.id] = height;
        } else {
          // 如果都没有，则计算高度并缓存
          height = calculateNodeHeight(node as Node<NodeData<NodeType>>, nodeWidth);
          nodeTypeHeightMap[node.type] = height;
          specialNodeHeights[node.id] = height;
        }
        // 更新节点数据中的高度信息
        node.data.height = height;
      }
      // 获得节点高度
      else if (node.id.startsWith(TEMP_QUERY_NODE_ID_PREFIX)) {
        height = TEMP_QUERY_NODE_HEIGHT;
      } else if (node.type === 'root') {
        height = ROOT_NODE_SIZE;
      } else if (!resetHeight && node.data.height !== undefined) {
        height = node.data.height as number;
      } else {
        // 如果没有缓存高度或需要重置高度，则计算高度
        height = calculateNodeHeight(node as Node<NodeData<NodeType>>, nodeWidth);
        
        // 将没有高度信息的节点添加到需要更新的列表中
        if (!node.id.startsWith(TEMP_QUERY_NODE_ID_PREFIX) && shouldUpdateServer) {
          nodesToUpdate.push({
            id: parseInt(node.id),
            position: node.position,
            height
          });
        }
        
        // 更新节点的高度信息（用于后续渲染）
        node.data.height = height;
      }
      
      flatTree[node.id] = {
        width,
        height,
        children: childrenMap[node.id] || [],
        parents: node.data.parentId ? [node.data.parentId.toString()] : []
      };
    });
    
    // 优化布局设置参数，使布局更加稳定
    const settings = {
      clone: false,
      enableFlex: true,
      // 调整节点间距，使布局更加紧凑但不拥挤
      firstDegreeSpacing: 75, // 相同父节点的子节点间距
      nextAfterSpacing: 10,
      nextBeforeSpacing: 10,
      nodeHeight: 40,
      nodeWidth: 40,
      orientation: "vertical",
      rootX: 0,
      rootY: 0,
      secondDegreeSpacing: 20, // 不同父节点的节点间距
      sourcesAccessor: "parents",
      // 增加父子节点之间的垂直间距，避免节点重叠
      sourceTargetSpacing: 120,
      targetsAccessor: "children",
    } as Partial<Settings>;
    
    const {map: layoutedTreeMap} = layoutFromMap(rootId, flatTree, settings);
    
    // 应用布局结果到节点，并保持特殊节点的高度不变
    const layoutedNodes = Object.entries(layoutedTreeMap).map(([id, node]) => {
      const originalNode = nodes.find(n => n.id === id);
      if (!originalNode) return null;
      
      // 对于特殊类型节点，确保其高度保持不变
      if (specialNodeHeights[id] !== undefined) {
        originalNode.data.height = specialNodeHeights[id];
      }
      
      // 检查位置是否发生变化
      const positionChanged = 
        originalNode.position.x !== node.x || 
        originalNode.position.y !== node.y;
      
      if (shouldUpdateServer && positionChanged) {
        // 查找节点是否已在更新列表中
        const existingNodeIndex = nodesToUpdate.findIndex(n => n.id === parseInt(id));
        
        if (existingNodeIndex !== -1) {
          // 更新已有节点的位置信息
          nodesToUpdate[existingNodeIndex].position = { x: node.x, y: node.y };
        } else {
          // 添加新的需要更新的节点
          // 确保height不为null
          const nodeHeight = typeof originalNode.data.height === 'number' 
            ? originalNode.data.height 
            : calculateNodeHeight(originalNode as Node<NodeData<NodeType>>);
            
          if (!id.startsWith(TEMP_QUERY_NODE_ID_PREFIX)) {
            nodesToUpdate.push({
              id: parseInt(id),
              position: { x: node.x, y: node.y },
              height: nodeHeight
            });
          }
        }
      }
      
      // 返回布局后的节点
      return {
        ...originalNode,
        position: { x: node.x, y: node.y }
      } as Node;
    }).filter((node: Node | null): node is Node => node !== null);
    
    // 更新服务器 - 仅当要求且有节点需要更新时才执行
    if (shouldUpdateServer && nodesToUpdate.length > 0) {
      console.log(`更新服务器节点数: ${nodesToUpdate.length}`);
      updateNodesPositionAndHeight(nodesToUpdate).send()
        .then(() => {
          console.log('节点位置和高度更新成功');
        })
        .catch(error => {
          console.error('节点位置和高度更新失败', error);
        });
    }
    
    return { nodes: layoutedNodes, edges };
  } catch (error) {
    console.error('entitreeFlexLayout error', error);
    return { nodes, edges };
  }
}
