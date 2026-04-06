import { CircuitDesign, CircuitElementType } from '@/api/types/circuit.types';
import { classifyNgspiceError } from './ngspiceErrors';
import { SimulationErrorDetails } from './types';

export interface SimulationAlert {
  title: string;
  summary: string;
  suggestions: string[];
  technicalDetails?: string;
}

type AnySimulationError = Error & {
  details?: SimulationErrorDetails;
};

const analogPowerTypes = new Set<CircuitElementType>([
  CircuitElementType.VOLTAGE_SOURCE,
  CircuitElementType.CURRENT_SOURCE,
  CircuitElementType.AC_SOURCE,
  CircuitElementType.PULSE_SOURCE,
  CircuitElementType.PWM_SOURCE,
  CircuitElementType.SINE_SOURCE,
]);

const analogPassiveTypes = new Set<CircuitElementType>([
  CircuitElementType.RESISTOR,
  CircuitElementType.CAPACITOR,
  CircuitElementType.INDUCTOR,
  CircuitElementType.DIODE,
  CircuitElementType.DIODE_ZENER,
  CircuitElementType.DIODE_LED,
  CircuitElementType.DIODE_SCHOTTKY,
]);

const analogActiveTypes = new Set<CircuitElementType>([
  CircuitElementType.TRANSISTOR_NPN,
  CircuitElementType.TRANSISTOR_PNP,
  CircuitElementType.OPAMP,
]);

const analogIgnoredTypes = new Set<CircuitElementType>([
  CircuitElementType.WIRE,
  CircuitElementType.JUNCTION,
  CircuitElementType.GROUND,
]);

const analogTwoTerminalTypes = new Set<CircuitElementType>([
  CircuitElementType.RESISTOR,
  CircuitElementType.CAPACITOR,
  CircuitElementType.INDUCTOR,
  CircuitElementType.DIODE,
  CircuitElementType.DIODE_ZENER,
  CircuitElementType.DIODE_LED,
  CircuitElementType.DIODE_SCHOTTKY,
  CircuitElementType.VOLTAGE_SOURCE,
  CircuitElementType.CURRENT_SOURCE,
  CircuitElementType.AC_SOURCE,
  CircuitElementType.PULSE_SOURCE,
  CircuitElementType.PWM_SOURCE,
  CircuitElementType.SINE_SOURCE,
]);

const digitalTypes = new Set<CircuitElementType>([
  CircuitElementType.DIGITAL_INPUT,
  CircuitElementType.DIGITAL_OUTPUT,
  CircuitElementType.DIGITAL_CLOCK,
  CircuitElementType.DIGITAL_AND,
  CircuitElementType.DIGITAL_AND3,
  CircuitElementType.DIGITAL_AND4,
  CircuitElementType.DIGITAL_OR,
  CircuitElementType.DIGITAL_OR3,
  CircuitElementType.DIGITAL_OR4,
  CircuitElementType.DIGITAL_NOT,
  CircuitElementType.DIGITAL_BUF,
  CircuitElementType.DIGITAL_TRI,
  CircuitElementType.DIGITAL_SCHMITT_NOT,
  CircuitElementType.DIGITAL_NAND,
  CircuitElementType.DIGITAL_NAND3,
  CircuitElementType.DIGITAL_NAND4,
  CircuitElementType.DIGITAL_NOR,
  CircuitElementType.DIGITAL_NOR3,
  CircuitElementType.DIGITAL_NOR4,
  CircuitElementType.DIGITAL_XOR,
  CircuitElementType.DIGITAL_XNOR,
  CircuitElementType.DIGITAL_DFF,
  CircuitElementType.DIGITAL_JKFF,
  CircuitElementType.DIGITAL_TFF,
  CircuitElementType.DIGITAL_SRFF,
]);

const labelOf = (element: CircuitDesign['elements'][number]) => element.label || element.id;

const compactTechnicalDetails = (value?: string | null) => {
  const normalized = (value || '').replace(/\s+/g, ' ').trim();
  return normalized || undefined;
};

const extractErrorMessage = (error: unknown) => {
  if (error instanceof Error) return error.message;
  if (typeof error === 'string') return error;
  return String(error || '');
};

const extractErrorDetails = (error: unknown) => {
  if (!error || typeof error !== 'object') return undefined;
  return (error as AnySimulationError).details;
};

const buildElementDegreeMap = (design: CircuitDesign) => {
  const degree = new Map<string, number>();
  design.elements.forEach((element) => degree.set(element.id, 0));
  design.connections.forEach((connection) => {
    degree.set(connection.source.elementId, (degree.get(connection.source.elementId) || 0) + 1);
    degree.set(connection.target.elementId, (degree.get(connection.target.elementId) || 0) + 1);
  });
  return degree;
};

const buildElementAdjacency = (design: CircuitDesign) => {
  const adjacency = new Map<string, Set<string>>();
  design.elements.forEach((element) => adjacency.set(element.id, new Set()));
  design.connections.forEach((connection) => {
    const sourceBucket = adjacency.get(connection.source.elementId);
    const targetBucket = adjacency.get(connection.target.elementId);
    sourceBucket?.add(connection.target.elementId);
    targetBucket?.add(connection.source.elementId);
  });
  return adjacency;
};

const buildEndpointDegreeMap = (design: CircuitDesign) => {
  const endpointDegree = new Map<string, number>();
  design.elements.forEach((element) => {
    element.ports.forEach((port) => {
      endpointDegree.set(`${element.id}:${port.id}`, 0);
    });
  });
  design.connections.forEach((connection) => {
    const sourceKey = `${connection.source.elementId}:${connection.source.portId}`;
    const targetKey = `${connection.target.elementId}:${connection.target.portId}`;
    endpointDegree.set(sourceKey, (endpointDegree.get(sourceKey) || 0) + 1);
    endpointDegree.set(targetKey, (endpointDegree.get(targetKey) || 0) + 1);
  });
  return endpointDegree;
};

const collectReachableElements = (roots: string[], adjacency: Map<string, Set<string>>) => {
  const visited = new Set<string>();
  const queue = [...roots];
  while (queue.length > 0) {
    const current = queue.shift();
    if (!current || visited.has(current)) continue;
    visited.add(current);
    const neighbors = adjacency.get(current);
    neighbors?.forEach((neighbor) => {
      if (!visited.has(neighbor)) {
        queue.push(neighbor);
      }
    });
  }
  return visited;
};

export const diagnoseAnalogSimulationDesign = (
  design: CircuitDesign,
  mode: 'realtime' | 'precision',
): SimulationAlert | null => {
  const elements = design.elements.filter((element) => !digitalTypes.has(element.type as CircuitElementType));
  if (elements.length === 0) {
    return {
      title: mode === 'realtime' ? '无法启动实时仿真' : '无法启动模拟仿真',
      summary: '当前画布中没有可参与模拟的模拟元件。',
      suggestions: [
        '先放置电源、地和至少一个模拟元件。',
        '如果这是数字电路，请切换到数字仿真模式。',
      ],
    };
  }

  const degreeMap = buildElementDegreeMap(design);
  const endpointDegreeMap = buildEndpointDegreeMap(design);
  const grounds = elements.filter((element) => element.type === CircuitElementType.GROUND);
  const connectedGrounds = grounds.filter((element) => (degreeMap.get(element.id) || 0) > 0);
  if (connectedGrounds.length === 0) {
    return {
      title: mode === 'realtime' ? '实时仿真缺少参考地' : '模拟电路缺少参考地',
      summary: '模拟电路必须至少有一个已接入回路的 GND，才能建立节点方程。',
      suggestions: [
        '放置一个 GND 元件并接入主回路。',
        '确认地节点不是孤立放置，而是实际连到了电源负端或参考节点。',
      ],
    };
  }

  const sources = elements.filter((element) => analogPowerTypes.has(element.type as CircuitElementType));
  const halfConnectedSources = sources.filter((element) => (degreeMap.get(element.id) || 0) < 2);
  if (halfConnectedSources.length > 0) {
    const labels = halfConnectedSources.map(labelOf).join('、');
    return {
      title: '检测到未完整接入的激励源',
      summary: `以下电源/激励源没有形成完整回路：${labels}。`,
      suggestions: [
        '检查激励源的两个端口是否都已接线。',
        '确保电源最终能回到同一参考地，而不是只连出一个端子。',
      ],
    };
  }

  const isolatedElements = elements.filter((element) => {
    if (analogIgnoredTypes.has(element.type as CircuitElementType)) return false;
    return (degreeMap.get(element.id) || 0) === 0;
  });
  if (isolatedElements.length > 0) {
    const labels = isolatedElements.map(labelOf).join('、');
    return {
      title: '检测到未接入电路的模拟元件',
      summary: `以下元件尚未接入任何连线：${labels}。`,
      suggestions: [
        '补全这些元件与主回路的连接。',
        '如果它们只是临时放置，请删除后再运行仿真。',
      ],
    };
  }

  const danglingTwoTerminalElements = elements.filter((element) => {
    if (!analogTwoTerminalTypes.has(element.type as CircuitElementType)) return false;
    const connectedPorts = element.ports.filter((port) => (endpointDegreeMap.get(`${element.id}:${port.id}`) || 0) > 0);
    return connectedPorts.length < 2;
  });
  if (danglingTwoTerminalElements.length > 0) {
    const labels = danglingTwoTerminalElements.map(labelOf).join('、');
    return {
      title: '检测到断路或悬空支路',
      summary: `以下双端元件至少有一个端口未接入回路：${labels}。这类断路在实时引擎中可能会产生数学上的虚假电压数值。`,
      suggestions: [
        '检查这些元件的两个端口是否都已接线。',
        '确认导线只是经过该元件附近，而不是视觉上贴近但实际上未连接。',
      ],
    };
  }

  const adjacency = buildElementAdjacency(design);
  const groundedReachable = collectReachableElements(connectedGrounds.map((element) => element.id), adjacency);
  const criticalElements = elements.filter((element) =>
    analogPowerTypes.has(element.type as CircuitElementType) ||
    analogActiveTypes.has(element.type as CircuitElementType) ||
    analogPassiveTypes.has(element.type as CircuitElementType),
  );
  const floatingSubcircuit = criticalElements.filter((element) => !groundedReachable.has(element.id));
  if (floatingSubcircuit.length > 0) {
    const labels = floatingSubcircuit.map(labelOf).join('、');
    return {
      title: '检测到与参考地断开的模拟子电路',
      summary: `以下元件所在子电路没有连接到任何参考地：${labels}。`,
      suggestions: [
        '确认主回路、偏置回路和负载回路都能回到同一 GND 参考。',
        '检查图片识别后的交叉点、连接点和导线是否误断开。',
      ],
    };
  }

  return null;
};

export const classifyDigitalSimulationError = (error: unknown): SimulationAlert => {
  const rawMessage = extractErrorMessage(error);
  const technicalDetails = compactTechnicalDetails(rawMessage);

  if (!rawMessage) {
    return {
      title: '数字仿真失败',
      summary: '数字仿真未能完成，但没有返回明确的错误信息。',
      suggestions: [
        '检查数字输入、时钟和逻辑门是否已正确接线。',
        '确认 Verilog 仿真服务已经启动。',
      ],
    };
  }

  if (/当前设计为空|请先在画布中放置至少一个数字元件/.test(rawMessage)) {
    return {
      title: '数字电路为空',
      summary: '当前画布中没有可参与数字仿真的元件。',
      suggestions: [
        '先放置数字输入、逻辑门和数字输出，再运行仿真。',
      ],
    };
  }

  if (/数字网络 .*多个输入源|数字网络 .*多驱动冲突|数字网络 .*多个输出驱动/.test(rawMessage)) {
    return {
      title: '数字网络存在冲突驱动',
      summary: rawMessage,
      suggestions: [
        '避免将两个输入源、时钟源或多个门输出直接短接到同一根线上。',
        '重点检查自动识图后的交叉连线、连接点和门输出端口。',
      ],
    };
  }

  if (/Unable to assign to unresolved wires|coerced to inout/i.test(rawMessage)) {
    return {
      title: '数字电路存在多驱动或误短接',
      summary: '同一根数字线上同时出现了输入源和其他驱动，或多个输出被直接并联，导致 Verilog 无法仿真。',
      suggestions: [
        '检查数字输入/时钟是否被误连到了门输出线上。',
        '检查图片转换后的交叉线是否被错误识别为连接点。',
        '避免将多个逻辑输出直接连到同一网络。',
      ],
      technicalDetails,
    };
  }

  if (/No Verilog sources provided|topModule.*required|digitalNetlist compilation is not implemented/i.test(rawMessage)) {
    return {
      title: '数字仿真请求不完整',
      summary: '前端生成的数字仿真请求缺少必要的网表信息。',
      suggestions: [
        '重新整理电路后再试一次。',
        '如果问题持续出现，请检查该电路是否包含当前尚未支持的数字器件组合。',
      ],
      technicalDetails,
    };
  }

  if (/syntax error|invalid module instantiation|malformed statement|error\(s\) during elaboration/i.test(rawMessage)) {
    return {
      title: '数字网表无法通过编译',
      summary: '当前电路生成的 Verilog 在编译阶段失败，通常意味着连线或器件组合存在结构问题。',
      suggestions: [
        '优先检查自动识图后的门输入输出方向是否正确。',
        '检查是否存在悬空端口、重复驱动或非法反馈回路。',
      ],
      technicalDetails,
    };
  }

  if (/Failed to fetch|NetworkError|Load failed|fetch failed|数字仿真服务不可用/i.test(rawMessage)) {
    return {
      title: '数字仿真服务不可用',
      summary: '前端无法连接到 Verilog 仿真服务。',
      suggestions: [
        '确认 Verilog Docker 容器或本地服务正在运行。',
        '确认前端当前连接的主机上已开放 3002 端口。',
      ],
      technicalDetails,
    };
  }

  return {
    title: '数字仿真失败',
    summary: '数字仿真未能完成，请检查电路连线、输入激励和识图结果。',
    suggestions: [
      '先检查输入源、时钟源和逻辑门输出是否发生短接。',
      '如果是图片自动转换得到的电路，请重点复核交叉线和连接点。',
    ],
    technicalDetails,
  };
};

export const classifyAnalogSimulationError = (
  error: unknown,
  mode: 'realtime' | 'precision',
): SimulationAlert => {
  const details = extractErrorDetails(error);
  const rawMessage = extractErrorMessage(error);
  const technicalDetails = compactTechnicalDetails(details?.rawMessage || rawMessage);

  if (details?.message) {
    return {
      title: mode === 'realtime' ? '实时仿真无法继续' : '模拟仿真失败',
      summary: details.message,
      suggestions: details.suggestion
        ? [details.suggestion, '检查参考地、回路闭合情况以及元件参数设置。']
        : ['检查参考地、回路闭合情况以及元件参数设置。'],
      technicalDetails,
    };
  }

  if (/Failed to fetch|NetworkError|Load failed|fetch failed/i.test(rawMessage)) {
    return {
      title: mode === 'realtime' ? '实时仿真引擎不可用' : '模拟仿真服务不可用',
      summary: mode === 'realtime'
        ? '浏览器中的实时仿真引擎未能正常启动。'
        : '前端无法连接到模拟仿真服务。',
      suggestions: mode === 'realtime'
        ? ['刷新页面后重试。', '如果问题持续，请检查浏览器控制台和构建产物是否完整。']
        : ['确认 ngspice 后端或本地仿真服务正在运行。', '确认前端当前连接的主机上已开放 3001 端口。'],
      technicalDetails,
    };
  }

  if (/矩阵不可逆|singular matrix|matrix is singular|ill-?conditioned/i.test(rawMessage)) {
    return {
      title: mode === 'realtime' ? '实时仿真无法建立方程' : '模拟电路方程不可解',
      summary: '电路当前的拓扑导致方程矩阵不可逆，常见原因是缺少参考地、悬空节点、短路或开路。',
      suggestions: [
        '确认电源与负载形成闭合回路，并且已经连接到 GND。',
        '检查是否存在悬空支路、直接短路，或图片识别后的误连线。',
      ],
      technicalDetails,
    };
  }

  if (mode === 'precision') {
    const info = classifyNgspiceError(rawMessage);
    return {
      title: '模拟仿真失败',
      summary: info.message,
      suggestions: info.suggestion
        ? [info.suggestion, '必要时逐步删减电路，定位是哪一段拓扑导致仿真失败。']
        : ['检查电路连接、参考地和元件参数。'],
      technicalDetails: compactTechnicalDetails(info.rawMessage || rawMessage),
    };
  }

  return {
    title: '实时仿真失败',
    summary: '实时仿真无法继续，请检查电路拓扑和元件连接。',
    suggestions: [
      '确认至少有一个接入主回路的 GND。',
      '确认电源、晶体管、二极管等非线性器件没有接成悬空支路。',
    ],
    technicalDetails,
  };
};
