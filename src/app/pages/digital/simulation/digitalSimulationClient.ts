import { CircuitDesign } from '@/api/types/circuit.types';
import { BASE_URL } from '@/api';
import { buildDigitalSimulationPlan } from './digitalNetlist';
import { parseVcdToWaveforms } from './vcd';
import { DigitalSimulationResult, DigitalWaveformTrace } from './types';

const DEFAULT_ENDPOINT = (() => {
  try {
    const apiUrl = new URL(BASE_URL);
    return `${apiUrl.protocol}//${apiUrl.hostname}:3002/simulate/digital`;
  } catch {
    return 'http://localhost:3002/simulate/digital';
  }
})();

const buildBackendErrorMessage = async (response: Response, endpoint: string) => {
  let payload: any = null;
  try {
    payload = await response.json();
  } catch {
    // Ignore non-JSON bodies and fall through to generic message.
  }

  const details = [
    payload?.error,
    payload?.stderr,
    payload?.stdout,
  ].filter((item): item is string => typeof item === 'string' && item.trim().length > 0);

  if (details.length > 0) {
    return `数字仿真后端异常(${response.status}) [${endpoint}]：${details.join(' | ')}`;
  }

  return `数字仿真后端请求失败：${response.status} [${endpoint}]`;
};

const matchSignalName = (vcdName: string, target: string) => {
  if (vcdName === target) return true;
  if (vcdName.endsWith(`.${target}`)) return true;
  if (vcdName.endsWith(`.${target}[0]`)) return true;
  return false;
};

export const runDigitalSimulation = async (design: CircuitDesign): Promise<DigitalSimulationResult> => {
  const plan = buildDigitalSimulationPlan(design);
  const requestBody = JSON.stringify({
    topModule: plan.topModule,
    verilog: plan.verilog,
    io: plan.io,
    testbench: {
      moduleName: `tb_${plan.topModule}`,
      dumpfile: 'waves.vcd',
      durationNs: plan.testbench.durationNs,
      clocks: plan.testbench.clocks,
      stimuli: plan.testbench.stimuli,
    },
  });

  const endpoint = import.meta.env.VITE_DIGITAL_SIM_API_URL || DEFAULT_ENDPOINT;
  const response = await fetch(endpoint, {
    method: 'POST',
    headers: { 'Content-Type': 'application/json' },
    body: requestBody,
  });

  if (!response.ok) {
    throw new Error(await buildBackendErrorMessage(response, endpoint));
  }

  const payload = await response.json();
  if (!payload.success) {
    throw new Error(payload.error || `数字仿真失败 [${endpoint}]`);
  }

  const parsed = payload.vcd ? parseVcdToWaveforms(payload.vcd, { onlySignals: plan.probes.map((probe) => probe.signal) }) : [];

  const waveforms: DigitalWaveformTrace[] = plan.probes.map((probe) => {
    const trace =
      parsed.find((p) => matchSignalName(p.signal, probe.signal)) ||
      parsed.find((p) => matchSignalName(p.signal, `dut.${probe.signal}`)) ||
      null;
    return {
      signal: probe.signal,
      label: probe.label,
      role: probe.role,
      samples: trace?.samples ?? [],
    };
  });

  const warnings: string[] = [
    ...(plan.warnings || []),
    ...(payload.warnings || []),
  ].filter(Boolean);

  return {
    plan,
    waveforms,
    rawVcd: payload.vcd,
    warnings,
    durationNs: payload.durationNs || plan.testbench.durationNs,
  };
};
