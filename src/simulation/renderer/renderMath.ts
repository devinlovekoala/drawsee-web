import { ComponentVisualConfig, Port } from '@/api/types/circuit.types';
import { Edge, Node, Position, getBezierPath, getSmoothStepPath } from 'reactflow';
import { Point } from '@/simulation/types/simResult';

const rotatePoint = (point: Point, center: Point, degrees: number): Point => {
  const radians = (degrees * Math.PI) / 180;
  const cos = Math.cos(radians);
  const sin = Math.sin(radians);
  const dx = point.x - center.x;
  const dy = point.y - center.y;
  return {
    x: center.x + (dx * cos) - (dy * sin),
    y: center.y + (dx * sin) + (dy * cos),
  };
};

export const getNodeSize = (node: Node) => {
  const elementType = node.data?.type as keyof typeof ComponentVisualConfig | undefined;
  const fallback = { width: node.width || 80, height: node.height || 48 };
  if (!elementType || !(elementType in ComponentVisualConfig)) {
    return fallback;
  }
  return ComponentVisualConfig[elementType];
};

export const getPortPosition = (node: Node, portId: string): Point => {
  const ports = (node.data?.ports || []) as Port[];
  const port = ports.find((item) => item.id === portId);
  const size = getNodeSize(node);
  const center = {
    x: node.position.x + (size.width / 2),
    y: node.position.y + (size.height / 2),
  };
  const rawPoint = port
    ? {
        x: node.position.x + (size.width * port.position.x) / 100,
        y: node.position.y + (size.height * port.position.y) / 100,
      }
    : center;
  const rotation = Number(node.data?.element?.rotation || 0);
  return rotatePoint(rawPoint, center, rotation);
};

const getPortDirection = (node: Node, portId: string) => {
  const ports = (node.data?.ports || []) as Port[];
  const port = ports.find((item) => item.id === portId);
  const side = port?.position.side || 'left';
  const rotation = Number(node.data?.element?.rotation || 0);

  if (rotation === 0) {
    if (side === 'left') return Position.Left;
    if (side === 'right') return Position.Right;
    if (side === 'top') return Position.Top;
    if (side === 'bottom') return Position.Bottom;
  } else if (rotation === 90) {
    if (side === 'left') return Position.Top;
    if (side === 'right') return Position.Bottom;
    if (side === 'top') return Position.Right;
    if (side === 'bottom') return Position.Left;
  } else if (rotation === 180) {
    if (side === 'left') return Position.Right;
    if (side === 'right') return Position.Left;
    if (side === 'top') return Position.Bottom;
    if (side === 'bottom') return Position.Top;
  } else if (rotation === 270) {
    if (side === 'left') return Position.Bottom;
    if (side === 'right') return Position.Top;
    if (side === 'top') return Position.Left;
    if (side === 'bottom') return Position.Right;
  }

  return Position.Left;
};

const getConnectionPath = (
  {
    sourceX,
    sourceY,
    sourcePosition,
    targetX,
    targetY,
    targetPosition,
  }: {
    sourceX: number;
    sourceY: number;
    sourcePosition: Position;
    targetX: number;
    targetY: number;
    targetPosition: Position;
  },
  type = 'step',
) => {
  switch (type) {
    case 'bezier':
      return getBezierPath({
        sourceX,
        sourceY,
        sourcePosition,
        targetX,
        targetY,
        targetPosition,
        curvature: 0.35,
      })[0];
    case 'straight':
      return `M${sourceX},${sourceY} L${targetX},${targetY}`;
    case 'manhattan': {
      const midX = sourceX + ((targetX - sourceX) / 2);
      return `M${sourceX},${sourceY} H${midX} V${targetY} H${targetX}`;
    }
    case 'step':
    default:
      return getSmoothStepPath({
        sourceX,
        sourceY,
        sourcePosition,
        targetX,
        targetY,
        targetPosition,
        borderRadius: 8,
        offset: 15,
      })[0];
  }
};

const sampleSvgPath = (pathData: string, fallback: Point[]) => {
  if (typeof document === 'undefined' || !pathData) {
    return fallback;
  }

  const path = document.createElementNS('http://www.w3.org/2000/svg', 'path');
  path.setAttribute('d', pathData);

  try {
    const totalLength = path.getTotalLength();
    if (!Number.isFinite(totalLength) || totalLength <= 1e-6) {
      return fallback;
    }
    const sampleCount = Math.max(12, Math.ceil(totalLength / 14));
    const points: Point[] = [];
    for (let index = 0; index <= sampleCount; index += 1) {
      const length = (index / sampleCount) * totalLength;
      const point = path.getPointAtLength(length);
      points.push({ x: point.x, y: point.y });
    }
    return points;
  } catch {
    return fallback;
  }
};

export const buildEdgePoints = (edge: Edge, nodesById: Map<string, Node>): Point[] => {
  const sourceNode = nodesById.get(edge.source);
  const targetNode = nodesById.get(edge.target);
  if (!sourceNode || !targetNode) {
    return [];
  }
  const start = getPortPosition(sourceNode, edge.sourceHandle || 'port1');
  const end = getPortPosition(targetNode, edge.targetHandle || 'port1');
  const fallbackPoints = [
    start,
    { x: start.x + ((end.x - start.x) / 2), y: start.y },
    { x: start.x + ((end.x - start.x) / 2), y: end.y },
    end,
  ];
  const sourcePosition = getPortDirection(sourceNode, edge.sourceHandle || 'port1');
  const targetPosition = getPortDirection(targetNode, edge.targetHandle || 'port1');
  const pathData = getConnectionPath({
    sourceX: start.x,
    sourceY: start.y,
    sourcePosition,
    targetX: end.x,
    targetY: end.y,
    targetPosition,
  }, String(edge.data?.lineType || 'step'));

  return sampleSvgPath(pathData, fallbackPoints);
};
