'use client';

import React, { memo } from 'react';
import { 
  EdgeProps, 
  getBezierPath, 
  EdgeLabelRenderer,
  BaseEdge
} from 'reactflow';

type CustomEdgeProps = EdgeProps & {
  id: string;
  source: string;
  target: string;
  style?: React.CSSProperties;
};

export const ConnectionLine = memo(({
  id,
  source,
  target,
  sourceX,
  sourceY,
  targetX,
  targetY,
  sourcePosition,
  targetPosition,
  style = {},
}: CustomEdgeProps) => {
  const [edgePath, labelX, labelY] = getBezierPath({
    sourceX,
    sourceY,
    sourcePosition,
    targetX,
    targetY,
    targetPosition,
  });

  return (
    <>
      <BaseEdge path={edgePath} id={id} style={{ stroke: '#334155', strokeWidth: 2, ...style }} />
      <EdgeLabelRenderer>
        <div
          style={{
            position: 'absolute',
            transform: `translate(-50%, -50%) translate(${labelX}px,${labelY}px)`,
            fontSize: 12,
            pointerEvents: 'all',
          }}
        >
          <button
            className="nodrag nopan"
            style={{
              width: 20,
              height: 20,
              background: 'white',
              border: '1px solid #334155',
              borderRadius: '50%',
              fontSize: 12,
              display: 'flex',
              alignItems: 'center',
              justifyContent: 'center',
              cursor: 'pointer',
            }}
            onClick={() => {
              console.log(`Clicked on edge ${id} connecting ${source} to ${target}`);
            }}
          >
            x
          </button>
        </div>
      </EdgeLabelRenderer>
    </>
  );
});

ConnectionLine.displayName = 'ConnectionLine';