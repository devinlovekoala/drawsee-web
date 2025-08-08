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
    // 准备ELK图 - 实现极紧凑布局以最大化空间利用率
    const graph = {
      id: "root",
      layoutOptions: {
        "elk.interactiveLayout": "true",
        "elk.direction": "RIGHT", // 从DOWN改为RIGHT，实现横向布局
        "elk.algorithm": "mrtree",
        "elk.nodeSize.constraints": "[]",
        "elk.interactive": "true",
        "elk.spacing.nodeNode": "15.0", // 同级节点间距（从25进一步减少到15，更紧凑）
        "elk.layered.spacing.nodeNodeBetweenLayers": "50.0", // 层级间距（从80大幅减少到50，显著压缩连接线）
        "elk.mrtree.edgeRoutingMode": "AVOID_OVERLAP",
        "elk.spacing.portPort": "4.0", // 端口间距（从6减少到4）
        "elk.margins": "8.0", // 图的边距（从10减少到8，进一步节省空间）
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
dagreGraph.setGraph({ 
  rankdir: 'LR', // 从TB（Top-Bottom）改为LR（Left-Right）
  nodesep: 15,   // 同一层级节点间的垂直间距（从25进一步减少到15，极致紧凑）
  ranksep: 50,   // 不同层级间的水平间距（从80大幅减少到50，显著压缩连接线长度）
  marginx: 8,    // 图的左右边距（从10减少到8）
  marginy: 8     // 图的上下边距（从10减少到8）
});

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

export function entitreeFlexLayout(nodes: Node[], edges: Edge[], shouldUpdateServer: boolean = false, resetHeight: boolean = false): { nodes: Node[], edges: Edge[] } {
  try {
    if (nodes.length === 0) {
      return { nodes, edges };
    }
    
    // 性能优化：添加时间戳用于性能监控
    const startTime = performance.now();
    
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
    
    // 性能优化：全局高度缓存，避免重复计算相同类型节点的高度
    const globalHeightCache = new Map<string, number>();
    
    // 性能优化：批量处理节点高度计算
    let heightCalculationCount = 0;
    let cacheHitCount = 0;
    
    nodes.forEach(node => {
      const width = node.type !== 'root' ? NODE_WIDTH : ROOT_NODE_SIZE;
      let height: number;
      
      // 性能优化：优先使用缓存的高度
      const textLength = (node.data.text && typeof node.data.text === 'string') ? node.data.text.length : 0;
      const cacheKey = `${node.type}-${textLength}`;
      
      if (node.id.startsWith(TEMP_QUERY_NODE_ID_PREFIX)) {
        height = TEMP_QUERY_NODE_HEIGHT;
      } else if (node.type === 'root') {
        height = ROOT_NODE_SIZE;
      } else if (!resetHeight && node.data.height !== undefined) {
        // 使用已缓存的高度
        height = node.data.height as number;
        cacheHitCount++;
      } else if (!resetHeight && globalHeightCache.has(cacheKey)) {
        // 使用全局缓存的高度（相同类型和文本长度的节点）
        height = globalHeightCache.get(cacheKey)!;
        cacheHitCount++;
      } else {
        // 需要计算高度
        height = calculateNodeHeight(node as Node<NodeData<NodeType>>, NODE_WIDTH);
        heightCalculationCount++;
        
        // 缓存计算结果
        globalHeightCache.set(cacheKey, height);
        
        // 将没有高度信息的节点添加到需要更新的列表中
        if (!node.id.startsWith(TEMP_QUERY_NODE_ID_PREFIX) && shouldUpdateServer) {
          nodesToUpdate.push({
            id: parseInt(node.id),
            position: node.position,
            height
          });
        }
      }
      
      // 更新节点的高度信息（用于后续渲染）
      node.data.height = height;
      
      flatTree[node.id] = {
        width,
        height,
        children: childrenMap[node.id] || [],
        parents: node.data.parentId ? [node.data.parentId.toString()] : []
      };
    });
    
    // 极度紧凑布局设置 - 大幅压缩所有间距参数
    const settings = {
      clone: false,
      enableFlex: true,
      // 横向布局的节点间距设置 - 极致紧凑布局
      firstDegreeSpacing: 15, // 相同父节点的子节点垂直间距（从25大幅减少到15）
      nextAfterSpacing: 2,    // 相邻节点间距（从4减少到2，几乎贴合）
      nextBeforeSpacing: 2,   // 相邻节点间距（从4减少到2，几乎贴合）
      nodeHeight: 40,
      nodeWidth: 40,
      orientation: "horizontal", // 关键改变：从vertical改为horizontal
      rootX: 0,
      rootY: 0,
      secondDegreeSpacing: 8, // 不同父节点的节点垂直间距（从12进一步减少到8）
      sourcesAccessor: "parents",
      // 父子节点之间的水平间距（横向布局的核心参数）- 极致压缩，相对于900px节点宽度这是很小的间距
      sourceTargetSpacing: 50, // 从80大幅减少到50，让连接线变得很短
      targetsAccessor: "children",
    } as Partial<Settings>;
    
    const {map: layoutedTreeMap} = layoutFromMap(rootId, flatTree, settings);
    
    // 应用布局结果到节点
    const layoutedNodes = Object.entries(layoutedTreeMap).map(([id, node]) => {
      const originalNode = nodes.find(n => n.id === id);
      if (!originalNode) return null;
      
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
    
    // 性能统计输出
    const endTime = performance.now();
    const totalTime = endTime - startTime;
    console.log(`entitreeFlexLayout 性能统计:`);
    console.log(`- 总耗时: ${totalTime.toFixed(2)}ms`);
    console.log(`- 节点总数: ${nodes.length}`);
    console.log(`- 高度计算次数: ${heightCalculationCount}`);
    console.log(`- 缓存命中次数: ${cacheHitCount}`);
    console.log(`- 缓存命中率: ${nodes.length > 0 ? ((cacheHitCount / nodes.length) * 100).toFixed(1) : 0}%`);
    
    return { nodes: layoutedNodes, edges };
  } catch (error) {
    console.error('entitreeFlexLayout error', error);
    return { nodes, edges };
  }
}
