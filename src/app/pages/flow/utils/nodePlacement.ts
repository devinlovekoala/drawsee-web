import type { Node } from '@xyflow/react';
import {
  COMPACT_NODE_HEIGHT,
  COMPACT_NODE_WIDTH,
  FLOW_VERTICAL_SPACING,
  ROOT_NODE_SIZE,
} from '../constants';

type Position = {
  x: number;
  y: number;
};

type Rect = Position & {
  width: number;
  height: number;
};

type ResolvePositionOptions = {
  nodes: Node[];
  movingNodeId: string;
  basePosition: Position;
  anchorY?: number;
  nodeWidth?: number;
  nodeHeight?: number;
  padding?: number;
};

const getNumber = (value: unknown, fallback: number): number => {
  return typeof value === 'number' && Number.isFinite(value) && value > 0 ? value : fallback;
};

const getNodeRect = (node: Node): Rect => {
  const fallbackSize = node.type === 'root' ? ROOT_NODE_SIZE : COMPACT_NODE_WIDTH;
  const fallbackHeight = node.type === 'root' ? ROOT_NODE_SIZE : COMPACT_NODE_HEIGHT;

  return {
    x: node.position.x,
    y: node.position.y,
    width: getNumber(node.width, getNumber(node.data?.layoutWidth, fallbackSize)),
    height: getNumber(node.height, getNumber(node.data?.layoutHeight, getNumber(node.data?.height, fallbackHeight))),
  };
};

const rectsOverlap = (a: Rect, b: Rect, padding: number): boolean => {
  return (
    a.x < b.x + b.width + padding &&
    a.x + a.width + padding > b.x &&
    a.y < b.y + b.height + padding &&
    a.y + a.height + padding > b.y
  );
};

export const resolveNonOverlappingNodePosition = ({
  nodes,
  movingNodeId,
  basePosition,
  anchorY = basePosition.y,
  nodeWidth = COMPACT_NODE_WIDTH,
  nodeHeight = COMPACT_NODE_HEIGHT,
  padding = 18,
}: ResolvePositionOptions): Position => {
  const stepY = nodeHeight + FLOW_VERTICAL_SPACING;
  const maxAttempts = Math.max(24, nodes.length + 6);
  const candidatePositions = Array.from({ length: maxAttempts * 2 + 1 }, (_, index) => {
    const offset = index - maxAttempts;
    return {
      x: basePosition.x,
      y: basePosition.y + offset * stepY,
    };
  })
    .filter(candidate => candidate.y >= 0)
    .sort((a, b) => {
      const distanceA = Math.abs(a.y - anchorY);
      const distanceB = Math.abs(b.y - anchorY);
      if (distanceA !== distanceB) return distanceA - distanceB;
      if (a.y === b.y) return 0;
      return a.y > anchorY ? -1 : 1;
    });

  for (const candidate of candidatePositions) {
    const candidateRect = {
      ...candidate,
      width: nodeWidth,
      height: nodeHeight,
    };
    const hasCollision = nodes.some(node => {
      if (node.id === movingNodeId) return false;
      return rectsOverlap(candidateRect, getNodeRect(node), padding);
    });

    if (!hasCollision) {
      return candidate;
    }
  }

  return {
    x: basePosition.x,
    y: basePosition.y + maxAttempts * stepY,
  };
};
