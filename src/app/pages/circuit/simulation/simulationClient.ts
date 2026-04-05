import { CircuitDesign } from '@/api/types/circuit.types';
import { buildNetlist } from './netlist';
import {
  SimulationMeasurementResult,
  SimulationRequest,
  SimulationResponse,
  SimulationErrorDetails,
} from './types';

type WorkerInstance = Worker | null;

class SimulationClient {
  private worker: WorkerInstance = null;
  private pending: ((res: SimulationResponse) => void) | null = null;
  private pendingReject: ((err: Error) => void) | null = null;
  private fallbackEndpoint = import.meta.env.VITE_NGSPICE_API_URL || 'http://localhost:3001/simulate';
  private preferBackend = Boolean(import.meta.env.VITE_NGSPICE_API_URL);



  private buildError(message: string, details?: SimulationErrorDetails) {
    const error: any = new Error(message);
    if (details) {
      error.details = details;
    }
    return error;
  }

  private ensureWorker() {
    if (this.worker) return;
    this.worker = new Worker(new URL('./simulation.worker.ts', import.meta.url), {
      type: 'classic',
    });

    this.worker.onmessage = (event: MessageEvent<SimulationResponse>) => {
      if (this.pending) {
        this.pending(event.data);
        this.pending = null;
        this.pendingReject = null;
      }
    };

    this.worker.onerror = (err) => {
      if (this.pendingReject) {
        this.pendingReject(err instanceof Error ? err : new Error('Simulation worker error'));
      }
      this.pending = null;
      this.pendingReject = null;
    };
  }

  async runSimulation(design: CircuitDesign): Promise<Record<string, SimulationMeasurementResult>> {
    const { netlist, bindings } = buildNetlist(design);
    const request: SimulationRequest = {
      netlist,
      design,
      mode: 'tran',
      bindings,
    };

    // 如果配置了后端优先，则直接走后端，避免 worker 再次触发 404/CORS
    if (this.preferBackend) {
      return this.runViaBackend(request);
    }

    try {
      this.ensureWorker();
      const result = await new Promise<Record<string, SimulationMeasurementResult>>((resolve, reject) => {
        if (!this.worker) return reject(new Error('Simulation worker unavailable'));
        this.pending = (res) => {
          if (res.error) {
            reject(this.buildError(res.error, res.errorDetails));
            return;
          }
          const map: Record<string, SimulationMeasurementResult> = {};
          res.measurements.forEach(m => {
            const binding = bindings.find(b => b.elementId === m.elementId);
            map[m.elementId] = {
              ...m,
              nets: m.nets || binding?.nets,
              channels: m.channels || binding?.channels,
            };
          });
          resolve(map);
        };
        this.pendingReject = reject;
        this.worker.postMessage(request);
      });
      return result;
    } catch (err: any) {
      if (err?.details) {
        throw err;
      }
      // 任何 worker 侧错误都降级到后端仿真
      return this.runViaBackend(request);
    }
  }

  private async runViaBackend(request: SimulationRequest): Promise<Record<string, SimulationMeasurementResult>> {
    const response = await fetch(this.fallbackEndpoint, {
      method: 'POST',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify(request),
    });
    if (!response.ok) {
      throw new Error(`后端仿真请求失败: ${response.status}`);
    }
    const data: SimulationResponse = await response.json();
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
