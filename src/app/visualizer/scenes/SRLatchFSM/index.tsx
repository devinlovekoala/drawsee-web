import { useReducer } from 'react';

type LatchState = 0 | 1;

interface FSMState {
  Q: LatchState;
  S: LatchState;
  R: LatchState;
  history: { S: LatchState; R: LatchState; Q: LatchState; Qbar: LatchState; note: string }[];
}

type FSMAction = { type: 'SET_S'; v: LatchState } | { type: 'SET_R'; v: LatchState } | { type: 'CLOCK' } | { type: 'RESET' };

function srTransition(Q: LatchState, S: LatchState, R: LatchState): { Q: LatchState; note: string } {
  if (S === 0 && R === 0) return { Q, note: '保持 (S=R=0)' };
  if (S === 1 && R === 0) return { Q: 1, note: '置位 (S=1)' };
  if (S === 0 && R === 1) return { Q: 0, note: '复位 (R=1)' };
  return { Q, note: '⚠ 禁止状态 (S=R=1)' };
}

function fsmReducer(state: FSMState, action: FSMAction): FSMState {
  switch (action.type) {
    case 'SET_S': return { ...state, S: action.v };
    case 'SET_R': return { ...state, R: action.v };
    case 'CLOCK': {
      const { Q, note } = srTransition(state.Q, state.S, state.R);
      const entry = { S: state.S, R: state.R, Q, Qbar: (Q === 1 ? 0 : 1) as LatchState, note };
      return { ...state, Q, history: [...state.history.slice(-14), entry] };
    }
    case 'RESET': return { Q: 0, S: 0, R: 0, history: [] };
    default: return state;
  }
}

const INIT: FSMState = { Q: 0, S: 0, R: 0, history: [] };

function StateNode({ label, active, color }: { label: string; active: boolean; color: string }) {
  return (
    <div className={`w-16 h-16 rounded-full border-2 flex items-center justify-center font-bold text-sm transition-all duration-300 ${active ? color : 'border-neutral-300 bg-neutral-100 text-neutral-400'}`}>
      {label}
    </div>
  );
}

export function SRLatchFSMScene() {
  const [state, dispatch] = useReducer(fsmReducer, INIT);

  const forbidden = state.S === 1 && state.R === 1;
  const { note } = srTransition(state.Q, state.S, state.R);

  return (
    <div className="space-y-5">
      {/* FSM diagram */}
      <div className="rounded-lg border border-neutral-200 bg-neutral-50 p-6">
        <div className="flex items-center justify-center gap-10">
          <div className="flex flex-col items-center gap-2">
            <StateNode label="Q=0" active={state.Q === 0} color="border-blue-500 bg-blue-50 text-blue-700" />
            <span className="text-[10px] text-neutral-400">复位状态</span>
          </div>

          <div className="flex flex-col items-center gap-1 min-w-[100px]">
            <div className="text-[10px] text-neutral-400 text-center">S=1,R=0</div>
            <div className={`text-lg font-bold transition-colors ${state.S === 1 && state.R === 0 ? 'text-blue-500' : 'text-neutral-300'}`}>→</div>
            <div className={`text-lg font-bold transition-colors ${state.S === 0 && state.R === 1 ? 'text-orange-500' : 'text-neutral-300'}`}>←</div>
            <div className="text-[10px] text-neutral-400 text-center">S=0,R=1</div>
          </div>

          <div className="flex flex-col items-center gap-2">
            <StateNode label="Q=1" active={state.Q === 1} color="border-green-500 bg-green-50 text-green-700" />
            <span className="text-[10px] text-neutral-400">置位状态</span>
          </div>
        </div>

        <div className="mt-4 flex justify-center gap-6">
          <div className="text-center">
            <div className="text-xs text-neutral-400">Q</div>
            <div className={`text-2xl font-mono font-bold ${state.Q === 1 ? 'text-green-600' : 'text-neutral-400'}`}>{state.Q}</div>
          </div>
          <div className="text-center">
            <div className="text-xs text-neutral-400">Q̄</div>
            <div className={`text-2xl font-mono font-bold ${state.Q === 0 ? 'text-green-600' : 'text-neutral-400'}`}>{state.Q === 1 ? 0 : 1}</div>
          </div>
          <div className="text-center border-l border-neutral-200 pl-6">
            <div className="text-xs text-neutral-400">状态</div>
            <div className={`text-sm font-medium mt-1 ${forbidden ? 'text-red-500' : 'text-neutral-600'}`}>{note}</div>
          </div>
        </div>
      </div>

      {/* S/R inputs */}
      <div className="grid grid-cols-2 gap-3">
        {(['S', 'R'] as const).map(input => {
          const val = state[input];
          return (
            <div key={input} className="rounded-lg border border-neutral-200 bg-neutral-50 p-3">
              <div className="text-xs text-neutral-500 mb-2 font-medium">{input === 'S' ? 'S (Set 置位)' : 'R (Reset 复位)'}</div>
              <div className="flex gap-2">
                {([0, 1] as const).map(v => (
                  <button
                    key={v}
                    onClick={() => dispatch({ type: input === 'S' ? 'SET_S' : 'SET_R', v })}
                    className={`flex-1 py-2 rounded text-sm font-mono font-bold transition-colors ${
                      val === v
                        ? (v === 1 ? 'bg-blue-600 text-white' : 'bg-neutral-700 text-white')
                        : 'border border-neutral-200 bg-white text-neutral-600 hover:bg-neutral-50'
                    }`}
                  >
                    {v}
                  </button>
                ))}
              </div>
            </div>
          );
        })}
      </div>

      {forbidden && (
        <div className="rounded-lg border border-red-200 bg-red-50 px-4 py-2 text-sm text-red-600">
          ⚠ S=1, R=1 是 SR 锁存器的禁止状态，输出不确定
        </div>
      )}

      <div className="flex gap-2">
        <button
          onClick={() => dispatch({ type: 'CLOCK' })}
          className="flex-1 rounded-md bg-blue-600 hover:bg-blue-500 text-white text-sm py-2 font-medium transition-colors"
        >
          时钟触发 (CLK↑)
        </button>
        <button
          onClick={() => dispatch({ type: 'RESET' })}
          className="px-4 rounded-md border border-neutral-200 bg-white hover:bg-neutral-50 text-neutral-600 text-sm py-2 transition-colors"
        >
          重置
        </button>
      </div>

      {state.history.length > 0 && (
        <div className="rounded-lg border border-neutral-200 overflow-hidden">
          <div className="grid grid-cols-5 bg-neutral-100 text-[10px] font-semibold text-neutral-500 px-3 py-1.5">
            <span>S</span><span>R</span><span>Q</span><span>Q̄</span><span>说明</span>
          </div>
          {[...state.history].reverse().slice(0, 8).map((h, i) => (
            <div key={i} className={`grid grid-cols-5 px-3 py-1.5 text-xs ${i === 0 ? 'bg-blue-50' : 'bg-white'} border-t border-neutral-100`}>
              <span className="font-mono">{h.S}</span>
              <span className="font-mono">{h.R}</span>
              <span className="font-mono font-bold text-green-700">{h.Q}</span>
              <span className="font-mono">{h.Qbar}</span>
              <span className={`truncate ${h.note.includes('⚠') ? 'text-red-500' : 'text-neutral-500'}`}>{h.note}</span>
            </div>
          ))}
        </div>
      )}

      <p className="text-[10px] text-neutral-400 text-center">
        SR 锁存器（基本型）· S=R=1 为禁止状态 · 点击时钟触发后观察 Q 变化
      </p>
    </div>
  );
}
