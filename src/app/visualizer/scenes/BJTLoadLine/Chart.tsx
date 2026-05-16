import { useEffect, useRef } from 'react';
import * as d3 from 'd3';
import type { LoadLineResult, WorkRegion } from './useLoadLine';

interface Props {
  data: LoadLineResult;
  width?: number;
  height?: number;
}

const REGION_COLORS: Record<WorkRegion, string> = {
  active: '#22c55e',
  saturation: '#f97316',
  cutoff: '#94a3b8',
};

export function BJTChart({ data, width = 460, height = 300 }: Props) {
  const svgRef = useRef<SVGSVGElement>(null);

  useEffect(() => {
    if (!svgRef.current) return;

    const margin = { top: 16, right: 24, bottom: 44, left: 56 };
    const W = width - margin.left - margin.right;
    const H = height - margin.top - margin.bottom;

    const svg = d3.select(svgRef.current);
    svg.selectAll('*').remove();

    const g = svg
      .attr('width', width)
      .attr('height', height)
      .append('g')
      .attr('transform', `translate(${margin.left},${margin.top})`);

    const xScale = d3.scaleLinear().domain([0, data.xMax]).range([0, W]);
    const yScale = d3.scaleLinear().domain([0, data.yMax]).range([H, 0]);

    // Grid lines
    g.append('g')
      .attr('transform', `translate(0,${H})`)
      .call(
        d3.axisBottom(xScale).ticks(6).tickSize(-H).tickFormat(() => '')
      )
      .call(sel => sel.select('.domain').remove())
      .call(sel => sel.selectAll('line').attr('stroke', '#334155').attr('stroke-opacity', 0.5));

    g.append('g')
      .call(
        d3.axisLeft(yScale).ticks(5).tickSize(-W).tickFormat(() => '')
      )
      .call(sel => sel.select('.domain').remove())
      .call(sel => sel.selectAll('line').attr('stroke', '#334155').attr('stroke-opacity', 0.5));

    // Axes
    g.append('g')
      .attr('transform', `translate(0,${H})`)
      .call(d3.axisBottom(xScale).ticks(6))
      .call(sel => sel.selectAll('text').attr('fill', '#94a3b8').attr('font-size', 11))
      .call(sel => sel.select('.domain').attr('stroke', '#475569'))
      .call(sel => sel.selectAll('.tick line').attr('stroke', '#475569'));

    g.append('g')
      .call(d3.axisLeft(yScale).ticks(5).tickFormat(d => `${(+d * 1000).toFixed(0)}`))
      .call(sel => sel.selectAll('text').attr('fill', '#94a3b8').attr('font-size', 11))
      .call(sel => sel.select('.domain').attr('stroke', '#475569'))
      .call(sel => sel.selectAll('.tick line').attr('stroke', '#475569'));

    // Axis labels
    g.append('text')
      .attr('x', W / 2)
      .attr('y', H + 36)
      .attr('text-anchor', 'middle')
      .attr('fill', '#94a3b8')
      .attr('font-size', 12)
      .text('VCE (V)');

    g.append('text')
      .attr('transform', 'rotate(-90)')
      .attr('x', -H / 2)
      .attr('y', -44)
      .attr('text-anchor', 'middle')
      .attr('fill', '#94a3b8')
      .attr('font-size', 12)
      .text('IC (mA)');

    const line = d3.line<[number, number]>()
      .x(d => xScale(d[0]))
      .y(d => yScale(d[1]));

    // Output characteristic curves
    data.curves.forEach(curve => {
      g.append('path')
        .datum(curve.pts)
        .attr('fill', 'none')
        .attr('stroke', '#334155')
        .attr('stroke-width', 1.5)
        .attr('d', line);
    });

    // Load line
    g.append('path')
      .datum(data.loadLine)
      .attr('fill', 'none')
      .attr('stroke', '#38bdf8')
      .attr('stroke-width', 2)
      .attr('stroke-dasharray', '6,3')
      .attr('d', line);

    const qColor = REGION_COLORS[data.qPoint.region];
    const qx = xScale(data.qPoint.Vce);
    const qy = yScale(data.qPoint.Ic);

    // Q point crosshairs
    g.append('line')
      .attr('x1', qx).attr('y1', H).attr('x2', qx).attr('y2', qy)
      .attr('stroke', qColor).attr('stroke-width', 1).attr('stroke-dasharray', '3,2').attr('stroke-opacity', 0.7);
    g.append('line')
      .attr('x1', 0).attr('y1', qy).attr('x2', qx).attr('y2', qy)
      .attr('stroke', qColor).attr('stroke-width', 1).attr('stroke-dasharray', '3,2').attr('stroke-opacity', 0.7);

    // Q point dot
    g.append('circle')
      .attr('cx', qx)
      .attr('cy', qy)
      .attr('r', 6)
      .attr('fill', qColor)
      .attr('stroke', '#0f172a')
      .attr('stroke-width', 2);

    g.append('text')
      .attr('x', qx + 8)
      .attr('y', qy - 8)
      .attr('fill', qColor)
      .attr('font-size', 11)
      .attr('font-weight', 600)
      .text(`Q (${data.qPoint.Vce.toFixed(1)}V, ${(data.qPoint.Ic * 1000).toFixed(2)}mA)`);

  }, [data, width, height]);

  return <svg ref={svgRef} />;
}
