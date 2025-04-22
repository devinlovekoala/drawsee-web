'use client';
import { CircuitFlowWithProvider } from './CircuitFlow';
import { CircuitDesign } from '@/api/types/circuit.types';

interface CircuitCanvasProps {
  onCircuitDesignChange?: (design: CircuitDesign) => void;
}

export function CircuitCanvas({ onCircuitDesignChange }: CircuitCanvasProps) {
  return (
    <div className="w-full h-full">
      <CircuitFlowWithProvider onCircuitDesignChange={onCircuitDesignChange} />
    </div>
  );
}

export default CircuitCanvas;