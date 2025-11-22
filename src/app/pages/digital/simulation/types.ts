import { CircuitDesign } from '@/api/types/circuit.types';

export type DigitalSignalRole = 'input' | 'output' | 'clock' | 'probe' | 'internal';

export interface DigitalStimulusEvent {
  signal: string;
  at: number;
  value: string;
  width?: number;
}

export interface DigitalClockConfig {
  signal: string;
  periodNs: number;
  initial?: 0 | 1;
  phaseNs?: number;
}

export interface DigitalProbe {
  elementId?: string;
  label: string;
  signal: string;
  role: DigitalSignalRole;
}

export interface DigitalSimulationPlan {
  topModule: string;
  verilog: string;
  io: {
    inputs: Array<{ name: string; width?: number; default?: number | string }>;
    outputs: Array<{ name: string; width?: number }>;
    inouts?: Array<{ name: string; width?: number }>;
  };
  testbench: {
    durationNs: number;
    clocks: DigitalClockConfig[];
    stimuli: DigitalStimulusEvent[];
  };
  probes: DigitalProbe[];
  endpointSignalMap: Record<string, string>;
  warnings: string[];
  design: CircuitDesign;
}

export interface DigitalWaveformSample {
  time: number;
  value: string;
}

export interface DigitalWaveformTrace {
  signal: string;
  label?: string;
  role?: DigitalSignalRole;
  samples: DigitalWaveformSample[];
}

export interface DigitalSimulationResult {
  plan: DigitalSimulationPlan;
  waveforms: DigitalWaveformTrace[];
  rawVcd?: string;
  warnings: string[];
  durationNs: number;
}
