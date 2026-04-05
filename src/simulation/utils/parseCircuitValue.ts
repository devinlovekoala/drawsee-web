const MICRO_CHARS = ['μ', 'µ'];
const UNIT_BASE_SUFFIXES = ['ohms', 'ohm', 'hz', 'deg', 'rad', 's', 'v', 'a', 'f', 'h', 'w', 'Ω'];

const stripBaseUnit = (suffixRaw: string) => {
  if (!suffixRaw) return '';
  const lower = suffixRaw.toLowerCase();
  for (const base of UNIT_BASE_SUFFIXES) {
    if (lower.endsWith(base.toLowerCase())) {
      return suffixRaw.slice(0, suffixRaw.length - base.length);
    }
  }
  return suffixRaw;
};

const getMultiplier = (prefixRaw: string) => {
  if (!prefixRaw) return 1;
  const lower = prefixRaw.toLowerCase();
  if (lower.startsWith('meg') || prefixRaw === 'M') return 1e6;
  const first = prefixRaw[0];
  switch (first) {
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
      return MICRO_CHARS.includes(first) ? 1e-6 : 1;
  }
};

export const parseCircuitNumericValue = (rawValue: unknown, fallback: number) => {
  if (typeof rawValue === 'number') {
    return Number.isFinite(rawValue) ? rawValue : fallback;
  }
  if (typeof rawValue !== 'string') {
    return fallback;
  }
  const compact = rawValue.replace(/\s+/g, '').replace(/,/g, '.');
  if (!compact) return fallback;
  const match = compact.match(/^([-+]?\d*\.?\d+(?:[eE][-+]?\d+)?)([A-Za-zμµΩ]*)$/);
  if (!match) {
    const numeric = Number(compact);
    return Number.isFinite(numeric) ? numeric : fallback;
  }
  const [, magnitude, suffix = ''] = match;
  const numericMagnitude = Number(magnitude);
  if (!Number.isFinite(numericMagnitude)) {
    return fallback;
  }
  const prefixPart = stripBaseUnit(suffix);
  return numericMagnitude * getMultiplier(prefixPart);
};

export const parseSourcePair = (rawValue: string, fallbackAmplitude: number, fallbackFrequency: number) => {
  const text = rawValue.trim();
  const segments = text.split('@');
  const amplitude = parseCircuitNumericValue(segments[0], fallbackAmplitude);
  const frequency = parseCircuitNumericValue(segments[1], fallbackFrequency);
  return { amplitude, frequency };
};

export const parseBinarySequence = (rawValue: string | undefined, stepSeconds = 10e-9) => {
  const normalized = (rawValue || '').replace(/[^01]/g, '');
  if (!normalized) {
    return {
      initialValue: 0,
      events: [] as Array<{ time: number; value: number }>,
    };
  }
  const bits = normalized.split('').map((bit) => (bit === '1' ? 1 : 0));
  const events: Array<{ time: number; value: number }> = [];
  for (let index = 1; index < bits.length; index += 1) {
    if (bits[index] === bits[index - 1]) continue;
    events.push({
      time: index * stepSeconds,
      value: bits[index],
    });
  }
  return {
    initialValue: bits[0],
    events,
  };
};
