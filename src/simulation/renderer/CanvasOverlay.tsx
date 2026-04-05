import React, { useEffect, useMemo, useRef } from 'react';
import { Node } from 'reactflow';
import { SimFrameResult } from '@/simulation/types/simResult';
import { NodeLabelRenderer, RealtimeLabelDensity } from '@/simulation/renderer/NodeLabelRenderer';
import { ScopeRenderer } from '@/simulation/renderer/ScopeRenderer';

export interface RealtimeOverlayOptions {
  showLabels?: boolean;
  showScopePanels?: boolean;
  labelDensity?: RealtimeLabelDensity;
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
const scopeRenderer = new ScopeRenderer();

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

    if (options?.showLabels ?? true) {
      nodeLabelRenderer.render(hudContext, nodes, frameResult.elementResults, {
        density: options?.labelDensity ?? 'adaptive',
        selectedNodeId,
        zoom: viewport.zoom,
        canvasWidth: bounds.width,
        canvasHeight: bounds.height,
      });
    }
    const shouldShowScopePanels = (options?.showScopePanels ?? true) && viewport.zoom >= 0.85;
    if (shouldShowScopePanels) {
      scopeRenderer.render(hudContext, frameResult.scopePanels);
    }
  }, [
    bounds.height,
    bounds.width,
    frameResult,
    nodes,
    options?.labelDensity,
    options?.showScopePanels,
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
