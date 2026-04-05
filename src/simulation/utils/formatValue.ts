const SI_PREFIXES = [
  { factor: 1e12, symbol: 'T' },
  { factor: 1e9, symbol: 'G' },
  { factor: 1e6, symbol: 'M' },
  { factor: 1e3, symbol: 'k' },
  { factor: 1, symbol: '' },
  { factor: 1e-3, symbol: 'm' },
  { factor: 1e-6, symbol: 'u' },
  { factor: 1e-9, symbol: 'n' },
  { factor: 1e-12, symbol: 'p' },
];

export const formatValue = (value: number, unit = '') => {
  if (!Number.isFinite(value)) return '-';
  if (value === 0) return unit ? `0 ${unit}` : '0';
  const abs = Math.abs(value);
  const prefix = SI_PREFIXES.find((item) => abs >= item.factor) || SI_PREFIXES[SI_PREFIXES.length - 1];
  const scaled = value / prefix.factor;
  const precision = Math.abs(scaled) >= 100 ? 1 : Math.abs(scaled) >= 10 ? 2 : 3;
  return `${scaled.toFixed(precision)} ${prefix.symbol}${unit}`.trim();
};
