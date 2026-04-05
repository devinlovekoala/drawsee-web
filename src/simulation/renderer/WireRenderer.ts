import { EdgeSimResult } from '@/simulation/types/simResult';

export class WireRenderer {
  private interpolateColor(a: [number, number, number], b: [number, number, number], ratio: number) {
    const t = Math.max(0, Math.min(1, ratio));
    return [
      Math.round(a[0] + ((b[0] - a[0]) * t)),
      Math.round(a[1] + ((b[1] - a[1]) * t)),
      Math.round(a[2] + ((b[2] - a[2]) * t)),
    ] as const;
  }

  getVoltageColor(voltage: number, maxVoltage: number) {
    if (maxVoltage <= 1e-9) return 'rgb(120, 136, 160)';
    const ratio = Math.max(-1, Math.min(1, voltage / maxVoltage));
    const neutral: [number, number, number] = [148, 163, 184];
    const positive: [number, number, number] = [245, 158, 11];
    const negative: [number, number, number] = [14, 165, 233];
    const [r, g, b] = ratio >= 0
      ? this.interpolateColor(neutral, positive, ratio)
      : this.interpolateColor(neutral, negative, Math.abs(ratio));
    return `rgb(${r}, ${g}, ${b})`;
  }

  getWireWidth(current: number, maxCurrent: number) {
    if (maxCurrent <= 1e-12) return 2.2;
    const ratio = Math.min(1, Math.abs(current) / maxCurrent);
    return 2.2 + ratio * 1.8;
  }

  private drawPolyline(ctx: CanvasRenderingContext2D, points: EdgeSimResult['points']) {
    if (points.length === 0) return;
    ctx.beginPath();
    ctx.moveTo(points[0].x, points[0].y);
    for (let index = 1; index < points.length; index += 1) {
      ctx.lineTo(points[index].x, points[index].y);
    }
  }

  private getPolylineLength(points: EdgeSimResult['points']) {
    let length = 0;
    for (let index = 1; index < points.length; index += 1) {
      const dx = points[index].x - points[index - 1].x;
      const dy = points[index].y - points[index - 1].y;
      length += Math.hypot(dx, dy);
    }
    return length;
  }

  private getPointAtDistance(points: EdgeSimResult['points'], distance: number) {
    if (points.length === 0) return null;
    if (points.length === 1) return points[0];

    let remaining = Math.max(0, distance);
    for (let index = 1; index < points.length; index += 1) {
      const start = points[index - 1];
      const end = points[index];
      const dx = end.x - start.x;
      const dy = end.y - start.y;
      const segmentLength = Math.hypot(dx, dy);
      if (segmentLength <= 1e-6) continue;
      if (remaining <= segmentLength) {
        const t = remaining / segmentLength;
        return {
          x: start.x + (dx * t),
          y: start.y + (dy * t),
        };
      }
      remaining -= segmentLength;
    }
    return points[points.length - 1];
  }

  private drawCurrentMarkers(
    ctx: CanvasRenderingContext2D,
    edge: EdgeSimResult,
    maxCurrent: number,
    time: number,
  ) {
    const magnitude = Math.abs(edge.current);
    if (magnitude <= 1e-8 || edge.points.length < 2) return;

    const pathLength = this.getPolylineLength(edge.points);
    if (pathLength < 20) return;

    const ratio = maxCurrent <= 1e-12 ? 0 : Math.min(1, magnitude / maxCurrent);
    const spacing = Math.max(32, 52 - (ratio * 18));
    const markerCount = Math.max(1, Math.floor(pathLength / spacing));
    const travel = time * (38 + (ratio * 54)) * Math.sign(edge.current);
    const baseOffset = ((travel % spacing) + spacing) % spacing;

    ctx.save();
    ctx.fillStyle = `rgba(255, 251, 235, ${0.56 + (ratio * 0.24)})`;
    ctx.shadowColor = 'rgba(245, 158, 11, 0.35)';
    ctx.shadowBlur = 8;
    for (let index = 0; index < markerCount; index += 1) {
      const distance = index * spacing + baseOffset;
      const point = this.getPointAtDistance(edge.points, distance % pathLength);
      if (!point) continue;
      ctx.beginPath();
      ctx.arc(point.x, point.y, 1.5 + (ratio * 0.9), 0, Math.PI * 2);
      ctx.fill();
    }
    ctx.restore();
  }

  render(ctx: CanvasRenderingContext2D, edges: EdgeSimResult[], maxVoltage: number, maxCurrent: number, time: number) {
    for (const edge of edges) {
      const voltageColor = this.getVoltageColor(edge.avgVoltage, maxVoltage);
      const wireWidth = this.getWireWidth(edge.current, maxCurrent);

      ctx.save();
      ctx.strokeStyle = 'rgba(226, 232, 240, 0.95)';
      ctx.lineWidth = wireWidth + 2.2;
      ctx.lineCap = 'round';
      ctx.lineJoin = 'round';
      ctx.shadowColor = 'rgba(148, 163, 184, 0.12)';
      ctx.shadowBlur = 6;
      this.drawPolyline(ctx, edge.points);
      ctx.stroke();
      ctx.restore();

      ctx.save();
      ctx.strokeStyle = voltageColor;
      ctx.lineWidth = wireWidth;
      ctx.lineCap = 'round';
      ctx.lineJoin = 'round';
      ctx.shadowColor = voltageColor.replace('rgb(', 'rgba(').replace(')', ', 0.22)');
      ctx.shadowBlur = 10;
      this.drawPolyline(ctx, edge.points);
      ctx.stroke();
      ctx.restore();

      this.drawCurrentMarkers(ctx, edge, maxCurrent, time);

      ctx.save();
      ctx.strokeStyle = 'rgba(255, 255, 255, 0.16)';
      ctx.lineWidth = Math.max(1, wireWidth * 0.32);
      ctx.lineCap = 'round';
      ctx.lineJoin = 'round';
      this.drawPolyline(ctx, edge.points);
      ctx.stroke();
      ctx.restore();
    }
  }
}
