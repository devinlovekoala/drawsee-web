import {
  DigitalSimulationRequest,
  DigitalSimulationResponse,
  DigitalSimulationResult,
} from '../types';
import { parseVcdToWaveforms } from '../utils/vcd';

const DEFAULT_ENDPOINT = 'http://localhost:3002/simulate/digital';

export class DigitalSimulationError extends Error {
  constructor(
    message: string,
    public readonly payload?: DigitalSimulationResponse
  ) {
    super(message);
    this.name = 'DigitalSimulationError';
  }
}

const getEndpoint = () => import.meta.env.VITE_DIGITAL_SIM_API_URL || DEFAULT_ENDPOINT;

export const runDigitalSimulation = async (
  request: DigitalSimulationRequest
): Promise<DigitalSimulationResult> => {
  const endpoint = getEndpoint();
  const response = await fetch(endpoint, {
    method: 'POST',
    headers: { 'Content-Type': 'application/json' },
    body: JSON.stringify(request),
  });

  if (!response.ok) {
    throw new DigitalSimulationError(`数字仿真请求失败: ${response.status}`);
  }

  const data: DigitalSimulationResponse = await response.json();
  if (!data.success) {
    throw new DigitalSimulationError(data.error || '数字仿真失败', data);
  }

  const waveforms = data.vcd
    ? parseVcdToWaveforms(data.vcd, data.io || request.io, { maxPoints: 2000 })
    : [];

  return {
    ...data,
    waveforms,
  };
};
