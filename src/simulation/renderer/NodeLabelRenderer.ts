import { Node } from 'reactflow';
import { ElementSimResult } from '@/simulation/types/simResult';
import { formatValue } from '@/simulation/utils/formatValue';
import { getNodeSize } from './renderMath';

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
  render(ctx: CanvasRenderingContext2D, nodes: Node[], results: Record<string, ElementSimResult>) {
    ctx.save();
    ctx.textBaseline = 'middle';
    for (const node of nodes) {
      const result = results[node.id];
      if (!result) continue;
      const size = getNodeSize(node);
      const centerX = node.position.x + (size.width / 2);
      ctx.font = '600 11px ui-sans-serif, system-ui, sans-serif';
      const labelWidth = ctx.measureText(result.label).width;
      ctx.font = '10px ui-monospace, SFMono-Regular, Menlo, monospace';
      const metricWidth = ctx.measureText(`V ${formatValue(result.voltage, 'V')}`).width
        + ctx.measureText(`I ${formatValue(result.current, 'A')}`).width;
      const cardWidth = Math.max(112, Math.ceil(Math.max(labelWidth + 40, metricWidth + 58)));
      const cardHeight = 34;
      const topPlacementY = node.position.y - cardHeight - 14;
      const cardY = topPlacementY < 8 ? node.position.y + size.height + 10 : topPlacementY;
      const cardX = centerX - (cardWidth / 2);
      const anchorY = cardY > node.position.y ? node.position.y + size.height : node.position.y;
      const accent = Math.abs(result.voltage) > Math.abs(result.current) ? '#f59e0b' : '#0ea5e9';
      const opacity = result.isActive ? 1 : 0.82;

      ctx.save();
      ctx.strokeStyle = 'rgba(148, 163, 184, 0.36)';
      ctx.lineWidth = 1;
      ctx.beginPath();
      ctx.moveTo(centerX, anchorY + (cardY > node.position.y ? 6 : -6));
      ctx.lineTo(centerX, cardY > node.position.y ? cardY - 4 : cardY + cardHeight + 4);
      ctx.stroke();

      ctx.shadowColor = 'rgba(15, 23, 42, 0.12)';
      ctx.shadowBlur = 14;
      ctx.fillStyle = `rgba(255, 255, 255, ${0.88 * opacity})`;
      drawRoundedRect(ctx, cardX, cardY, cardWidth, cardHeight, 10);
      ctx.fill();

      ctx.shadowBlur = 0;
      ctx.strokeStyle = 'rgba(203, 213, 225, 0.9)';
      ctx.stroke();

      ctx.fillStyle = accent;
      ctx.beginPath();
      ctx.arc(cardX + 12, cardY + 11, 3.5, 0, Math.PI * 2);
      ctx.fill();

      ctx.font = '600 11px ui-sans-serif, system-ui, sans-serif';
      ctx.fillStyle = '#0f172a';
      ctx.fillText(result.label, cardX + 22, cardY + 11);

      ctx.font = '10px ui-monospace, SFMono-Regular, Menlo, monospace';
      ctx.fillStyle = '#475569';
      ctx.fillText(`V ${formatValue(result.voltage, 'V')}`, cardX + 10, cardY + 24);
      ctx.fillText(`I ${formatValue(result.current, 'A')}`, cardX + (cardWidth / 2), cardY + 24);
      ctx.restore();
    }
    ctx.restore();
  }
}
