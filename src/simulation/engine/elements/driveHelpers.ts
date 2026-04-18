import { SourceWaveform } from '@/simulation/types/netlist';
import { MNAMatrix } from '../MNAMatrix';

export const DEFAULT_DIGITAL_VIL = 1.5;
export const DEFAULT_DIGITAL_VIH = 3.5;
export const DEFAULT_DIGITAL_LOW = 0;
export const DEFAULT_DIGITAL_HIGH = 5;
export const DEFAULT_OUTPUT_CONDUCTANCE = 100;

export const booleanToVoltage = (value: boolean | null, high = DEFAULT_DIGITAL_HIGH, low = DEFAULT_DIGITAL_LOW) => {
  if (value === null) {
    return (high + low) / 2;
  }
  return value ? high : low;
};

export const voltageToLogic = (value: number, previous: boolean | null = null) => {
  if (value >= DEFAULT_DIGITAL_VIH) return true;
  if (value <= DEFAULT_DIGITAL_VIL) return false;
  return previous;
};

export const stampDrivenNode = (
  matrix: MNAMatrix,
  node: number,
  targetVoltage: number,
  conductance = DEFAULT_OUTPUT_CONDUCTANCE,
) => {
  if (node < 0) return;
  matrix.stamp(node, node, conductance);
  matrix.stampRHS(node, conductance * targetVoltage);
};

export const resolveWaveformVoltage = (
  waveform: SourceWaveform | undefined,
  time: number,
  fallbackVoltage: number,
) => {
  if (!waveform || waveform.type === 'dc') {
    return fallbackVoltage;
  }
  if (waveform.type === 'sine') {
    const amplitude = waveform.amplitude ?? fallbackVoltage;
    const offset = waveform.offset ?? 0;
    const frequency = waveform.frequency ?? 1000;
    const phase = waveform.phase ?? 0;
    return offset + amplitude * Math.sin((2 * Math.PI * frequency * time) + phase);
  }
  if (waveform.type === 'pulse' || waveform.type === 'pwm') {
    const low = waveform.low ?? 0;
    const high = waveform.high ?? fallbackVoltage;
    const period = waveform.period ?? (waveform.frequency ? 1 / waveform.frequency : 1e-3);
    const dutyCycle = waveform.dutyCycle ?? 0.5;
    const delay = waveform.delay ?? 0;
    if (period <= 0 || time < delay) return low;
    const localTime = (time - delay) % period;
    return localTime < period * dutyCycle ? high : low;
  }
  if (waveform.type === 'sequence') {
    let value = waveform.initialValue ?? 0;
    for (const event of waveform.events || []) {
      if (time + 1e-18 >= event.time) {
        value = event.value;
      } else {
        break;
      }
    }
    return value > 0 ? (waveform.high ?? DEFAULT_DIGITAL_HIGH) : (waveform.low ?? DEFAULT_DIGITAL_LOW);
  }
  return fallbackVoltage;
};
