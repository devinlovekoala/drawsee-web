import { useState, useEffect, useRef } from 'react';
import * as d3 from 'd3';

type CounterBits = 2 | 3 | 4;

function generateCounterWaveform(bits: CounterBits, cycles: number) {
  const states = 1 << bits;
  const rows: { name: string; values: number[] }[] = [];
  for (let b = bits - 1; b >= 0; b--) {
    const values: number[] = [];
    for (let t = 0; t < cycles; t++) {
      const count = t % states;
      values.push((count >> b) & 1);
    }
    rows.push({ name: `Q${b}`, values });
  }
  return rows;
}

const ROW_HEIGHT = 52;
const COLORS = ['#38bdf8', '#a78bfa', '#86efac', '#fb923c'];

interface WaveformChartProps {
  bits: CounterBits;
  cycles: number;
  width?: number;
}

function WaveformChart({ bits, cycles, width = 700 }: WaveformChartProps) {
  const rows = generateCounterWaveform(bits, cycles);
  const totalRows = rows.length + 1;
  const svgHeight = totalRows * ROW_HEIGHT + 40;
  const svgRef = useRef<SVGSVGElement>(null);

  useEffect(() => {
    if (!svgRef.current) return;

    const margin = { top: 16, right: 16, bottom: 24, left: 40 };
    const W = width - margin.left - margin.right;
    const H = svgHeight - margin.top - margin.bottom;

    const svg = d3.select(svgRef.current);
    svg.selectAll('*').remove();
    svg.attr('width', width).attr('height', svgHeight);

    const g = svg.append('g').attr('transform', `translate(${margin.left},${margin.top})`);
    const xScale = d3.scaleLinear().domain([0, cycles]).range([0, W]);
    const rowH = H / totalRows;

    const drawWave = (values: number[], rowIndex: number, color: string, label: string) => {
      const y0 = rowIndex * rowH;
      const yLow = y0 + rowH * 0.75;
      const yHigh = y0 + rowH * 0.15;

      g.append('text').attr('x', -4).attr('y', y0 + rowH / 2 + 4)
        .attr('text-anchor', 'end').attr('fill', color).attr('font-size', 10).attr('font-weight', 600).text(label);

      const pts: [number, number][] = [];
      values.forEach((v, i) => {
        const x1 = xScale(i);
        const x2 = xScale(i + 1);
        const y = v === 1 ? yHigh : yLow;
        if (i === 0) { pts.push([x1, y]); }
        else if (values[i - 1] !== v) { pts.push([x1, pts[pts.length - 1][1]], [x1, y]); }
        pts.push([x2, y]);
      });

      const lineStr = pts.map((p, i) => `${i === 0 ? 'M' : 'L'}${p[0]},${p[1]}`).join(' ');
      g.append('path').attr('d', lineStr).attr('fill', 'none').attr('stroke', color).attr('stroke-width', 2);
    };

    const clkValues = Array.from({ length: cycles }, (_, i) => i % 2);
    drawWave(clkValues, 0, '#64748b', 'CLK');
    rows.forEach((row, i) => drawWave(row.values, i + 1, COLORS[i % COLORS.length], row.name));

    const states = 1 << bits;
    for (let t = 0; t < cycles; t++) {
      const count = t % states;
      const cx = xScale(t) + (xScale(1) - xScale(0)) / 2;
      g.append('text')
        .attr('x', cx).attr('y', H + 16)
        .attr('text-anchor', 'middle').attr('fill', '#94a3b8').attr('font-size', 9)
        .text(count.toString(16).toUpperCase());
    }

    for (let t = 0; t <= cycles; t++) {
      g.append('line')
        .attr('x1', xScale(t)).attr('y1', 0).attr('x2', xScale(t)).attr('y2', H)
        .attr('stroke', '#1e293b').attr('stroke-opacity', 0.3).attr('stroke-width', 0.5);
    }
  }, [bits, cycles, rows, totalRows, svgHeight, width]);

  return <svg ref={svgRef} />;
}

export function SyncCounterScene() {
  const [bits, setBits] = useState<CounterBits>(3);
  const cycles = (1 << bits) * 2;
  const states = 1 << bits;

  return (
    <div className="space-y-5">
      <div className="rounded-lg border border-neutral-200 bg-slate-900 overflow-x-auto">
        <WaveformChart bits={bits} cycles={cycles} width={700} />
      </div>

      <div className="flex items-center gap-3">
        <span className="text-xs text-neutral-500 shrink-0">计数器位数</span>
        <div className="flex gap-1.5">
          {([2, 3, 4] as const).map(b => (
            <button key={b} onClick={() => setBits(b)}
              className={`px-4 py-1.5 rounded text-sm font-medium transition-colors border ${
                bits === b ? 'border-blue-500 bg-blue-50 text-blue-700' : 'border-neutral-200 bg-white text-neutral-500 hover:bg-neutral-50'
              }`}>
              {b} 位
            </button>
          ))}
        </div>
      </div>

      <div className="grid grid-cols-3 gap-2">
        {[
          { label: '模数', value: states, color: 'text-blue-600' },
          { label: '计数范围', value: `0 ~ ${states - 1}`, color: 'text-neutral-600' },
          { label: '最高位周期', value: `${states} × T`, color: 'text-neutral-600' },
        ].map(s => (
          <div key={s.label} className="rounded-md border border-neutral-200 bg-neutral-50 px-3 py-2 text-center">
            <div className="text-[10px] text-neutral-400">{s.label}</div>
            <div className={`text-sm font-mono font-bold ${s.color}`}>{s.value}</div>
          </div>
        ))}
      </div>

      <div className="rounded-lg border border-neutral-200 overflow-hidden">
        <div className="grid bg-neutral-100 text-[10px] font-semibold text-neutral-500 px-3 py-1.5"
          style={{ gridTemplateColumns: `repeat(${bits + 1}, 1fr)` }}>
          <span>计数</span>
          {Array.from({ length: bits }, (_, i) => <span key={i}>Q{bits - 1 - i}</span>)}
        </div>
        {Array.from({ length: Math.min(states, 16) }, (_, count) => (
          <div key={count}
            className={`grid px-3 py-1 text-xs border-t border-neutral-100 ${count % 2 === 0 ? 'bg-white' : 'bg-neutral-50'}`}
            style={{ gridTemplateColumns: `repeat(${bits + 1}, 1fr)` }}>
            <span className="font-mono text-blue-600">{count}</span>
            {Array.from({ length: bits }, (_, b) => (
              <span key={b} className={`font-mono font-bold ${((count >> (bits - 1 - b)) & 1) ? 'text-green-600' : 'text-neutral-400'}`}>
                {(count >> (bits - 1 - b)) & 1}
              </span>
            ))}
          </div>
        ))}
      </div>

      <p className="text-[10px] text-neutral-400 text-center">
        同步计数器：所有触发器共享时钟，无竞争冒险 · 底部十六进制为当前计数值
      </p>
    </div>
  );
}
