import { CircuitDesign, CircuitElementType } from '@/api/types/circuit.types';

export type SourceWaveformType = 'dc' | 'sine' | 'pulse' | 'pwm' | 'sequence';

export interface WaveformEvent {
  time: number;
  value: number;
}

export interface SourceWaveform {
  type: SourceWaveformType;
  amplitude?: number;
  offset?: number;
  phase?: number;
  frequency?: number;
  low?: number;
  high?: number;
  dutyCycle?: number;
  delay?: number;
  rise?: number;
  fall?: number;
  width?: number;
  period?: number;
  initialValue?: number;
  events?: WaveformEvent[];
}

export interface NetlistElement {
  id: string;
  label: string;
  type: CircuitElementType;
  nets: string[];
  params: Record<string, number>;
  waveform?: SourceWaveform;
}

export interface NetlistScopeProbe {
  id: string;
  label: string;
  nets: string[];
}

export interface Netlist {
  elements: NetlistElement[];
  probes: NetlistScopeProbe[];
  nets: string[];
  endpointToNet: Record<string, string>;
  elementNets: Record<string, string[]>;
  design: CircuitDesign;
}
