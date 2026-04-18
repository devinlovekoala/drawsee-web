import { CircuitDesign, CircuitElementType } from '@/api/types/circuit.types';
import { Netlist, NetlistElement, NetlistScopeProbe, SourceWaveform } from '@/simulation/types/netlist';
import { parseBinarySequence, parseCircuitNumericValue, parseSourcePair } from '@/simulation/utils/parseCircuitValue';

type Endpoint = {
  elementId: string;
  portId: string;
};

class UnionFind {
  private parent = new Map<string, string>();

  find(value: string): string {
    if (!this.parent.has(value)) {
      this.parent.set(value, value);
    }
    const parent = this.parent.get(value)!;
    if (parent !== value) {
      const root = this.find(parent);
      this.parent.set(value, root);
      return root;
    }
    return parent;
  }

  union(a: string, b: string) {
    const rootA = this.find(a);
    const rootB = this.find(b);
    if (rootA !== rootB) {
      this.parent.set(rootA, rootB);
    }
  }

  groups() {
    const result = new Map<string, string[]>();
    for (const key of this.parent.keys()) {
      const root = this.find(key);
      const bucket = result.get(root) || [];
      bucket.push(key);
      result.set(root, bucket);
    }
    return result;
  }
}

const getEndpointKey = ({ elementId, portId }: Endpoint) => `${elementId}:${portId}`;

const mapPortsById = (element: CircuitDesign['elements'][number], orderedIds: string[]) => {
  const ports = element.ports || [];
  const ordered = orderedIds.map((id) => ports.find((port) => port.id === id));
  return ordered.every(Boolean)
    ? (ordered as typeof ports)
    : ports;
};

const resolvePorts = (element: CircuitDesign['elements'][number]) => {
  const ports = element.ports || [];
  if (
    element.type === CircuitElementType.VOLTAGE_SOURCE ||
    element.type === CircuitElementType.CURRENT_SOURCE ||
    element.type === CircuitElementType.AC_SOURCE ||
    element.type === CircuitElementType.PULSE_SOURCE ||
    element.type === CircuitElementType.PWM_SOURCE ||
    element.type === CircuitElementType.SINE_SOURCE
  ) {
    const positive = ports.find((port) => port.id === 'positive') || ports[0];
    const negative = ports.find((port) => port.id === 'negative') || ports[1] || ports[0];
    return [positive, negative];
  }
  if (
    element.type === CircuitElementType.DIODE ||
    element.type === CircuitElementType.DIODE_LED ||
    element.type === CircuitElementType.DIODE_ZENER ||
    element.type === CircuitElementType.DIODE_SCHOTTKY
  ) {
    const anode = ports.find((port) => port.id === 'anode') || ports[0];
    const cathode = ports.find((port) => port.id === 'cathode') || ports[1] || ports[0];
    return [anode, cathode];
  }
  if (element.type === CircuitElementType.OSCILLOSCOPE) {
    const ch1 = ports.find((port) => port.id === 'channel1') || ports[0];
    const ch2 = ports.find((port) => port.id === 'channel2') || ports[1];
    const ground = ports.find((port) => port.id === 'ground') || ports[2];
    return [ch1, ch2, ground].filter(Boolean);
  }
  if (
    element.type === CircuitElementType.DIGITAL_AND ||
    element.type === CircuitElementType.DIGITAL_OR ||
    element.type === CircuitElementType.DIGITAL_NAND ||
    element.type === CircuitElementType.DIGITAL_NOR ||
    element.type === CircuitElementType.DIGITAL_XOR ||
    element.type === CircuitElementType.DIGITAL_XNOR
  ) {
    return mapPortsById(element, ['in1', 'in2', 'out']);
  }
  if (
    element.type === CircuitElementType.DIGITAL_AND3 ||
    element.type === CircuitElementType.DIGITAL_OR3 ||
    element.type === CircuitElementType.DIGITAL_NAND3 ||
    element.type === CircuitElementType.DIGITAL_NOR3
  ) {
    return mapPortsById(element, ['in1', 'in2', 'in3', 'out']);
  }
  if (
    element.type === CircuitElementType.DIGITAL_AND4 ||
    element.type === CircuitElementType.DIGITAL_OR4 ||
    element.type === CircuitElementType.DIGITAL_NAND4 ||
    element.type === CircuitElementType.DIGITAL_NOR4
  ) {
    return mapPortsById(element, ['in1', 'in2', 'in3', 'in4', 'out']);
  }
  if (
    element.type === CircuitElementType.DIGITAL_NOT ||
    element.type === CircuitElementType.DIGITAL_BUF ||
    element.type === CircuitElementType.DIGITAL_SCHMITT_NOT
  ) {
    return mapPortsById(element, ['in', 'out']);
  }
  if (element.type === CircuitElementType.DIGITAL_TRI) {
    return mapPortsById(element, ['in', 'oe', 'out']);
  }
  if (element.type === CircuitElementType.DIGITAL_INPUT || element.type === CircuitElementType.DIGITAL_CLOCK) {
    return mapPortsById(element, ['out']);
  }
  if (element.type === CircuitElementType.DIGITAL_OUTPUT) {
    return mapPortsById(element, ['in']);
  }
  if (element.type === CircuitElementType.DIGITAL_DFF) {
    return mapPortsById(element, ['d', 'pre', 'clr', 'clk', 'q', 'qn']);
  }
  if (element.type === CircuitElementType.DIGITAL_JKFF) {
    return mapPortsById(element, ['j', 'k', 'clk', 'q', 'qn']);
  }
  if (element.type === CircuitElementType.DIGITAL_TFF) {
    return mapPortsById(element, ['t', 'clk', 'q', 'qn']);
  }
  if (element.type === CircuitElementType.DIGITAL_SRFF) {
    return mapPortsById(element, ['s', 'r', 'clk', 'q', 'qn']);
  }
  if (element.type === CircuitElementType.OPAMP) {
    return mapPortsById(element, ['input1', 'input2', 'output']);
  }
  if (
    element.type === CircuitElementType.TRANSISTOR_NPN ||
    element.type === CircuitElementType.TRANSISTOR_PNP
  ) {
    return mapPortsById(element, ['base', 'collector', 'emitter']);
  }
  if (element.type === CircuitElementType.AMMETER) {
    return mapPortsById(element, ['in', 'out']);
  }
  if (element.type === CircuitElementType.VOLTMETER) {
    return mapPortsById(element, ['positive', 'negative']);
  }
  return ports;
};

const buildWaveform = (element: CircuitDesign['elements'][number]): SourceWaveform | undefined => {
  const props = (element.properties || {}) as Record<string, unknown>;
  switch (element.type) {
    case CircuitElementType.AC_SOURCE:
    case CircuitElementType.SINE_SOURCE: {
      const pair = parseSourcePair(element.value || '1V@1kHz', 1, 1000);
      return {
        type: 'sine',
        amplitude: parseCircuitNumericValue(props.va ?? pair.amplitude, pair.amplitude),
        offset: parseCircuitNumericValue(props.vo ?? 0, 0),
        frequency: parseCircuitNumericValue(props.freq ?? pair.frequency, pair.frequency),
        phase: parseCircuitNumericValue(props.phase ?? 0, 0),
      };
    }
    case CircuitElementType.PWM_SOURCE: {
      const freq = parseCircuitNumericValue(props.freqHz ?? 1000, 1000);
      const duty = Math.min(1, Math.max(0, Number(props.duty ?? 0.5)));
      return {
        type: 'pwm',
        low: parseCircuitNumericValue(props.vlow ?? 0, 0),
        high: parseCircuitNumericValue(props.vhigh ?? 5, 5),
        frequency: freq,
        dutyCycle: duty,
        period: freq > 0 ? 1 / freq : 1e-3,
      };
    }
    case CircuitElementType.PULSE_SOURCE:
      return {
        type: 'pulse',
        low: parseCircuitNumericValue(props.v1 ?? 0, 0),
        high: parseCircuitNumericValue(props.v2 ?? 5, 5),
        delay: parseCircuitNumericValue(props.td ?? 0, 0),
        rise: parseCircuitNumericValue(props.tr ?? 1e-9, 1e-9),
        fall: parseCircuitNumericValue(props.tf ?? 1e-9, 1e-9),
        width: parseCircuitNumericValue(props.pw ?? 1e-6, 1e-6),
        period: parseCircuitNumericValue(props.per ?? 2e-6, 2e-6),
        dutyCycle: parseCircuitNumericValue(props.pw ?? 1e-6, 1e-6) / Math.max(parseCircuitNumericValue(props.per ?? 2e-6, 2e-6), 1e-12),
      };
    case CircuitElementType.DIGITAL_INPUT: {
      const sequence = parseBinarySequence(
        typeof element.value === 'string' ? element.value : String(props.value || ''),
      );
      return {
        type: 'sequence',
        low: 0,
        high: 5,
        initialValue: sequence.initialValue,
        events: sequence.events,
      };
    }
    case CircuitElementType.DIGITAL_CLOCK: {
      const period = parseCircuitNumericValue(
        typeof element.value === 'string' ? element.value : props.value,
        10e-9,
      );
      return {
        type: 'pwm',
        low: 0,
        high: 5,
        dutyCycle: 0.5,
        period,
      };
    }
    default:
      return undefined;
  }
};

const extractElement = (element: CircuitDesign['elements'][number], nets: string[]): NetlistElement | null => {
  const props = (element.properties || {}) as Record<string, unknown>;
  const label = element.label || String(props.label || element.id);
  switch (element.type) {
    case CircuitElementType.RESISTOR:
      return { id: element.id, label, type: element.type, nets, params: { resistance: parseCircuitNumericValue(element.value || props.value, 1000) } };
    case CircuitElementType.CAPACITOR:
      return { id: element.id, label, type: element.type, nets, params: { capacitance: parseCircuitNumericValue(element.value || props.value, 1e-6) } };
    case CircuitElementType.INDUCTOR:
      return { id: element.id, label, type: element.type, nets, params: { inductance: parseCircuitNumericValue(element.value || props.value, 1e-3) } };
    case CircuitElementType.VOLTAGE_SOURCE:
      return { id: element.id, label, type: element.type, nets, params: { voltage: parseCircuitNumericValue(element.value || props.value, 5) } };
    case CircuitElementType.CURRENT_SOURCE:
      return { id: element.id, label, type: element.type, nets, params: { current: parseCircuitNumericValue(element.value || props.value, 0.01) } };
    case CircuitElementType.AC_SOURCE:
    case CircuitElementType.PULSE_SOURCE:
    case CircuitElementType.PWM_SOURCE:
    case CircuitElementType.SINE_SOURCE:
      return {
        id: element.id,
        label,
        type: element.type,
        nets,
        params: { voltage: parseCircuitNumericValue(element.value || props.value, 5) },
        waveform: buildWaveform(element),
      };
    case CircuitElementType.DIODE:
    case CircuitElementType.DIODE_LED:
    case CircuitElementType.DIODE_ZENER:
    case CircuitElementType.DIODE_SCHOTTKY:
      return {
        id: element.id,
        label,
        type: element.type,
        nets,
        params: {
          saturationCurrent: parseCircuitNumericValue(props.is ?? 1e-14, 1e-14),
          emissionCoefficient: parseCircuitNumericValue(props.n ?? 1, 1),
        },
      };
    case CircuitElementType.TRANSISTOR_NPN:
    case CircuitElementType.TRANSISTOR_PNP:
      return {
        id: element.id,
        label,
        type: element.type,
        nets,
        params: {
          beta: parseCircuitNumericValue(props.beta ?? 100, 100),
          saturationCurrent: parseCircuitNumericValue(props.is ?? 1e-14, 1e-14),
        },
      };
    case CircuitElementType.OPAMP:
      return {
        id: element.id,
        label,
        type: element.type,
        nets,
        params: {
          gbw: parseCircuitNumericValue(props.gbw ?? 1e6, 1e6),
          sr: parseCircuitNumericValue(props.sr ?? 0.5, 0.5),
          vos: parseCircuitNumericValue(props.vos ?? 0, 0),
          vsatMargin: parseCircuitNumericValue(props.vsatMargin ?? 1.5, 1.5),
        },
      };
    case CircuitElementType.AMMETER:
    case CircuitElementType.VOLTMETER:
    case CircuitElementType.DIGITAL_OUTPUT:
      return {
        id: element.id,
        label,
        type: element.type,
        nets,
        params: {},
      };
    case CircuitElementType.DIGITAL_INPUT:
    case CircuitElementType.DIGITAL_CLOCK:
      return {
        id: element.id,
        label,
        type: element.type,
        nets,
        params: {
          low: 0,
          high: 5,
        },
        waveform: buildWaveform(element),
      };
    case CircuitElementType.DIGITAL_AND:
    case CircuitElementType.DIGITAL_AND3:
    case CircuitElementType.DIGITAL_AND4:
    case CircuitElementType.DIGITAL_OR:
    case CircuitElementType.DIGITAL_OR3:
    case CircuitElementType.DIGITAL_OR4:
    case CircuitElementType.DIGITAL_NOT:
    case CircuitElementType.DIGITAL_BUF:
    case CircuitElementType.DIGITAL_TRI:
    case CircuitElementType.DIGITAL_SCHMITT_NOT:
    case CircuitElementType.DIGITAL_NAND:
    case CircuitElementType.DIGITAL_NAND3:
    case CircuitElementType.DIGITAL_NAND4:
    case CircuitElementType.DIGITAL_NOR:
    case CircuitElementType.DIGITAL_NOR3:
    case CircuitElementType.DIGITAL_NOR4:
    case CircuitElementType.DIGITAL_XOR:
    case CircuitElementType.DIGITAL_XNOR:
      return {
        id: element.id,
        label,
        type: element.type,
        nets,
        params: {
          tpd: parseCircuitNumericValue(props.tpdNs ?? 5, 5) * 1e-9,
          oeActiveHigh: props.oeActiveHigh === false ? 0 : 1,
        },
      };
    case CircuitElementType.DIGITAL_DFF:
    case CircuitElementType.DIGITAL_JKFF:
    case CircuitElementType.DIGITAL_TFF:
    case CircuitElementType.DIGITAL_SRFF:
      return {
        id: element.id,
        label,
        type: element.type,
        nets,
        params: {
          tpd: parseCircuitNumericValue(props.tpdNs ?? 5, 5) * 1e-9,
          edge: String(props.edge || 'posedge') === 'negedge' ? -1 : 1,
        },
      };
    default:
      return null;
  }
};

export const extractNetlist = (design: CircuitDesign): Netlist => {
  const uf = new UnionFind();
  const groundEndpoints = new Set<string>();
  const endpointToNet: Record<string, string> = {};

  for (const connection of design.connections) {
    uf.union(
      getEndpointKey({ elementId: connection.source.elementId, portId: connection.source.portId }),
      getEndpointKey({ elementId: connection.target.elementId, portId: connection.target.portId }),
    );
  }

  for (const element of design.elements) {
    for (const port of element.ports || []) {
      const key = getEndpointKey({ elementId: element.id, portId: port.id });
      uf.find(key);
      if (element.type === CircuitElementType.GROUND) {
        groundEndpoints.add(key);
      }
    }
  }

  const groups = uf.groups();
  let netCounter = 1;
  const rootToNet = new Map<string, string>();
  for (const [root, members] of groups.entries()) {
    const isGround = members.some((member) => groundEndpoints.has(member));
    rootToNet.set(root, isGround ? '0' : `N${netCounter++}`);
  }
  for (const [root, members] of groups.entries()) {
    const netName = rootToNet.get(root) || '0';
    for (const member of members) {
      endpointToNet[member] = netName;
    }
  }

  const elementNets: Record<string, string[]> = {};
  const elements: NetlistElement[] = [];
  const probes: NetlistScopeProbe[] = [];

  for (const element of design.elements) {
    const orderedPorts = resolvePorts(element);
    const nets = orderedPorts.map((port) => endpointToNet[getEndpointKey({ elementId: element.id, portId: port.id })] || '0');
    elementNets[element.id] = nets;
    if (element.type === CircuitElementType.OSCILLOSCOPE) {
      probes.push({
        id: element.id,
        label: element.label || element.id,
        nets: [nets[0] || '0', nets[1] || '0', nets[2] || '0'],
      });
      continue;
    }
    const mapped = extractElement(element, nets);
    if (mapped) {
      elements.push(mapped);
    }
  }

  const netSet = new Set<string>(['0']);
  Object.values(endpointToNet).forEach((net) => netSet.add(net || '0'));

  return {
    elements,
    probes,
    nets: Array.from(netSet),
    endpointToNet,
    elementNets,
    design,
  };
};
