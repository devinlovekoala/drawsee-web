'use client';

import { useMemo, useEffect, useState, useCallback } from 'react';
import { EdgeProps, ConnectionLineComponentProps, getSmoothStepPath, getBezierPath } from 'reactflow';

// 连接线类型定义
export type ConnectionLineType = 'straight' | 'step' | 'bezier' | 'manhattan';

// 连接线样式配置
const edgeStyles = {
  stroke: '#3B82F6',      // 蓝色
  strokeWidth: 2,
  fill: 'none',
  transition: 'stroke 0.2s, stroke-width 0.2s, filter 0.2s',
  strokeLinecap: 'round' as const,
  strokeLinejoin: 'round' as const,
};

// 电源连接线样式 - 稍粗以表示主电源
const powerEdgeStyles = {
  ...edgeStyles,
  stroke: '#2563EB',      // 深蓝色
  strokeWidth: 2.5,
  filter: 'drop-shadow(0px 0px 2px rgba(37, 99, 235, 0.3))',
};

// 信号连接线样式 - 适用于数据/信号线
const signalEdgeStyles = {
  ...edgeStyles,
  stroke: '#10B981',      // 绿色
  strokeDasharray: '3 2',
};

// 接地连接线样式
const groundEdgeStyles = {
  ...edgeStyles,
  stroke: '#4B5563',      // 灰色
};

// 预览线样式
const previewLineStyle = {
  stroke: '#60A5FA',
  strokeWidth: 2.5,
  strokeDasharray: '5 3',
  fill: 'none',
  filter: 'drop-shadow(0px 0px 3px rgba(59, 130, 246, 0.4))',
  strokeLinecap: 'round' as const,
  strokeLinejoin: 'round' as const,
};

// 选中状态的边缘线样式
const selectedEdgeStyles = {
  stroke: '#F59E0B', // 选中时使用橙色
  strokeWidth: 3,
  filter: 'drop-shadow(0px 0px 4px rgba(245, 158, 11, 0.5))',
  strokeLinecap: 'round' as const,
  strokeLinejoin: 'round' as const,
};

// 错误状态的边缘线样式
const errorEdgeStyles = {
  stroke: '#EF4444', // 错误时使用红色
  strokeWidth: 2.5,
  strokeDasharray: '4 3',
  filter: 'drop-shadow(0px 0px 2px rgba(239, 68, 68, 0.4))',
};

// 根据连接类型获取路径
const getConnectionPath = (
  { sourceX, sourceY, sourcePosition, targetX, targetY, targetPosition }: any, 
  type: ConnectionLineType = 'step'
) => {
  switch (type) {
    case 'bezier':
      return getBezierPath({
        sourceX, sourceY, sourcePosition,
        targetX, targetY, targetPosition,
        curvature: 0.35,
      });
    case 'straight':
      return [`M${sourceX},${sourceY} L${targetX},${targetY}`];
    case 'manhattan':
      // Manhattan路径 - 水平后垂直连接
      const midX = sourceX + (targetX - sourceX) / 2;
      return [`M${sourceX},${sourceY} H${midX} V${targetY} H${targetX}`];
    case 'step':
    default:
      return getSmoothStepPath({
        sourceX, sourceY, sourcePosition,
        targetX, targetY, targetPosition,
        borderRadius: 8,  // 增加圆角半径
        offset: 15,       // 增加偏移，让线条更加平滑
      });
  }
};

// 获取连接线的样式
const getEdgeStyle = (edgeData: any, selected: boolean) => {
  // 如果选中，优先返回选中样式
  if (selected === true) {
    return { ...selectedEdgeStyles };
  }
  
  // 使用具体的类型检查而不是可选链
  const lineType = edgeData?.lineType || '';
  const hasError = edgeData?.error === true;
  
  // 根据连接类型设置样式
  if (lineType === 'power') {
    return powerEdgeStyles;
  } else if (lineType === 'signal') {
    return signalEdgeStyles;
  } else if (lineType === 'ground') {
    return groundEdgeStyles;
  } else if (hasError) {
    return errorEdgeStyles;
  }
  
  // 默认样式
  return edgeStyles;
};

// 连接线组件 - 用于已经建立的连接
export function ConnectionEdge({
  id,
  sourceX,
  sourceY,
  targetX,
  targetY,
  sourcePosition,
  targetPosition,
  style = {},
  markerEnd,
  selected,
  animated,
  data,
  source,
  target,
  sourceHandleId,
  targetHandleId,
  label,
}: EdgeProps) {
  // 跟踪是否需要重新计算连线
  const [needsUpdate, setNeedsUpdate] = useState(false);
  // 跟踪悬停状态
  const [isHovered, setIsHovered] = useState(false);
  
  // 连线类型 - 默认为step
  const lineType: ConnectionLineType = data?.lineType || 'step';
  
  // 当源节点或目标节点旋转时强制更新
  useEffect(() => {
    if (data && (data.forceRefresh || data.updateTimestamp)) {
      setNeedsUpdate(true);
      // 重置状态
      setTimeout(() => setNeedsUpdate(false), 50);
    }
  }, [data]);
  
  // 确定连线类型 - 自动检测接地连接
  const isGroundConnection = useMemo(() => {
    // 检查是否连接到接地元件
    const sourceIsGround = data?.sourceType === 'ground';
    const targetIsGround = data?.targetType === 'ground';
    if (sourceIsGround || targetIsGround) {
      return true;
    }
    // 或者检查端口ID是否包含ground关键字
    const sourceHasGround = sourceHandleId ? sourceHandleId.includes('ground') : false;
    const targetHasGround = targetHandleId ? targetHandleId.includes('ground') : false;
    return sourceHasGround || targetHasGround;
  }, [data, sourceHandleId, targetHandleId]);
  
  // 确定连线类型 - 自动检测电源连接
  const isPowerConnection = useMemo(() => {
    // 检查是否连接到电源元件
    const sourceTypeStr = data?.sourceType || '';
    const targetTypeStr = data?.targetType || '';
    const sourceIsSource = sourceTypeStr.includes('source');
    const targetIsSource = targetTypeStr.includes('source');
    
    if (sourceIsSource || targetIsSource) {
      return true;
    }
    
    // 或者检查端口ID
    const powerPorts = ['positive', 'negative', 'vcc', 'vdd', 'vss', 'gnd'];
    const sourceHandleString = sourceHandleId || '';
    const targetHandleString = targetHandleId || '';
    
    return powerPorts.some(term => 
      sourceHandleString.includes(term) || targetHandleString.includes(term)
    );
  }, [data, sourceHandleId, targetHandleId]);
  
  // 判断连接类型
  const connectionType = useMemo(() => {
    if (isGroundConnection) return 'ground';
    if (isPowerConnection) return 'power';
    if (data?.lineType) return data.lineType;
    return 'default';
  }, [isGroundConnection, isPowerConnection, data]);
  
  // 使用useMemo缓存路径计算
  const [edgePath, labelX, labelY] = useMemo(() => {
    const pathData = getConnectionPath(
      { sourceX, sourceY, sourcePosition, targetX, targetY, targetPosition },
      lineType
    );
    
    // 计算标签位置 - 路径中点位置
    const midX = (sourceX + targetX) / 2;
    const midY = (sourceY + targetY) / 2;
    
    // 返回路径和标签位置
    return [pathData[0], midX, midY];
  }, [sourceX, sourceY, targetX, targetY, sourcePosition, targetPosition, lineType, needsUpdate]);

  // 合并默认样式和自定义样式，根据连接类型和选中状态应用不同样式
  const customStyle = useMemo(() => {
    // 基础样式
    const baseStyle = getEdgeStyle({ lineType: connectionType, error: data?.error }, !!selected);
    
    // 悬停增强
    const hoverStyle = isHovered && !selected ? {
      strokeWidth: (baseStyle.strokeWidth as number) + 0.5,
      filter: 'drop-shadow(0px 0px 3px rgba(59, 130, 246, 0.4))',
    } : {};
    
    // 合并样式
    return {
      ...baseStyle,
      ...style,
      ...hoverStyle
    };
  }, [connectionType, data, selected, isHovered, style]);

  // 双击处理 - 可以用来设置边属性
  const handleDoubleClick = useCallback((event: React.MouseEvent) => {
    event.stopPropagation();
    
    // 连接线属性设置逻辑可在此处理
    console.log('Double clicked on edge:', id);
    
    // TODO: 在此处添加边属性编辑的弹窗逻辑
  }, [id]);
  
  // 鼠标进入/离开处理
  const handleMouseEnter = useCallback(() => {
    setIsHovered(true);
  }, []);

  const handleMouseLeave = useCallback(() => {
    setIsHovered(false);
  }, []);

  // 获取端点样式 - 根据连接类型
  const getEndpointStyle = useCallback((isSource: boolean) => {
    const baseStyle = {
      r: selected || isHovered ? 4 : 3,
      fill: selected ? '#F59E0B' : (customStyle.stroke as string),
      stroke: '#fff',
      strokeWidth: 1,
      filter: selected || isHovered ? 'drop-shadow(0px 0px 2px rgba(0,0,0,0.2))' : 'none',
      transition: 'r 0.2s, fill 0.2s, filter 0.2s',
    };
    
    return baseStyle;
  }, [selected, isHovered, customStyle.stroke]);

  // 创建连线ID，用于动画同步
  const animationId = `${id}-animation`;
  const uniqueAnimationName = `flow-${id.replace(/[^a-zA-Z0-9]/g, '-')}`;

  // 添加自定义样式，包括动画
  useEffect(() => {
    if (animated) {
      // 创建并添加唯一的CSS动画
      const styleElement = document.createElement('style');
      styleElement.textContent = `
        @keyframes ${uniqueAnimationName} {
          0% {
            stroke-dashoffset: 24;
          }
          100% {
            stroke-dashoffset: 0;
          }
        }
      `;
      document.head.appendChild(styleElement);
      
      return () => {
        document.head.removeChild(styleElement);
      };
    }
  }, [animated, uniqueAnimationName]);

  // 构造动画样式
  const animationStyle = useMemo(() => {
    return {
      ...customStyle,
      strokeDasharray: '8 8',
      strokeDashoffset: 0,
      animation: `${uniqueAnimationName} 1s linear infinite`,
      opacity: 0.8,
    };
  }, [customStyle, uniqueAnimationName]);

  // 预览线样式
  const previewStyles = useMemo(() => {
    return {
      ...previewLineStyle,
      animation: 'dashoffset 1s linear infinite',
    };
  }, []);

  return (
    <g 
      onMouseEnter={handleMouseEnter}
      onMouseLeave={handleMouseLeave}
      onDoubleClick={handleDoubleClick}
      className={`react-flow__edge ${selected ? 'selected' : ''} ${isHovered ? 'hovered' : ''}`}
      data-testid={`edge-${id}`}
      data-type={`${connectionType}-edge`}
      style={{ pointerEvents: 'visibleStroke' }}
    >
      <path
        id={id}
        className="react-flow__edge-path"
        d={edgePath}
        markerEnd={markerEnd}
        style={customStyle}
        data-source={source}
        data-target={target}
        data-source-handle={sourceHandleId}
        data-target-handle={targetHandleId}
        data-connection-type={connectionType}
        pointerEvents="visibleStroke"
      />
      
      {animated && (
        <path
          id={animationId}
          style={animationStyle}
          className="react-flow__edge-path-animation"
          d={edgePath}
          onMouseEnter={handleMouseEnter}
          onMouseLeave={handleMouseLeave}
        />
      )}

      {/* 源端点标记 */}
      <circle
        cx={sourceX}
        cy={sourceY}
        {...getEndpointStyle(true)}
        pointerEvents="none" // 防止干扰用户操作
      />
      
      {/* 目标端点标记 */}
      <circle
        cx={targetX}
        cy={targetY}
        {...getEndpointStyle(false)}
        pointerEvents="none" // 防止干扰用户操作
      />
    </g>
  );
}

// 连接线预览组件 - 用于拖拽连接时的预览
export function ConnectionPreview({
  fromX,
  fromY,
  fromPosition,
  toX,
  toY,
  toPosition,
}: ConnectionLineComponentProps) {
  // 使用useMemo缓存预览路径计算
  const path = useMemo(() => {
    // 使用step路径类型
    const [pathData] = getConnectionPath(
      { sourceX: fromX, sourceY: fromY, sourcePosition: fromPosition, 
        targetX: toX, targetY: toY, targetPosition: toPosition },
      'step'
    );
    
    return pathData;
  }, [fromX, fromY, toX, toY, fromPosition, toPosition]);

  // 创建安全的样式对象
  const previewStyles = {
    stroke: '#60A5FA',
    strokeWidth: 2.5,
    strokeDasharray: '5 3',
    fill: 'none',
    filter: 'drop-shadow(0px 0px 3px rgba(59, 130, 246, 0.4))',
    strokeLinecap: 'round' as const,
    strokeLinejoin: 'round' as const,
  };

  return (
    <g>
      <path 
        style={previewStyles}
        d={path} 
        className="connection-preview-path"
      />
      
      {/* 辅助线条指示连接方向 */}
      <line 
        x1={fromX} y1={fromY} 
        x2={toX} y2={toY} 
        stroke="#60A5FA" 
        strokeWidth={1} 
        strokeDasharray="2 4"
        opacity={0.3}
        strokeLinecap="round" 
      />
      
      {/* 源端点 */}
      <circle 
        cx={fromX} 
        cy={fromY} 
        r={4} 
        fill="#3B82F6" 
        stroke="#fff" 
        strokeWidth={1.5}
        filter="drop-shadow(0px 0px 2px rgba(59, 130, 246, 0.4))"
        className="connection-preview-source"
      />
      
      {/* 目标端点 */}
      <circle 
        cx={toX} 
        cy={toY} 
        r={5} 
        fill="#60A5FA" 
        stroke="#fff" 
        strokeWidth={1.5}
        filter="drop-shadow(0px 0px 3px rgba(59, 130, 246, 0.5))"
        className="connection-preview-target"
      />
    </g>
  );
}

// 默认导出已建立的连接线组件
export default ConnectionEdge; 
