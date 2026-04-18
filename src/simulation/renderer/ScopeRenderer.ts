import { ScopePanelResult } from '@/simulation/types/simResult';

const COLORS = ['#38bdf8', '#f59e0b', '#34d399', '#f472b6'];

export const scopeTraceColor = (index: number) => COLORS[index % COLORS.length];

const drawRoundedRect = (
  ctx: CanvasRenderingContext2D,
  width: number,
  height: number,
  radius: number,
) => {
  ctx.beginPath();
  if ('roundRect' in ctx) {
    ctx.roundRect(0, 0, width, height, radius);
  } else {
    ctx.moveTo(radius, 0);
    ctx.arcTo(width, 0, width, height, radius);
    ctx.arcTo(width, height, 0, height, radius);
    ctx.arcTo(0, height, 0, 0, radius);
    ctx.arcTo(0, 0, width, 0, radius);
  }
  ctx.closePath();
};

export class ScopeRenderer {
  render(ctx: CanvasRenderingContext2D, panels: ScopePanelResult[]) {
    for (const panel of panels) {
      ctx.save();
      ctx.translate(panel.position.x, panel.position.y);
      ctx.shadowColor = 'rgba(15, 23, 42, 0.18)';
      ctx.shadowBlur = 18;
      ctx.fillStyle = 'rgba(248, 250, 252, 0.96)';
      drawRoundedRect(ctx, panel.width, panel.height, 12);
      ctx.fill();
      ctx.shadowBlur = 0;
      ctx.strokeStyle = 'rgba(203, 213, 225, 0.88)';
      ctx.stroke();

      const headerHeight = 22;
      ctx.fillStyle = 'rgba(241, 245, 249, 0.95)';
      drawRoundedRect(ctx, panel.width, headerHeight, 12);
      ctx.fill();

      ctx.save();
      ctx.beginPath();
      ctx.rect(8, headerHeight + 6, panel.width - 16, panel.height - headerHeight - 14);
      ctx.clip();

      ctx.strokeStyle = 'rgba(148, 163, 184, 0.16)';
      for (let x = 8; x <= panel.width - 8; x += (panel.width - 16) / 6) {
        ctx.beginPath();
        ctx.moveTo(x, headerHeight + 6);
        ctx.lineTo(x, panel.height - 8);
        ctx.stroke();
      }
      for (let y = headerHeight + 6; y <= panel.height - 8; y += (panel.height - headerHeight - 14) / 4) {
        ctx.beginPath();
        ctx.moveTo(8, y);
        ctx.lineTo(panel.width - 8, y);
        ctx.stroke();
      }
      ctx.restore();

      ctx.fillStyle = '#0f172a';
      ctx.font = '600 10px ui-sans-serif, system-ui';
      ctx.textBaseline = 'middle';
      ctx.fillText(panel.label, 10, headerHeight / 2);

      panel.traces.forEach((trace, traceIndex) => {
        if (trace.samples.length < 2) return;
        const values = trace.samples.map((sample) => sample.value);
        const min = Math.min(...values);
        const max = Math.max(...values);
        const span = Math.max(1e-6, max - min);
        const traceColor = trace.color || scopeTraceColor(traceIndex);
        const badgeX = panel.width - 12 - (traceIndex * 54);
        ctx.fillStyle = traceColor;
        ctx.fillRect(badgeX - 24, 8, 8, 8);
        ctx.fillStyle = '#475569';
        ctx.font = '9px ui-sans-serif, system-ui';
        ctx.fillText(trace.label.slice(0, 4), badgeX - 12, headerHeight / 2);

        ctx.strokeStyle = traceColor;
        ctx.lineWidth = 1.8;
        ctx.shadowColor = traceColor;
        ctx.shadowBlur = 6;
        ctx.beginPath();
        trace.samples.forEach((sample, index) => {
          const x = (index / Math.max(1, trace.samples.length - 1)) * (panel.width - 16) + 8;
          const y = panel.height - 8 - (((sample.value - min) / span) * (panel.height - headerHeight - 18)) - 2;
          if (index === 0) ctx.moveTo(x, y);
          else ctx.lineTo(x, y);
        });
        ctx.stroke();
        ctx.shadowBlur = 0;
      });
      ctx.restore();
    }
  }
}
