import React, { useEffect, useMemo, useRef } from 'react';
import { Node } from 'reactflow';
import { SimFrameResult } from '@/simulation/types/simResult';
import { NodeLabelRenderer, RealtimeLabelDensity } from '@/simulation/renderer/NodeLabelRenderer';

export type RealtimeLabelMode = 'hidden' | 'focused' | 'adaptive';

export interface RealtimeOverlayOptions {
  showScopePanels?: boolean;
  labelMode?: RealtimeLabelMode;
}

interface CanvasOverlayProps {
  frameResult: SimFrameResult | null;
  nodes: Node[];
  selectedNodeId?: string | null;
  options?: RealtimeOverlayOptions;
  viewport: {
    x: number;
    y: number;
    zoom: number;
  };
}

const nodeLabelRenderer = new NodeLabelRenderer();
export const CanvasOverlay: React.FC<CanvasOverlayProps> = ({
  frameResult,
  nodes,
  selectedNodeId,
  options,
  viewport,
}) => {
  const hudCanvasRef = useRef<HTMLCanvasElement>(null);

  const bounds = useMemo(() => {
    const maxX = Math.max(0, ...nodes.map((node) => node.position.x + (node.width || 120) + 260));
    const maxY = Math.max(0, ...nodes.map((node) => node.position.y + (node.height || 80) + 140));
    return {
      width: Math.max(1600, Math.ceil(maxX)),
      height: Math.max(900, Math.ceil(maxY)),
    };
  }, [nodes]);

  useEffect(() => {
    const hudCanvas = hudCanvasRef.current;
    if (!hudCanvas || !frameResult) return;

    hudCanvas.width = bounds.width;
    hudCanvas.height = bounds.height;

    const hudContext = hudCanvas.getContext('2d');
    if (!hudContext) return;

    hudContext.clearRect(0, 0, hudCanvas.width, hudCanvas.height);

    const labelMode = options?.labelMode ?? 'adaptive';
    if (labelMode !== 'hidden') {
      nodeLabelRenderer.render(hudContext, nodes, frameResult.elementResults, {
        density: labelMode as RealtimeLabelDensity,
        selectedNodeId,
        zoom: viewport.zoom,
        canvasWidth: bounds.width,
        canvasHeight: bounds.height,
      });
    }
  }, [
    bounds.height,
    bounds.width,
    frameResult,
    nodes,
    options?.labelMode,
    selectedNodeId,
    viewport.zoom,
  ]);

  return (
    <canvas
      ref={hudCanvasRef}
      className="pointer-events-none absolute inset-0 z-[8]"
      style={{
        width: bounds.width,
        height: bounds.height,
        transform: `translate(${viewport.x}px, ${viewport.y}px) scale(${viewport.zoom})`,
        transformOrigin: '0 0',
      }}
    />
  );
};
