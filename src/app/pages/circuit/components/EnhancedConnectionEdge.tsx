/**
 * 增强的连接线组件
 * 提供专业的电路连线视觉效果和交互体验
 */

'use client';

import { useMemo, useEffect, useState, useCallback } from 'react';
import { EdgeProps, getSmoothStepPath, getBezierPath, getSimpleBezierPath } from 'reactflow';
import { ConnectionPointType } from './EnhancedConnectionSystem';

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

// 智能路径计算
const getSmartConnectionPath = (
  { sourceX, sourceY, sourcePosition, targetX, targetY, targetPosition }: any,
  lineType: EnhancedConnectionLineType = 'smooth'
) => {
  const distance = Math.sqrt(Math.pow(targetX - sourceX, 2) + Math.pow(targetY - sourceY, 2));
  
  switch (lineType) {
    case 'straight':
      return [`M${sourceX},${sourceY} L${targetX},${targetY}`, sourceX, sourceY, targetX, targetY];
      
    case 'bezier':
      return getBezierPath({
        sourceX, sourceY, sourcePosition,
        targetX, targetY, targetPosition,
        curvature: Math.min(0.5, distance / 200) // 根据距离调整曲率
      });
      
    case 'step':
      return getSmoothStepPath({
        sourceX, sourceY, sourcePosition,
        targetX, targetY, targetPosition,
        borderRadius: Math.min(12, distance / 20),
        offset: Math.min(20, distance / 10)
      });
      
    case 'manhattan':
      const midX = sourceX + (targetX - sourceX) / 2;
      const midY = sourceY + (targetY - sourceY) / 2;
      return [
        `M${sourceX},${sourceY} H${midX} V${targetY} H${targetX}`,
        midX, midY, targetX, targetY
      ];
      
    case 'orthogonal':
      // 智能正交路径，避免重叠
      const horizontalFirst = Math.abs(targetX - sourceX) > Math.abs(targetY - sourceY);
      if (horizontalFirst) {
        return [
          `M${sourceX},${sourceY} H${targetX} V${targetY}`,
          targetX, sourceY, targetX, targetY
        ];
      } else {
        return [
          `M${sourceX},${sourceY} V${targetY} H${targetX}`,
          sourceX, targetY, targetX, targetY
        ];
      }
      
    case 'smooth':
    default:
      // 默认使用智能平滑路径
      if (distance < 100) {
        // 短距离使用贝塞尔曲线
        return getSimpleBezierPath({
          sourceX, sourceY, sourcePosition,
          targetX, targetY, targetPosition
        });
      } else {
        // 长距离使用步进路径
        return getSmoothStepPath({
          sourceX, sourceY, sourcePosition,
          targetX, targetY, targetPosition,
          borderRadius: 15,
          offset: 25
        });
      }
  }
};

// 连接点指示器组件
const ConnectionEndpoint = ({ 
  x, 
  y, 
  type, 
  style, 
  isSource = false 
}: { 
  x: number; 
  y: number; 
  type: string; 
  style: ConnectionLineStyle;
  isSource?: boolean;
}) => {
  const endpointStyle = useMemo(() => ({
    r: type === 'power' ? 5 : 4,
    fill: style.stroke,
    stroke: '#fff',
    strokeWidth: 1.5,
    filter: 'drop-shadow(0px 0px 2px rgba(0,0,0,0.2))',
  }), [type, style.stroke]);

  return (
    <circle
      cx={x}
      cy={y}
      {...endpointStyle}
      className={`connection-endpoint ${isSource ? 'source' : 'target'}`}
    />
  );
};

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

// 连接线动画效果
const AnimatedConnectionPath = ({ 
  path, 
  style, 
  animated = false 
}: { 
  path: string; 
  style: ConnectionLineStyle; 
  animated: boolean;
}) => {
  const [dashOffset, setDashOffset] = useState(0);

  useEffect(() => {
    if (!animated) return;

    const interval = setInterval(() => {
      setDashOffset(prev => (prev + 1) % 24);
    }, 50);

    return () => clearInterval(interval);
  }, [animated]);

  if (!animated) {
    return <path d={path} {...style} />;
  }

  return (
    <path
      d={path}
      {...style}
      strokeDasharray="8 4"
      strokeDashoffset={dashOffset}
      className="animated-connection-path"
    />
  );
};

// 主要的增强连接线组件
export function EnhancedConnectionEdge({
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
  const [isHovered, setIsHovered] = useState(false);
  const [pathError, setPathError] = useState<string | null>(null);

  // 连接类型检测
  const connectionType = useMemo(() => {
    if (data?.connectionType) return data.connectionType;
    if (data?.sourcePointType === 'power' || data?.targetPointType === 'power') return 'power';
    if (data?.sourcePointType === 'ground' || data?.targetPointType === 'ground') return 'ground';
    if (sourceHandleId?.includes('data') || targetHandleId?.includes('data')) return 'data';
    if (sourceHandleId?.includes('control') || targetHandleId?.includes('control')) return 'control';
    return 'signal';
  }, [data, sourceHandleId, targetHandleId]);

  // 线条类型
  const lineType: EnhancedConnectionLineType = data?.lineType || 'smooth';

  // 计算路径
  const [edgePath, labelX, labelY] = useMemo(() => {
    try {
      const pathData = getSmartConnectionPath(
        { sourceX, sourceY, sourcePosition, targetX, targetY, targetPosition },
        lineType
      );
      
      let path: string;
      let midX: number;
      let midY: number;
      
      if (Array.isArray(pathData)) {
        [path, midX, midY] = pathData;
      } else {
        path = pathData[0];
        midX = (sourceX + targetX) / 2;
        midY = (sourceY + targetY) / 2;
      }
      
      setPathError(null);
      return [path, midX, midY];
    } catch (error) {
      console.error('路径计算错误:', error);
      setPathError('路径计算失败');
      // 回退到直线
      return [`M${sourceX},${sourceY} L${targetX},${targetY}`, (sourceX + targetX) / 2, (sourceY + targetY) / 2];
    }
  }, [sourceX, sourceY, targetX, targetY, sourcePosition, targetPosition, lineType]);

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

  // 连接质量指示器
  const connectionQuality = useMemo(() => {
    const distance = Math.sqrt(Math.pow(targetX - sourceX, 2) + Math.pow(targetY - sourceY, 2));
    if (distance < 50) return 'excellent';
    if (distance < 150) return 'good';
    if (distance < 300) return 'fair';
    return 'poor';
  }, [sourceX, sourceY, targetX, targetY]);

  return (
    <g
      className={`enhanced-connection-edge ${selected ? 'selected' : ''} ${isHovered ? 'hovered' : ''} quality-${connectionQuality}`}
      onMouseEnter={handleMouseEnter}
      onMouseLeave={handleMouseLeave}
      onDoubleClick={handleDoubleClick}
      data-connection-id={id}
      data-connection-type={connectionType}
      data-source={source}
      data-target={target}
    >
      {/* 主连接路径 */}
      <AnimatedConnectionPath
        path={edgePath}
        style={connectionStyle}
        animated={!!animated}
      />

      {/* 错误状态显示 */}
      {pathError && (
        <text
          x={labelX}
          y={labelY}
          fontSize="10"
          fill="#EF4444"
          textAnchor="middle"
          className="path-error-text"
        >
          {pathError}
        </text>
      )}

      {/* 连接点指示器 */}
      <ConnectionEndpoint
        x={sourceX}
        y={sourceY}
        type={connectionType}
        style={connectionStyle}
        isSource={true}
      />
      <ConnectionEndpoint
        x={targetX}
        y={targetY}
        type={connectionType}
        style={connectionStyle}
        isSource={false}
      />

      {/* 连接标签 */}
      {label && (
        <ConnectionLabel
          x={labelX}
          y={labelY}
          label={label}
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

      {/* 连接质量指示器 */}
      {(selected || isHovered) && (
        <g className="connection-quality-indicator">
          <circle
            cx={labelX + 20}
            cy={labelY - 15}
            r="3"
            fill={
              connectionQuality === 'excellent' ? '#10B981' :
              connectionQuality === 'good' ? '#3B82F6' :
              connectionQuality === 'fair' ? '#F59E0B' : '#EF4444'
            }
            stroke="#fff"
            strokeWidth="1"
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

// 连接预览组件（拖拽连接时使用）
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
    return getSmartConnectionPath(
      { sourceX: fromX, sourceY: fromY, sourcePosition: fromPosition,
        targetX: toX, targetY: toY, targetPosition: toPosition },
      'smooth'
    );
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
      <AnimatedConnectionPath
        path={path}
        style={previewStyle}
        animated={true}
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