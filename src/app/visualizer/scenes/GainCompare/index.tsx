import { useState, useEffect, useRef } from 'react';
import * as d3 from 'd3';

interface GainParams {
  beta: number;
  Rc: number;
  Re: number;
  RL: number;
}

interface GainResult {
  CE: number;
  CB: number;
  CC: number;
}

function computeGains(p: GainParams): GainResult {
  const Ic = 1e-3;
  const rbe = 200 + (1 + p.beta) * 0.026 / Ic;
  const RcParallelRL = (p.Rc * p.RL) / (p.Rc + p.RL);

  const CE = Math.abs(-(p.beta * RcParallelRL) / rbe);
  const CB = (p.beta * RcParallelRL) / (rbe + (1 + p.beta) * 0);
  const CC = ((1 + p.beta) * p.Re) / (rbe + (1 + p.beta) * p.Re);

  return { CE, CB, CC };
}

interface BarChartProps {
  gains: GainResult;
  width?: number;
  height?: number;
}

const CONFIG_LABELS = { CE: '共射', CB: '共基', CC: '共集' };
const CONFIG_COLORS = { CE: '#38bdf8', CB: '#a78bfa', CC: '#86efac' };

function GainBarChart({ gains, width = 700, height = 280 }: BarChartProps) {
  const svgRef = useRef<SVGSVGElement>(null);

  useEffect(() => {
    if (!svgRef.current) return;

    const margin = { top: 20, right: 24, bottom: 40, left: 56 };
    const W = width - margin.left - margin.right;
    const H = height - margin.top - margin.bottom;

    const svg = d3.select(svgRef.current);
    svg.selectAll('*').remove();
    svg.attr('width', width).attr('height', height);

    const g = svg.append('g').attr('transform', `translate(${margin.left},${margin.top})`);

    const data = [
      { key: 'CE' as const, label: CONFIG_LABELS.CE, value: gains.CE },
      { key: 'CB' as const, label: CONFIG_LABELS.CB, value: gains.CB },
      { key: 'CC' as const, label: CONFIG_LABELS.CC, value: gains.CC },
    ];

    const maxVal = Math.max(...data.map(d => d.value), 1);
    const yScale = d3.scaleLinear().domain([0, maxVal * 1.15]).range([H, 0]);
    const xScale = d3.scaleBand().domain(data.map(d => d.label)).range([0, W]).padding(0.35);

    // Grid
    g.append('g')
      .call(d3.axisLeft(yScale).ticks(5).tickSize(-W).tickFormat(() => ''))
      .call(s => s.select('.domain').remove())
      .call(s => s.selectAll('line').attr('stroke', '#334155').attr('stroke-opacity', 0.4));

    // Axes
    g.append('g').attr('transform', `translate(0,${H})`)
      .call(d3.axisBottom(xScale))
      .call(s => s.selectAll('text').attr('fill', '#94a3b8').attr('font-size', 13).attr('font-weight', 600))
      .call(s => s.select('.domain').attr('stroke', '#475569'))
      .call(s => s.selectAll('.tick line').remove());
    g.append('g')
      .call(d3.axisLeft(yScale).ticks(5))
      .call(s => s.selectAll('text').attr('fill', '#94a3b8').attr('font-size', 10))
      .call(s => s.select('.domain').attr('stroke', '#475569'))
      .call(s => s.selectAll('.tick line').attr('stroke', '#475569'));

    g.append('text').attr('transform', 'rotate(-90)').attr('x', -H / 2).attr('y', -44)
      .attr('text-anchor', 'middle').attr('fill', '#94a3b8').attr('font-size', 11).text('增益 (幅值)');

    // Bars
    data.forEach(d => {
      const x = xScale(d.label)!;
      const bw = xScale.bandwidth();
      const displayVal = Math.min(d.value, maxVal);
      const by = yScale(displayVal);

      g.append('rect')
        .attr('x', x).attr('y', by)
        .attr('width', bw).attr('height', H - by)
        .attr('fill', CONFIG_COLORS[d.key])
        .attr('rx', 4).attr('opacity', 0.85);

      g.append('text')
        .attr('x', x + bw / 2).attr('y', by - 6)
        .attr('text-anchor', 'middle')
        .attr('fill', CONFIG_COLORS[d.key])
        .attr('font-size', 12).attr('font-weight', 600)
        .text(d.value > 999 ? '>999' : d.value.toFixed(1));
    });

    // Phase note for CE
    g.append('text')
      .attr('x', xScale(CONFIG_LABELS.CE)! + xScale.bandwidth() / 2)
      .attr('y', H + 34)
      .attr('text-anchor', 'middle')
      .attr('fill', '#475569').attr('font-size', 9)
      .text('(反相)');

  }, [gains, width, height]);

  return <svg ref={svgRef} />;
}

export function GainCompareScene() {
  const [beta, setBeta] = useState(100);
  const [Rc, setRc] = useState(3000);
  const [Re, setRe] = useState(1000);
  const [RL, setRL] = useState(5000);

  const gains = computeGains({ beta, Rc, Re, RL });

  return (
    <div className="space-y-5">
      <div className="rounded-lg border border-neutral-200 bg-slate-900 overflow-x-auto">
        <GainBarChart gains={gains} width={700} height={280} />
      </div>

      {/* Gain values */}
      <div className="grid grid-cols-3 gap-2">
        {[
          { key: 'CE' as const, label: '共射 |Au|', inv: true },
          { key: 'CB' as const, label: '共基 Au', inv: false },
          { key: 'CC' as const, label: '共集 Au', inv: false },
        ].map(c => (
          <div key={c.key} className="rounded-md border border-neutral-200 bg-neutral-50 px-3 py-2 text-center">
            <div className="text-[10px] text-neutral-400">{c.label}</div>
            <div className="text-sm font-mono font-semibold" style={{ color: CONFIG_COLORS[c.key] }}>
              {gains[c.key] > 999 ? '>999' : gains[c.key].toFixed(1)}
            </div>
            {c.inv && <div className="text-[9px] text-neutral-400">反相输出</div>}
          </div>
        ))}
      </div>

      {/* Sliders */}
      <div className="space-y-2.5 rounded-lg border border-neutral-200 bg-neutral-50 p-4">
        {[
          { label: 'β', value: beta, min: 20, max: 300, step: 5, display: (v: number) => v.toFixed(0), unit: '', set: setBeta },
          { label: 'RC', value: Rc, min: 500, max: 10000, step: 100, display: (v: number) => (v / 1000).toFixed(1), unit: 'kΩ', set: setRc },
          { label: 'RE', value: Re, min: 100, max: 5000, step: 100, display: (v: number) => (v / 1000).toFixed(1), unit: 'kΩ', set: setRe },
          { label: 'RL', value: RL, min: 1000, max: 20000, step: 500, display: (v: number) => (v / 1000).toFixed(1), unit: 'kΩ', set: setRL },
        ].map(s => (
          <div key={s.label} className="flex items-center gap-3">
            <span className="w-8 text-right text-xs text-neutral-500 shrink-0">{s.label}</span>
            <input
              type="range" min={s.min} max={s.max} step={s.step} value={s.value}
              onChange={e => s.set(Number(e.target.value))}
              className="flex-1 h-1 accent-blue-500"
            />
            <span className="w-16 text-right text-xs text-blue-600 font-mono shrink-0">
              {s.display(s.value)}{s.unit}
            </span>
          </div>
        ))}
      </div>

      <p className="text-[10px] text-neutral-400 text-center">
        小信号模型 · Ic = 1 mA 固定（用于计算 rbe）
      </p>
    </div>
  );
}
