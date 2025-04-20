'use client';

import React, { useMemo, useEffect, useState } from 'react';
import { EdgeProps, ConnectionLineComponentProps, getSmoothStepPath, getBezierPath } from 'reactflow';

// 统一边缘线样式
const edgeStyles = {
  stroke: '#3B82F6',  // 使用蓝色而不是灰色
  strokeWidth: 2,
  fill: 'none',
};

// 预览线样式
const previewLineStyle = {
  stroke: '#3B82F6',
  strokeWidth: 2.5,
  strokeDasharray: '5 3',
  fill: 'none',
  filter: 'drop-shadow(0px 0px 2px rgba(59, 130, 246, 0.5))',
};

// 选中状态的边缘线样式
const selectedEdgeStyles = {
  ...edgeStyles,
  stroke: '#F59E0B', // 选中时使用橙色
  strokeWidth: 3,
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
}: EdgeProps) {
  // 跟踪是否需要重新计算连线
  const [needsUpdate, setNeedsUpdate] = useState(false);
  
  // 当源节点或目标节点旋转时强制更新
  useEffect(() => {
    if (data && data.forceRefresh) {
      setNeedsUpdate(true);
      // 重置状态
      setTimeout(() => setNeedsUpdate(false), 50);
    }
  }, [data]);
  
  // 使用useMemo缓存路径计算
  const edgePath = useMemo(() => {
    // 使用getSmoothStepPath确保类型兼容性
    const [path] = getSmoothStepPath({
      sourceX,
      sourceY,
      sourcePosition,
      targetX,
      targetY,
      targetPosition,
      borderRadius: 0,
      offset: 5, // 较小的偏移量
    });
    
    return path;
  }, [sourceX, sourceY, targetX, targetY, sourcePosition, targetPosition, needsUpdate]);

  // 合并默认样式和自定义样式，根据是否选中应用不同样式
  const customStyle = {
    ...(selected ? selectedEdgeStyles : edgeStyles),
    ...style,
  };

  return (
    <>
      <path
        id={id}
        style={customStyle}
        className="react-flow__edge-path"
        d={edgePath}
        markerEnd={markerEnd}
        data-source={source}
        data-target={target}
        data-source-handle={sourceHandleId}
        data-target-handle={targetHandleId}
      />
      {animated && (
        <path
          id={`${id}-animation`}
          style={{
            ...customStyle,
            strokeDasharray: '5 5',
            strokeDashoffset: 0,
            animation: 'flow 1s linear infinite',
          }}
          className="react-flow__edge-path-animation"
          d={edgePath}
        />
      )}

      {/* 端点标记 - 使端点位置可见，并提高连接的精确度 */}
      <circle
        cx={sourceX}
        cy={sourceY}
        r={3}
        fill={selected ? '#F59E0B' : '#3B82F6'}
        stroke="#fff"
        strokeWidth={1}
        pointerEvents="none" // 防止干扰用户操作
      />
      <circle
        cx={targetX}
        cy={targetY}
        r={3}
        fill={selected ? '#F59E0B' : '#3B82F6'}
        stroke="#fff"
        strokeWidth={1}
        pointerEvents="none" // 防止干扰用户操作
      />
    </>
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
    // 使用getSmoothStepPath确保类型兼容性
    const [previewPath] = getSmoothStepPath({
      sourceX: fromX,
      sourceY: fromY,
      sourcePosition: fromPosition,
      targetX: toX,
      targetY: toY,
      targetPosition: toPosition,
      borderRadius: 0,
      offset: 5,
    });
    
    return previewPath;
  }, [fromX, fromY, toX, toY, fromPosition, toPosition]);

  return (
    <g>
      <path style={previewLineStyle} d={path} />
      <circle cx={fromX} cy={fromY} r={3} fill="#3B82F6" stroke="#fff" strokeWidth={1} />
      <circle cx={toX} cy={toY} r={3} fill="#3B82F6" stroke="#fff" strokeWidth={1.5} />
    </g>
  );
}

// 默认导出已建立的连接线组件
export default ConnectionEdge; 