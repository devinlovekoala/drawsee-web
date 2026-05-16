import { useState, useEffect, useRef } from 'react';
import * as d3 from 'd3';

function computeSK(R1: number, R2: number, C1: number, C2: number) {
  const f0 = 1 / (2 * Math.PI * Math.sqrt(R1 * R2 * C1 * C2));
  const Q = Math.sqrt(R1 * R2 * C1 * C2) / (C2 * (R1 + R2));
  return { f0, Q };
}

function computeBodeSK(f0: number, Q: number): [number, number][] {
  return Array.from({ length: 500 }, (_, i) => {
    const logF = 1 + (i / 499) * 5;
    const freq = Math.pow(10, logF);
    const ratio = freq / f0;
    const mag = 1 / Math.sqrt(Math.pow(1 - ratio * ratio, 2) + Math.pow(ratio / Q, 2));
    return [freq, 20 * Math.log10(Math.max(mag, 1e-6))];
  });
}

function SKChart({ f0, Q, width = 700, height = 280 }: { f0: number; Q: number; width?: number; height?: number }) {
  const svgRef = useRef<SVGSVGElement>(null);

  useEffect(() => {
    if (!svgRef.current) return;

    const margin = { top: 20, right: 24, bottom: 48, left: 52 };
    const W = width - margin.left - margin.right;
    const H = height - margin.top - margin.bottom;

    const svg = d3.select(svgRef.current);
    svg.selectAll('*').remove();
    svg.attr('width', width).attr('height', height);

    const g = svg.append('g').attr('transform', `translate(${margin.left},${margin.top})`);
    const pts = computeBodeSK(f0, Q);
    const xScale = d3.scaleLog().domain([10, 1e6]).range([0, W]);
    const yScale = d3.scaleLinear().domain([-60, 12]).range([H, 0]);

    g.append('g').attr('transform', `translate(0,${H})`)
      .call(d3.axisBottom(xScale).ticks(5, '~s').tickSize(-H).tickFormat(() => ''))
      .call(s => s.select('.domain').remove())
      .call(s => s.selectAll('line').attr('stroke', '#334155').attr('stroke-opacity', 0.3));
    g.append('g')
      .call(d3.axisLeft(yScale).ticks(6).tickSize(-W).tickFormat(() => ''))
      .call(s => s.select('.domain').remove())
      .call(s => s.selectAll('line').attr('stroke', '#334155').attr('stroke-opacity', 0.3));

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

    g.append('text').attr('x', W / 2).attr('y', H + 38)
      .attr('text-anchor', 'middle').attr('fill', '#94a3b8').attr('font-size', 11).text('频率 (Hz)');
    g.append('text').attr('transform', 'rotate(-90)').attr('x', -H / 2).attr('y', -40)
      .attr('text-anchor', 'middle').attr('fill', '#94a3b8').attr('font-size', 11).text('增益 (dB)');

    g.append('line').attr('x1', 0).attr('y1', yScale(-3)).attr('x2', W).attr('y2', yScale(-3))
      .attr('stroke', '#475569').attr('stroke-dasharray', '4,3').attr('stroke-width', 1);
    g.append('text').attr('x', 4).attr('y', yScale(-3) - 4)
      .attr('fill', '#64748b').attr('font-size', 9).text('-3 dB');

    if (f0 >= 10 && f0 <= 1e6) {
      g.append('line').attr('x1', xScale(f0)).attr('y1', 0).attr('x2', xScale(f0)).attr('y2', H)
        .attr('stroke', '#475569').attr('stroke-dasharray', '4,3').attr('stroke-width', 1);
      g.append('text').attr('x', xScale(f0) + 3).attr('y', 14)
        .attr('fill', '#64748b').attr('font-size', 9)
        .text(`f₀=${f0 >= 1000 ? (f0 / 1000).toFixed(2) + 'k' : f0.toFixed(0)}Hz`);
    }

    const line = d3.line<[number, number]>()
      .x(d => xScale(Math.max(10, d[0]))).y(d => yScale(Math.max(-60, d[1])))
      .defined(d => d[0] >= 10 && d[0] <= 1e6 && isFinite(d[1]));
    g.append('path').datum(pts).attr('fill', 'none')
      .attr('stroke', '#a78bfa').attr('stroke-width', 2.5).attr('d', line);

    const qColor = Q > 1.4 ? '#fb923c' : Q > 0.6 ? '#86efac' : '#38bdf8';
    g.append('text').attr('x', W - 4).attr('y', 16)
      .attr('text-anchor', 'end').attr('fill', qColor).attr('font-size', 11).attr('font-weight', 600)
      .text(`Q = ${Q.toFixed(3)}`);
  }, [f0, Q, width, height]);

  return <svg ref={svgRef} />;
}

export function SallenKeyScene() {
  const [R1, setR1] = useState(10000);
  const [R2, setR2] = useState(10000);
  const [C1log, setC1log] = useState(-8);
  const [C2log, setC2log] = useState(-8);

  const C1 = Math.pow(10, C1log);
  const C2 = Math.pow(10, C2log);
  const { f0, Q } = computeSK(R1, R2, C1, C2);

  const fmtF = (f: number) => f >= 1000 ? (f / 1000).toFixed(2) + 'kHz' : f.toFixed(1) + 'Hz';
  const fmtC = (c: number) => c < 1e-9 ? (c * 1e12).toFixed(0) + 'pF' : c < 1e-6 ? (c * 1e9).toFixed(0) + 'nF' : (c * 1e6).toFixed(0) + 'μF';
  const fmtR = (r: number) => r >= 1000 ? (r / 1000).toFixed(1) + 'kΩ' : r.toFixed(0) + 'Ω';

  const qBand = Q > 1.4 ? { label: '欠阻尼 (谐振峰)', color: 'text-orange-500' }
    : Q > 0.6 ? { label: '临界 (最平坦)', color: 'text-green-600' }
    : { label: '过阻尼 (缓慢滚降)', color: 'text-blue-600' };

  return (
    <div className="space-y-5">
      <div className="rounded-lg border border-neutral-200 bg-slate-900 overflow-x-auto">
        <SKChart f0={f0} Q={Q} width={700} height={280} />
      </div>

      <div className="grid grid-cols-4 gap-2">
        <div className="rounded-md border border-neutral-200 bg-neutral-50 px-3 py-2 text-center col-span-2">
          <div className="text-[10px] text-neutral-400">截止频率 f₀</div>
          <div className="text-base font-mono font-bold text-violet-600">{fmtF(f0)}</div>
        </div>
        <div className="rounded-md border border-neutral-200 bg-neutral-50 px-3 py-2 text-center">
          <div className="text-[10px] text-neutral-400">品质因数 Q</div>
          <div className={`text-base font-mono font-bold ${qBand.color}`}>{Q.toFixed(3)}</div>
        </div>
        <div className="rounded-md border border-neutral-200 bg-neutral-50 px-3 py-2 text-center">
          <div className="text-[10px] text-neutral-400">响应类型</div>
          <div className={`text-[10px] font-medium mt-1 ${qBand.color}`}>{qBand.label}</div>
        </div>
      </div>

      <div className="space-y-2.5 rounded-lg border border-neutral-200 bg-neutral-50 p-4">
        {[
          { label: 'R1', value: R1, min: 1000, max: 100000, step: 1000, display: () => fmtR(R1), set: setR1, accent: 'accent-blue-500', valColor: 'text-blue-600' },
          { label: 'R2', value: R2, min: 1000, max: 100000, step: 1000, display: () => fmtR(R2), set: setR2, accent: 'accent-blue-500', valColor: 'text-blue-600' },
        ].map(s => (
          <div key={s.label} className="flex items-center gap-3">
            <span className="w-8 text-right text-xs text-neutral-500 shrink-0">{s.label}</span>
            <input type="range" min={s.min} max={s.max} step={s.step} value={s.value}
              onChange={e => s.set(Number(e.target.value))} className={`flex-1 h-1 ${s.accent}`} />
            <span className={`w-16 text-right text-xs font-mono shrink-0 ${s.valColor}`}>{s.display()}</span>
          </div>
        ))}
        {[
          { label: 'C1', value: C1log, min: -10, max: -6, step: 0.5, display: () => fmtC(C1), set: setC1log },
          { label: 'C2', value: C2log, min: -10, max: -6, step: 0.5, display: () => fmtC(C2), set: setC2log },
        ].map(s => (
          <div key={s.label} className="flex items-center gap-3">
            <span className="w-8 text-right text-xs text-neutral-500 shrink-0">{s.label}</span>
            <input type="range" min={s.min} max={s.max} step={s.step} value={s.value}
              onChange={e => s.set(Number(e.target.value))} className="flex-1 h-1 accent-violet-500" />
            <span className="w-16 text-right text-xs text-violet-600 font-mono shrink-0">{s.display()}</span>
          </div>
        ))}
      </div>

      <p className="text-[10px] text-neutral-400 text-center">
        Sallen-Key 二阶低通 · f₀=1/(2π√R₁R₂C₁C₂) · Butterworth: Q≈0.707 · 增大 Q 产生谐振峰
      </p>
    </div>
  );
}
