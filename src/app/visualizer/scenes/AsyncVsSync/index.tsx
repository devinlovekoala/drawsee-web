import { useState, useEffect, useRef } from 'react';
import * as d3 from 'd3';

const ROW_H = 48;
const CLK_COLOR = '#64748b';
const SYNC_COLORS = ['#38bdf8', '#a78bfa', '#86efac'];
const ASYNC_COLORS = ['#fb923c', '#f472b6', '#fbbf24'];
const GLITCH_COLOR = '#ef4444';
const PROP_DELAY = 0.3;

interface WavePoint { t: number; v: number }

function buildSyncWaves(bits: number, cycles: number) {
  return Array.from({ length: bits }, (_, idx) => {
    const b = bits - 1 - idx;
    const pts: WavePoint[] = Array.from({ length: cycles * 100 + 1 }, (_, i) => {
      const t = i / 100;
      return { t, v: (Math.floor(t * 2) >> b) & 1 };
    });
    return { name: `Q${b}(同步)`, pts, color: SYNC_COLORS[idx % SYNC_COLORS.length] };
  });
}

function buildAsyncWaves(bits: number, cycles: number) {
  return Array.from({ length: bits }, (_, idx) => {
    const b = bits - 1 - idx;
    const delay = PROP_DELAY * idx;
    const pts: WavePoint[] = Array.from({ length: cycles * 100 + 1 }, (_, i) => {
      const t = i / 100;
      const dt = Math.max(0, t - delay);
      return { t, v: (Math.floor(dt * 2) >> b) & 1 };
    });
    const glitches = delay > 0
      ? Array.from({ length: cycles * 2 }, (_, k) => ({ t: k / 2 }))
      : [];
    return { name: `Q${b}(异步)`, pts, color: ASYNC_COLORS[idx % ASYNC_COLORS.length], glitches, delay };
  });
}

interface ChartProps { bits: number; cycles: number; width?: number }

function CompareChart({ bits, cycles, width = 700 }: ChartProps) {
  const totalRows = 1 + bits * 2;
  const svgHeight = totalRows * ROW_H + 40;
  const svgRef = useRef<SVGSVGElement>(null);

  useEffect(() => {
    if (!svgRef.current) return;

    const margin = { top: 16, right: 16, bottom: 24, left: 72 };
    const W = width - margin.left - margin.right;
    const H = svgHeight - margin.top - margin.bottom;

    const svg = d3.select(svgRef.current);
    svg.selectAll('*').remove();
    svg.attr('width', width).attr('height', svgHeight);

    const g = svg.append('g').attr('transform', `translate(${margin.left},${margin.top})`);
    const xScale = d3.scaleLinear().domain([0, cycles]).range([0, W]);
    const rowH = H / totalRows;

    const drawWave = (pts: WavePoint[], rowIndex: number, color: string, label: string) => {
      const y0 = rowIndex * rowH;
      const yLow = y0 + rowH * 0.75;
      const yHigh = y0 + rowH * 0.15;
      g.append('text').attr('x', -4).attr('y', y0 + rowH / 2 + 4)
        .attr('text-anchor', 'end').attr('fill', color).attr('font-size', 9).attr('font-weight', 600).text(label);
      const path: string[] = [];
      pts.forEach((p, i) => {
        const x = xScale(p.t);
        const y = p.v === 1 ? yHigh : yLow;
        if (i === 0) { path.push(`M${x},${y}`); return; }
        const prevY = pts[i - 1].v === 1 ? yHigh : yLow;
        if (prevY !== y) path.push(`L${x},${prevY}`, `L${x},${y}`);
        else path.push(`L${x},${y}`);
      });
      g.append('path').attr('d', path.join(' ')).attr('fill', 'none').attr('stroke', color).attr('stroke-width', 1.8);
    };

    const clkPts: WavePoint[] = Array.from({ length: cycles * 100 + 1 }, (_, i) => ({
      t: i / 100, v: Math.floor(i / 50) % 2,
    }));
    drawWave(clkPts, 0, CLK_COLOR, 'CLK');

    const syncWaves = buildSyncWaves(bits, cycles);
    syncWaves.forEach((w, i) => drawWave(w.pts, i + 1, w.color, w.name));

    const asyncWaves = buildAsyncWaves(bits, cycles);
    asyncWaves.forEach((w, i) => {
      const rowIdx = bits + 1 + i;
      drawWave(w.pts, rowIdx, w.color, w.name);
      if (w.delay > 0) {
        const winW = xScale(w.delay) - xScale(0);
        w.glitches.slice(0, cycles * 2).forEach(gl => {
          g.append('rect')
            .attr('x', xScale(gl.t)).attr('y', rowIdx * rowH + rowH * 0.1)
            .attr('width', Math.max(2, winW)).attr('height', rowH * 0.8)
            .attr('fill', GLITCH_COLOR).attr('opacity', 0.15);
        });
      }
    });

    const states = 1 << bits;
    for (let t = 0; t < cycles; t++) {
      const cx = xScale(t) + (xScale(1) - xScale(0)) / 2;
      g.append('text').attr('x', cx).attr('y', H + 16)
        .attr('text-anchor', 'middle').attr('fill', '#94a3b8').attr('font-size', 9)
        .text((t % states).toString(16).toUpperCase());
    }

    const divY = (bits + 1) * rowH;
    g.append('line').attr('x1', 0).attr('y1', divY).attr('x2', W).attr('y2', divY)
      .attr('stroke', '#334155').attr('stroke-dasharray', '6,3').attr('stroke-width', 1).attr('opacity', 0.5);

  }, [bits, cycles, width, svgHeight, totalRows]);

  return <svg ref={svgRef} />;
}

export function AsyncVsSyncScene() {
  const [bits, setBits] = useState(3);
  const cycles = (1 << bits) * 2;

  return (
    <div className="space-y-5">
      <div className="rounded-lg border border-neutral-200 bg-slate-900 overflow-x-auto">
        <CompareChart bits={bits} cycles={cycles} width={700} />
      </div>

      <div className="flex items-center gap-3">
        <span className="text-xs text-neutral-500 shrink-0">计数器位数</span>
        <div className="flex gap-1.5">
          {[2, 3].map(b => (
            <button key={b} onClick={() => setBits(b)}
              className={`px-4 py-1.5 rounded text-sm font-medium transition-colors border ${
                bits === b ? 'border-blue-500 bg-blue-50 text-blue-700' : 'border-neutral-200 bg-white text-neutral-500 hover:bg-neutral-50'
              }`}>
              {b} 位
            </button>
          ))}
        </div>
      </div>

      <div className="grid grid-cols-2 gap-3">
        <div className="rounded-lg border border-blue-200 bg-blue-50 p-3">
          <div className="text-xs font-semibold text-blue-700 mb-1">同步计数器</div>
          <div className="text-[11px] text-blue-600 space-y-0.5">
            <div>· 所有触发器共享同一时钟</div>
            <div>· 输出同时翻转，无延迟累积</div>
            <div>· 无竞争冒险（Hazard-free）</div>
          </div>
        </div>
        <div className="rounded-lg border border-orange-200 bg-orange-50 p-3">
          <div className="text-xs font-semibold text-orange-700 mb-1">异步计数器（涟漪计数器）</div>
          <div className="text-[11px] text-orange-600 space-y-0.5">
            <div>· 每级由上级输出驱动</div>
            <div>· 延迟随位数线性累积</div>
            <div>· 红色区域为竞争冒险窗口</div>
          </div>
        </div>
      </div>

      <p className="text-[10px] text-neutral-400 text-center">
        红色区域 = 异步计数器竞争冒险（Glitch）窗口 · 每级传播延迟 τp = {PROP_DELAY} 时钟单元 · 位数越多延迟越严重
      </p>
    </div>
  );
}
