import { useState, useEffect, useRef } from 'react';
import * as d3 from 'd3';

function computeDiffAmp(beta: number, Rc: number, Ree: number) {
  const Ic = 0.5e-3;
  const rbe = 200 + (1 + beta) * 0.026 / Ic;
  const Ad = (beta * Rc) / (2 * rbe);
  const Ac = Rc / (2 * Ree + rbe / beta);
  const CMRR = Math.abs(Ad / Ac);
  const CMRRdB = 20 * Math.log10(CMRR);
  return { Ad, Ac, CMRR, CMRRdB };
}

interface ChartProps {
  beta: number;
  Rc: number;
  Ree: number;
  width?: number;
  height?: number;
}

function CMRRChart({ beta, Rc, Ree, width = 700, height = 280 }: ChartProps) {
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
    const reeRange = d3.range(500, 50001, 500);
    const cmrrData = reeRange.map(r => ({ r, v: computeDiffAmp(beta, Rc, r).CMRRdB }));

    const xScale = d3.scaleLog().domain([500, 50000]).range([0, W]);
    const yCMRR = d3.scaleLinear().domain([0, Math.max(...cmrrData.map(d => d.v)) * 1.1]).range([H, 0]);

    g.append('g').attr('transform', `translate(0,${H})`)
      .call(d3.axisBottom(xScale).ticks(5, '~s').tickSize(-H).tickFormat(() => ''))
      .call(s => s.select('.domain').remove())
      .call(s => s.selectAll('line').attr('stroke', '#334155').attr('stroke-opacity', 0.3));
    g.append('g')
      .call(d3.axisLeft(yCMRR).ticks(5).tickSize(-W).tickFormat(() => ''))
      .call(s => s.select('.domain').remove())
      .call(s => s.selectAll('line').attr('stroke', '#334155').attr('stroke-opacity', 0.3));

    g.append('g').attr('transform', `translate(0,${H})`)
      .call(d3.axisBottom(xScale).ticks(5, '~s'))
      .call(s => s.selectAll('text').attr('fill', '#94a3b8').attr('font-size', 10))
      .call(s => s.select('.domain').attr('stroke', '#475569'))
      .call(s => s.selectAll('.tick line').attr('stroke', '#475569'));
    g.append('g')
      .call(d3.axisLeft(yCMRR).ticks(5))
      .call(s => s.selectAll('text').attr('fill', '#94a3b8').attr('font-size', 10))
      .call(s => s.select('.domain').attr('stroke', '#475569'))
      .call(s => s.selectAll('.tick line').attr('stroke', '#475569'));

    g.append('text').attr('x', W / 2).attr('y', H + 38)
      .attr('text-anchor', 'middle').attr('fill', '#94a3b8').attr('font-size', 11).text('尾电阻 Ree (Ω)');
    g.append('text').attr('transform', 'rotate(-90)').attr('x', -H / 2).attr('y', -52)
      .attr('text-anchor', 'middle').attr('fill', '#94a3b8').attr('font-size', 11).text('CMRR (dB)');

    const cmrrLine = d3.line<{ r: number; v: number }>()
      .x(d => xScale(d.r)).y(d => yCMRR(d.v));
    g.append('path').datum(cmrrData).attr('fill', 'none')
      .attr('stroke', '#38bdf8').attr('stroke-width', 2.5).attr('d', cmrrLine);

    // Current Ree marker
    const cur = computeDiffAmp(beta, Rc, Ree);
    const reeX = xScale(Ree);
    g.append('line').attr('x1', reeX).attr('y1', 0).attr('x2', reeX).attr('y2', H)
      .attr('stroke', '#64748b').attr('stroke-dasharray', '4,3').attr('stroke-width', 1);
    g.append('circle').attr('cx', reeX).attr('cy', yCMRR(cur.CMRRdB))
      .attr('r', 5).attr('fill', '#38bdf8');

  }, [beta, Rc, Ree, width, height]);

  return <svg ref={svgRef} />;
}

export function DiffAmpCMRRScene() {
  const [beta, setBeta] = useState(100);
  const [Rc, setRc] = useState(10000);
  const [Ree, setRee] = useState(10000);

  const result = computeDiffAmp(beta, Rc, Ree);

  return (
    <div className="space-y-5">
      <div className="rounded-lg border border-neutral-200 bg-slate-900 overflow-x-auto">
        <CMRRChart beta={beta} Rc={Rc} Ree={Ree} width={700} height={280} />
      </div>

      <div className="grid grid-cols-4 gap-2">
        {[
          { label: 'Ad 差模增益', value: result.Ad.toFixed(1), unit: '', color: 'text-green-600' },
          { label: 'Ac 共模增益', value: result.Ac.toFixed(3), unit: '', color: 'text-orange-500' },
          { label: 'CMRR', value: result.CMRR.toFixed(0), unit: '×', color: 'text-sky-600' },
          { label: 'CMRR', value: result.CMRRdB.toFixed(1), unit: 'dB', color: 'text-blue-700' },
        ].map((s, i) => (
          <div key={i} className="rounded-md border border-neutral-200 bg-neutral-50 px-3 py-2 text-center">
            <div className="text-[10px] text-neutral-400">{s.label}</div>
            <div className={`text-sm font-mono font-semibold ${s.color}`}>{s.value}<span className="text-xs text-neutral-400 ml-0.5">{s.unit}</span></div>
          </div>
        ))}
      </div>

      <div className="space-y-2.5 rounded-lg border border-neutral-200 bg-neutral-50 p-4">
        {[
          { label: 'β', value: beta, min: 20, max: 300, step: 5, display: (v: number) => v.toFixed(0), unit: '', set: setBeta },
          { label: 'RC', value: Rc, min: 1000, max: 50000, step: 500, display: (v: number) => (v / 1000).toFixed(1), unit: 'kΩ', set: setRc },
          { label: 'Ree', value: Ree, min: 500, max: 50000, step: 500, display: (v: number) => (v / 1000).toFixed(1), unit: 'kΩ', set: setRee },
        ].map(s => (
          <div key={s.label} className="flex items-center gap-3">
            <span className="w-8 text-right text-xs text-neutral-500 shrink-0">{s.label}</span>
            <input type="range" min={s.min} max={s.max} step={s.step} value={s.value}
              onChange={e => s.set(Number(e.target.value))}
              className="flex-1 h-1 accent-blue-500" />
            <span className="w-16 text-right text-xs text-blue-600 font-mono shrink-0">{s.display(s.value)}{s.unit}</span>
          </div>
        ))}
      </div>

      <p className="text-[10px] text-neutral-400 text-center">
        CMRR = Ad/Ac · 尾电阻 Ree 越大，共模抑制能力越强 · 实际电路用恒流源替代尾电阻
      </p>
    </div>
  );
}
