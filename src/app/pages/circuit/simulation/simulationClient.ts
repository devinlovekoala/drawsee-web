import { CircuitDesign } from '@/api/types/circuit.types';
import { NGSPICE_SIM_API_URL } from '@/api';
import { buildNetlist } from './netlist';
import {
  SimulationMeasurementResult,
  SimulationRequest,
  SimulationResponse,
  SimulationErrorDetails,
} from './types';

class SimulationClient {
  private endpoint = NGSPICE_SIM_API_URL;

  private buildError(message: string, details?: SimulationErrorDetails) {
    const error: any = new Error(message);
    if (details) {
      error.details = details;
    }
    return error;
  }

  async runSimulation(design: CircuitDesign): Promise<Record<string, SimulationMeasurementResult>> {
    const { netlist, bindings } = buildNetlist(design);
    const request: SimulationRequest = {
      netlist,
      design,
      mode: 'tran',
      bindings,
    };
    return this.runViaBackend(request);
  }

  private async runViaBackend(request: SimulationRequest): Promise<Record<string, SimulationMeasurementResult>> {
    const response = await fetch(this.endpoint, {
      method: 'POST',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify(request),
    });
    let data: SimulationResponse | null = null;
    try {
      data = await response.json();
    } catch {
      data = null;
    }
    if (!response.ok) {
      if (data?.error || data?.errorDetails) {
        throw this.buildError(
          data.error || `后端仿真请求失败: ${response.status}`,
          data.errorDetails,
        );
      }
      throw new Error(`后端仿真请求失败: ${response.status}`);
    }
    if (!data) {
      throw new Error('后端仿真未返回有效结果');
    }
    if (data.error) {
      throw this.buildError(data.error, data.errorDetails);
    }
    const map: Record<string, SimulationMeasurementResult> = {};
    data.measurements.forEach(m => {
      map[m.elementId] = m;
    });
    return map;
  }
}

export const simulationClient = new SimulationClient();
