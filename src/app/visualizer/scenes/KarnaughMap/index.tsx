import { useState } from 'react';

type Vars = 2 | 3 | 4;

const GRAY2 = [0, 1, 3, 2];
const GRAY2_LABELS = ['00', '01', '11', '10'];

function getLayout(vars: Vars) {
  if (vars === 2) {
    return {
      rows: 2, cols: 2,
      rowLabels: ['A=0', 'A=1'],
      colLabels: ['B=0', 'B=1'],
      cellIndex: (r: number, c: number) => r * 2 + c,
    };
  }
  if (vars === 3) {
    return {
      rows: 2, cols: 4,
      rowLabels: ['A=0', 'A=1'],
      colLabels: GRAY2_LABELS,
      cellIndex: (r: number, c: number) => r * 4 + GRAY2[c],
    };
  }
  return {
    rows: 4, cols: 4,
    rowLabels: GRAY2_LABELS,
    colLabels: GRAY2_LABELS,
    cellIndex: (r: number, c: number) => GRAY2[r] * 4 + GRAY2[c],
  };
}

const CELL_SIZE = 56;

export function KarnaughMapScene() {
  const [vars, setVars] = useState<Vars>(3);
  const totalCells = 1 << vars;
  const [cells, setCells] = useState<number[]>(Array(16).fill(0));

  const toggleCell = (idx: number) => {
    setCells(prev => { const next = [...prev]; next[idx] = next[idx] ? 0 : 1; return next; });
  };

  const resetCells = () => setCells(Array(16).fill(0));
  const layout = getLayout(vars);
  const minterms = Array.from({ length: totalCells }, (_, i) => i).filter(i => cells[i] === 1);

  return (
    <div className="space-y-5">
      <div className="rounded-lg border border-neutral-200 bg-neutral-50 p-4 overflow-x-auto">
        <div className="inline-block">
          <div className="flex" style={{ marginLeft: CELL_SIZE + 8 }}>
            {Array.from({ length: layout.cols }, (_, c) => (
              <div key={c} className="flex items-center justify-center text-[10px] text-neutral-500 font-mono"
                style={{ width: CELL_SIZE, height: 20 }}>
                {layout.colLabels[c]}
              </div>
            ))}
          </div>

          {Array.from({ length: layout.rows }, (_, r) => (
            <div key={r} className="flex items-center">
              <div className="flex items-center justify-end text-[10px] text-neutral-500 font-mono pr-2"
                style={{ width: CELL_SIZE, height: CELL_SIZE }}>
                {layout.rowLabels[r]}
              </div>
              {Array.from({ length: layout.cols }, (_, c) => {
                const idx = layout.cellIndex(r, c);
                const val = cells[idx] ?? 0;
                return (
                  <button key={c} onClick={() => toggleCell(idx)}
                    className={`border border-neutral-300 flex items-center justify-center text-lg font-mono font-bold transition-colors select-none ${
                      val === 1
                        ? 'bg-blue-100 text-blue-700 hover:bg-blue-200'
                        : 'bg-white text-neutral-300 hover:bg-neutral-100'
                    }`}
                    style={{ width: CELL_SIZE, height: CELL_SIZE }}>
                    {val}
                  </button>
                );
              })}
            </div>
          ))}
        </div>
      </div>

      <div className="flex items-center gap-3">
        <span className="text-xs text-neutral-500 shrink-0">变量数</span>
        <div className="flex gap-1.5">
          {([2, 3, 4] as const).map(v => (
            <button key={v} onClick={() => { setVars(v); resetCells(); }}
              className={`px-4 py-1.5 rounded text-sm font-medium transition-colors border ${
                vars === v ? 'border-blue-500 bg-blue-50 text-blue-700' : 'border-neutral-200 bg-white text-neutral-500 hover:bg-neutral-50'
              }`}>
              {v} 变量
            </button>
          ))}
        </div>
        <button onClick={resetCells}
          className="ml-auto px-3 py-1.5 rounded text-xs border border-neutral-200 bg-white hover:bg-neutral-50 text-neutral-500 transition-colors">
          清空
        </button>
      </div>

      <div className="rounded-lg border border-neutral-200 bg-neutral-50 p-4">
        <div className="text-xs text-neutral-500 mb-2 font-medium">最小项（Minterms）</div>
        {minterms.length === 0 ? (
          <div className="text-sm text-neutral-400">点击格子填入 1，观察最小项</div>
        ) : (
          <>
            <div className="flex flex-wrap gap-1.5">
              {minterms.map(m => (
                <span key={m} className="px-2 py-0.5 rounded bg-blue-100 text-blue-700 text-xs font-mono font-bold">m{m}</span>
              ))}
            </div>
            <div className="mt-3 text-xs text-neutral-600">
              <span className="font-medium">函数表达式：</span>
              <span className="font-mono ml-1">f = Σm({minterms.join(', ')})</span>
            </div>
          </>
        )}
      </div>

      <div className="grid grid-cols-3 gap-2">
        <div className="rounded-md border border-neutral-200 bg-neutral-50 px-3 py-2 text-center">
          <div className="text-[10px] text-neutral-400">变量数</div>
          <div className="text-lg font-mono font-bold text-blue-600">{vars}</div>
        </div>
        <div className="rounded-md border border-neutral-200 bg-neutral-50 px-3 py-2 text-center">
          <div className="text-[10px] text-neutral-400">最小项数</div>
          <div className="text-lg font-mono font-bold text-green-600">{minterms.length}</div>
        </div>
        <div className="rounded-md border border-neutral-200 bg-neutral-50 px-3 py-2 text-center">
          <div className="text-[10px] text-neutral-400">格子总数</div>
          <div className="text-lg font-mono font-bold text-neutral-600">{totalCells}</div>
        </div>
      </div>

      <p className="text-[10px] text-neutral-400 text-center">
        点击格子切换 0/1 · 格雷码排列保证相邻格只有 1 位变化 · 优先合并 2ⁿ 个相邻 1 化简
      </p>
    </div>
  );
}
