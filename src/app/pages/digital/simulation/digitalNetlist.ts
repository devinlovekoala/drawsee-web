import { CircuitDesign, CircuitElementType, Port } from '@/api/types/circuit.types';
import { DigitalSimulationPlan, DigitalStimulusEvent, DigitalClockConfig, DigitalProbe } from './types';

const DIGITAL_GATE_TYPES = new Set<CircuitElementType>([
  CircuitElementType.DIGITAL_AND,
  CircuitElementType.DIGITAL_OR,
  CircuitElementType.DIGITAL_NOT,
  CircuitElementType.DIGITAL_NAND,
  CircuitElementType.DIGITAL_NOR,
  CircuitElementType.DIGITAL_XOR,
  CircuitElementType.DIGITAL_XNOR,
  CircuitElementType.DIGITAL_DFF,
]);

const DIGITAL_IO_TYPES = new Set<CircuitElementType>([
  CircuitElementType.DIGITAL_INPUT,
  CircuitElementType.DIGITAL_OUTPUT,
  CircuitElementType.DIGITAL_CLOCK,
]);

const PASSIVE_DIGITAL_TYPES = new Set<CircuitElementType>([
  CircuitElementType.JUNCTION,
  CircuitElementType.WIRE,
]);

const sanitizeIdentifier = (value: string, fallback: string) => {
  const compact = value.trim().replace(/[^0-9A-Za-z_]/g, '_');
  const safe = compact.replace(/^(\d)/, '_$1');
  return safe || fallback;
};

const uniqueNameFactory = () => {
  const taken = new Set<string>();
  return (base: string) => {
    let candidate = base;
    let suffix = 1;
    while (taken.has(candidate)) {
      candidate = `${base}_${suffix++}`;
    }
    taken.add(candidate);
    return candidate;
  };
};

const DEFAULT_INPUT_STEP_NS = 10;
const parseNumericDuration = (raw: string | number | undefined, fallback: number) => {
  if (typeof raw === 'number' && Number.isFinite(raw)) return raw;
  if (typeof raw !== 'string') return fallback;
  const trimmed = raw.trim();
  if (!trimmed) return fallback;
  const match = trimmed.match(/^([-+]?\d*\.?\d+)([a-zA-Z]+)?$/);
  if (!match) {
    const numeric = Number(trimmed);
    return Number.isFinite(numeric) ? numeric : fallback;
  }
  const magnitude = Number(match[1]);
  if (!Number.isFinite(magnitude)) return fallback;
  const unit = (match[2] || '').toLowerCase();
  const factor =
    unit === 'ms' ? 1e6 :
    unit === 'us' ? 1e3 :
    unit === 'ns' || unit === '' ? 1 :
    unit === 'ps' ? 1e-3 :
    1;
  return Math.max(magnitude * factor, 1);
};

const parseStimulusSequence = (value: string | undefined) => {
  const normalized = (value || '').replace(/[^01]/g, '');
  if (!normalized) {
    return { initial: 0, events: [] as Array<{ at: number; value: string }>, span: DEFAULT_INPUT_STEP_NS };
  }
  const bits = normalized.split('').map((ch) => (ch === '1' ? '1' : '0'));
  const initial = bits[0];
  const events: Array<{ at: number; value: string }> = [];
  for (let i = 1; i < bits.length; i += 1) {
    if (bits[i] === bits[i - 1]) continue;
    events.push({ at: i * DEFAULT_INPUT_STEP_NS, value: bits[i] });
  }
  const span = Math.max(bits.length * DEFAULT_INPUT_STEP_NS, DEFAULT_INPUT_STEP_NS);
  return { initial: initial === '1' ? 1 : 0, events, span };
};

const getEndpointKey = (elementId: string, portId: string) => `${elementId}:${portId}`;

class UnionFind {
  private parent = new Map<string, string>();

  private find(x: string): string {
    if (!this.parent.has(x)) {
      this.parent.set(x, x);
    }
    const p = this.parent.get(x)!;
    if (p !== x) {
      const root = this.find(p);
      this.parent.set(x, root);
      return root;
    }
    return p;
  }

  union(a: string, b: string) {
    const ra = this.find(a);
    const rb = this.find(b);
    if (ra !== rb) {
      this.parent.set(ra, rb);
    }
  }

  getRoots(): Map<string, string[]> {
    const groups = new Map<string, string[]>();
    for (const key of this.parent.keys()) {
      const root = this.find(key);
      if (!groups.has(root)) groups.set(root, []);
      groups.get(root)!.push(key);
    }
    return groups;
  }

  getOrCreateRoot(key: string) {
    if (!this.parent.has(key)) {
      this.parent.set(key, key);
    }
    return this.find(key);
  }
}

const getPorts = (element: { ports?: Port[] }) => element.ports || [];

const elementLabel = (elementId: string, label?: string) =>
  sanitizeIdentifier(label || elementId, elementId);

export const buildDigitalSimulationPlan = (design: CircuitDesign): DigitalSimulationPlan => {
  if (!design.elements?.length) {
    throw new Error('当前设计为空，无法生成数字仿真网表');
  }

  const supportedTypes = new Set<CircuitElementType>([
    ...DIGITAL_GATE_TYPES,
    ...DIGITAL_IO_TYPES,
    ...PASSIVE_DIGITAL_TYPES,
  ]);

  const unsupported = design.elements.filter(
    (el) => !supportedTypes.has(el.type as CircuitElementType)
  );
  const warnings: string[] = [];
  if (unsupported.length) {
    warnings.push(`检测到 ${unsupported.length} 个暂不支持的元件，已在仿真中忽略。`);
  }

  const uf = new UnionFind();
  design.connections.forEach((conn) => {
    const sKey = getEndpointKey(conn.source.elementId, conn.source.portId);
    const tKey = getEndpointKey(conn.target.elementId, conn.target.portId);
    uf.union(sKey, tKey);
  });

  design.elements.forEach((element) => {
    if (!PASSIVE_DIGITAL_TYPES.has(element.type as CircuitElementType)) return;
    const ports = getPorts(element);
    for (let i = 1; i < ports.length; i += 1) {
      const a = getEndpointKey(element.id, ports[0].id);
      const b = getEndpointKey(element.id, ports[i].id);
      uf.union(a, b);
    }
  });

  const assignUnique = uniqueNameFactory();
  const endpointSignalMap: Record<string, string> = {};
  const netNameByRoot = new Map<string, string>();

  const registerPortName = (root: string, preferred: string) => {
    if (!netNameByRoot.has(root)) {
      netNameByRoot.set(root, assignUnique(preferred));
    }
    return netNameByRoot.get(root)!;
  };

  const inputs: Array<{ name: string; width?: number }> = [];
  const outputs: Array<{ name: string; width?: number }> = [];
  const clocks: DigitalClockConfig[] = [];
  const stimuliEvents: DigitalStimulusEvent[] = [];
  const probes: DigitalProbe[] = [];
  const dffRegisters: string[] = [];
  const assignLines: string[] = [];
  const regAssignments: string[] = [];
  const wireNames = new Set<string>();

const inputStepNs = DEFAULT_INPUT_STEP_NS;
let suggestedDuration = 200;

  design.elements.forEach((element) => {
    const type = element.type as CircuitElementType;
    if (type === CircuitElementType.DIGITAL_INPUT) {
      const port = getPorts(element)[0];
      if (!port) return;
      const key = getEndpointKey(element.id, port.id);
      const root = uf.getOrCreateRoot(key);
      const portName = registerPortName(root, elementLabel(element.id, element.label || 'din'));
      endpointSignalMap[key] = portName;
      const stimulus = parseStimulusSequence(
        (element.value as string) ||
        ((element.properties?.value as string) ?? '')
      );
      inputs.push({ name: portName, default: stimulus.initial });
      if (stimulus.events.length) {
        stimulus.events.forEach((event) => {
          stimuliEvents.push({
            signal: portName,
            at: event.at,
            value: event.value,
          });
        });
        suggestedDuration = Math.max(suggestedDuration, stimulus.span + inputStepNs);
      }
      probes.push({
        elementId: element.id,
        label: elementLabel(element.id, element.label),
        signal: portName,
        role: 'input',
      });
    } else if (type === CircuitElementType.DIGITAL_CLOCK) {
      const port = getPorts(element)[0];
      if (!port) return;
      const key = getEndpointKey(element.id, port.id);
      const root = uf.getOrCreateRoot(key);
      const portName = registerPortName(root, elementLabel(element.id, element.label || 'clk'));
      endpointSignalMap[key] = portName;
      inputs.push({ name: portName, default: 0 });
      const period = parseNumericDuration(
        typeof element.value === 'string' ? element.value : element.properties?.value as string,
        10
      );
      clocks.push({ signal: portName, periodNs: period, initial: 0 });
      probes.push({
        elementId: element.id,
        label: elementLabel(element.id, element.label),
        signal: portName,
        role: 'clock',
      });
      suggestedDuration = Math.max(suggestedDuration, period * 8);
    } else if (type === CircuitElementType.DIGITAL_OUTPUT) {
      const port = getPorts(element)[0];
      if (!port) return;
      const key = getEndpointKey(element.id, port.id);
      const root = uf.getOrCreateRoot(key);
      const portName = registerPortName(root, elementLabel(element.id, element.label || 'dout'));
      endpointSignalMap[key] = portName;
      outputs.push({ name: portName });
      probes.push({
        elementId: element.id,
        label: elementLabel(element.id, element.label),
        signal: portName,
        role: 'output',
      });
    }
  });

  const getNetForElementPort = (element: CircuitDesign['elements'][number], portId: string) => {
    const key = getEndpointKey(element.id, portId);
    return endpointSignalMap[key];
  };

  const requireNet = (element: CircuitDesign['elements'][number], portId: string) => {
    const net = getNetForElementPort(element, portId);
    if (!net) {
      const root = uf.getOrCreateRoot(getEndpointKey(element.id, portId));
      const fallback = registerPortName(root, assignUnique(`n${netNameByRoot.size + 1}`));
      endpointSignalMap[getEndpointKey(element.id, portId)] = fallback;
      return fallback;
    }
    return net;
  };

  const logicElements = design.elements.filter((el) =>
    DIGITAL_GATE_TYPES.has(el.type as CircuitElementType)
  );

  logicElements.forEach((element) => {
    const type = element.type as CircuitElementType;
    const ports = getPorts(element);
    const byId = new Map(ports.map((port) => [port.id, port]));
    const pick = (id: string, fallbackIndex = 0) => {
      const port = byId.get(id) || ports[fallbackIndex];
      return port ? requireNet(element, port.id) : null;
    };
    switch (type) {
      case CircuitElementType.DIGITAL_AND: {
        const in1 = pick('in1');
        const in2 = pick('in2', 1);
        const out = pick('out', 2);
        if (in1 && in2 && out) {
          assignLines.push(`assign ${out} = ${in1} & ${in2};`);
        }
        break;
      }
      case CircuitElementType.DIGITAL_OR: {
        const in1 = pick('in1');
        const in2 = pick('in2', 1);
        const out = pick('out', 2);
        if (in1 && in2 && out) {
          assignLines.push(`assign ${out} = ${in1} | ${in2};`);
        }
        break;
      }
      case CircuitElementType.DIGITAL_NOT: {
        const input = pick('in');
        const out = pick('out', 1);
        if (input && out) {
          assignLines.push(`assign ${out} = ~${input};`);
        }
        break;
      }
      case CircuitElementType.DIGITAL_NAND: {
        const in1 = pick('in1');
        const in2 = pick('in2', 1);
        const out = pick('out', 2);
        if (in1 && in2 && out) {
          assignLines.push(`assign ${out} = ~(${in1} & ${in2});`);
        }
        break;
      }
      case CircuitElementType.DIGITAL_NOR: {
        const in1 = pick('in1');
        const in2 = pick('in2', 1);
        const out = pick('out', 2);
        if (in1 && in2 && out) {
          assignLines.push(`assign ${out} = ~(${in1} | ${in2});`);
        }
        break;
      }
      case CircuitElementType.DIGITAL_XOR: {
        const in1 = pick('in1');
        const in2 = pick('in2', 1);
        const out = pick('out', 2);
        if (in1 && in2 && out) {
          assignLines.push(`assign ${out} = ${in1} ^ ${in2};`);
        }
        break;
      }
      case CircuitElementType.DIGITAL_XNOR: {
        const in1 = pick('in1');
        const in2 = pick('in2', 1);
        const out = pick('out', 2);
        if (in1 && in2 && out) {
          assignLines.push(`assign ${out} = ~(${in1} ^ ${in2});`);
        }
        break;
      }
      case CircuitElementType.DIGITAL_DFF: {
        const d = pick('d');
        const clk = pick('clk', 1);
        const q = pick('q', 2);
        if (d && clk && q) {
          const regName = assignUnique(`reg_${elementLabel(element.id, element.label || 'dff')}`);
          dffRegisters.push(`reg ${regName};`);
          regAssignments.push(`always @(posedge ${clk}) begin ${regName} <= ${d}; end`);
          assignLines.push(`assign ${q} = ${regName};`);
        }
        break;
      }
      default:
        break;
    }
  });

  const portNames = new Set([
    ...inputs.map((p) => p.name),
    ...outputs.map((p) => p.name),
  ]);

  for (const netName of netNameByRoot.values()) {
    if (!portNames.has(netName)) {
      wireNames.add(netName);
    }
  }

  const headerPorts = [
    ...inputs.map((p) => p.name),
    ...outputs.map((p) => p.name),
  ];

  const verilogLines: string[] = [];
  verilogLines.push(`module digital_top(`);
  verilogLines.push(`  ${headerPorts.join(',\n  ')}`);
  verilogLines.push(`);`);
  verilogLines.push('');
  inputs.forEach((input) => {
    verilogLines.push(`  input wire ${input.name};`);
  });
  outputs.forEach((output) => {
    verilogLines.push(`  output wire ${output.name};`);
  });
  if (wireNames.size) {
    verilogLines.push('');
    wireNames.forEach((wire) => {
      verilogLines.push(`  wire ${wire};`);
    });
  }
  if (dffRegisters.length) {
    verilogLines.push('');
    dffRegisters.forEach((decl) => verilogLines.push(`  ${decl}`));
  }
  if (assignLines.length) {
    verilogLines.push('');
    assignLines.forEach((line) => verilogLines.push(`  ${line}`));
  }
  if (regAssignments.length) {
    verilogLines.push('');
    regAssignments.forEach((line) => verilogLines.push(`  ${line}`));
  }
  verilogLines.push('');
  verilogLines.push('endmodule');

  const plan: DigitalSimulationPlan = {
    topModule: 'digital_top',
    verilog: verilogLines.join('\n'),
    io: {
      inputs,
      outputs,
    },
    testbench: {
      durationNs: suggestedDuration,
      clocks,
      stimuli: stimuliEvents,
    },
    probes,
    endpointSignalMap,
    warnings,
    design,
  };

  return plan;
};
