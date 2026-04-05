import { Node } from 'reactflow';
import { ElementSimResult } from '@/simulation/types/simResult';
import { formatValue } from '@/simulation/utils/formatValue';
import { getNodeSize } from './renderMath';

export type RealtimeLabelDensity = 'focused' | 'adaptive' | 'all';

interface NodeLabelRenderOptions {
  density?: RealtimeLabelDensity;
  selectedNodeId?: string | null;
  zoom?: number;
  canvasWidth?: number;
  canvasHeight?: number;
}

interface LabelLayout {
  cardX: number;
  cardY: number;
  cardWidth: number;
  cardHeight: number;
  anchorX: number;
  anchorY: number;
  compact: boolean;
  labelFontSize: number;
  valueFontSize: number;
  tetherStartX: number;
  tetherStartY: number;
  tetherEndX: number;
  tetherEndY: number;
}

interface LabelBoxMetrics {
  cardWidth: number;
  cardHeight: number;
  compact: boolean;
  labelFontSize: number;
  valueFontSize: number;
}

type Rect = {
  x: number;
  y: number;
  width: number;
  height: number;
};

const drawRoundedRect = (
  ctx: CanvasRenderingContext2D,
  x: number,
  y: number,
  width: number,
  height: number,
  radius: number,
) => {
  ctx.beginPath();
  if ('roundRect' in ctx) {
    ctx.roundRect(x, y, width, height, radius);
  } else {
    ctx.moveTo(x + radius, y);
    ctx.arcTo(x + width, y, x + width, y + height, radius);
    ctx.arcTo(x + width, y + height, x, y + height, radius);
    ctx.arcTo(x, y + height, x, y, radius);
    ctx.arcTo(x, y, x + width, y, radius);
  }
  ctx.closePath();
};

export class NodeLabelRenderer {
  private clamp(value: number, min: number, max: number) {
    return Math.min(max, Math.max(min, value));
  }

  private intersects(a: Rect, b: Rect) {
    return !(
      a.x + a.width <= b.x ||
      b.x + b.width <= a.x ||
      a.y + a.height <= b.y ||
      b.y + b.height <= a.y
    );
  }

  private pickVisibleNodeIds(
    nodes: Node[],
    results: Record<string, ElementSimResult>,
    options: NodeLabelRenderOptions,
  ) {
    const density = options.density ?? 'adaptive';
    const selectedNodeId = options.selectedNodeId || null;
    const zoom = options.zoom ?? 1;
    const ranked = nodes
      .map((node) => ({
        node,
        result: results[node.id],
      }))
      .filter((item): item is { node: Node; result: ElementSimResult } => Boolean(item.result))
      .sort((a, b) => {
        const scoreA = Math.abs(a.result.current) * 10 + Math.abs(a.result.voltage);
        const scoreB = Math.abs(b.result.current) * 10 + Math.abs(b.result.voltage);
        return scoreB - scoreA;
      });

    if (density === 'all') {
      return new Set(ranked.map((item) => item.node.id));
    }

    if (density === 'focused') {
      if (selectedNodeId && results[selectedNodeId]) {
        return new Set([selectedNodeId]);
      }
      return new Set(ranked.slice(0, 5).map((item) => item.node.id));
    }

    const maxCount =
      zoom < 0.55 ? 4 :
      zoom < 0.75 ? 8 :
      zoom < 0.95 ? 16 :
      Number.POSITIVE_INFINITY;
    const preferred: string[] = [];
    if (selectedNodeId && results[selectedNodeId]) {
      preferred.push(selectedNodeId);
    }
    for (const item of ranked) {
      if (preferred.length >= maxCount) break;
      if (!preferred.includes(item.node.id)) {
        preferred.push(item.node.id);
      }
    }
    return new Set(preferred);
  }

  private buildMetrics(node: Node, zoom: number): LabelBoxMetrics {
    const size = getNodeSize(node);
    const compact = zoom < 0.9;
    const labelScale = this.clamp(size.width / 120, 0.82, 1.25);
    const resultScale = this.clamp(size.height / 72, 0.85, 1.2);
    const cardHeight = Math.round(this.clamp(size.height * (compact ? 0.34 : 0.42), 26, 40));
    const cardWidth = this.clamp(
      Math.round(Math.max(104, (size.width * (compact ? 1.08 : 1.18)) + (compact ? 12 : 22))),
      96,
      compact ? 156 : 188,
    );

    return {
      cardWidth,
      cardHeight,
      compact,
      labelFontSize: Math.round(this.clamp((compact ? 10 : 11) * labelScale, 10, 13)),
      valueFontSize: Math.round(this.clamp((compact ? 9 : 10) * resultScale, 9, 12)),
    };
  }

  private buildCandidateLayouts(
    node: Node,
    metrics: LabelBoxMetrics,
    canvasWidth: number,
    canvasHeight: number,
  ): LabelLayout[] {
    const size = getNodeSize(node);
    const centerX = node.position.x + (size.width / 2);
    const centerY = node.position.y + (size.height / 2);
    const gap = Math.max(10, Math.round(Math.min(size.width, size.height) * 0.18));
    const cardWidth = metrics.cardWidth;
    const cardHeight = metrics.cardHeight;

    const placements = [
      {
        cardX: centerX - (cardWidth / 2),
        cardY: node.position.y - cardHeight - gap,
        tetherStartX: centerX,
        tetherStartY: node.position.y,
        tetherEndX: centerX,
        tetherEndY: node.position.y - gap + 2,
      },
      {
        cardX: centerX - (cardWidth / 2),
        cardY: node.position.y + size.height + gap,
        tetherStartX: centerX,
        tetherStartY: node.position.y + size.height,
        tetherEndX: centerX,
        tetherEndY: node.position.y + size.height + gap - 2,
      },
      {
        cardX: node.position.x + size.width + gap,
        cardY: centerY - (cardHeight / 2),
        tetherStartX: node.position.x + size.width,
        tetherStartY: centerY,
        tetherEndX: node.position.x + size.width + gap - 2,
        tetherEndY: centerY,
      },
      {
        cardX: node.position.x - cardWidth - gap,
        cardY: centerY - (cardHeight / 2),
        tetherStartX: node.position.x,
        tetherStartY: centerY,
        tetherEndX: node.position.x - gap + 2,
        tetherEndY: centerY,
      },
    ];

    return placements.map((placement) => ({
      ...placement,
      cardX: this.clamp(placement.cardX, 8, Math.max(8, canvasWidth - cardWidth - 8)),
      cardY: this.clamp(placement.cardY, 8, Math.max(8, canvasHeight - cardHeight - 8)),
      cardWidth,
      cardHeight,
      compact: metrics.compact,
      labelFontSize: metrics.labelFontSize,
      valueFontSize: metrics.valueFontSize,
      anchorX: centerX,
      anchorY: centerY,
    }));
  }

  private resolveLayout(
    node: Node,
    metrics: LabelBoxMetrics,
    occupied: Rect[],
    options: NodeLabelRenderOptions,
  ) {
    const canvasWidth = options.canvasWidth ?? 4096;
    const canvasHeight = options.canvasHeight ?? 4096;
    const candidates = this.buildCandidateLayouts(node, metrics, canvasWidth, canvasHeight);

    for (const candidate of candidates) {
      const rect = {
        x: candidate.cardX - 4,
        y: candidate.cardY - 4,
        width: candidate.cardWidth + 8,
        height: candidate.cardHeight + 8,
      };
      if (!occupied.some((item) => this.intersects(item, rect))) {
        occupied.push(rect);
        return candidate;
      }
    }

    const fallback = candidates[0];
    occupied.push({
      x: fallback.cardX - 4,
      y: fallback.cardY - 4,
      width: fallback.cardWidth + 8,
      height: fallback.cardHeight + 8,
    });
    return fallback;
  }

  render(
    ctx: CanvasRenderingContext2D,
    nodes: Node[],
    results: Record<string, ElementSimResult>,
    options: NodeLabelRenderOptions = {},
  ) {
    const visibleNodeIds = this.pickVisibleNodeIds(nodes, results, options);
    const visibleNodes = nodes
      .filter((node) => visibleNodeIds.has(node.id) && results[node.id])
      .sort((a, b) => {
        if (a.id === options.selectedNodeId) return -1;
        if (b.id === options.selectedNodeId) return 1;
        return a.position.y - b.position.y || a.position.x - b.position.x;
      });
    const occupied: Rect[] = [];
    ctx.save();
    ctx.textBaseline = 'middle';
    for (const node of visibleNodes) {
      const result = results[node.id];
      if (!result) continue;
      const metrics = this.buildMetrics(node, options.zoom ?? 1);
      const layout = this.resolveLayout(node, metrics, occupied, options);
      const {
        cardX,
        cardY,
        cardWidth,
        cardHeight,
        compact,
        labelFontSize,
        valueFontSize,
        tetherStartX,
        tetherStartY,
        tetherEndX,
        tetherEndY,
      } = layout;
      const isSelected = options.selectedNodeId === node.id;
      const accent = isSelected ? '#2563eb' : Math.abs(result.voltage) > Math.abs(result.current) ? '#f59e0b' : '#0ea5e9';
      const opacity = isSelected ? 1 : result.isActive ? 0.96 : 0.82;
      const labelX = cardX + 24;
      const labelY = cardY + (compact ? 8 : 11);
      const voltageText = `V ${formatValue(result.voltage, 'V')}`;
      const currentText = `I ${formatValue(result.current, 'A')}`;

      ctx.save();
      ctx.strokeStyle = isSelected ? 'rgba(37, 99, 235, 0.32)' : 'rgba(148, 163, 184, 0.30)';
      ctx.lineWidth = 1;
      ctx.beginPath();
      ctx.moveTo(tetherStartX, tetherStartY);
      ctx.lineTo(tetherEndX, tetherEndY);
      ctx.stroke();

      ctx.shadowColor = 'rgba(15, 23, 42, 0.11)';
      ctx.shadowBlur = compact ? 10 : 14;
      ctx.fillStyle = isSelected
        ? `rgba(239, 246, 255, ${0.96 * opacity})`
        : `rgba(255, 255, 255, ${0.92 * opacity})`;
      drawRoundedRect(ctx, cardX, cardY, cardWidth, cardHeight, compact ? 9 : 11);
      ctx.fill();

      ctx.shadowBlur = 0;
      ctx.strokeStyle = isSelected ? 'rgba(147, 197, 253, 0.95)' : 'rgba(203, 213, 225, 0.88)';
      ctx.stroke();

      ctx.fillStyle = accent;
      ctx.beginPath();
      ctx.arc(cardX + 12, cardY + (compact ? 10 : 11), compact ? 3 : 3.5, 0, Math.PI * 2);
      ctx.fill();

      ctx.font = `600 ${labelFontSize}px ui-sans-serif, system-ui, sans-serif`;
      ctx.fillStyle = '#0f172a';
      ctx.fillText(result.label, labelX, labelY);

      ctx.fillStyle = '#475569';
      ctx.font = `${valueFontSize}px ui-monospace, SFMono-Regular, Menlo, monospace`;
      if (compact || cardWidth < 154) {
        const combined = `${voltageText}   ${currentText}`;
        ctx.fillText(combined, cardX + 10, cardY + cardHeight - 7);
      } else {
        ctx.fillText(voltageText, cardX + 10, cardY + cardHeight - 8);
        ctx.fillText(currentText, cardX + (cardWidth / 2) + 4, cardY + cardHeight - 8);
      }
      ctx.restore();
    }
    ctx.restore();
  }
}
