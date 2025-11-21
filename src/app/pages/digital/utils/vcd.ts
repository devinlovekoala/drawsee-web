import { DigitalIOConfig, DigitalWaveformTrace } from '../types';

export interface VcdParseOptions {
  maxPoints?: number;
  onlySignals?: string[];
}

interface VcdVarInfo {
  name: string;
  size: number;
}

const downsample = (samples: { time: number; value: string }[], maxPoints?: number) => {
  if (!maxPoints || samples.length <= maxPoints) {
    return samples;
  }
  const step = Math.ceil(samples.length / maxPoints);
  return samples.filter((_, idx) => idx % step === 0);
};

export const parseVcdToWaveforms = (
  vcd: string,
  io?: DigitalIOConfig,
  options?: VcdParseOptions
): DigitalWaveformTrace[] => {
  if (!vcd) return [];

  const preferredOrder = new Map<string, number>();
  io?.inputs?.forEach((port, idx) => preferredOrder.set(port.name, idx));
  io?.outputs?.forEach((port, idx) => preferredOrder.set(port.name, 1000 + idx));
  io?.inouts?.forEach((port, idx) => preferredOrder.set(port.name, 2000 + idx));

  const onlySignals = options?.onlySignals;
  const symbolMap = new Map<string, VcdVarInfo>();
  const traces = new Map<string, DigitalWaveformTrace>();
  const lastValues = new Map<string, string>();

  const lines = vcd.split(/\r?\n/);
  let inDefinitions = true;
  let currentTime = 0;

  const shouldTrack = (name: string) =>
    !onlySignals || onlySignals.length === 0 || onlySignals.includes(name);

  const ensureTrace = (symbol: string) => {
    const info = symbolMap.get(symbol);
    if (!info || !shouldTrack(info.name)) {
      return null;
    }
    if (!traces.has(symbol)) {
      traces.set(symbol, {
        signal: info.name,
        width: info.size,
        id: symbol,
        samples: [],
      });
    }
    return traces.get(symbol)!;
  };

  const recordValue = (symbol: string, rawValue: string) => {
    const trace = ensureTrace(symbol);
    if (!trace) return;
    const normalized = rawValue.trim();
    const lastValue = lastValues.get(symbol);
    if (lastValue === normalized && trace.samples.length) {
      // 更新同一时间点的值
      const lastSample = trace.samples[trace.samples.length - 1];
      if (lastSample.time === currentTime) {
        lastSample.value = normalized;
      }
      return;
    }
    if (lastValue === normalized) {
      return;
    }
    trace.samples.push({ time: currentTime, value: normalized });
    lastValues.set(symbol, normalized);
  };

  for (const rawLine of lines) {
    const line = rawLine.trim();
    if (!line) continue;

    if (line.startsWith('$enddefinitions')) {
      inDefinitions = false;
      continue;
    }

    if (inDefinitions) {
      if (line.startsWith('var ')) {
        const match = line.match(/^var\s+\S+\s+(\d+)\s+(\S+)\s+(.+?)\s+\$end$/);
        if (match) {
          const size = Number(match[1]) || 1;
          const symbol = match[2];
          const name = match[3];
          symbolMap.set(symbol, { name, size });
        }
      }
      continue;
    }

    if (line.startsWith('#')) {
      const timeValue = Number(line.substring(1));
      if (!Number.isNaN(timeValue)) {
        currentTime = timeValue;
      }
      continue;
    }

    if (line.startsWith('b') || line.startsWith('r')) {
      const parts = line.split(/\s+/);
      if (parts.length >= 2) {
        const symbol = parts[1];
        const value = parts[0].substring(1);
        recordValue(symbol, value);
      }
      continue;
    }

    const symbol = line.substring(1);
    const value = line[0];
    recordValue(symbol, value);
  }

  const maxPoints = options?.maxPoints;
  const ordered = Array.from(traces.values()).map((trace) => ({
    ...trace,
    samples: downsample(trace.samples, maxPoints),
  }));

  ordered.sort((a, b) => {
    const orderA = preferredOrder.get(a.signal) ?? Number.MAX_SAFE_INTEGER;
    const orderB = preferredOrder.get(b.signal) ?? Number.MAX_SAFE_INTEGER;
    if (orderA !== orderB) return orderA - orderB;
    return a.signal.localeCompare(b.signal);
  });

  return ordered;
};
