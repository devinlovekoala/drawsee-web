import React, { useEffect, useMemo, useRef } from 'react';
import { Node } from 'reactflow';
import { SimFrameResult } from '@/simulation/types/simResult';
import { WireRenderer } from '@/simulation/renderer/WireRenderer';
import { NodeLabelRenderer } from '@/simulation/renderer/NodeLabelRenderer';
import { ScopeRenderer } from '@/simulation/renderer/ScopeRenderer';

interface CanvasOverlayProps {
  frameResult: SimFrameResult | null;
  nodes: Node[];
  viewport: {
    x: number;
    y: number;
    zoom: number;
  };
}

const wireRenderer = new WireRenderer();
const nodeLabelRenderer = new NodeLabelRenderer();
const scopeRenderer = new ScopeRenderer();

export const CanvasOverlay: React.FC<CanvasOverlayProps> = ({ frameResult, nodes, viewport }) => {
  const wireCanvasRef = useRef<HTMLCanvasElement>(null);
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
    const wireCanvas = wireCanvasRef.current;
    const hudCanvas = hudCanvasRef.current;
    if (!wireCanvas || !hudCanvas || !frameResult) return;

    wireCanvas.width = bounds.width;
    wireCanvas.height = bounds.height;
    hudCanvas.width = bounds.width;
    hudCanvas.height = bounds.height;

    const wireContext = wireCanvas.getContext('2d');
    const hudContext = hudCanvas.getContext('2d');
    if (!wireContext || !hudContext) return;

    wireContext.clearRect(0, 0, wireCanvas.width, wireCanvas.height);
    hudContext.clearRect(0, 0, hudCanvas.width, hudCanvas.height);

    wireRenderer.render(wireContext, frameResult.edgeResults, frameResult.maxVoltage, frameResult.maxCurrent, frameResult.time);
    nodeLabelRenderer.render(hudContext, nodes, frameResult.elementResults);
    scopeRenderer.render(hudContext, frameResult.scopePanels);
  }, [bounds.height, bounds.width, frameResult, nodes]);

  return (
    <>
      <canvas
        ref={wireCanvasRef}
        className="pointer-events-none absolute inset-0 z-[1] opacity-95"
        style={{
          width: bounds.width,
          height: bounds.height,
          transform: `translate(${viewport.x}px, ${viewport.y}px) scale(${viewport.zoom})`,
          transformOrigin: '0 0',
        }}
      />
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
    </>
  );
};
