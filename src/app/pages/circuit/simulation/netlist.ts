import { CircuitDesign, CircuitElementType } from '@/api/types/circuit.types';
import { MeasurementBinding } from './types';

type Endpoint = { elementId: string; portId: string };

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

  toGroups(): Map<string, string[]> {
    const groups = new Map<string, string[]>();
    for (const key of this.parent.keys()) {
      const root = this.find(key);
      if (!groups.has(root)) groups.set(root, []);
      groups.get(root)!.push(key);
    }
    return groups;
  }
}

const getEndpointKey = (endpoint: Endpoint) => `${endpoint.elementId}:${endpoint.portId}`;

const orderPortsForElement = (type: CircuitElementType, ports: Endpoint[], portIdToNet: Record<string, string>) => {
  switch (type) {
    case CircuitElementType.RESISTOR:
    case CircuitElementType.CAPACITOR:
    case CircuitElementType.INDUCTOR:
      return ports.slice(0, 2).map(p => portIdToNet[getEndpointKey(p)]);
    case CircuitElementType.VOLTAGE_SOURCE:
    case CircuitElementType.CURRENT_SOURCE: {
      const pos = ports.find(p => p.portId === 'positive') || ports[0];
      const neg = ports.find(p => p.portId === 'negative') || ports[1] || ports[0];
      return [portIdToNet[getEndpointKey(pos)], portIdToNet[getEndpointKey(neg)]];
    }
    case CircuitElementType.DIODE: {
      const anode = ports.find(p => p.portId === 'anode') || ports[0];
      const cathode = ports.find(p => p.portId === 'cathode') || ports[1] || ports[0];
      return [portIdToNet[getEndpointKey(anode)], portIdToNet[getEndpointKey(cathode)]];
    }
    case CircuitElementType.OPAMP: {
      const in1 = ports.find(p => p.portId === 'input1') || ports[0];
      const in2 = ports.find(p => p.portId === 'input2') || ports[1] || ports[0];
      const out = ports.find(p => p.portId === 'output') || ports[2] || ports[0];
      return [portIdToNet[getEndpointKey(in1)], portIdToNet[getEndpointKey(in2)], portIdToNet[getEndpointKey(out)]];
    }
    case CircuitElementType.AMMETER:
    case CircuitElementType.VOLTMETER: {
      // 对于电流表，需要正确的端口顺序
      // SPICE 电压源 Vxxx n+ n- 测量的正电流是从 n+ 流向 n-（内部）
      // 对应外部电流从 n- 流向 n+
      // 为了让电流表显示正确的正电流（从 in 流入，从 out 流出），
      // 需要让 SPICE 电压源的正向与外部电流方向一致
      // 即 n+ = out, n- = in
      const inPort = ports.find(p => p.portId === 'in') || ports[0];
      const outPort = ports.find(p => p.portId === 'out') || ports[1] || ports[0];
      // 返回 [out, in] 使得正电流对应从 in 流向 out（外部）
      return [portIdToNet[getEndpointKey(outPort)], portIdToNet[getEndpointKey(inPort)]];
    }
    case CircuitElementType.OSCILLOSCOPE: {
      const ch1 = ports.find(p => p.portId === 'channel1') || ports[0];
      const ch2 = ports.find(p => p.portId === 'channel2') || ports[1] || ports[0];
      const gnd = ports.find(p => p.portId === 'ground');
      return [
        portIdToNet[getEndpointKey(ch1)],
        portIdToNet[getEndpointKey(ch2)],
        gnd ? portIdToNet[getEndpointKey(gnd)] : '0',
      ];
    }
    default:
      return ports.map(p => portIdToNet[getEndpointKey(p)]);
  }
};

const MICRO_CHARS = ['μ', 'µ'];
const UNIT_BASE_SUFFIXES = ['ohms', 'ohm', 'Ω', 'v', 'a', 'f', 'h'];

const stripUnitBase = (suffixRaw: string) => {
  if (!suffixRaw) return '';
  const lower = suffixRaw.toLowerCase();
  for (const base of UNIT_BASE_SUFFIXES) {
    if (lower.endsWith(base.toLowerCase())) {
      return suffixRaw.slice(0, suffixRaw.length - base.length);
    }
  }
  return suffixRaw;
};

const getPrefixMultiplier = (prefixRaw: string) => {
  if (!prefixRaw) return 1;
  const lower = prefixRaw.toLowerCase();
  if (lower.startsWith('meg') || prefixRaw === 'M') {
    return 1e6;
  }
  const firstChar = prefixRaw[0];
  switch (firstChar) {
    case 'T':
    case 't':
      return 1e12;
    case 'G':
    case 'g':
      return 1e9;
    case 'M':
      return 1e6;
    case 'K':
    case 'k':
      return 1e3;
    case 'm':
      return 1e-3;
    case 'U':
    case 'u':
      return 1e-6;
    case 'n':
    case 'N':
      return 1e-9;
    case 'p':
    case 'P':
      return 1e-12;
    case 'f':
    case 'F':
      return 1e-15;
    default:
      if (MICRO_CHARS.includes(firstChar)) {
        return 1e-6;
      }
      return 1;
  }
};

const normalizeNumericValue = (rawValue: string, fallback: string) => {
  if (!rawValue) return fallback;
  const compact = rawValue.replace(/\s+/g, '').replace(/,/g, '.');
  if (!compact) return fallback;
  const match = compact.match(/^([-+]?\d*\.?\d+(?:[eE][-+]?\d+)?)([A-Za-zμµΩ]*)$/);
  if (!match) {
    const numeric = Number(compact);
    return Number.isFinite(numeric) ? numeric.toString() : fallback;
  }
  const [, magnitude, suffixRaw = ''] = match;
  const numericMagnitude = Number(magnitude);
  if (!Number.isFinite(numericMagnitude)) return fallback;
  const prefixPart = stripUnitBase(suffixRaw);
  const multiplier = getPrefixMultiplier(prefixPart);
  const normalized = numericMagnitude * multiplier;
  if (!Number.isFinite(normalized)) return fallback;
  // 使用 toPrecision 避免浮点数精度问题（如 10μA 变成 0.000009999999999999999）
  // SPICE 解析器对超长小数可能有问题
  const result = normalized.toPrecision(10);
  // 移除不必要的尾部零，但保留科学计数法
  return result.includes('e') ? result : parseFloat(result).toString();
};

const pickElementValue = (el: CircuitDesign['elements'][number], fallback: string) => {
  let raw: unknown = el?.value;
  if ((raw === undefined || raw === null) && el?.properties) {
    const props = el.properties as Record<string, unknown>;
    if ('value' in props) {
      raw = props['value'];
    }
  }
  const formatted =
    typeof raw === 'number'
      ? raw.toString()
      : typeof raw === 'string'
        ? raw.trim()
        : '';
  if (!formatted) return fallback;
  return normalizeNumericValue(formatted, fallback);
};

export const buildNetlist = (design: CircuitDesign) => {
  const uf = new UnionFind();
  const groundEndpoints = new Set<string>();

  design.connections.forEach(conn => {
    const sourceKey = getEndpointKey({ elementId: conn.source.elementId, portId: conn.source.portId });
    const targetKey = getEndpointKey({ elementId: conn.target.elementId, portId: conn.target.portId });
    uf.union(sourceKey, targetKey);
  });

  // 标记接地端口
  design.elements.forEach(el => {
    if (el.type === CircuitElementType.GROUND && el.ports?.length > 0) {
      el.ports.forEach(p => groundEndpoints.add(getEndpointKey({ elementId: el.id, portId: p.id })));
    }
  });

  // 建立 net 名称映射
  const groups = uf.toGroups();
  const rootToNet = new Map<string, string>();
  let netIndex = 1;

  for (const [root, members] of groups.entries()) {
    const hasGround = members.some(m => groundEndpoints.has(m));
    rootToNet.set(root, hasGround ? '0' : `N${netIndex++}`);
  }

  const endpointToNet: Record<string, string> = {};
  for (const [root, members] of groups.entries()) {
    const netName = rootToNet.get(root)!;
    members.forEach(m => { endpointToNet[m] = netName; });
  }

  const netAliases: Record<string, string> = {};

  const ensureGroundReference = (): string | null => {
    const hasGroundNet = Object.values(endpointToNet).some(net => net === '0');
    if (hasGroundNet) return null;
    const findCandidate = () => {
      for (const el of design.elements) {
        if (
          el.type === CircuitElementType.VOLTAGE_SOURCE ||
          el.type === CircuitElementType.CURRENT_SOURCE
        ) {
          const ports = el.ports || [];
          const negativePort = ports.find(p => p.id === 'negative');
          const fallbackPort = ports[1] || ports[0];
          const selectedPort = negativePort || fallbackPort;
          if (selectedPort) {
            const key = getEndpointKey({ elementId: el.id, portId: selectedPort.id });
            if (endpointToNet[key]) {
              return endpointToNet[key];
            }
          }
        }
      }
      const firstNet = Object.values(endpointToNet)[0];
      return firstNet;
    };

    const candidateNet = findCandidate();
    if (!candidateNet) return null;
    netAliases[candidateNet] = '0';
    return candidateNet;
  };

  const resolveNetName = (net?: string) => {
    if (!net) return '';
    let current = net;
    const visited = new Set<string>();
    while (netAliases[current]) {
      if (visited.has(current)) break;
      visited.add(current);
      current = netAliases[current];
    }
    return current;
  };

  const groundedNet = ensureGroundReference();

  const hasResolvedGround = Object.values(endpointToNet).some(net => resolveNetName(net) === '0');
  if (!hasResolvedGround) {
    const fallbackNet = groundedNet || Object.values(endpointToNet)[0];
    if (fallbackNet) {
      netAliases[fallbackNet] = '0';
    }
  }

  const lines: string[] = [];
  const bindings: MeasurementBinding[] = [];

  lines.push('* Auto-generated by DrawSee');
  lines.push('.option numdgt=6');

  design.elements.forEach(el => {
    const ports = (el.ports || []).map(p => ({ elementId: el.id, portId: p.id }));
    const rawNets = orderPortsForElement(el.type as CircuitElementType, ports, endpointToNet);
    const nets = rawNets.map(net => resolveNetName(net) || '0');
    // 确保 label 是字符串类型
    const propsLabel = el.properties?.label;
    const label = el.label || (typeof propsLabel === 'string' ? propsLabel : undefined) || el.id;

    switch (el.type) {
      case CircuitElementType.RESISTOR:
        lines.push(`R${label} ${nets[0]} ${nets[1]} ${pickElementValue(el, '1000')}`);
        break;
      case CircuitElementType.CAPACITOR:
        lines.push(`C${label} ${nets[0]} ${nets[1]} ${pickElementValue(el, '0.000001')}`);
        break;
      case CircuitElementType.INDUCTOR:
        lines.push(`L${label} ${nets[0]} ${nets[1]} ${pickElementValue(el, '0.001')}`);
        break;
      case CircuitElementType.VOLTAGE_SOURCE:
        lines.push(`V${label} ${nets[0]} ${nets[1]} ${pickElementValue(el, '5')}`);
        break;
      case CircuitElementType.CURRENT_SOURCE:
        lines.push(`I${label} ${nets[0]} ${nets[1]} ${pickElementValue(el, '0.01')}`);
        break;
      case CircuitElementType.DIODE:
        lines.push(`D${label} ${nets[0]} ${nets[1]} DDEFAULT`);
        break;
      case CircuitElementType.OPAMP:
        // 简化模型：理想运放，使用受控源近似
        lines.push(`E${label} ${nets[2]} 0 ${nets[0]} ${nets[1]} 1e6`);
        break;
      case CircuitElementType.AMMETER: {
        const sourceName = `VAM${label}`;
        lines.push(`${sourceName} ${nets[0]} ${nets[1]} 0`);
        bindings.push({
          elementId: el.id,
          elementType: el.type,
          label,
          nets,
          measureKey: `I(${sourceName})`,
        });
        break;
      }
      case CircuitElementType.VOLTMETER: {
        bindings.push({
          elementId: el.id,
          elementType: el.type,
          label,
          nets,
          measureKey: `${nets[0]}-${nets[1]}`,
        });
        break;
      }
      case CircuitElementType.OSCILLOSCOPE: {
        bindings.push({
          elementId: el.id,
          elementType: el.type,
          label,
          nets,
          measureKey: `${nets[0]}-${nets[2] || '0'}`,
          channels: [nets[0], nets[1], nets[2] || '0'],
        });
        break;
      }
      default:
        break;
    }
  });

  lines.push('.tran 0.1ms 10ms');
  lines.push('.model DDEFAULT D');
  lines.push('.end');

  const normalizedNets: Record<string, string> = {};
  Object.entries(endpointToNet).forEach(([key, value]) => {
    normalizedNets[key] = resolveNetName(value);
  });

  return {
    netlist: lines.join('\n'),
    bindings,
    nets: normalizedNets,
  };
};
