/**
 * 增强的连接点组件
 * 提供可视化连接点和交互功能
 */

'use client';

import React, { memo, useCallback, useMemo, useState } from 'react';
import { ConnectionPoint, ConnectionPointState, ConnectionPointType } from './EnhancedConnectionSystem';

// 连接点组件属性
interface ConnectionPointComponentProps {
  connectionPoint: ConnectionPoint;
  rotation?: number;
  onConnectionStart?: (pointId: string) => void;
  onConnectionComplete?: (pointId: string) => void;
  onConnectionCancel?: () => void;
  onHover?: (pointId: string, isHovered: boolean) => void;
  disabled?: boolean;
  showLabels?: boolean;
  scale?: number;
}

// 获取连接点的颜色主题
const getConnectionPointTheme = (type: ConnectionPointType, state: ConnectionPointState) => {
  const themes = {
    [ConnectionPointType.INPUT]: {
      idle: { bg: '#3B82F6', border: '#1D4ED8', shadow: 'rgba(59, 130, 246, 0.3)' },
      hover: { bg: '#2563EB', border: '#1E40AF', shadow: 'rgba(37, 99, 235, 0.5)' },
      active: { bg: '#1D4ED8', border: '#1E3A8A', shadow: 'rgba(29, 78, 216, 0.7)' },
      connecting: { bg: '#F59E0B', border: '#D97706', shadow: 'rgba(245, 158, 11, 0.7)' },
      connected: { bg: '#10B981', border: '#059669', shadow: 'rgba(16, 185, 129, 0.4)' }
    },
    [ConnectionPointType.OUTPUT]: {
      idle: { bg: '#10B981', border: '#059669', shadow: 'rgba(16, 185, 129, 0.3)' },
      hover: { bg: '#047857', border: '#065F46', shadow: 'rgba(4, 120, 87, 0.5)' },
      active: { bg: '#059669', border: '#064E3B', shadow: 'rgba(5, 150, 105, 0.7)' },
      connecting: { bg: '#F59E0B', border: '#D97706', shadow: 'rgba(245, 158, 11, 0.7)' },
      connected: { bg: '#3B82F6', border: '#1D4ED8', shadow: 'rgba(59, 130, 246, 0.4)' }
    },
    [ConnectionPointType.BIDIRECTIONAL]: {
      idle: { bg: '#8B5CF6', border: '#7C3AED', shadow: 'rgba(139, 92, 246, 0.3)' },
      hover: { bg: '#7C3AED', border: '#6D28D9', shadow: 'rgba(124, 58, 237, 0.5)' },
      active: { bg: '#6D28D9', border: '#5B21B6', shadow: 'rgba(109, 40, 217, 0.7)' },
      connecting: { bg: '#F59E0B', border: '#D97706', shadow: 'rgba(245, 158, 11, 0.7)' },
      connected: { bg: '#EC4899', border: '#DB2777', shadow: 'rgba(236, 72, 153, 0.4)' }
    },
    [ConnectionPointType.POWER]: {
      idle: { bg: '#DC2626', border: '#B91C1C', shadow: 'rgba(220, 38, 38, 0.3)' },
      hover: { bg: '#B91C1C', border: '#991B1B', shadow: 'rgba(185, 28, 28, 0.5)' },
      active: { bg: '#991B1B', border: '#7F1D1D', shadow: 'rgba(153, 27, 27, 0.7)' },
      connecting: { bg: '#F59E0B', border: '#D97706', shadow: 'rgba(245, 158, 11, 0.7)' },
      connected: { bg: '#EF4444', border: '#DC2626', shadow: 'rgba(239, 68, 68, 0.4)' }
    },
    [ConnectionPointType.GROUND]: {
      idle: { bg: '#6B7280', border: '#4B5563', shadow: 'rgba(107, 114, 128, 0.3)' },
      hover: { bg: '#4B5563', border: '#374151', shadow: 'rgba(75, 85, 99, 0.5)' },
      active: { bg: '#374151', border: '#1F2937', shadow: 'rgba(55, 65, 81, 0.7)' },
      connecting: { bg: '#F59E0B', border: '#D97706', shadow: 'rgba(245, 158, 11, 0.7)' },
      connected: { bg: '#9CA3AF', border: '#6B7280', shadow: 'rgba(156, 163, 175, 0.4)' }
    }
  };
  
  return themes[type][state];
};

// 获取连接点类型图标
const getConnectionPointIcon = (type: ConnectionPointType) => {
  switch (type) {
    case ConnectionPointType.INPUT:
      return '→';
    case ConnectionPointType.OUTPUT:
      return '←';
    case ConnectionPointType.BIDIRECTIONAL:
      return '↔';
    case ConnectionPointType.POWER:
      return '+';
    case ConnectionPointType.GROUND:
      return '⏚';
    default:
      return '●';
  }
};

// 连接点组件
export const ConnectionPointComponent = memo<ConnectionPointComponentProps>(({
  connectionPoint,
  rotation = 0,
  onConnectionStart,
  onConnectionComplete,
  onConnectionCancel,
  onHover,
  disabled = false,
  showLabels = true,
  scale = 1
}) => {
  const [isLocalHovered, setIsLocalHovered] = useState(false);
  const [isPulsing, setIsPulsing] = useState(false);

  // 计算连接点的绝对位置
  const position = useMemo(() => {
    const { x, y, side } = connectionPoint.position;
    
    // 基于旋转调整位置
    let adjustedX = x;
    let adjustedY = y;
    let adjustedSide = side;
    
    if (rotation !== 0) {
      // 根据旋转角度调整位置和边
      const rotationMap = {
        90: { left: 'top', right: 'bottom', top: 'right', bottom: 'left' },
        180: { left: 'right', right: 'left', top: 'bottom', bottom: 'top' },
        270: { left: 'bottom', right: 'top', top: 'left', bottom: 'right' }
      };
      
      const rotMap = rotationMap[rotation as keyof typeof rotationMap];
      if (rotMap) {
        adjustedSide = rotMap[side as keyof typeof rotMap] as typeof side;
        
        // 调整坐标
        if (rotation === 90) {
          [adjustedX, adjustedY] = [100 - y, x];
        } else if (rotation === 180) {
          [adjustedX, adjustedY] = [100 - x, 100 - y];
        } else if (rotation === 270) {
          [adjustedX, adjustedY] = [y, 100 - x];
        }
      }
    }
    
    return { x: adjustedX, y: adjustedY, side: adjustedSide };
  }, [connectionPoint.position, rotation]);

  // 获取主题颜色
  const theme = useMemo(() => 
    getConnectionPointTheme(connectionPoint.type, connectionPoint.state), 
    [connectionPoint.type, connectionPoint.state]
  );

  // 处理点击事件 - 优化连接逻辑
  const handleClick = useCallback((event: React.MouseEvent) => {
    event.stopPropagation();
    event.preventDefault();
    
    if (disabled) return;
    
    console.log('连接点被点击:', {
      pointId: connectionPoint.id,
      currentState: connectionPoint.state,
      nodeId: connectionPoint.nodeId
    });
    
    // 根据当前状态处理点击
    switch (connectionPoint.state) {
      case ConnectionPointState.CONNECTING:
        // 如果当前连接点处于连接中状态，取消连接
        onConnectionCancel?.();
        break;
        
      case ConnectionPointState.ACTIVE:
        // 如果是激活状态（可连接），完成连接
        onConnectionComplete?.(connectionPoint.id);
        setIsPulsing(true);
        setTimeout(() => setIsPulsing(false), 300);
        break;
        
      case ConnectionPointState.IDLE:
      case ConnectionPointState.HOVER:
      case ConnectionPointState.CONNECTED:
      default:
        // 空闲、悬停或已连接状态，开始新的连接
        const startResult = onConnectionStart?.(connectionPoint.id);
        if (startResult !== false) { // 如果没有明确返回false，表示成功
          setIsPulsing(true);
          setTimeout(() => setIsPulsing(false), 300);
        }
        break;
    }
  }, [connectionPoint.id, connectionPoint.state, connectionPoint.nodeId, disabled, onConnectionStart, onConnectionComplete, onConnectionCancel]);

  // 处理鼠标悬停
  const handleMouseEnter = useCallback(() => {
    if (!disabled) {
      setIsLocalHovered(true);
      onHover?.(connectionPoint.id, true);
    }
  }, [connectionPoint.id, disabled, onHover]);

  const handleMouseLeave = useCallback(() => {
    if (!disabled) {
      setIsLocalHovered(false);
      onHover?.(connectionPoint.id, false);
    }
  }, [connectionPoint.id, disabled, onHover]);

  // 计算连接点样式
  const pointStyle = useMemo(() => {
    const baseSize = 12 * scale;
    const hoverSize = 16 * scale;
    const activeSize = 18 * scale;
    
    let size = baseSize;
    if (connectionPoint.state === ConnectionPointState.ACTIVE || connectionPoint.state === ConnectionPointState.CONNECTING) {
      size = activeSize;
    } else if (isLocalHovered || connectionPoint.state === ConnectionPointState.HOVER) {
      size = hoverSize;
    }
    
    const style: React.CSSProperties = {
      position: 'absolute',
      left: `${position.x}%`,
      top: `${position.y}%`,
      width: size,
      height: size,
      borderRadius: '50%',
      background: theme.bg,
      border: `2px solid ${theme.border}`,
      boxShadow: `0 0 12px ${theme.shadow}`,
      transform: 'translate(-50%, -50%)',
      cursor: disabled ? 'not-allowed' : 'pointer',
      transition: 'all 0.2s cubic-bezier(0.4, 0, 0.2, 1)',
      zIndex: 20,
      display: 'flex',
      alignItems: 'center',
      justifyContent: 'center',
      fontSize: `${8 * scale}px`,
      fontWeight: 'bold',
      color: '#fff',
      userSelect: 'none',
    };
    
    // 添加动画效果
    if (connectionPoint.state === ConnectionPointState.CONNECTING) {
      style.animation = 'pulse 1s infinite';
    }
    
    if (isPulsing) {
      style.animation = 'connectionPulse 0.3s ease-out';
    }
    
    if (disabled) {
      style.opacity = 0.5;
      style.filter = 'grayscale(50%)';
    }
    
    return style;
  }, [position, theme, scale, isLocalHovered, connectionPoint.state, disabled, isPulsing]);

  // 计算标签样式
  const labelStyle = useMemo(() => {
    const offset = 20 * scale;
    let labelPosition = { x: 0, y: 0 };
    
    switch (position.side) {
      case 'left':
        labelPosition = { x: -offset, y: 0 };
        break;
      case 'right':
        labelPosition = { x: offset, y: 0 };
        break;
      case 'top':
        labelPosition = { x: 0, y: -offset };
        break;
      case 'bottom':
        labelPosition = { x: 0, y: offset };
        break;
    }
    
    const style: React.CSSProperties = {
      position: 'absolute',
      left: `calc(${position.x}% + ${labelPosition.x}px)`,
      top: `calc(${position.y}% + ${labelPosition.y}px)`,
      transform: 'translate(-50%, -50%)',
      fontSize: `${10 * scale}px`,
      fontWeight: 500,
      color: theme.border,
      background: 'rgba(255, 255, 255, 0.95)',
      padding: `${2 * scale}px ${6 * scale}px`,
      borderRadius: `${4 * scale}px`,
      border: `1px solid ${theme.border}`,
      whiteSpace: 'nowrap',
      pointerEvents: 'none',
      opacity: (isLocalHovered || connectionPoint.state === ConnectionPointState.ACTIVE) ? 1 : 0,
      transition: 'opacity 0.2s ease',
      zIndex: 25,
      boxShadow: '0 2px 4px rgba(0, 0, 0, 0.1)',
    };
    
    return style;
  }, [position, theme, scale, isLocalHovered, connectionPoint.state]);

  // 计算连接状态指示器
  const connectionIndicatorStyle = useMemo(() => {
    if (!connectionPoint.connectedTo?.length) return { display: 'none' };
    
    const style: React.CSSProperties = {
      position: 'absolute',
      left: `calc(${position.x}% + ${8 * scale}px)`,
      top: `calc(${position.y}% - ${8 * scale}px)`,
      width: `${6 * scale}px`,
      height: `${6 * scale}px`,
      borderRadius: '50%',
      background: '#10B981',
      border: '1px solid #fff',
      fontSize: `${6 * scale}px`,
      color: '#fff',
      display: 'flex',
      alignItems: 'center',
      justifyContent: 'center',
      zIndex: 21,
      transform: 'translate(-50%, -50%)',
      boxShadow: '0 0 4px rgba(16, 185, 129, 0.5)',
    };
    
    return style;
  }, [position, connectionPoint.connectedTo, scale]);

  return (
    <>
      {/* CSS动画定义 */}
      <style>
        {`
          @keyframes pulse {
            0%, 100% { transform: translate(-50%, -50%) scale(1); }
            50% { transform: translate(-50%, -50%) scale(1.2); }
          }
          
          @keyframes connectionPulse {
            0% { transform: translate(-50%, -50%) scale(1); }
            50% { transform: translate(-50%, -50%) scale(1.3); }
            100% { transform: translate(-50%, -50%) scale(1); }
          }
          
          .connection-point-interactive {
            position: relative;
            user-select: none;
            -webkit-user-select: none;
            -moz-user-select: none;
            -ms-user-select: none;
          }
          
          .connection-point-interactive:hover {
            transform: translate(-50%, -50%) scale(1.1);
          }
          
          .connection-point-interactive:active {
            transform: translate(-50%, -50%) scale(0.95);
          }
          
          .connection-point-icon {
            display: flex;
            align-items: center;
            justify-content: center;
            width: 100%;
            height: 100%;
            pointer-events: none;
          }
        `}
      </style>
      
      {/* 主连接点 - 增强交互反馈 */}
      <div
        style={pointStyle}
        onClick={handleClick}
        onMouseEnter={handleMouseEnter}
        onMouseLeave={handleMouseLeave}
        onMouseDown={(e) => e.stopPropagation()}
        title={`${connectionPoint.name} (${connectionPoint.type})\n点击开始连接或完成连接`}
        data-connection-point-id={connectionPoint.id}
        data-connection-point-type={connectionPoint.type}
        data-connection-point-state={connectionPoint.state}
        className="connection-point-interactive"
      >
        <div className="connection-point-icon">
          {getConnectionPointIcon(connectionPoint.type)}
        </div>
        
        {/* 连接状态指示器 */}
        {connectionPoint.state === ConnectionPointState.ACTIVE && (
          <div 
            className="absolute inset-0 rounded-full border-2 border-yellow-400 animate-ping"
            style={{ borderWidth: '2px' }}
          />
        )}
        
        {connectionPoint.state === ConnectionPointState.CONNECTING && (
          <div 
            className="absolute inset-0 rounded-full border-2 border-orange-500 animate-pulse"
            style={{ borderWidth: '2px' }}
          />
        )}
      </div>
      
      {/* 连接点标签 */}
      {showLabels && (
        <div style={labelStyle}>
          <div>{connectionPoint.name}</div>
          {connectionPoint.electricalProperties && (
            <div style={{ fontSize: `${8 * scale}px`, opacity: 0.8 }}>
              {connectionPoint.electricalProperties.voltage !== undefined && 
                `${connectionPoint.electricalProperties.voltage}V`}
              {connectionPoint.electricalProperties.current !== undefined && 
                ` ${connectionPoint.electricalProperties.current}A`}
            </div>
          )}
        </div>
      )}
      
      {/* 连接状态指示器 */}
      <div style={connectionIndicatorStyle}>
        {connectionPoint.connectedTo?.length || 0}
      </div>
    </>
  );
});

ConnectionPointComponent.displayName = 'ConnectionPointComponent';