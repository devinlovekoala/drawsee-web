/**
 * 增强的电路连接系统
 * 提供点对点连接功能，支持可视化连接点和智能连线
 */

import { Node, Edge } from 'reactflow';
import { CircuitElement, CircuitElementType } from '@/api/types/circuit.types';

// 连接点状态
export enum ConnectionPointState {
  IDLE = 'idle',           // 空闲状态
  HOVER = 'hover',         // 悬停状态
  ACTIVE = 'active',       // 激活状态（可连接）
  CONNECTING = 'connecting', // 连接中
  CONNECTED = 'connected'   // 已连接
}

// 连接点类型
export enum ConnectionPointType {
  INPUT = 'input',
  OUTPUT = 'output',
  BIDIRECTIONAL = 'bidirectional',
  POWER = 'power',
  GROUND = 'ground'
}

// 连接点定义
export interface ConnectionPoint {
  id: string;
  nodeId: string;
  name: string;
  type: ConnectionPointType;
  position: {
    x: number; // 相对于节点的百分比位置 (0-100)
    y: number;
    side: 'left' | 'right' | 'top' | 'bottom';
  };
  state: ConnectionPointState;
  connectedTo?: string[]; // 连接到的其他连接点ID列表
  maxConnections?: number; // 最大连接数，undefined表示无限制
  electricalProperties?: {
    voltage?: number;
    current?: number;
    impedance?: number;
  };
}

// 连接配置
export interface ConnectionConfig {
  allowMultipleConnections: boolean;
  autoValidateConnections: boolean;
  showConnectionHints: boolean;
  animateConnections: boolean;
  snapToGrid: boolean;
  gridSize: number;
}

// 连接验证规则
export interface ConnectionRule {
  sourceType: ConnectionPointType;
  targetType: ConnectionPointType;
  allowed: boolean;
  warning?: string;
  requiresConfirmation?: boolean;
}

// 默认连接规则
export const DEFAULT_CONNECTION_RULES: ConnectionRule[] = [
  // 基本连接规则
  { sourceType: ConnectionPointType.OUTPUT, targetType: ConnectionPointType.INPUT, allowed: true },
  { sourceType: ConnectionPointType.INPUT, targetType: ConnectionPointType.OUTPUT, allowed: true },
  { sourceType: ConnectionPointType.BIDIRECTIONAL, targetType: ConnectionPointType.BIDIRECTIONAL, allowed: true },
  { sourceType: ConnectionPointType.BIDIRECTIONAL, targetType: ConnectionPointType.INPUT, allowed: true },
  { sourceType: ConnectionPointType.BIDIRECTIONAL, targetType: ConnectionPointType.OUTPUT, allowed: true },
  { sourceType: ConnectionPointType.OUTPUT, targetType: ConnectionPointType.BIDIRECTIONAL, allowed: true },
  { sourceType: ConnectionPointType.INPUT, targetType: ConnectionPointType.BIDIRECTIONAL, allowed: true },
  
  // 电源连接规则
  { sourceType: ConnectionPointType.POWER, targetType: ConnectionPointType.INPUT, allowed: true },
  { sourceType: ConnectionPointType.POWER, targetType: ConnectionPointType.BIDIRECTIONAL, allowed: true },
  { sourceType: ConnectionPointType.OUTPUT, targetType: ConnectionPointType.POWER, allowed: false, warning: '输出不能直接连接到电源' },
  
  // 接地连接规则
  { sourceType: ConnectionPointType.GROUND, targetType: ConnectionPointType.INPUT, allowed: true },
  { sourceType: ConnectionPointType.GROUND, targetType: ConnectionPointType.OUTPUT, allowed: true },
  { sourceType: ConnectionPointType.GROUND, targetType: ConnectionPointType.BIDIRECTIONAL, allowed: true },
  { sourceType: ConnectionPointType.GROUND, targetType: ConnectionPointType.GROUND, allowed: true },
  
  // 禁止的连接
  { sourceType: ConnectionPointType.OUTPUT, targetType: ConnectionPointType.OUTPUT, allowed: false, warning: '输出不能直接连接到输出' },
  { sourceType: ConnectionPointType.INPUT, targetType: ConnectionPointType.INPUT, allowed: false, warning: '输入不能直接连接到输入' },
];

// 连接点工厂类
export class ConnectionPointFactory {
  /**
   * 为指定元件类型创建默认连接点
   */
  static createDefaultConnectionPoints(nodeId: string, elementType: CircuitElementType): ConnectionPoint[] {
    const baseId = `${nodeId}`;
    
    switch (elementType) {
      case CircuitElementType.RESISTOR:
        return [
          {
            id: `${baseId}-left`,
            nodeId,
            name: '左端',
            type: ConnectionPointType.BIDIRECTIONAL,
            position: { x: 0, y: 50, side: 'left' },
            state: ConnectionPointState.IDLE,
            connectedTo: []
          },
          {
            id: `${baseId}-right`,
            nodeId,
            name: '右端',
            type: ConnectionPointType.BIDIRECTIONAL,
            position: { x: 100, y: 50, side: 'right' },
            state: ConnectionPointState.IDLE,
            connectedTo: []
          }
        ];
        
      case CircuitElementType.CAPACITOR:
        return [
          {
            id: `${baseId}-positive`,
            nodeId,
            name: '正极',
            type: ConnectionPointType.BIDIRECTIONAL,
            position: { x: 0, y: 50, side: 'left' },
            state: ConnectionPointState.IDLE,
            connectedTo: []
          },
          {
            id: `${baseId}-negative`,
            nodeId,
            name: '负极',
            type: ConnectionPointType.BIDIRECTIONAL,
            position: { x: 100, y: 50, side: 'right' },
            state: ConnectionPointState.IDLE,
            connectedTo: []
          }
        ];
        
      case CircuitElementType.INDUCTOR:
        return [
          {
            id: `${baseId}-terminal1`,
            nodeId,
            name: '端子1',
            type: ConnectionPointType.BIDIRECTIONAL,
            position: { x: 0, y: 50, side: 'left' },
            state: ConnectionPointState.IDLE,
            connectedTo: []
          },
          {
            id: `${baseId}-terminal2`,
            nodeId,
            name: '端子2',
            type: ConnectionPointType.BIDIRECTIONAL,
            position: { x: 100, y: 50, side: 'right' },
            state: ConnectionPointState.IDLE,
            connectedTo: []
          }
        ];
        
      case CircuitElementType.VOLTAGE_SOURCE:
        return [
          {
            id: `${baseId}-positive`,
            nodeId,
            name: '正极',
            type: ConnectionPointType.POWER,
            position: { x: 0, y: 50, side: 'left' },
            state: ConnectionPointState.IDLE,
            connectedTo: [],
            electricalProperties: { voltage: 5.0 }
          },
          {
            id: `${baseId}-negative`,
            nodeId,
            name: '负极',
            type: ConnectionPointType.GROUND,
            position: { x: 100, y: 50, side: 'right' },
            state: ConnectionPointState.IDLE,
            connectedTo: [],
            electricalProperties: { voltage: 0.0 }
          }
        ];
        
      case CircuitElementType.CURRENT_SOURCE:
        return [
          {
            id: `${baseId}-positive`,
            nodeId,
            name: '正极',
            type: ConnectionPointType.OUTPUT,
            position: { x: 0, y: 50, side: 'left' },
            state: ConnectionPointState.IDLE,
            connectedTo: [],
            electricalProperties: { current: 1.0 }
          },
          {
            id: `${baseId}-negative`,
            nodeId,
            name: '负极',
            type: ConnectionPointType.INPUT,
            position: { x: 100, y: 50, side: 'right' },
            state: ConnectionPointState.IDLE,
            connectedTo: []
          }
        ];
        
      case CircuitElementType.DIODE:
        return [
          {
            id: `${baseId}-anode`,
            nodeId,
            name: '阳极',
            type: ConnectionPointType.INPUT,
            position: { x: 0, y: 50, side: 'left' },
            state: ConnectionPointState.IDLE,
            connectedTo: [],
            maxConnections: 1
          },
          {
            id: `${baseId}-cathode`,
            nodeId,
            name: '阴极',
            type: ConnectionPointType.OUTPUT,
            position: { x: 100, y: 50, side: 'right' },
            state: ConnectionPointState.IDLE,
            connectedTo: [],
            maxConnections: 1
          }
        ];
        
      case CircuitElementType.TRANSISTOR_NPN:
        return [
          {
            id: `${baseId}-base`,
            nodeId,
            name: '基极',
            type: ConnectionPointType.INPUT,
            position: { x: 0, y: 50, side: 'left' },
            state: ConnectionPointState.IDLE,
            connectedTo: [],
            maxConnections: 1
          },
          {
            id: `${baseId}-collector`,
            nodeId,
            name: '集电极',
            type: ConnectionPointType.INPUT,
            position: { x: 100, y: 20, side: 'right' },
            state: ConnectionPointState.IDLE,
            connectedTo: [],
            maxConnections: 1
          },
          {
            id: `${baseId}-emitter`,
            nodeId,
            name: '发射极',
            type: ConnectionPointType.OUTPUT,
            position: { x: 100, y: 80, side: 'right' },
            state: ConnectionPointState.IDLE,
            connectedTo: [],
            maxConnections: 1
          }
        ];
        
      case CircuitElementType.GROUND:
        return [
          {
            id: `${baseId}-terminal`,
            nodeId,
            name: '接地点',
            type: ConnectionPointType.GROUND,
            position: { x: 50, y: 0, side: 'top' },
            state: ConnectionPointState.IDLE,
            connectedTo: [],
            electricalProperties: { voltage: 0.0 }
          }
        ];
        
      case CircuitElementType.OPAMP:
        return [
          {
            id: `${baseId}-input-positive`,
            nodeId,
            name: '同相输入',
            type: ConnectionPointType.INPUT,
            position: { x: 0, y: 35, side: 'left' },
            state: ConnectionPointState.IDLE,
            connectedTo: [],
            maxConnections: 1
          },
          {
            id: `${baseId}-input-negative`,
            nodeId,
            name: '反相输入',
            type: ConnectionPointType.INPUT,
            position: { x: 0, y: 65, side: 'left' },
            state: ConnectionPointState.IDLE,
            connectedTo: [],
            maxConnections: 1
          },
          {
            id: `${baseId}-output`,
            nodeId,
            name: '输出',
            type: ConnectionPointType.OUTPUT,
            position: { x: 100, y: 50, side: 'right' },
            state: ConnectionPointState.IDLE,
            connectedTo: [],
            maxConnections: 5
          }
        ];
        
      default:
        return [
          {
            id: `${baseId}-default`,
            nodeId,
            name: '连接点',
            type: ConnectionPointType.BIDIRECTIONAL,
            position: { x: 50, y: 50, side: 'right' },
            state: ConnectionPointState.IDLE,
            connectedTo: []
          }
        ];
    }
  }
}

// 连接管理器类
export class ConnectionManager {
  private connectionPoints: Map<string, ConnectionPoint> = new Map();
  private connections: Edge[] = [];
  public config: ConnectionConfig;
  private rules: ConnectionRule[];
  private activeConnection: {
    sourcePoint: ConnectionPoint | null;
    targetPoint: ConnectionPoint | null;
  } = { sourcePoint: null, targetPoint: null };

  constructor(config?: Partial<ConnectionConfig>, rules?: ConnectionRule[]) {
    this.config = {
      allowMultipleConnections: true,
      autoValidateConnections: true,
      showConnectionHints: true,
      animateConnections: true,
      snapToGrid: false,
      gridSize: 10,
      ...config
    };
    this.rules = rules || DEFAULT_CONNECTION_RULES;
  }

  /**
   * 添加连接点
   */
  addConnectionPoint(point: ConnectionPoint): void {
    this.connectionPoints.set(point.id, point);
  }

  /**
   * 移除连接点
   */
  removeConnectionPoint(pointId: string): void {
    // 首先断开所有相关连接
    const point = this.connectionPoints.get(pointId);
    if (point?.connectedTo) {
      point.connectedTo.forEach(connectedId => {
        this.disconnectPoints(pointId, connectedId);
      });
    }
    this.connectionPoints.delete(pointId);
  }

  /**
   * 更新连接点状态
   */
  updateConnectionPointState(pointId: string, state: ConnectionPointState): void {
    const point = this.connectionPoints.get(pointId);
    if (point) {
      point.state = state;
    }
  }

  /**
   * 获取连接点
   */
  getConnectionPoint(pointId: string): ConnectionPoint | undefined {
    return this.connectionPoints.get(pointId);
  }

  /**
   * 获取节点的所有连接点
   */
  getNodeConnectionPoints(nodeId: string): ConnectionPoint[] {
    return Array.from(this.connectionPoints.values())
      .filter(point => point.nodeId === nodeId);
  }

  /**
   * 验证连接是否允许
   */
  validateConnection(sourceId: string, targetId: string): { allowed: boolean; warning?: string } {
    const sourcePoint = this.connectionPoints.get(sourceId);
    const targetPoint = this.connectionPoints.get(targetId);
    
    if (!sourcePoint || !targetPoint) {
      return { allowed: false, warning: '连接点不存在' };
    }
    
    // 不能连接到自身节点
    if (sourcePoint.nodeId === targetPoint.nodeId) {
      return { allowed: false, warning: '不能连接同一元件的端口' };
    }
    
    // 检查是否已经连接
    if (sourcePoint.connectedTo?.includes(targetId)) {
      return { allowed: false, warning: '连接已存在' };
    }
    
    // 检查最大连接数限制
    if (sourcePoint.maxConnections && 
        sourcePoint.connectedTo && 
        sourcePoint.connectedTo.length >= sourcePoint.maxConnections) {
      return { allowed: false, warning: `${sourcePoint.name}已达到最大连接数` };
    }
    
    if (targetPoint.maxConnections && 
        targetPoint.connectedTo && 
        targetPoint.connectedTo.length >= targetPoint.maxConnections) {
      return { allowed: false, warning: `${targetPoint.name}已达到最大连接数` };
    }
    
    // 应用连接规则
    const rule = this.rules.find(r => 
      r.sourceType === sourcePoint.type && r.targetType === targetPoint.type
    );
    
    if (rule) {
      return { allowed: rule.allowed, warning: rule.warning };
    }
    
    // 默认允许连接
    return { allowed: true };
  }

  /**
   * 创建连接
   */
  createConnection(sourceId: string, targetId: string): { success: boolean; edge?: Edge; error?: string } {
    console.log('创建连接:', { sourceId, targetId });
    
    const validation = this.validateConnection(sourceId, targetId);
    if (!validation.allowed) {
      console.error('连接验证失败:', validation.warning);
      return { success: false, error: validation.warning };
    }

    const sourcePoint = this.connectionPoints.get(sourceId);
    const targetPoint = this.connectionPoints.get(targetId);
    
    if (!sourcePoint || !targetPoint) {
      console.error('连接点不存在:', { sourceId, targetId, sourcePoint: !!sourcePoint, targetPoint: !!targetPoint });
      return { success: false, error: '连接点不存在' };
    }

    // 检查是否已经存在相同的连接
    const existingConnection = this.connections.find(edge => 
      (edge.sourceHandle === sourceId && edge.targetHandle === targetId) ||
      (edge.sourceHandle === targetId && edge.targetHandle === sourceId)
    );
    
    if (existingConnection) {
      console.error('连接已存在:', existingConnection.id);
      return { success: false, error: '连接已存在' };
    }

    // 创建边
    const edgeId = `${sourceId}-${targetId}-${Date.now()}`;
    const edge: Edge = {
      id: edgeId,
      source: sourcePoint.nodeId,
      target: targetPoint.nodeId,
      sourceHandle: sourceId,
      targetHandle: targetId,
      type: 'default',
      data: {
        sourcePointId: sourceId,
        targetPointId: targetId,
        lineType: this.getConnectionLineType(sourcePoint, targetPoint),
        electricalProperties: this.calculateElectricalProperties(sourcePoint, targetPoint)
      },
      animated: this.config.animateConnections
    };

    // 更新连接点状态
    if (!sourcePoint.connectedTo) sourcePoint.connectedTo = [];
    if (!targetPoint.connectedTo) targetPoint.connectedTo = [];
    
    sourcePoint.connectedTo.push(targetId);
    targetPoint.connectedTo.push(sourceId);
    sourcePoint.state = ConnectionPointState.CONNECTED;
    targetPoint.state = ConnectionPointState.CONNECTED;

    // 添加到连接列表
    this.connections.push(edge);

    console.log('连接创建成功:', edge);
    return { success: true, edge };
  }

  /**
   * 断开连接
   */
  disconnectPoints(sourceId: string, targetId: string): boolean {
    const sourcePoint = this.connectionPoints.get(sourceId);
    const targetPoint = this.connectionPoints.get(targetId);
    
    if (!sourcePoint || !targetPoint) return false;

    // 移除连接引用
    if (sourcePoint.connectedTo) {
      sourcePoint.connectedTo = sourcePoint.connectedTo.filter(id => id !== targetId);
    }
    if (targetPoint.connectedTo) {
      targetPoint.connectedTo = targetPoint.connectedTo.filter(id => id !== sourceId);
    }

    // 更新状态
    sourcePoint.state = sourcePoint.connectedTo?.length ? ConnectionPointState.CONNECTED : ConnectionPointState.IDLE;
    targetPoint.state = targetPoint.connectedTo?.length ? ConnectionPointState.CONNECTED : ConnectionPointState.IDLE;

    // 移除边
    this.connections = this.connections.filter(edge => 
      !(edge.sourceHandle === sourceId && edge.targetHandle === targetId) &&
      !(edge.sourceHandle === targetId && edge.targetHandle === sourceId)
    );

    return true;
  }

  /**
   * 获取连接线类型
   */
  private getConnectionLineType(sourcePoint: ConnectionPoint, targetPoint: ConnectionPoint): string {
    if (sourcePoint.type === ConnectionPointType.POWER || targetPoint.type === ConnectionPointType.POWER) {
      return 'power';
    }
    if (sourcePoint.type === ConnectionPointType.GROUND || targetPoint.type === ConnectionPointType.GROUND) {
      return 'ground';
    }
    return 'signal';
  }

  /**
   * 计算电气属性
   */
  private calculateElectricalProperties(sourcePoint: ConnectionPoint, targetPoint: ConnectionPoint) {
    const sourceProps = sourcePoint.electricalProperties || {};
    const targetProps = targetPoint.electricalProperties || {};
    
    return {
      voltage: sourceProps.voltage || targetProps.voltage || 0,
      current: sourceProps.current || targetProps.current || 0,
      impedance: sourceProps.impedance || targetProps.impedance || 0
    };
  }

  /**
   * 获取所有连接
   */
  getConnections(): Edge[] {
    return [...this.connections];
  }

  /**
   * 开始连接过程
   */
  startConnection(sourcePointId: string): boolean {
    console.log('连接管理器: 开始连接', sourcePointId);
    
    const sourcePoint = this.connectionPoints.get(sourcePointId);
    if (!sourcePoint) {
      console.error('源连接点不存在:', sourcePointId);
      return false;
    }

    // 如果已经有活跃连接，先取消
    if (this.activeConnection.sourcePoint) {
      console.log('取消当前活跃连接');
      this.clearActiveConnection();
    }

    this.activeConnection.sourcePoint = sourcePoint;
    this.updateConnectionPointState(sourcePointId, ConnectionPointState.CONNECTING);
    
    // 高亮可连接的目标点
    const compatibleTargets = this.highlightCompatibleTargets(sourcePoint);
    console.log('找到可连接目标:', compatibleTargets);
    
    return true;
  }

  /**
   * 完成连接
   */
  completeConnection(targetPointId: string): { success: boolean; edge?: Edge; error?: string } {
    console.log('连接管理器: 完成连接', { 
      sourcePoint: this.activeConnection.sourcePoint?.id, 
      targetPoint: targetPointId 
    });
    
    if (!this.activeConnection.sourcePoint) {
      console.error('没有活跃的连接源');
      return { success: false, error: '没有活跃的连接源' };
    }

    // 检查是否尝试连接到自身
    if (this.activeConnection.sourcePoint.id === targetPointId) {
      console.error('不能连接到自身');
      this.clearActiveConnection();
      return { success: false, error: '不能连接到自身' };
    }

    const result = this.createConnection(this.activeConnection.sourcePoint.id, targetPointId);
    
    if (result.success) {
      console.log('连接创建成功:', result.edge);
    } else {
      console.error('连接创建失败:', result.error);
    }
    
    // 清理活跃连接状态
    this.clearActiveConnection();
    
    return result;
  }

  /**
   * 取消连接
   */
  cancelConnection(): void {
    this.clearActiveConnection();
  }

  /**
   * 清理活跃连接状态
   */
  private clearActiveConnection(): void {
    if (this.activeConnection.sourcePoint) {
      this.updateConnectionPointState(
        this.activeConnection.sourcePoint.id, 
        this.activeConnection.sourcePoint.connectedTo?.length ? 
          ConnectionPointState.CONNECTED : ConnectionPointState.IDLE
      );
    }

    // 清除所有高亮状态
    this.connectionPoints.forEach((point, id) => {
      if (point.state === ConnectionPointState.ACTIVE) {
        this.updateConnectionPointState(id, 
          point.connectedTo?.length ? ConnectionPointState.CONNECTED : ConnectionPointState.IDLE
        );
      }
    });

    this.activeConnection = { sourcePoint: null, targetPoint: null };
  }

  /**
   * 高亮兼容的目标连接点
   */
  private highlightCompatibleTargets(sourcePoint: ConnectionPoint): string[] {
    const compatibleTargets: string[] = [];
    
    this.connectionPoints.forEach((point, id) => {
      if (point.nodeId !== sourcePoint.nodeId) {
        const validation = this.validateConnection(sourcePoint.id, id);
        if (validation.allowed) {
          this.updateConnectionPointState(id, ConnectionPointState.ACTIVE);
          compatibleTargets.push(id);
        }
      }
    });
    
    return compatibleTargets;
  }

  /**
   * 获取连接统计信息
   */
  getConnectionStats(): {
    totalPoints: number;
    connectedPoints: number;
    totalConnections: number;
    averageConnectionsPerPoint: number;
  } {
    const totalPoints = this.connectionPoints.size;
    const connectedPoints = Array.from(this.connectionPoints.values())
      .filter(point => point.connectedTo && point.connectedTo.length > 0).length;
    const totalConnections = this.connections.length;
    
    return {
      totalPoints,
      connectedPoints,
      totalConnections,
      averageConnectionsPerPoint: totalPoints > 0 ? totalConnections / totalPoints : 0
    };
  }
}