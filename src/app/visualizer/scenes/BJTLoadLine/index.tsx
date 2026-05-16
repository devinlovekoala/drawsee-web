import { useState, useCallback } from 'react';
import { useLoadLine, type BJTParams, type WorkRegion } from './useLoadLine';
import { BJTChart } from './Chart';

const DEFAULTS: BJTParams = {
  Vcc: 12,
  Rb1: 40000,
  Rb2: 10000,
  Rc: 3000,
  Re: 1000,
  Vbe: 0.7,
  beta: 100,
};

const REGION_LABELS: Record<WorkRegion, string> = {
  active: '放大区',
  saturation: '饱和区',
  cutoff: '截止区',
};

const REGION_BADGE: Record<WorkRegion, string> = {
  active: 'bg-green-100 text-green-700 border-green-300',
  saturation: 'bg-orange-100 text-orange-700 border-orange-300',
  cutoff: 'bg-neutral-100 text-neutral-500 border-neutral-300',
};

interface SliderRowProps {
  label: string;
  unit: string;
  value: number;
  min: number;
  max: number;
  step: number;
  display: (v: number) => string;
  onChange: (v: number) => void;
}

function SliderRow({ label, unit, value, min, max, step, display, onChange }: SliderRowProps) {
  return (
    <div className="flex items-center gap-3">
      <span className="w-12 text-right text-xs text-neutral-500 shrink-0">{label}</span>
      <input
        type="range"
        min={min}
        max={max}
        step={step}
        value={value}
        onChange={e => onChange(Number(e.target.value))}
        className="flex-1 h-1 accent-blue-500"
      />
      <span className="w-20 text-right text-xs text-blue-600 font-mono shrink-0">
        {display(value)}{unit}
      </span>
    </div>
  );
}

export function BJTLoadLineScene() {
  const [params, setParams] = useState<BJTParams>(DEFAULTS);
  const result = useLoadLine(params);

  const set = useCallback(<K extends keyof BJTParams>(key: K, value: BJTParams[K]) => {
    setParams(prev => ({ ...prev, [key]: value }));
  }, []);

  return (
    <div className="space-y-5">
      {/* Chart — dark bg preserved for SVG export contrast */}
      <div className="rounded-lg border border-neutral-200 bg-slate-900 overflow-x-auto">
        <BJTChart data={result} width={700} height={320} />
      </div>

      {/* Stat cards */}
      <div className="grid grid-cols-4 gap-2">
        {[
          { label: 'VCE', value: result.qPoint.Vce.toFixed(2), unit: 'V' },
          { label: 'IC', value: (result.qPoint.Ic * 1000).toFixed(2), unit: 'mA' },
          { label: 'rbe', value: result.rbe.toFixed(0), unit: 'Ω' },
          { label: '|Au|', value: Math.abs(result.Au).toFixed(1), unit: '' },
        ].map(s => (
          <div key={s.label} className="rounded-md border border-neutral-200 bg-neutral-50 px-3 py-2 text-center">
            <div className="text-[10px] text-neutral-400">{s.label}</div>
            <div className="text-sm font-mono text-blue-700 font-semibold">{s.value}<span className="text-xs text-neutral-400 ml-0.5">{s.unit}</span></div>
          </div>
        ))}
      </div>

      {/* Region badge */}
      <div className="flex items-center justify-between">
        <span className="text-xs text-neutral-500">工作区状态</span>
        <span className={`text-xs border rounded-full px-2.5 py-0.5 font-medium ${REGION_BADGE[result.qPoint.region]}`}>
          {REGION_LABELS[result.qPoint.region]}
        </span>
      </div>

      {/* Sliders */}
      <div className="space-y-2.5 rounded-lg border border-neutral-200 bg-neutral-50 p-4">
        <SliderRow
          label="RB1"
          unit="kΩ"
          value={params.Rb1}
          min={10000} max={100000} step={1000}
          display={v => (v / 1000).toFixed(0)}
          onChange={v => set('Rb1', v)}
        />
        <SliderRow
          label="RB2"
          unit="kΩ"
          value={params.Rb2}
          min={2000} max={30000} step={500}
          display={v => (v / 1000).toFixed(1)}
          onChange={v => set('Rb2', v)}
        />
        <SliderRow
          label="RC"
          unit="kΩ"
          value={params.Rc}
          min={500} max={10000} step={100}
          display={v => (v / 1000).toFixed(1)}
          onChange={v => set('Rc', v)}
        />
      </div>

      <p className="text-[10px] text-neutral-400 text-center">
        固定参数：Vcc = 12 V · Re = 1 kΩ · β = 100
      </p>
    </div>
  );
}
