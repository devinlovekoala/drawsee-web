import { CircuitDesign } from '@/api/types/circuit.types';

export const CIRCUIT_PREFILL_STORAGE_KEY = 'flow_prefill_circuit_design';

type CircuitWorkbenchRoute = '/circuit' | '/digital';

interface StoredCircuitPrefillPayload {
  design?: CircuitDesign;
  ts?: number;
  convId?: number | null;
  source?: string;
  resourceId?: number;
  courseId?: string | number;
}

const normalizeCircuitDesign = (design?: CircuitDesign | null): CircuitDesign | null => {
  if (!design) return null;

  const fallbackTimestamp = new Date().toISOString();

  return {
    ...design,
    elements: Array.isArray(design.elements) ? design.elements : [],
    connections: Array.isArray(design.connections) ? design.connections : [],
    metadata: {
      title: design.metadata?.title || '电路设计',
      description: design.metadata?.description || '使用DrawSee创建的电路',
      createdAt: design.metadata?.createdAt || fallbackTimestamp,
      updatedAt: design.metadata?.updatedAt || fallbackTimestamp,
    },
  };
};

export const resolveWorkbenchRouteFromDesign = (design?: CircuitDesign | null): CircuitWorkbenchRoute => {
  const normalized = normalizeCircuitDesign(design);
  if (!normalized || normalized.elements.length === 0) {
    return '/circuit';
  }

  const hasDigital = normalized.elements.some((element) => String(element.type).startsWith('digital_'));
  const hasAnalog = normalized.elements.some((element) => !String(element.type).startsWith('digital_'));

  if (hasDigital && !hasAnalog) {
    return '/digital';
  }

  return '/circuit';
};

export const writeCircuitPrefill = (payload: StoredCircuitPrefillPayload) => {
  sessionStorage.setItem(CIRCUIT_PREFILL_STORAGE_KEY, JSON.stringify(payload));
};

export const consumeCircuitPrefill = (): CircuitDesign | null => {
  try {
    const stored = sessionStorage.getItem(CIRCUIT_PREFILL_STORAGE_KEY);
    if (!stored) return null;
    const parsed = JSON.parse(stored) as StoredCircuitPrefillPayload;
    return normalizeCircuitDesign(parsed?.design);
  } catch (error) {
    console.error('读取预填电路设计失败', error);
    return null;
  } finally {
    try {
      sessionStorage.removeItem(CIRCUIT_PREFILL_STORAGE_KEY);
    } catch (error) {
      console.error('清理预填电路设计失败', error);
    }
  }
};
