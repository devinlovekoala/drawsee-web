'use client';

import React from 'react';
import { ConnectionLineComponentProps, getBezierPath } from 'reactflow';

export const ConnectionLine = ({
  fromX,
  fromY,
  fromPosition,
  toX,
  toY,
  toPosition,
}: ConnectionLineComponentProps) => {
  const [edgePath] = getBezierPath({
    sourceX: fromX,
    sourceY: fromY,
    sourcePosition: fromPosition,
    targetX: toX,
    targetY: toY,
    targetPosition: toPosition,
  });

  return (
    <g>
      <path
        d={edgePath}
        fill="none"
        stroke="#555"
        strokeWidth={2}
        className="animated"
      />
    </g>
  );
};