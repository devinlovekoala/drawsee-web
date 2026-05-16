import { useDFlipFlop } from './useDFlipFlop';
import { DFFChart } from './Chart';

function DFFSymbol() {
  return (
    <svg width="120" height="80" viewBox="0 0 120 80">
      <rect x="30" y="10" width="60" height="60" rx="4" fill="#f8fafc" stroke="#94a3b8" strokeWidth="1.5" />
      <text x="22" y="38" textAnchor="end" fill="#7c3aed" fontSize="11" fontWeight="600">D</text>
      <line x1="22" y1="35" x2="30" y2="35" stroke="#7c3aed" strokeWidth="1.5" />
      <text x="22" y="55" textAnchor="end" fill="#0284c7" fontSize="11" fontWeight="600">CLK</text>
      <line x1="22" y1="52" x2="30" y2="52" stroke="#0284c7" strokeWidth="1.5" />
      <polyline points="30,56 36,52 30,48" fill="none" stroke="#0284c7" strokeWidth="1" />
      <line x1="90" y1="35" x2="98" y2="35" stroke="#16a34a" strokeWidth="1.5" />
      <text x="101" y="38" fill="#16a34a" fontSize="11" fontWeight="600">Q</text>
      <text x="60" y="45" textAnchor="middle" fill="#94a3b8" fontSize="10">D-FF</text>
    </svg>
  );
}

export function DFlipFlopTimingScene() {
  const { state, step, toggleD, toggleViolate, reset } = useDFlipFlop();

  return (
    <div className="space-y-5">
      <div className="rounded-lg border border-neutral-200 bg-slate-900 overflow-x-auto">
        <DFFChart history={state.history} width={700} />
      </div>

      <div className="flex items-center justify-between gap-4">
        <DFFSymbol />
        <div className="flex-1 grid grid-cols-3 gap-2">
          {[
            { label: 'D', value: state.currentD, color: 'text-violet-600' },
            { label: 'Q', value: state.currentQ, color: 'text-green-600' },
            { label: '周期', value: state.history.length, color: 'text-blue-600' },
          ].map(s => (
            <div key={s.label} className="rounded-md border border-neutral-200 bg-neutral-50 px-3 py-2 text-center">
              <div className="text-[10px] text-neutral-400">{s.label}</div>
              <div className={`text-lg font-mono font-bold ${s.color}`}>{s.value}</div>
            </div>
          ))}
        </div>
      </div>

      <label className="flex items-center gap-3 cursor-pointer select-none">
        <div
          className={`relative w-10 h-5 rounded-full transition-colors ${state.violate ? 'bg-orange-500' : 'bg-neutral-300'}`}
          onClick={toggleViolate}
        >
          <div
            className={`absolute top-0.5 w-4 h-4 rounded-full bg-white transition-transform ${state.violate ? 'translate-x-5' : 'translate-x-0.5'}`}
          />
        </div>
        <span className="text-xs text-neutral-500">
          模拟建立/保持时间违反
          {state.violate && <span className="ml-2 text-orange-500 font-medium">(有亚稳态风险)</span>}
        </span>
      </label>

      <div className="flex gap-2">
        <button
          onClick={step}
          className="flex-1 rounded-md bg-blue-600 hover:bg-blue-500 text-white text-sm py-2 font-medium transition-colors"
        >
          推进时钟
        </button>
        <button
          onClick={toggleD}
          className="flex-1 rounded-md border border-violet-300 bg-violet-50 hover:bg-violet-100 text-violet-700 text-sm py-2 font-medium transition-colors"
        >
          D 切换 ({state.currentD} → {state.currentD === 0 ? 1 : 0})
        </button>
        <button
          onClick={reset}
          className="px-4 rounded-md border border-neutral-200 bg-white hover:bg-neutral-50 text-neutral-600 text-sm py-2 transition-colors"
        >
          重置
        </button>
      </div>
    </div>
  );
}
