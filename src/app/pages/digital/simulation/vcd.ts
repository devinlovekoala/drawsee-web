export interface ParsedVcdTrace {
  signal: string;
  width: number;
  samples: Array<{ time: number; value: string }>;
}

interface VarInfo {
  name: string;
  size: number;
}

const downsample = <T>(samples: T[], maxPoints?: number) => {
  if (!maxPoints || samples.length <= maxPoints) {
    return samples;
  }
  const step = Math.ceil(samples.length / maxPoints);
  return samples.filter((_, index) => index % step === 0);
};

export const parseVcdToWaveforms = (
  vcd: string,
  options?: { onlySignals?: string[]; maxPoints?: number }
): ParsedVcdTrace[] => {
  if (!vcd) return [];
  const lines = vcd.split(/\r?\n/);
  const symbolMap = new Map<string, VarInfo>();
  const traces = new Map<string, ParsedVcdTrace>();
  const lastValues = new Map<string, string>();
  let inDefinitions = true;
  let currentTime = 0;

  const shouldKeep = (name: string) => {
    if (!options?.onlySignals || !options.onlySignals.length) return true;
    return options.onlySignals.some((target) =>
      name === target || name.endsWith(`.${target}`) || name.endsWith(`.${target}[0]`)
    );
  };

  const ensureTrace = (symbol: string) => {
    const info = symbolMap.get(symbol);
    if (!info || !shouldKeep(info.name)) return null;
    if (!traces.has(symbol)) {
      traces.set(symbol, {
        signal: info.name,
        width: info.size,
        samples: [],
      });
    }
    return traces.get(symbol)!;
  };

  const recordValue = (symbol: string, value: string) => {
    const trace = ensureTrace(symbol);
    if (!trace) return;
    const normalized = value.trim();
    const last = lastValues.get(symbol);
    if (last === normalized) return;
    trace.samples.push({ time: currentTime, value: normalized });
    lastValues.set(symbol, normalized);
  };

  lines.forEach((lineRaw) => {
    const line = lineRaw.trim();
    if (!line) return;
    if (line.startsWith('$enddefinitions')) {
      inDefinitions = false;
      return;
    }
    if (inDefinitions) {
      if (line.startsWith('var ') || line.startsWith('$var ')) {
        const match = line.match(/^\$?var\s+\S+\s+(\d+)\s+(\S+)\s+(.+?)\s+\$end$/);
        if (match) {
          const size = Number(match[1]) || 1;
          const symbol = match[2];
          const name = match[3];
          symbolMap.set(symbol, { name, size });
        }
      }
      return;
    }
    if (line.startsWith('#')) {
      const timeValue = Number(line.slice(1));
      if (!Number.isNaN(timeValue)) {
        currentTime = timeValue;
      }
      return;
    }
    if (line.startsWith('b') || line.startsWith('r')) {
      const parts = line.split(/\s+/);
      if (parts.length >= 2) {
        const symbol = parts[1];
        const value = parts[0].substring(1);
        recordValue(symbol, value);
      }
      return;
    }
    const symbol = line.substring(1);
    const value = line.charAt(0);
    recordValue(symbol, value);
  });

  const maxPoints = options?.maxPoints;
  return Array.from(traces.values()).map((trace) => ({
    ...trace,
    samples: downsample(trace.samples, maxPoints),
  }));
};
