import { useEffect, useMemo, useRef, useState } from 'react';
import { Edge, Node } from 'reactflow';
import { CircuitEngine } from '@/simulation/engine/CircuitEngine';
import { extractNetlist } from '@/simulation/hooks/useNetlistExtract';
import { buildEdgePoints, getNodeSize } from '@/simulation/renderer/renderMath';
import { ScopePanelResult, SimFrameResult } from '@/simulation/types/simResult';
import { scopeTraceColor } from '@/simulation/renderer/ScopeRenderer';
import { CircuitDesign } from '@/api/types/circuit.types';

export interface SimLoopOptions {
  enabled: boolean;
  design: CircuitDesign | null;
  flowNodes: Node[];
  flowEdges: Edge[];
  stepsPerFrame?: number;
  rebuildKey?: number | string;
}

const emptyFrameResult: SimFrameResult = {
  time: 0,
  converged: true,
  nodeVoltages: {},
  elementResults: {},
  edgeResults: [],
  scopePanels: [],
  maxVoltage: 0,
  maxCurrent: 0,
  fpsHint: 60,
};

const computeScopePanels = (
  engine: CircuitEngine,
  nodesById: Map<string, Node>,
  probes: ReturnType<typeof extractNetlist>['probes'],
): ScopePanelResult[] => {
  const panels: ScopePanelResult[] = [];
  for (const probe of probes) {
    const node = nodesById.get(probe.id);
    if (!node) continue;
    const size = getNodeSize(node);
    panels.push({
      elementId: probe.id,
      label: probe.label,
      position: {
        x: node.position.x + size.width + 18,
        y: node.position.y - 12,
      },
      width: 200,
      height: 88,
      traces: probe.nets.slice(0, 2).map((net, index) => ({
        key: net,
        label: net,
        color: scopeTraceColor(index),
        samples: engine.getScopeSamples(net),
      })),
    });
  }
  return panels;
};

export const useSimLoop = ({
  enabled,
  design,
  flowNodes,
  flowEdges,
  stepsPerFrame = 12,
  rebuildKey = 0,
}: SimLoopOptions) => {
  const engineRef = useRef<CircuitEngine | null>(null);
  const [frameResult, setFrameResult] = useState<SimFrameResult>(emptyFrameResult);

  const designSignature = useMemo(() => JSON.stringify(design || null), [design]);

  useEffect(() => {
    if (!design) {
      engineRef.current = null;
      setFrameResult(emptyFrameResult);
      return;
    }
    const engine = new CircuitEngine();
    engine.loadNetlist(extractNetlist(design));
    engineRef.current = engine;
    setFrameResult(emptyFrameResult);
  }, [design, designSignature, rebuildKey]);

  useEffect(() => {
    if (!enabled || !design || !engineRef.current) {
      return;
    }
    let rafId = 0;
    let lastFrameTimestamp = performance.now();
    const loop = (timestamp: number) => {
      const engine = engineRef.current;
      if (!engine) return;
      engine.stepFrames(stepsPerFrame);
      const netlist = extractNetlist(design);
      const nodeVoltages = engine.getNodeVoltages();
      const elementResults = engine.getElementResults();
      const nodesById = new Map(flowNodes.map((node) => [node.id, node]));
      const edgeResults = flowEdges.map((edge) => {
        const points = buildEdgePoints(edge, nodesById);
        const sourceNet = netlist.endpointToNet[`${edge.source}:${edge.sourceHandle || 'port1'}`] || '0';
        const targetNet = netlist.endpointToNet[`${edge.target}:${edge.targetHandle || 'port1'}`] || '0';
        const sourceVoltage = nodeVoltages[sourceNet] || 0;
        const targetVoltage = nodeVoltages[targetNet] || 0;
        const sourceResult = elementResults[edge.source];
        const targetResult = elementResults[edge.target];
        const current = (Math.abs(sourceResult?.current || 0) + Math.abs(targetResult?.current || 0)) / 2;
        return {
          edgeId: edge.id,
          avgVoltage: (sourceVoltage + targetVoltage) / 2,
          sourceVoltage,
          targetVoltage,
          current,
          points,
        };
      });
      const maxVoltage = Math.max(1e-6, ...Object.values(nodeVoltages).map((value) => Math.abs(value)));
      const maxCurrent = Math.max(1e-9, ...Object.values(elementResults).map((value) => Math.abs(value.current)));
      const scopePanels = computeScopePanels(engine, nodesById, netlist.probes);
      const fpsHint = 1000 / Math.max(1, timestamp - lastFrameTimestamp);
      lastFrameTimestamp = timestamp;
      setFrameResult({
        time: engine.time,
        converged: engine.converged,
        nodeVoltages,
        elementResults: Object.fromEntries(
          Object.entries(elementResults).map(([elementId, result]) => [
            elementId,
            {
              elementId,
              label: result.label,
              voltage: result.voltage,
              current: result.current,
              power: result.power,
              nodeVoltages: result.nodeVoltages,
              isActive: Math.abs(result.current) > 1e-8,
            },
          ]),
        ),
        edgeResults,
        scopePanels,
        maxVoltage,
        maxCurrent,
        fpsHint,
      });
      rafId = requestAnimationFrame(loop);
    };
    rafId = requestAnimationFrame(loop);
    return () => cancelAnimationFrame(rafId);
  }, [design, enabled, flowEdges, flowNodes, stepsPerFrame]);

  return {
    frameResult,
    engine: engineRef.current,
  };
};
