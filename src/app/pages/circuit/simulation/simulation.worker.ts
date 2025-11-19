/// <reference lib="webworker" />
import { SimulationRequest, SimulationResponse, SimulationWaveformPoint, SimulationMeasurementResult } from './types';

const ctx: DedicatedWorkerGlobalScope = self as any;

const NGSPICE_SCRIPT = '/ngspice/ngspice.js';

let ngModule: any = null;
let moduleReady: Promise<any> | null = null;

const ensureNgSpice = () => {
  if (ngModule) return Promise.resolve(ngModule);
  if (moduleReady) return moduleReady;

  moduleReady = new Promise((resolve, reject) => {
    (self as any).Module = {
      locateFile: (path: string) => `/ngspice/${path}`,
      print: (text: string) => console.log('[ngspice]', text),
      printErr: (text: string) => console.error('[ngspice]', text),
      noExitRuntime: true,
      onAbort: (text: string) => {
        moduleReady = null;
        reject(new Error(text));
      },
      onRuntimeInitialized() {
        ngModule = (self as any).Module;
        if (!ngModule.FS) {
          moduleReady = null;
          reject(new Error('NGSPICE_WASM_UNAVAILABLE'));
          return;
        }
        resolve(ngModule);
      },
    };

    try {
      importScripts(NGSPICE_SCRIPT);
    } catch (err) {
      moduleReady = null;
      reject(err);
    }
  });

  return moduleReady;
};

const getFilesystem = () => {
  const fs = ngModule?.FS;
  if (!fs) {
    throw new Error('NGSPICE_WASM_UNAVAILABLE');
  }
  return fs;
};

const runNetlist = async (netlist: string) => {
  const mod = await ensureNgSpice();
  const FS = getFilesystem();
  const filename = '/tmp.cir';
  const rawPath = '/tmp.raw';

  const content = `set filetype=ascii\nset wr_singlescale\n${netlist}`;
  try {
    if (FS.analyzePath(filename).exists) {
      FS.unlink(filename);
    }
  } catch (err) {
    // ignore
  }
  FS.writeFile(filename, content);
  try {
    if (FS.analyzePath(rawPath).exists) {
      FS.unlink(rawPath);
    }
  } catch {}

  try {
    mod.callMain(['-b', filename, '-r', rawPath]);
  } catch (err: any) {
    // Emscripten main may throw ExitStatus; treat non-zero as error
    if (!err || err.name !== 'ExitStatus') {
      throw err;
    }
  }

  const args = ['-b', filename, '-r', rawPath];
  if (typeof mod.callMain === 'function') {
    try {
      mod.callMain(args);
    } catch (err: any) {
      if (!err || err.name !== 'ExitStatus') {
        throw err;
      }
    }
  } else if (typeof mod._main === 'function') {
    mod._main(args.length, 0);
  }

  if (!FS.analyzePath(rawPath).exists) {
    throw new Error('ngspice did not produce raw output');
  }
  const raw = FS.readFile(rawPath);
  return raw;
};

const textDecoder = new TextDecoder();

const parseRawAscii = (rawBuffer: Uint8Array) => {
  const text = textDecoder.decode(rawBuffer);
  const lines = text.split(/\r?\n/);
  const vectors: Record<string, { real: number[] }> = {};
  const variableNames: string[] = [];
  let inVariables = false;
  let inValues = false;

  for (const rawLine of lines) {
    if (rawLine.startsWith('Variables:')) {
      inVariables = true;
      inValues = false;
      continue;
    }
    if (rawLine.startsWith('Values:')) {
      inVariables = false;
      inValues = true;
      continue;
    }
    if (inVariables) {
      const trimmed = rawLine.trim();
      if (!trimmed) continue;
      const match = trimmed.match(/^(\d+)\s+(\S+)/);
      if (!match) continue;
      const index = Number(match[1]);
      const name = match[2].toLowerCase();
      variableNames[index] = name;
      vectors[name] = { real: [] };
      continue;
    }
    if (inValues) {
      const trimmed = rawLine.trim();
      if (!trimmed) continue;
      const match = trimmed.match(/^(\d+)\s+([-+eE0-9.]+)/);
      if (!match) continue;
      const index = Number(match[1]);
      const value = Number(match[2]);
      const vectorName = variableNames[index];
      if (vectorName) {
        vectors[vectorName].real.push(value);
      }
    }
  }

  return vectors;
};

const MAX_WAVEFORM_POINTS = 1500;

const buildWaveform = (time: number[], value: number[]): SimulationWaveformPoint[] => {
  const length = Math.min(time.length, value.length);
  if (!length) return [];
  const step = Math.max(1, Math.ceil(length / MAX_WAVEFORM_POINTS));
  const data: SimulationWaveformPoint[] = [];
  for (let i = 0; i < length; i += step) {
    data.push({ time: time[i] * 1000, value: value[i] });
  }
  return data;
};

const computeStats = (values: number[]) => {
  if (!values.length) return null;
  let min = values[0];
  let max = values[0];
  let sum = 0;
  let sumSquares = 0;
  let peak = Math.abs(values[0]);
  values.forEach((value) => {
    if (value < min) min = value;
    if (value > max) max = value;
    const abs = Math.abs(value);
    if (abs > peak) peak = abs;
    sum += value;
    sumSquares += value * value;
  });
  const avg = sum / values.length;
  const rms = Math.sqrt(sumSquares / values.length);
  const last = values[values.length - 1];
  const peakToPeak = max - min;
  return { min, max, avg, rms, last, peak, peakToPeak };
};

const formatNumber = (value: number, digits = 6) => Number(value.toFixed(digits));

const estimateFrequency = (waveform: SimulationWaveformPoint[]) => {
  if (!waveform || waveform.length < 2) return null;
  const zeroCrossings: number[] = [];
  for (let i = 1; i < waveform.length; i++) {
    const prev = waveform[i - 1];
    const current = waveform[i];
    if ((prev.value <= 0 && current.value > 0) || (prev.value >= 0 && current.value < 0)) {
      const delta = current.value - prev.value;
      if (delta === 0) continue;
      const ratio = -prev.value / delta;
      const crossingTime = prev.time + (current.time - prev.time) * ratio;
      zeroCrossings.push(crossingTime);
    }
  }
  if (zeroCrossings.length < 2) return null;
  const periods: number[] = [];
  for (let i = 1; i < zeroCrossings.length; i++) {
    const periodMs = zeroCrossings[i] - zeroCrossings[i - 1];
    if (periodMs > 0) periods.push(periodMs);
  }
  if (!periods.length) return null;
  const avgPeriodMs = periods.reduce((sum, value) => sum + value, 0) / periods.length;
  if (avgPeriodMs <= 0) return null;
  return 1000 / avgPeriodMs;
};

const runSimulation = async (request: SimulationRequest): Promise<SimulationMeasurementResult[]> => {
  const rawData = await runNetlist(request.netlist);
  const vectors = parseRawAscii(rawData);
  const time = vectors['time']?.real || [];

  return request.bindings.map(binding => {
    const netNames = (binding.nets || []).map(net => net.toLowerCase());
    const metrics: Record<string, number> = {};
    let waveform: SimulationWaveformPoint[] | undefined;
    let channelWaveforms: Record<string, SimulationWaveformPoint[]> | undefined;

    if (binding.elementType === 'ammeter') {
      const key = binding.measureKey?.toLowerCase() || `i(${binding.label.toLowerCase()})`;
      const currentVec = vectors[key];
      if (currentVec) {
        const stats = computeStats(currentVec.real);
        if (stats) {
          metrics.current = formatNumber(stats.last);
          metrics.minCurrent = formatNumber(stats.min);
          metrics.maxCurrent = formatNumber(stats.max);
          metrics.avgCurrent = formatNumber(stats.avg);
          metrics.rmsCurrent = formatNumber(stats.rms);
          metrics.peakCurrent = formatNumber(stats.peak);
          metrics.peakToPeakCurrent = formatNumber(stats.peakToPeak);
        }
      }
    } else if (binding.elementType === 'voltmeter' && netNames.length >= 2) {
      const [n1, n2] = netNames;
      const vector1 = vectors[`v(${n1})`];
      const vector2 = vectors[`v(${n2})`];
      if (vector1 && vector2) {
        const diff = vector1.real.map((v, idx) => v - (vector2.real[idx] || 0));
        const stats = computeStats(diff);
        if (stats) {
          metrics.voltage = formatNumber(stats.last);
          metrics.minVoltage = formatNumber(stats.min);
          metrics.maxVoltage = formatNumber(stats.max);
          metrics.avgVoltage = formatNumber(stats.avg);
          metrics.rmsVoltage = formatNumber(stats.rms);
          metrics.peakVoltage = formatNumber(stats.peak);
          metrics.peakToPeakVoltage = formatNumber(stats.peakToPeak);
        }
      }
    } else if (binding.elementType === 'oscilloscope' && binding.channels?.length) {
      channelWaveforms = {};
      const groundNet = binding.channels[2]?.toLowerCase() || '0';
      const groundVec = groundNet === '0' ? null : vectors[`v(${groundNet})`];

      const captureChannel = (channelId?: string) => {
        if (!channelId) return null;
        const netName = channelId.toLowerCase();
        const vec = vectors[`v(${netName})`];
        if (!vec) return null;
        const diff = vec.real.map((value, idx) => value - (groundVec?.real[idx] || 0));
        const series = buildWaveform(time, diff);
        channelWaveforms![channelId] = series;
        return { diff, series };
      };

      const primaryChannel = binding.channels[0];
      const secondaryChannel = binding.channels[1];
      const primaryData = captureChannel(primaryChannel);
      captureChannel(secondaryChannel);

      if (primaryData) {
        waveform = primaryData.series;
        const stats = computeStats(primaryData.diff);
        if (stats) {
          metrics.amplitude = formatNumber(stats.peak);
          metrics.peakVoltage = formatNumber(stats.peak);
          metrics.peakToPeakVoltage = formatNumber(stats.peakToPeak);
        }
        const freq = estimateFrequency(primaryData.series);
        if (freq) {
          metrics.frequency = formatNumber(freq, 3);
        }
      }
    }

    return {
      elementId: binding.elementId,
      label: binding.label,
      elementType: binding.elementType,
      metrics,
      waveform,
      channelWaveforms,
      nets: binding.nets,
      channels: binding.channels,
    };
  });
};

ctx.addEventListener('message', async (event: MessageEvent<SimulationRequest>) => {
  try {
    const measurements = await runSimulation(event.data);
    const response: SimulationResponse = { measurements };
    ctx.postMessage(response);
  } catch (error: any) {
    console.error('Simulation worker error', error);
    const response: SimulationResponse = { measurements: [], error: error?.message || '仿真失败' };
    ctx.postMessage(response);
  }
});
