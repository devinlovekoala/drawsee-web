export type DigitalComponentKind =
  | 'and'
  | 'nand'
  | 'or'
  | 'nor'
  | 'xor'
  | 'xnor'
  | 'not'
  | 'buffer'
  | 'mux'
  | 'demux'
  | 'decoder'
  | 'encoder'
  | 'dff'
  | 'tff'
  | 'sr_latch'
  | 'jkff'
  | 'counter'
  | 'register'
  | 'rom'
  | 'ram'
  | 'custom';

export interface DigitalPortSpec {
  id?: string;
  name: string;
  width?: number;
  net?: string;
  default?: number | string;
  description?: string;
}

export interface DigitalIOConfig {
  inputs: DigitalPortSpec[];
  outputs: DigitalPortSpec[];
  inouts?: DigitalPortSpec[];
}

export interface DigitalNetSpec {
  id: string;
  name?: string;
  width?: number;
  attributes?: Record<string, unknown>;
}

export type DigitalComponentConnection = Record<string, string | string[]>;

export interface DigitalComponent {
  id: string;
  type: DigitalComponentKind | string;
  label?: string;
  description?: string;
  inputs?: DigitalComponentConnection;
  outputs?: DigitalComponentConnection;
  parameters?: Record<string, unknown>;
  metadata?: Record<string, unknown>;
}

export interface DigitalClockConfig {
  signal: string;
  periodNs: number;
  phaseNs?: number;
  initial?: 0 | 1;
}

export interface DigitalStimulusEvent {
  signal: string;
  at: number;
  value: number | string;
  width?: number;
}

export interface DigitalDesignSimulationProfile {
  timescale?: string;
  durationNs?: number;
  clocks?: DigitalClockConfig[];
  stimuli?: DigitalStimulusEvent[];
  testbenchCode?: string;
}

export interface DigitalDesignArtifacts {
  verilog?: string;
  sources?: Array<{ filename?: string; content: string }>;
  digitalJsProject?: Record<string, unknown>;
}

export interface DigitalDesign {
  id: string;
  name: string;
  topModule?: string;
  version?: string;
  description?: string;
  createdAt?: string;
  updatedAt?: string;
  ports: DigitalIOConfig;
  nets: DigitalNetSpec[];
  components: DigitalComponent[];
  artifacts?: DigitalDesignArtifacts;
  simulation?: DigitalDesignSimulationProfile;
  tags?: string[];
  metadata?: Record<string, unknown>;
}

export interface DigitalNetlistPayload {
  id?: string;
  name?: string;
  topModule?: string;
  io?: DigitalIOConfig;
  filename?: string;
  verilog?: string;
  design?: DigitalDesign;
}

export interface DigitalTestbenchConfig {
  moduleName?: string;
  dumpfile?: string;
  durationNs?: number;
  clocks?: DigitalClockConfig[];
  stimuli?: DigitalStimulusEvent[];
  timescale?: string;
  code?: string;
  dumpHierarchy?: string[];
}

export interface DigitalSourceFile {
  filename?: string;
  content: string;
}

export interface DigitalSimulationRequest {
  runId?: string;
  topModule: string;
  io: DigitalIOConfig;
  verilog?: string;
  verilogSources?: DigitalSourceFile[];
  digitalNetlist?: DigitalNetlistPayload;
  testbench?: DigitalTestbenchConfig;
  simulation?: DigitalTestbenchConfig;
}

export interface DigitalSimulationResponse {
  runId: string;
  success: boolean;
  topModule?: string;
  io?: DigitalIOConfig;
  compileLog?: string;
  runtimeLog?: string;
  warnings?: string[];
  durationNs?: number;
  dumpFile?: string;
  vcd?: string;
  error?: string;
  stdout?: string;
  stderr?: string;
}

export interface DigitalWaveformSample {
  time: number;
  value: string;
}

export interface DigitalWaveformTrace {
  signal: string;
  width: number;
  id?: string;
  samples: DigitalWaveformSample[];
}

export interface DigitalSimulationResult extends DigitalSimulationResponse {
  waveforms: DigitalWaveformTrace[];
}

export type DigitalSimulationStatus = 'idle' | 'running' | 'success' | 'error';
