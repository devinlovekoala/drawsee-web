'use client';

import React from 'react';
import { EdgeProps, ConnectionLineComponentProps, getBezierPath, getSmoothStepPath } from 'reactflow';

// 统一边缘线样式
const edgeStyles = {
  stroke: '#555',
  strokeWidth: 2,
  fill: 'none',
};

// 预览线样式
const previewLineStyle = {
  stroke: '#3B82F6',
  strokeWidth: 2,
  strokeDasharray: '5 5',
  fill: 'none',
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
}: EdgeProps) {
  // 使用getBezierPath创建平滑的曲线路径
  const [edgePath] = getBezierPath({
    sourceX,
    sourceY,
    sourcePosition,
    targetX,
    targetY,
    targetPosition,
    curvature: 0.25, // 控制曲线的曲率
  });

  // 合并默认样式和自定义样式
  const customStyle = {
    ...edgeStyles,
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
      />
      <circle
        cx={targetX}
        cy={targetY}
        r={3}
        fill="#3B82F6"
        stroke="#fff"
        strokeWidth={1.5}
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
  // 使用getSmoothStepPath函数创建平滑的步进路径
  const [path] = getSmoothStepPath({
    sourceX: fromX,
    sourceY: fromY,
    sourcePosition: fromPosition,
    targetX: toX,
    targetY: toY,
    targetPosition: toPosition,
    borderRadius: 10, // 控制拐角的圆角半径
  });

  return (
    <g>
      <path style={previewLineStyle} d={path} />
    </g>
  );
}

// 默认导出已建立的连接线组件
export default ConnectionEdge; 