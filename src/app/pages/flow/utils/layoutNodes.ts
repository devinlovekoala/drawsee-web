import ELK from 'elkjs/lib/elk-api';
import type { ElkNode, ElkExtendedEdge } from 'elkjs';
import { Node, Edge } from '@xyflow/react';
import { NODE_WIDTH, ROOT_NODE_WIDTH, TEMP_QUERY_NODE_HEIGHT, TEMP_QUERY_NODE_ID_PREFIX } from '../constants';
import { calculateNodeHeight } from './calculateNodeHeight';
import { NodeType } from '@/api/types/flow.types';
import { NodeData } from '../components/node/types/node.types';
import { updateNodesPositionAndHeight } from '@/api/methods/flow.methods';
import type { NodeToUpdate } from '@/api/types/flow.types';
import dagre from '@dagrejs/dagre';
import { flextree } from 'd3-flextree';
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
      const width = node.type !== 'root' ? NODE_WIDTH : ROOT_NODE_WIDTH;
      
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
        (node.data as any).height = height;
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
      const width = node.type !== 'root' ? NODE_WIDTH : ROOT_NODE_WIDTH;
      
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
        (node.data as any).height = height;
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

/**
 * 使用d3-flextree布局算法
 * 该算法支持变量节点大小的树布局
 * @param nodes 节点列表
 * @param edges 边列表
 * @param shouldUpdateServer 是否需要更新服务器
 * @returns 布局后的节点和边
 */
export function flexTreeLayout(nodes: Node[], edges: Edge[], shouldUpdateServer: boolean = false): { nodes: Node[], edges: Edge[] } {
  // 记录开始时间
  const startTime = performance.now();
  
  try {
    if (nodes.length === 0) {
      return { nodes, edges };
    }

    // 性能统计
    let heightCalculationTime = 0;
    let cachedHeightCount = 0;

    // 创建节点ID到节点的映射
    const nodeMap = new Map<string, Node>();
    nodes.forEach(node => {
      nodeMap.set(node.id, node);
    });

    // 创建父子关系映射
    const childrenMap = new Map<string, string[]>();
    edges.forEach(edge => {
      const parentId = edge.source;
      const childId = edge.target;
      
      if (!childrenMap.has(parentId)) {
        childrenMap.set(parentId, []);
      }
      childrenMap.get(parentId)?.push(childId);
    });

    // 找到根节点
    const rootNode = nodes.find(node => node.type === 'root') || nodes[0];
    
    // 准备节点尺寸
    const nodesWithDimensions = nodes.map((node) => {
      const width = node.type !== 'root' ? NODE_WIDTH : ROOT_NODE_WIDTH;
      
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
        (node.data as any).height = height;
      }
      
      return {
        ...node,
        width,
        height
      };
    });
    
    // 创建节点尺寸映射
    const nodeSizeMap = new Map<string, [number, number]>();
    nodesWithDimensions.forEach(node => {
      nodeSizeMap.set(node.id, [node.width, node.height]);
    });

    // 创建flextree布局
    const layout = flextree({
      nodeSize: (node: any) => {
        const id = node.data.id;
        return nodeSizeMap.get(id) || [100, 50];
      },
      spacing: 400 // 节点间距
    });

    // 构建层次结构
    const buildHierarchy = (nodeId: string): any => {
      const node = nodeMap.get(nodeId);
      if (!node) return null;
      
      const children = childrenMap.get(nodeId) || [];
      return {
        id: nodeId,
        children: children.map(childId => buildHierarchy(childId)).filter(Boolean)
      };
    };

    // 从根节点开始构建层次结构
    const hierarchyData = buildHierarchy(rootNode.id);
    
    // 创建层次结构
    const root = layout.hierarchy(hierarchyData);
    
    // 计算布局
    layout(root);
    
    // 应用布局结果到节点
    const nodesToUpdate: NodeToUpdate[] = [];
    const newNodes = nodes.map(node => {
      // 在层次结构中查找对应节点
      const findNode = (n: any): any => {
        if (n.data.id === node.id) return n;
        if (!n.children) return null;
        for (const child of n.children) {
          const found = findNode(child);
          if (found) return found;
        }
        return null;
      };
      
      const hierarchyNode = findNode(root);
      if (!hierarchyNode) return node;
      
      // 应用新位置
      const newNode = {
        ...node,
        position: {
          x: hierarchyNode.x,
          y: hierarchyNode.y
        }
      };
      
      // 如果需要更新服务器且位置发生变化
      if (
        shouldUpdateServer && 
        (node.position.x !== newNode.position.x || node.position.y !== newNode.position.y)
      ) {
        // 获取节点高度
        const nodeWithDimensions = nodesWithDimensions.find(n => n.id === node.id);
        const height = node.data.height as number || 
                      (nodeWithDimensions ? nodeWithDimensions.height : calculateNodeHeight(node as Node<NodeData<NodeType>>));
        
        nodesToUpdate.push({
          id: parseInt(node.id),
          position: newNode.position,
          height: height
        });
      }
      
      return newNode;
    });

    // 更新服务器
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
    console.error('flexTreeLayout error', error);
    return { nodes, edges };
  }
}

export function entitreeFlexLayout(nodes: Node[], edges: Edge[], shouldUpdateServer: boolean = false, resetHeight: boolean = false): { nodes: Node[], edges: Edge[] } {
  // 记录开始时间
  const startTime = performance.now();
  
  try {
    console.log('entitreeFlexLayout', nodes.length, edges.length);
    
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
    
    // 性能统计
    let heightCalculationTime = 0;
    let cachedHeightCount = 0;
    
    nodes.forEach(node => {
      const width = node.type !== 'root' ? NODE_WIDTH : ROOT_NODE_WIDTH;
      let height: number;
      
      // 获得节点高度
      if (node.id.startsWith(TEMP_QUERY_NODE_ID_PREFIX)) {
        height = TEMP_QUERY_NODE_HEIGHT;
      } else if (!resetHeight && node.data.height !== undefined) {
        height = node.data.height as number;
        cachedHeightCount++;
      } else {
        // 如果没有缓存高度，则计算高度
        const calcStartTime = performance.now();
        height = calculateNodeHeight(node as Node<NodeData<NodeType>>);
        const calcEndTime = performance.now();
        heightCalculationTime += (calcEndTime - calcStartTime);
        console.log(`${node.type}节点进行calculateNodeHeight，结果：${height}，用时: ${calcEndTime - calcStartTime}毫秒`);
        
        // 将没有高度信息的节点添加到需要更新的列表中
        if (!node.id.startsWith(TEMP_QUERY_NODE_ID_PREFIX)) {
          nodesToUpdate.push({
            id: parseInt(node.id),
            position: node.position,
            height
          });
        }
        
        // 更新节点的高度信息（用于后续渲染）
        (node.data as any).height = height;
      }
      
      flatTree[node.id] = {
        width,
        height,
        children: childrenMap[node.id] || [],
        parents: node.data.parentId ? [node.data.parentId.toString()] : []
      };
    });
    
    const settings = {
      clone: false, // 如果您的应用程序不允许编辑原始对象，则返回输入的副本
      enableFlex: true, // 如果关闭，性能略好（不会读取node.width，node.height）
      firstDegreeSpacing: 60, // 节点之间的间距（像素），属于同一源的节点，例如具有相同父节点的子节点
      nextAfterAccessor: "spouses", // 用于在当前节点之后侧向移动的侧节点属性
      nextAfterSpacing: 10, // 当前节点之后的"侧"节点的间距
      nextBeforeAccessor: "siblings", // 用于在当前节点之前侧向移动的侧节点属性
      nextBeforeSpacing: 10, // 当前节点之前的"侧"节点的间距
      nodeHeight: 40, // 默认节点高度（像素）
      nodeWidth: 40, // 默认节点宽度（像素）
      orientation: "vertical", // "垂直"以查看顶部的父节点和底部的子节点，"水平"以查看左侧的父节点和
      rootX: 0, // 如果不是0，设置根节点的位置
      rootY: 0, // 如果不是0，设置根节点的位置
      secondDegreeSpacing: 20, // 节点之间的间距（像素），不属于同一父节点的节点，例如"cousin"节点
      sourcesAccessor: "parents", // 用作祖先ID数组的属性
      sourceTargetSpacing: 100, // 在垂直方向上节点之间的间距（垂直方向），否则在水平方向
      targetsAccessor: "children", // 用作子节点ID数组的属性
    } as Partial<Settings>;
    
    const {map: layoutedTreeMap} = layoutFromMap(rootId, flatTree, settings);
    
    // 应用布局结果到节点
    const layoutedNodes = Object.entries(layoutedTreeMap).map(([id, node]) => {
      const originalNode = nodes.find(n => n.id === id);
      if (!originalNode) return null;
      
      // 检查位置是否发生变化
      if (
        shouldUpdateServer && 
        (originalNode.position.x !== node.x || originalNode.position.y !== node.y)
      ) {
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
      
      return {
        ...originalNode,
        position: { x: node.x, y: node.y }
      } as Node;
    }).filter((node: Node | null): node is Node => node !== null);
    
    // 输出性能统计
    const endTime = performance.now();
    const totalTime = endTime - startTime;
    console.log(`布局计算总耗时: ${totalTime.toFixed(2)}ms`);
    console.log(`高度计算耗时: ${heightCalculationTime.toFixed(2)}ms (${(heightCalculationTime / totalTime * 100).toFixed(2)}%)`);
    console.log(`使用缓存高度的节点数: ${cachedHeightCount}/${nodes.length} (${(cachedHeightCount / nodes.length * 100).toFixed(2)}%)`);
    
    // 更新服务器
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
