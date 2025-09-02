import { Node, Edge } from 'reactflow';
import { CircuitElementType } from '@/api/types/circuit.types';

/**
 * 专业级电路验证器
 * 提供电路设计验证功能
 */
export class CircuitValidator {
  /**
   * 验证电路设计
   * @param nodes 节点列表
   * @param edges 边列表
   * @returns 错误信息列表
   */
  static validateCircuit(nodes: Node[], edges: Edge[]): string[] {
    const errors: string[] = [];

    // 1. 检查基本连接性
    errors.push(...this.validateConnectivity(nodes, edges));

    // 2. 检查电源完整性
    errors.push(...this.validatePowerSupply(nodes, edges));

    // 3. 检查接地连接
    errors.push(...this.validateGrounding(nodes, edges));

    // 4. 检查元件参数
    errors.push(...this.validateComponentParameters(nodes));

    // 5. 检查电路拓扑
    errors.push(...this.validateCircuitTopology(nodes, edges));

    // 6. 检查短路和开路
    errors.push(...this.validateShortAndOpenCircuits(nodes, edges));

    return errors;
  }

  /**
   * 验证电路连接性
   */
  private static validateConnectivity(nodes: Node[], edges: Edge[]): string[] {
    const errors: string[] = [];
    const connectedNodes = new Set<string>();

    // 收集所有连接的节点
    edges.forEach(edge => {
      connectedNodes.add(edge.source);
      connectedNodes.add(edge.target);
    });

    // 检查是否有孤立的节点
    nodes.forEach(node => {
      if (!connectedNodes.has(node.id)) {
        errors.push(`节点 "${node.data.label || node.id}" 未连接到电路中`);
      }
    });

    // 检查是否有悬空的连接
    edges.forEach(edge => {
      const sourceExists = nodes.some(n => n.id === edge.source);
      const targetExists = nodes.some(n => n.id === edge.target);
      
      if (!sourceExists) {
        errors.push(`连接线连接到不存在的源节点: ${edge.source}`);
      }
      if (!targetExists) {
        errors.push(`连接线连接到不存在的目标节点: ${edge.target}`);
      }
    });

    return errors;
  }

  /**
   * 验证电源完整性
   */
  private static validatePowerSupply(nodes: Node[], edges: Edge[]): string[] {
    const errors: string[] = [];
    const powerSources = nodes.filter(node => 
      node.data.elementType === CircuitElementType.VOLTAGE_SOURCE ||
      node.data.elementType === CircuitElementType.CURRENT_SOURCE
    );

    if (powerSources.length === 0) {
      errors.push('电路中没有电源元件');
    }

    // 检查电源连接
    powerSources.forEach(source => {
      const sourceConnections = edges.filter(edge => 
        edge.source === source.id || edge.target === source.id
      );

      if (sourceConnections.length === 0) {
        errors.push(`电源 "${source.data.label || source.id}" 未连接到电路中`);
      }
    });

    return errors;
  }

  /**
   * 验证接地连接
   */
  private static validateGrounding(nodes: Node[], edges: Edge[]): string[] {
    const errors: string[] = [];
    const grounds = nodes.filter(node => 
      node.data.elementType === CircuitElementType.GROUND
    );

    if (grounds.length === 0) {
      errors.push('电路中没有接地点');
    }

    // 检查接地连接
    grounds.forEach(ground => {
      const groundConnections = edges.filter(edge => 
        edge.source === ground.id || edge.target === ground.id
      );

      if (groundConnections.length === 0) {
        errors.push(`接地点 "${ground.data.label || ground.id}" 未连接到电路中`);
      }
    });

    return errors;
  }

  /**
   * 验证元件参数
   */
  private static validateComponentParameters(nodes: Node[]): string[] {
    const errors: string[] = [];

    nodes.forEach(node => {
      const elementType = node.data.elementType;
      const value = node.data.value;

      // 检查数值是否有效
      if (value && !this.isValidComponentValue(value, elementType)) {
        errors.push(`元件 "${node.data.label || node.id}" 的数值无效: ${value}`);
      }

      // 检查特定元件的参数
      switch (elementType) {
        case CircuitElementType.RESISTOR:
          if (value && parseFloat(value) <= 0) {
            errors.push(`电阻 "${node.data.label || node.id}" 的阻值必须大于0`);
          }
          break;

        case CircuitElementType.CAPACITOR:
          if (value && parseFloat(value) <= 0) {
            errors.push(`电容 "${node.data.label || node.id}" 的容值必须大于0`);
          }
          break;

        case CircuitElementType.INDUCTOR:
          if (value && parseFloat(value) <= 0) {
            errors.push(`电感 "${node.data.label || node.id}" 的感值必须大于0`);
          }
          break;

        case CircuitElementType.VOLTAGE_SOURCE:
          if (value && parseFloat(value) === 0) {
            errors.push(`电压源 "${node.data.label || node.id}" 的电压不能为0`);
          }
          break;

        case CircuitElementType.CURRENT_SOURCE:
          if (value && parseFloat(value) === 0) {
            errors.push(`电流源 "${node.data.label || node.id}" 的电流不能为0`);
          }
          break;
      }
    });

    return errors;
  }

  /**
   * 验证电路拓扑
   */
  private static validateCircuitTopology(nodes: Node[], edges: Edge[]): string[] {
    const errors: string[] = [];

    // 检查是否有环路
    const hasLoop = this.detectLoops(nodes, edges);
    if (hasLoop) {
      errors.push('电路中存在环路，可能导致仿真不稳定');
    }

    // 检查是否有并联短路
    const hasParallelShort = this.detectParallelShorts(nodes, edges);
    if (hasParallelShort) {
      errors.push('电路中存在并联短路');
    }

    return errors;
  }

  /**
   * 验证短路和开路
   */
  private static validateShortAndOpenCircuits(nodes: Node[], edges: Edge[]): string[] {
    const errors: string[] = [];

    // 检查直接短路
    const directShorts = this.detectDirectShorts(edges);
    directShorts.forEach(short => {
      errors.push(`检测到直接短路: ${short.source} 到 ${short.target}`);
    });

    // 检查开路
    const openCircuits = this.detectOpenCircuits(nodes, edges);
    openCircuits.forEach(open => {
      errors.push(`检测到开路: ${open}`);
    });

    return errors;
  }

  /**
   * 检查元件数值是否有效
   */
  private static isValidComponentValue(value: string, elementType: CircuitElementType): boolean {
    // 移除单位，提取数值
    const numericValue = parseFloat(value.replace(/[^\d.-]/g, ''));
    
    if (isNaN(numericValue)) {
      return false;
    }

    // 根据元件类型检查数值范围
    switch (elementType) {
      case CircuitElementType.RESISTOR:
        return numericValue > 0 && numericValue < 1e12; // 0 < R < 1TΩ

      case CircuitElementType.CAPACITOR:
        return numericValue > 0 && numericValue < 1e6; // 0 < C < 1MF

      case CircuitElementType.INDUCTOR:
        return numericValue > 0 && numericValue < 1e6; // 0 < L < 1MH

      case CircuitElementType.VOLTAGE_SOURCE:
        return Math.abs(numericValue) < 1e6; // |V| < 1MV

      case CircuitElementType.CURRENT_SOURCE:
        return Math.abs(numericValue) < 1e6; // |I| < 1MA

      default:
        return true;
    }
  }

  /**
   * 检测环路
   */
  private static detectLoops(nodes: Node[], edges: Edge[]): boolean {
    // 使用深度优先搜索检测环路
    const visited = new Set<string>();
    const recursionStack = new Set<string>();

    const hasCycle = (nodeId: string): boolean => {
      if (recursionStack.has(nodeId)) {
        return true;
      }

      if (visited.has(nodeId)) {
        return false;
      }

      visited.add(nodeId);
      recursionStack.add(nodeId);

      const outgoingEdges = edges.filter(edge => edge.source === nodeId);
      for (const edge of outgoingEdges) {
        if (hasCycle(edge.target)) {
          return true;
        }
      }

      recursionStack.delete(nodeId);
      return false;
    };

    for (const node of nodes) {
      if (!visited.has(node.id)) {
        if (hasCycle(node.id)) {
          return true;
        }
      }
    }

    return false;
  }

  /**
   * 检测并联短路
   */
  private static detectParallelShorts(nodes: Node[], edges: Edge[]): boolean {
    // 检查是否有多个边连接相同的两个节点
    const edgeMap = new Map<string, number>();
    
    edges.forEach(edge => {
      const key = `${edge.source}-${edge.target}`;
      const reverseKey = `${edge.target}-${edge.source}`;
      
      edgeMap.set(key, (edgeMap.get(key) || 0) + 1);
      edgeMap.set(reverseKey, (edgeMap.get(reverseKey) || 0) + 1);
    });

    for (const count of edgeMap.values()) {
      if (count > 1) {
        return true;
      }
    }

    return false;
  }

  /**
   * 检测直接短路
   */
  private static detectDirectShorts(edges: Edge[]): Edge[] {
    const shorts: Edge[] = [];
    
    edges.forEach(edge => {
      if (edge.source === edge.target) {
        shorts.push(edge);
      }
    });

    return shorts;
  }

  /**
   * 检测开路
   */
  private static detectOpenCircuits(nodes: Node[], edges: Edge[]): string[] {
    const opens: string[] = [];
    const connectedNodes = new Set<string>();

    edges.forEach(edge => {
      connectedNodes.add(edge.source);
      connectedNodes.add(edge.target);
    });

    nodes.forEach(node => {
      if (!connectedNodes.has(node.id)) {
        opens.push(node.id);
      }
    });

    return opens;
  }

  /**
   * 验证电路设计是否可以进行仿真
   */
  static canSimulate(nodes: Node[], edges: Edge[]): boolean {
    const errors = this.validateCircuit(nodes, edges);
    
    // 过滤掉非关键错误
    const criticalErrors = errors.filter(error => 
      !error.includes('未连接到电路中') && 
      !error.includes('数值无效')
    );

    return criticalErrors.length === 0;
  }

  /**
   * 获取电路复杂度评分
   */
  static getComplexityScore(nodes: Node[], edges: Edge[]): number {
    let score = 0;

    // 基于节点数量
    score += nodes.length * 10;

    // 基于连接数量
    score += edges.length * 5;

    // 基于元件类型多样性
    const elementTypes = new Set(nodes.map(node => node.data.elementType));
    score += elementTypes.size * 20;

    // 基于电路拓扑
    if (this.detectLoops(nodes, edges)) {
      score += 50; // 有环路增加复杂度
    }

    return Math.min(score, 100); // 最大100分
  }
}