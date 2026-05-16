import { useMemo } from 'react';

export interface BJTParams {
  Vcc: number;
  Rb1: number;
  Rb2: number;
  Rc: number;
  Re: number;
  Vbe: number;
  beta: number;
}

export type WorkRegion = 'cutoff' | 'saturation' | 'active';

export interface OutputCurve {
  Ib: number;
  pts: [number, number][];
}

export interface LoadLineResult {
  qPoint: { Ic: number; Vce: number; region: WorkRegion };
  loadLine: [number, number][];
  curves: OutputCurve[];
  xMax: number;
  yMax: number;
  rbe: number;
  Au: number;
}

export function useLoadLine(p: BJTParams): LoadLineResult {
  return useMemo(() => {
    const Vb = p.Vcc * p.Rb2 / (p.Rb1 + p.Rb2);
    const Ic = Math.max(0, (Vb - p.Vbe) / p.Re);
    const Vce = p.Vcc - Ic * (p.Rc + p.Re);

    const region: WorkRegion =
      Ic === 0 ? 'cutoff' :
      Vce < 0.2 ? 'saturation' : 'active';

    const Ic_max = p.Vcc / (p.Rc + p.Re);
    const rbe = 200 + 101 * 0.026 / Math.max(Ic, 1e-6);
    const Au = region === 'active' ? -(p.beta * p.Rc) / rbe : 0;

    const curves: OutputCurve[] = Array.from({ length: 8 }, (_, i) => {
      const Ib = (i + 1) * Ic_max / p.beta / 5;
      const Ica = p.beta * Ib;
      const pts: [number, number][] = Array.from({ length: 201 }, (_, j) => {
        const vce = p.Vcc * j / 200;
        return [vce, vce < 0.2 ? Ica * vce / 0.2 : Ica];
      });
      return { Ib, pts };
    });

    return {
      qPoint: { Ic, Vce, region },
      loadLine: [[0, Ic_max], [p.Vcc, 0]],
      curves,
      xMax: p.Vcc,
      yMax: Ic_max * 1.25,
      rbe,
      Au,
    };
  }, [p]);
}
