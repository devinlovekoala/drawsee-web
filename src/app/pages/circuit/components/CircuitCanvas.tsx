'use client';

import React from 'react';
import { CircuitFlowWithProvider } from './CircuitFlow';

export function CircuitCanvas() {
  return (
    <div className="w-full h-full">
      <CircuitFlowWithProvider />
    </div>
  );
}

export default CircuitCanvas;