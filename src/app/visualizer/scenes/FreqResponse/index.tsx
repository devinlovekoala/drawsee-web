import { useState, useEffect, useRef } from 'react';
import * as d3 from 'd3';

type FilterType = 'lp1' | 'hp1' | 'lp2' | 'hp2';

const FILTER_LABELS: Record<FilterType, string> = {
  lp1: '一阶低通',
  hp1: '一阶高通',
  lp2: '二阶低通',
  hp2: '二阶高通',
};

const FILTER_COLORS: Record<FilterType, string> = {
  lp1: '#38bdf8',
  hp1: '#f472b6',
  lp2: '#a78bfa',
  hp2: '#fb923c',
};

function computeBode(type: FilterType, fc: number, Q: number): [number, number][] {
  return Array.from({ length: 500 }, (_, i) => {
    const logF = 1 + (i / 499) * 5;
    const freq = Math.pow(10, logF);
    const ratio = freq / fc;
    let mag: number;
    if (type === 'lp1') mag = 1 / Math.sqrt(1 + ratio * ratio);
    else if (type === 'hp1') mag = ratio / Math.sqrt(1 + ratio * ratio);
    else if (type === 'lp2') mag = 1 / Math.sqrt(Math.pow(1 - ratio * ratio, 2) + Math.pow(ratio / Q, 2));
    else mag = ratio * ratio / Math.sqrt(Math.pow(1 - ratio * ratio, 2) + Math.pow(ratio / Q, 2));
    const db = 20 * Math.log10(Math.max(mag, 1e-6));
    return [freq, db];
  });
}

interface ChartProps {
  type: FilterType;
  fc: number;
  Q: number;
  width?: number;
  height?: number;
}

function FreqChart({ type, fc, Q, width = 700, height = 300 }: ChartProps) {
  const svgRef = useRef<SVGSVGElement>(null);

  useEffect(() => {
    if (!svgRef.current) return;

    const margin = { top: 16, right: 24, bottom: 44, left: 52 };
    const W = width - margin.left - margin.right;
    const H = height - margin.top - margin.bottom;

    const svg = d3.select(svgRef.current);
    svg.selectAll('*').remove();
    svg.attr('width', width).attr('height', height);

    const g = svg.append('g').attr('transform', `translate(${margin.left},${margin.top})`);

    const pts = computeBode(type, fc, Q);
    const xScale = d3.scaleLog().domain([10, 1e6]).range([0, W]);
    const yScale = d3.scaleLinear().domain([-60, 6]).range([H, 0]);

    // Grid
    g.append('g').attr('transform', `translate(0,${H})`)
      .call(d3.axisBottom(xScale).ticks(5, '~s').tickSize(-H).tickFormat(() => ''))
      .call(s => s.select('.domain').remove())
      .call(s => s.selectAll('line').attr('stroke', '#334155').attr('stroke-opacity', 0.4));
    g.append('g')
      .call(d3.axisLeft(yScale).ticks(6).tickSize(-W).tickFormat(() => ''))
      .call(s => s.select('.domain').remove())
      .call(s => s.selectAll('line').attr('stroke', '#334155').attr('stroke-opacity', 0.4));

    // Axes
    g.append('g').attr('transform', `translate(0,${H})`)
      .call(d3.axisBottom(xScale).ticks(5, '~s'))
      .call(s => s.selectAll('text').attr('fill', '#94a3b8').attr('font-size', 10))
      .call(s => s.select('.domain').attr('stroke', '#475569'))
      .call(s => s.selectAll('.tick line').attr('stroke', '#475569'));
    g.append('g')
      .call(d3.axisLeft(yScale).ticks(6))
      .call(s => s.selectAll('text').attr('fill', '#94a3b8').attr('font-size', 10))
      .call(s => s.select('.domain').attr('stroke', '#475569'))
      .call(s => s.selectAll('.tick line').attr('stroke', '#475569'));

    // Labels
    g.append('text').attr('x', W / 2).attr('y', H + 36)
      .attr('text-anchor', 'middle').attr('fill', '#94a3b8').attr('font-size', 11).text('频率 (Hz)');
    g.append('text').attr('transform', 'rotate(-90)').attr('x', -H / 2).attr('y', -40)
      .attr('text-anchor', 'middle').attr('fill', '#94a3b8').attr('font-size', 11).text('增益 (dB)');

    // -3dB line
    g.append('line')
      .attr('x1', 0).attr('y1', yScale(-3)).attr('x2', W).attr('y2', yScale(-3))
      .attr('stroke', '#475569').attr('stroke-dasharray', '4,3').attr('stroke-width', 1);
    g.append('text').attr('x', 4).attr('y', yScale(-3) - 4)
      .attr('fill', '#64748b').attr('font-size', 9).text('-3 dB');

    // fc marker
    if (fc >= 10 && fc <= 1e6) {
      g.append('line')
        .attr('x1', xScale(fc)).attr('y1', 0).attr('x2', xScale(fc)).attr('y2', H)
        .attr('stroke', '#475569').attr('stroke-dasharray', '4,3').attr('stroke-width', 1);
      g.append('text').attr('x', xScale(fc) + 3).attr('y', 14)
        .attr('fill', '#64748b').attr('font-size', 9)
        .text(`fc=${fc >= 1000 ? (fc / 1000).toFixed(1) + 'k' : fc}Hz`);
    }

    // Bode curve
    const line = d3.line<[number, number]>()
      .x(d => xScale(Math.max(10, d[0])))
      .y(d => yScale(Math.max(-60, d[1])))
      .defined(d => d[0] >= 10 && d[0] <= 1e6 && isFinite(d[1]));

    g.append('path')
      .datum(pts)
      .attr('fill', 'none')
      .attr('stroke', FILTER_COLORS[type])
      .attr('stroke-width', 2.5)
      .attr('d', line);

  }, [type, fc, Q, width, height]);

  return <svg ref={svgRef} />;
}

export function FreqResponseScene() {
  const [type, setType] = useState<FilterType>('lp2');
  const [fcLog, setFcLog] = useState(3);
  const [Q, setQ] = useState(0.707);

  const fc = Math.round(Math.pow(10, fcLog));
  const is2nd = type === 'lp2' || type === 'hp2';

  return (
    <div className="space-y-5">
      <div className="rounded-lg border border-neutral-200 bg-slate-900 overflow-x-auto">
        <FreqChart type={type} fc={fc} Q={Q} width={700} height={300} />
      </div>

      {/* Filter type selector */}
      <div className="grid grid-cols-4 gap-1.5">
        {(Object.keys(FILTER_LABELS) as FilterType[]).map(t => (
          <button
            key={t}
            onClick={() => setType(t)}
            className={`rounded py-1.5 text-xs font-medium transition-colors border ${
              type === t
                ? 'border-blue-500 bg-blue-50 text-blue-700'
                : 'border-neutral-200 bg-white text-neutral-500 hover:text-neutral-800 hover:bg-neutral-50'
            }`}
          >
            {FILTER_LABELS[t]}
          </button>
        ))}
      </div>

      {/* Sliders */}
      <div className="space-y-3 rounded-lg border border-neutral-200 bg-neutral-50 p-4">
        <div className="flex items-center gap-3">
          <span className="w-8 text-right text-xs text-neutral-500 shrink-0">fc</span>
          <input
            type="range" min={1} max={5} step={0.01} value={fcLog}
            onChange={e => setFcLog(Number(e.target.value))}
            className="flex-1 h-1 accent-blue-500"
          />
          <span className="w-20 text-right text-xs text-blue-600 font-mono shrink-0">
            {fc >= 1000 ? (fc / 1000).toFixed(1) + 'kHz' : fc + 'Hz'}
          </span>
        </div>
        {is2nd && (
          <div className="flex items-center gap-3">
            <span className="w-8 text-right text-xs text-neutral-500 shrink-0">Q</span>
            <input
              type="range" min={0.3} max={3} step={0.01} value={Q}
              onChange={e => setQ(Number(e.target.value))}
              className="flex-1 h-1 accent-violet-500"
            />
            <span className="w-20 text-right text-xs text-violet-600 font-mono shrink-0">{Q.toFixed(2)}</span>
          </div>
        )}
      </div>

      <p className="text-[10px] text-neutral-400 text-center">
        一阶：|H| = 1/√(1+(f/fc)²) · 二阶 Sallen-Key 模型
      </p>
    </div>
  );
}
