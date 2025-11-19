import { CircuitDesign } from '@/api/types/circuit.types';

export type SimulationMode = 'dc' | 'ac' | 'tran';

export interface MeasurementBinding {
  elementId: string;
  elementType: string;
  label: string;
  nets: string[];
  measureKey: string;
  channels?: string[];
}

export interface SimulationRequest {
  netlist: string;
  design: CircuitDesign;
  mode: SimulationMode;
  bindings: MeasurementBinding[];
}

export interface SimulationMetric {
  [key: string]: number;
}

export interface SimulationWaveformPoint {
  time: number;
  value: number;
}

export interface SimulationMeasurementResult {
  elementId: string;
  label: string;
  elementType: string;
  metrics: SimulationMetric;
  nets?: string[];
  channels?: string[];
  waveform?: SimulationWaveformPoint[];
  channelWaveforms?: Record<string, SimulationWaveformPoint[]>;
}

export interface SimulationResponse {
  measurements: SimulationMeasurementResult[];
  error?: string;
}
