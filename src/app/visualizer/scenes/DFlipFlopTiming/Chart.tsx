import { useEffect, useRef } from 'react';
import * as d3 from 'd3';
import type { Cycle } from './useDFlipFlop';

interface Props {
  history: Cycle[];
  width?: number;
}

const ROW_HEIGHT = 52;
const MARGIN = { top: 12, right: 16, bottom: 20, left: 40 };
const ROWS = ['CLK', 'D', 'Q'] as const;
const ROW_COLORS = { CLK: '#7dd3fc', D: '#c4b5fd', Q: '#86efac' };

export function DFFChart({ history, width = 460 }: Props) {
  const svgRef = useRef<SVGSVGElement>(null);

  useEffect(() => {
    if (!svgRef.current) return;

    const totalCycles = Math.max(history.length + 1, 8);
    const W = width - MARGIN.left - MARGIN.right;
    const H = ROWS.length * ROW_HEIGHT;
    const height = H + MARGIN.top + MARGIN.bottom;

    const svg = d3.select(svgRef.current);
    svg.selectAll('*').remove();
    svg.attr('width', width).attr('height', height);

    const g = svg.append('g').attr('transform', `translate(${MARGIN.left},${MARGIN.top})`);

    const xScale = d3.scaleLinear().domain([0, totalCycles]).range([0, W]);

    // Row labels
    ROWS.forEach((row, i) => {
      g.append('text')
        .attr('x', -6)
        .attr('y', i * ROW_HEIGHT + ROW_HEIGHT / 2 + 4)
        .attr('text-anchor', 'end')
        .attr('fill', ROW_COLORS[row])
        .attr('font-size', 10)
        .attr('font-weight', 600)
        .text(row);
    });

    // Row background tracks
    ROWS.forEach((_, i) => {
      g.append('rect')
        .attr('x', 0).attr('y', i * ROW_HEIGHT + 8)
        .attr('width', W).attr('height', ROW_HEIGHT - 16)
        .attr('fill', '#1e293b')
        .attr('rx', 3);
    });

    // CLK waveform (fixed square wave)
    const clkPts: [number, number][] = [];
    for (let c = 0; c < totalCycles; c++) {
      clkPts.push([c, 0], [c, 1], [c + 0.5, 1], [c + 0.5, 0], [c + 1, 0]);
    }

    const makeWavePath = (pts: [number, number][], row: number, color: string) => {
      const yHigh = row * ROW_HEIGHT + 8 + 4;
      const yLow = row * ROW_HEIGHT + ROW_HEIGHT - 8 - 4;
      const lineGen = d3.line<[number, number]>()
        .x(d => xScale(d[0]))
        .y(d => (d[1] === 1 ? yHigh : yLow))
        .curve(d3.curveStepAfter);
      g.append('path')
        .datum(pts)
        .attr('fill', 'none')
        .attr('stroke', color)
        .attr('stroke-width', 1.5)
        .attr('d', lineGen);
    };

    makeWavePath(clkPts, 0, ROW_COLORS.CLK);

    // D and Q waveforms from history
    if (history.length > 0) {
      const dPts: [number, number][] = [[0, 0]];
      const qPts: [number, number][] = [[0, 0]];

      history.forEach((cycle, i) => {
        dPts.push([i, cycle.d], [i + 1, cycle.d]);
        qPts.push([i + 1, cycle.q]);
      });

      makeWavePath(dPts, 1, ROW_COLORS.D);
      makeWavePath(qPts, 2, ROW_COLORS.Q);

      // Metastable overlays
      history.forEach((cycle, i) => {
        if (!cycle.metastable) return;
        const row = 2;
        const x0 = xScale(i + 0.5);
        const x1 = xScale(i + 1);
        const yTop = row * ROW_HEIGHT + 8;
        const yBot = row * ROW_HEIGHT + ROW_HEIGHT - 8;
        g.append('rect')
          .attr('x', x0).attr('y', yTop)
          .attr('width', x1 - x0).attr('height', yBot - yTop)
          .attr('fill', '#f97316').attr('fill-opacity', 0.25);
        g.append('text')
          .attr('x', (x0 + x1) / 2).attr('y', (yTop + yBot) / 2 + 4)
          .attr('text-anchor', 'middle').attr('fill', '#fb923c')
          .attr('font-size', 9).text('亚稳?');
      });
    }

    // Cycle tick lines
    for (let c = 0; c <= totalCycles; c++) {
      g.append('line')
        .attr('x1', xScale(c)).attr('y1', 0)
        .attr('x2', xScale(c)).attr('y2', H)
        .attr('stroke', '#334155').attr('stroke-opacity', 0.4).attr('stroke-width', 0.5);
    }

  }, [history, width]);

  return <svg ref={svgRef} style={{ display: 'block' }} />;
}
