/**
 * 增强的连接线组件
 * 提供专业的电路连线视觉效果和交互体验
 */

'use client';

import { useMemo, useState, useCallback } from 'react';
import { EdgeProps, getSimpleBezierPath } from 'reactflow';
// 移除未使用的导入

// 连接线类型定义
export type EnhancedConnectionLineType = 'smooth' | 'straight' | 'step' | 'bezier' | 'manhattan' | 'orthogonal';

// 连接线样式配置
interface ConnectionLineStyle {
  stroke: string;
  strokeWidth: number;
  strokeDasharray?: string;
  fill: string;
  filter?: string;
  strokeLinecap: 'butt' | 'round' | 'square';
  strokeLinejoin: 'miter' | 'round' | 'bevel';
  opacity?: number;
}

// 获取连接类型的样式
const getConnectionTypeStyle = (
  connectionType: string, 
  selected: boolean = false, 
  hovered: boolean = false
): ConnectionLineStyle => {
  const baseStyles = {
    power: {
      stroke: '#DC2626',
      strokeWidth: 3,
      strokeDasharray: undefined,
      fill: 'none',
      filter: 'drop-shadow(0px 0px 4px rgba(220, 38, 38, 0.4))',
      strokeLinecap: 'round' as const,
      strokeLinejoin: 'round' as const,
      opacity: 0.9
    },
    ground: {
      stroke: '#6B7280',
      strokeWidth: 2.5,
      strokeDasharray: undefined,
      fill: 'none',
      filter: 'drop-shadow(0px 0px 2px rgba(107, 114, 128, 0.3))',
      strokeLinecap: 'round' as const,
      strokeLinejoin: 'round' as const,
      opacity: 0.8
    },
    signal: {
      stroke: '#3B82F6',
      strokeWidth: 2,
      strokeDasharray: undefined,
      fill: 'none',
      filter: 'drop-shadow(0px 0px 2px rgba(59, 130, 246, 0.3))',
      strokeLinecap: 'round' as const,
      strokeLinejoin: 'round' as const,
      opacity: 0.85
    },
    data: {
      stroke: '#10B981',
      strokeWidth: 2,
      strokeDasharray: '4 2',
      fill: 'none',
      filter: 'drop-shadow(0px 0px 2px rgba(16, 185, 129, 0.3))',
      strokeLinecap: 'round' as const,
      strokeLinejoin: 'round' as const,
      opacity: 0.8
    },
    control: {
      stroke: '#8B5CF6',
      strokeWidth: 1.5,
      strokeDasharray: '6 3',
      fill: 'none',
      filter: 'drop-shadow(0px 0px 2px rgba(139, 92, 246, 0.3))',
      strokeLinecap: 'round' as const,
      strokeLinejoin: 'round' as const,
      opacity: 0.75
    }
  };

  let baseStyle = baseStyles[connectionType as keyof typeof baseStyles] || baseStyles.signal;

  // 选中状态增强
  if (selected) {
    baseStyle = {
      ...baseStyle,
      stroke: '#F59E0B',
      strokeWidth: baseStyle.strokeWidth + 1,
      filter: 'drop-shadow(0px 0px 8px rgba(245, 158, 11, 0.6))',
      opacity: 1
    };
  }
  // 悬停状态增强
  else if (hovered) {
    baseStyle = {
      ...baseStyle,
      strokeWidth: baseStyle.strokeWidth + 0.5,
      filter: `${baseStyle.filter}, drop-shadow(0px 0px 4px rgba(255, 255, 255, 0.3))`,
      opacity: Math.min((baseStyle.opacity || 1) + 0.1, 1)
    };
  }

  return baseStyle;
};

// 移除复杂的路径计算函数

// 移除连接点指示器组件

// 连接线标签组件
const ConnectionLabel = ({ 
  x, 
  y, 
  label, 
  style 
}: { 
  x: number; 
  y: number; 
  label: string; 
  style: ConnectionLineStyle;
}) => {
  if (!label) return null;

  return (
    <g className="connection-label">
      <rect
        x={x - label.length * 3}
        y={y - 8}
        width={label.length * 6}
        height={16}
        fill="rgba(255, 255, 255, 0.95)"
        stroke={style.stroke}
        strokeWidth="1"
        rx="3"
        ry="3"
      />
      <text
        x={x}
        y={y + 4}
        fontSize="10"
        fontFamily="Arial, sans-serif"
        fontWeight="500"
        fill={style.stroke}
        textAnchor="middle"
        pointerEvents="none"
      >
        {label}
      </text>
    </g>
  );
};

// 移除动画路径组件

// 简化的连接线组件
export function EnhancedConnectionEdge({
  id,
  sourceX,
  sourceY,
  targetX,
  targetY,
  sourcePosition,
  targetPosition,
  style = {},
  selected,
  animated,
  source,
  target,
  sourceHandleId,
  targetHandleId,
  label,
}: EdgeProps) {
  const [isHovered, setIsHovered] = useState(false);

  // 简化的连接类型检测
  const connectionType = useMemo(() => {
    if (sourceHandleId?.includes('positive') || targetHandleId?.includes('positive')) return 'power';
    if (sourceHandleId?.includes('ground') || targetHandleId?.includes('ground')) return 'ground';
    return 'signal';
  }, [sourceHandleId, targetHandleId]);

  // 计算路径 - 使用简单的贝塞尔曲线
  const [edgePath, labelX, labelY] = useMemo(() => {
    try {
      const pathData = getSimpleBezierPath({
        sourceX, sourceY, sourcePosition,
        targetX, targetY, targetPosition
      });
      
      const path = pathData[0];
      const midX = (sourceX + targetX) / 2;
      const midY = (sourceY + targetY) / 2;
      
      return [path, midX, midY];
    } catch (error) {
      console.error('路径计算错误:', error);
      // 回退到直线
      return [`M${sourceX},${sourceY} L${targetX},${targetY}`, (sourceX + targetX) / 2, (sourceY + targetY) / 2];
    }
  }, [sourceX, sourceY, targetX, targetY, sourcePosition, targetPosition]);

  // 获取样式
  const connectionStyle = useMemo(() => {
    const baseStyle = getConnectionTypeStyle(connectionType, !!selected, isHovered);
    return { ...baseStyle, ...style };
  }, [connectionType, selected, isHovered, style]);

  // 事件处理
  const handleMouseEnter = useCallback(() => {
    setIsHovered(true);
  }, []);

  const handleMouseLeave = useCallback(() => {
    setIsHovered(false);
  }, []);

  const handleDoubleClick = useCallback((event: React.MouseEvent) => {
    event.stopPropagation();
    console.log('连接线双击:', { id, connectionType, sourceHandleId, targetHandleId });
  }, [id, connectionType, sourceHandleId, targetHandleId]);

  return (
    <g
      className={`enhanced-connection-edge ${selected ? 'selected' : ''} ${isHovered ? 'hovered' : ''}`}
      onMouseEnter={handleMouseEnter}
      onMouseLeave={handleMouseLeave}
      onDoubleClick={handleDoubleClick}
      data-connection-id={id}
      data-connection-type={connectionType}
      data-source={source}
      data-target={target}
    >
      {/* 主连接路径 */}
      <path
        d={edgePath}
        stroke={connectionStyle.stroke}
        strokeWidth={connectionStyle.strokeWidth}
        fill={connectionStyle.fill}
        strokeLinecap={connectionStyle.strokeLinecap}
        strokeLinejoin={connectionStyle.strokeLinejoin}
        opacity={connectionStyle.opacity}
        className={animated ? 'animated-connection-path' : ''}
      />

      {/* 连接标签 */}
      {label && (
        <ConnectionLabel
          x={labelX}
          y={labelY}
          label={String(label)}
          style={connectionStyle}
        />
      )}

      {/* 电流方向指示器（仅对电源连接显示） */}
      {connectionType === 'power' && (
        <g className="current-flow-indicator">
          <defs>
            <marker
              id={`arrow-${id}`}
              markerWidth="8"
              markerHeight="6"
              refX="7"
              refY="3"
              orient="auto"
              markerUnits="strokeWidth"
            >
              <polygon
                points="0,0 0,6 8,3"
                fill={connectionStyle.stroke}
                opacity={0.8}
              />
            </marker>
          </defs>
          <path
            d={edgePath}
            fill="none"
            stroke="transparent"
            strokeWidth="1"
            markerMid={`url(#arrow-${id})`}
          />
        </g>
      )}

      {/* 调试信息（开发环境） */}
      {process.env.NODE_ENV === 'development' && (selected || isHovered) && (
        <text
          x={labelX}
          y={labelY + 20}
          fontSize="8"
          fill="#6B7280"
          textAnchor="middle"
          className="debug-info"
        >
          {`${sourceHandleId} → ${targetHandleId}`}
        </text>
      )}
    </g>
  );
}

// 简化的连接预览组件
export function EnhancedConnectionPreview({
  fromX,
  fromY,
  fromPosition,
  toX,
  toY,
  toPosition,
  connectionType = 'signal'
}: {
  fromX: number;
  fromY: number;
  fromPosition: any;
  toX: number;
  toY: number;
  toPosition: any;
  connectionType?: string;
}) {
  const [path] = useMemo(() => {
    return getSimpleBezierPath({
      sourceX: fromX, sourceY: fromY, sourcePosition: fromPosition,
      targetX: toX, targetY: toY, targetPosition: toPosition
    });
  }, [fromX, fromY, toX, toY, fromPosition, toPosition]);

  const previewStyle = useMemo(() => {
    const baseStyle = getConnectionTypeStyle(connectionType);
    return {
      ...baseStyle,
      strokeDasharray: '8 4',
      opacity: 0.7,
      filter: 'drop-shadow(0px 0px 6px rgba(59, 130, 246, 0.5))'
    };
  }, [connectionType]);

  return (
    <g className="enhanced-connection-preview">
      {/* 预览路径 */}
      <path
        d={path}
        stroke={previewStyle.stroke}
        strokeWidth={previewStyle.strokeWidth}
        fill={previewStyle.fill}
        strokeLinecap={previewStyle.strokeLinecap}
        strokeLinejoin={previewStyle.strokeLinejoin}
        opacity={previewStyle.opacity}
        className="connection-preview-path"
      />

      {/* 源点指示器 */}
      <circle
        cx={fromX}
        cy={fromY}
        r="6"
        fill={previewStyle.stroke}
        stroke="#fff"
        strokeWidth="2"
        className="preview-source"
      />

      {/* 目标点指示器 */}
      <circle
        cx={toX}
        cy={toY}
        r="8"
        fill="none"
        stroke={previewStyle.stroke}
        strokeWidth="2"
        strokeDasharray="4 2"
        className="preview-target"
      >
        <animate
          attributeName="r"
          values="8;12;8"
          dur="1s"
          repeatCount="indefinite"
        />
      </circle>
    </g>
  );
}

export default EnhancedConnectionEdge;