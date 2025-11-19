// Simple ngspice backend bridge for front-end simulation requests.
// Requires a native ngspice binary available in PATH or configured via NGSPICE_BIN env.
import express from 'express';
import cors from 'cors';
import { promises as fs } from 'fs';
import { tmpdir } from 'os';
import path from 'path';
import { randomUUID } from 'crypto';
import { execFile } from 'child_process';

const app = express();
const PORT = process.env.PORT || 3001;
const DEFAULT_BIN = '/home/devin/Workspace/drawsee-platform/ngspice/linux-ubuntu/build/ngspice';
const NGSPICE_BIN = process.env.NGSPICE_BIN || DEFAULT_BIN;

app.use(express.json({ limit: '2mb' }));
app.use(cors());

const textDecoder = new TextDecoder();

const parseRawAscii = (rawBuffer) => {
  const text = textDecoder.decode(rawBuffer);
  const lines = text.split(/\r?\n/);
  const vectors = {};
  const variableNames = [];
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

const buildWaveform = (time, value) => {
  const length = Math.min(time.length, value.length);
  if (!length) return [];
  const step = Math.max(1, Math.ceil(length / MAX_WAVEFORM_POINTS));
  const data = [];
  for (let i = 0; i < length; i += step) {
    data.push({ time: time[i] * 1000, value: value[i] });
  }
  return data;
};

const computeStats = (values) => {
  if (!values.length) return null;
  let min = values[0];
  let max = values[0];
  let sum = 0;
  let sumSquares = 0;
  let peak = Math.abs(values[0]);
  values.forEach((v) => {
    if (v < min) min = v;
    if (v > max) max = v;
    const abs = Math.abs(v);
    if (abs > peak) peak = abs;
    sum += v;
    sumSquares += v * v;
  });
  const avg = sum / values.length;
  const rms = Math.sqrt(sumSquares / values.length);
  const last = values[values.length - 1];
  const peakToPeak = max - min;
  return { min, max, avg, rms, last, peak, peakToPeak };
};

const formatNumber = (value, digits = 6) => Number(value.toFixed(digits));

const estimateFrequency = (waveform) => {
  if (!waveform || waveform.length < 2) return null;
  const zeroCrossings = [];
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
  const periods = [];
  for (let i = 1; i < zeroCrossings.length; i++) {
    const periodMs = zeroCrossings[i] - zeroCrossings[i - 1];
    if (periodMs > 0) periods.push(periodMs);
  }
  if (!periods.length) return null;
  const avgPeriodMs = periods.reduce((sum, v) => sum + v, 0) / periods.length;
  if (avgPeriodMs <= 0) return null;
  return 1000 / avgPeriodMs;
};

app.post('/simulate', async (req, res) => {
  try {
    const { netlist, bindings } = req.body || {};
    if (!netlist || !Array.isArray(bindings)) {
      return res.status(400).json({ error: 'invalid request' });
    }

    const tmpDir = await fs.mkdtemp(path.join(tmpdir(), 'ngspice-'));
    const circuitPath = path.join(tmpDir, 'circuit.cir');
    const rawPath = path.join(tmpDir, 'out.raw');

    const trimmedNetlist = String(netlist).trim();
    const netlistWithoutEnd = trimmedNetlist.replace(/\.end\s*$/im, '').trim();
    const controlBlock = [
      '.control',
      'set filetype=ascii',
      'set wr_singlescale',
      'run',
      `write ${rawPath}`,
      'quit',
      '.endc',
      '.end'
    ].join('\n');
    const netlistContent = `${netlistWithoutEnd}\n${controlBlock}\n`;

    await fs.writeFile(circuitPath, netlistContent, 'utf8');

    await new Promise((resolve, reject) => {
      execFile(
        NGSPICE_BIN,
        ['-b', circuitPath],
        { timeout: 20000 },
        (error, stdout, stderr) => {
          if (error) {
            reject(new Error(stderr || error.message));
          } else {
            resolve(stdout);
          }
        }
      );
    });

    const rawBuffer = await fs.readFile(rawPath);
    const vectors = parseRawAscii(rawBuffer);
    const time = vectors['time']?.real || [];

    const measurements = bindings.map((binding) => {
      const netNames = (binding.nets || []).map((n) => n.toLowerCase());
      const metrics = {};
      let waveform;
      let channelWaveforms;

      if (binding.elementType === 'ammeter') {
        const key = binding.measureKey?.toLowerCase() || `i(${binding.label?.toLowerCase()})`;
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
        const v1 = vectors[`v(${n1})`];
        const v2 = vectors[`v(${n2})`];
        if (v1 && v2) {
          const diff = v1.real.map((v, idx) => v - (v2.real[idx] || 0));
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

        const captureChannel = (channelId) => {
          if (!channelId) return null;
          const netName = channelId.toLowerCase();
          const vec = vectors[`v(${netName})`];
          if (!vec) return null;
          const diff = vec.real.map((value, idx) => value - (groundVec?.real[idx] || 0));
          const series = buildWaveform(time, diff);
          channelWaveforms[channelId] = series;
          return { diff, series };
        };

        const primaryData = captureChannel(binding.channels[0]);
        captureChannel(binding.channels[1]);

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

    res.json({ measurements });
  } catch (err) {
    res.status(500).json({ error: err?.message || 'simulation failed' });
  }
});

app.listen(PORT, () => {
  console.log(`ngspice bridge listening on http://localhost:${PORT}`);
  console.log(`Using ngspice binary: ${NGSPICE_BIN}`);
});
