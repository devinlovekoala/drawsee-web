import { useState, useEffect, useRef } from 'react';
import * as d3 from 'd3';

function computeImpedances(beta: number, Re: number, Rs: number, RL: number) {
  const Ic = 1e-3;
  const rbe = 200 + (1 + beta) * 0.026 / Ic;
  const ReParallelRL = (Re * RL) / (Re + RL);

  const Rin = rbe + (1 + beta) * ReParallelRL;
  const Rout = (rbe + Rs) / (1 + beta);
  const Au = ((1 + beta) * ReParallelRL) / (rbe + (1 + beta) * ReParallelRL);

  return { Rin, Rout, Au, rbe };
}

interface ChartProps {
  beta: number;
  Re: number;
  Rs: number;
  RL: number;
  width?: number;
  height?: number;
}

function ImpedanceChart({ beta, Re, Rs, RL, width = 700, height = 280 }: ChartProps) {
  const svgRef = useRef<SVGSVGElement>(null);

  useEffect(() => {
    if (!svgRef.current) return;

    const margin = { top: 20, right: 40, bottom: 48, left: 64 };
    const W = width - margin.left - margin.right;
    const H = height - margin.top - margin.bottom;

    const svg = d3.select(svgRef.current);
    svg.selectAll('*').remove();
    svg.attr('width', width).attr('height', height);

    const g = svg.append('g').attr('transform', `translate(${margin.left},${margin.top})`);

    const betaRange = d3.range(20, 301, 5);
    const rinData = betaRange.map(b => ({ b, v: computeImpedances(b, Re, Rs, RL).Rin }));
    const routData = betaRange.map(b => ({ b, v: computeImpedances(b, Re, Rs, RL).Rout }));

    const allVals = [...rinData.map(d => d.v), ...routData.map(d => d.v)];
    const yMax = Math.max(...allVals) * 1.15;
    const yMin = Math.min(...allVals) * 0.85;

    const xScale = d3.scaleLinear().domain([20, 300]).range([0, W]);
    const yScale = d3.scaleLog().domain([Math.max(1, yMin), yMax]).range([H, 0]);

    g.append('g').attr('transform', `translate(0,${H})`)
      .call(d3.axisBottom(xScale).ticks(8).tickSize(-H).tickFormat(() => ''))
      .call(s => s.select('.domain').remove())
      .call(s => s.selectAll('line').attr('stroke', '#334155').attr('stroke-opacity', 0.3));
    g.append('g')
      .call(d3.axisLeft(yScale).ticks(4, '~s').tickSize(-W).tickFormat(() => ''))
      .call(s => s.select('.domain').remove())
      .call(s => s.selectAll('line').attr('stroke', '#334155').attr('stroke-opacity', 0.3));

    g.append('g').attr('transform', `translate(0,${H})`)
      .call(d3.axisBottom(xScale).ticks(8))
      .call(s => s.selectAll('text').attr('fill', '#94a3b8').attr('font-size', 10))
      .call(s => s.select('.domain').attr('stroke', '#475569'))
      .call(s => s.selectAll('.tick line').attr('stroke', '#475569'));
    g.append('g')
      .call(d3.axisLeft(yScale).ticks(4, '~s'))
      .call(s => s.selectAll('text').attr('fill', '#94a3b8').attr('font-size', 10))
      .call(s => s.select('.domain').attr('stroke', '#475569'))
      .call(s => s.selectAll('.tick line').attr('stroke', '#475569'));

    g.append('text').attr('x', W / 2).attr('y', H + 38)
      .attr('text-anchor', 'middle').attr('fill', '#94a3b8').attr('font-size', 11).text('β (电流放大倍数)');
    g.append('text').attr('transform', 'rotate(-90)').attr('x', -H / 2).attr('y', -52)
      .attr('text-anchor', 'middle').attr('fill', '#94a3b8').attr('font-size', 11).text('阻抗 (Ω, 对数轴)');

    const lineGen = d3.line<{ b: number; v: number }>()
      .x(d => xScale(d.b))
      .y(d => yScale(Math.max(1, d.v)));

    g.append('path').datum(rinData).attr('fill', 'none')
      .attr('stroke', '#38bdf8').attr('stroke-width', 2.5).attr('d', lineGen);
    g.append('path').datum(routData).attr('fill', 'none')
      .attr('stroke', '#fb923c').attr('stroke-width', 2.5).attr('d', lineGen);

    const cur = computeImpedances(beta, Re, Rs, RL);
    const bx = xScale(beta);
    g.append('line').attr('x1', bx).attr('y1', 0).attr('x2', bx).attr('y2', H)
      .attr('stroke', '#64748b').attr('stroke-dasharray', '4,3').attr('stroke-width', 1);
    g.append('circle').attr('cx', bx).attr('cy', yScale(Math.max(1, cur.Rin)))
      .attr('r', 5).attr('fill', '#38bdf8');
    g.append('circle').attr('cx', bx).attr('cy', yScale(Math.max(1, cur.Rout)))
      .attr('r', 5).attr('fill', '#fb923c');

    const legend = [
      { color: '#38bdf8', label: 'Rin (输入阻抗)' },
      { color: '#fb923c', label: 'Rout (输出阻抗)' },
    ];
    legend.forEach((l, i) => {
      g.append('line').attr('x1', W - 130).attr('y1', 12 + i * 18)
        .attr('x2', W - 110).attr('y2', 12 + i * 18)
        .attr('stroke', l.color).attr('stroke-width', 2.5);
      g.append('text').attr('x', W - 106).attr('y', 16 + i * 18)
        .attr('fill', '#94a3b8').attr('font-size', 10).text(l.label);
    });

  }, [beta, Re, Rs, RL, width, height]);

  return <svg ref={svgRef} />;
}

export function EmitterFollowerScene() {
  const [beta, setBeta] = useState(100);
  const [Re, setRe] = useState(2000);
  const [Rs, setRs] = useState(1000);
  const [RL, setRL] = useState(5000);

  const result = computeImpedances(beta, Re, Rs, RL);
  const fmt = (v: number) => v >= 1000 ? (v / 1000).toFixed(1) + 'k' : v.toFixed(0);

  return (
    <div className="space-y-5">
      <div className="rounded-lg border border-neutral-200 bg-slate-900 overflow-x-auto">
        <ImpedanceChart beta={beta} Re={Re} Rs={Rs} RL={RL} width={700} height={280} />
      </div>

      <div className="grid grid-cols-4 gap-2">
        {[
          { label: 'Rin', value: fmt(result.Rin), unit: 'Ω', color: 'text-sky-600' },
          { label: 'Rout', value: fmt(result.Rout), unit: 'Ω', color: 'text-orange-500' },
          { label: 'Au', value: result.Au.toFixed(3), unit: '', color: 'text-green-600' },
          { label: 'rbe', value: fmt(result.rbe), unit: 'Ω', color: 'text-neutral-500' },
        ].map(s => (
          <div key={s.label} className="rounded-md border border-neutral-200 bg-neutral-50 px-3 py-2 text-center">
            <div className="text-[10px] text-neutral-400">{s.label}</div>
            <div className={`text-sm font-mono font-semibold ${s.color}`}>{s.value}<span className="text-xs text-neutral-400 ml-0.5">{s.unit}</span></div>
          </div>
        ))}
      </div>

      <div className="space-y-2.5 rounded-lg border border-neutral-200 bg-neutral-50 p-4">
        {[
          { label: 'β', value: beta, min: 20, max: 300, step: 5, display: (v: number) => v.toFixed(0), unit: '', set: setBeta },
          { label: 'Re', value: Re, min: 200, max: 10000, step: 100, display: (v: number) => (v / 1000).toFixed(1), unit: 'kΩ', set: setRe },
          { label: 'Rs', value: Rs, min: 100, max: 10000, step: 100, display: (v: number) => (v / 1000).toFixed(1), unit: 'kΩ', set: setRs },
          { label: 'RL', value: RL, min: 500, max: 20000, step: 500, display: (v: number) => (v / 1000).toFixed(1), unit: 'kΩ', set: setRL },
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
        射极跟随器：Av ≈ 1（同相）· Rin 高 · Rout 低 · 适合阻抗变换
      </p>
    </div>
  );
}
