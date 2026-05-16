import { useState } from 'react';
import { SCENES } from '@/app/visualizer/registry';
import { SceneShell } from '@/app/visualizer/components/SceneShell';
import type { SceneMeta } from '@/app/visualizer/types';

type CourseFilter = 'all' | 'analog' | 'digital';

const FILTER_LABELS: Record<CourseFilter, string> = {
  all: '全部',
  analog: '模电',
  digital: '数电',
};

export function VisualizerPage() {
  const [activeId, setActiveId] = useState(SCENES[0].id);
  const [filter, setFilter] = useState<CourseFilter>('all');

  const list = SCENES.filter(s => filter === 'all' || s.course === filter);
  const effectiveActive: SceneMeta = list.find(s => s.id === activeId) ?? list[0] ?? SCENES[0];

  const ActiveComponent = effectiveActive.component;

  return (
    <div className="flex h-screen bg-neutral-50">
      {/* Left scene list */}
      <aside className="w-52 border-r border-neutral-200 flex flex-col flex-shrink-0 overflow-hidden bg-white">
        <div className="px-4 py-3 border-b border-neutral-200">
          <div className="text-xs text-neutral-700 font-semibold">电路动画生成</div>
          <div className="flex gap-1 mt-2">
            {(['all', 'analog', 'digital'] as const).map(f => (
              <button
                key={f}
                onClick={() => setFilter(f)}
                className={`flex-1 text-[10px] py-0.5 rounded transition-colors ${
                  filter === f
                    ? 'bg-blue-600 text-white'
                    : 'text-neutral-500 hover:text-neutral-800'
                }`}
              >
                {FILTER_LABELS[f]}
              </button>
            ))}
          </div>
        </div>

        <nav className="flex-1 overflow-y-auto">
          {list.map(s => (
            <button
              key={s.id}
              onClick={() => setActiveId(s.id)}
              className={`w-full text-left px-4 py-3 border-b border-neutral-100 transition-colors text-xs ${
                effectiveActive.id === s.id
                  ? 'bg-blue-50 border-l-2 border-l-blue-600 text-neutral-900 font-medium'
                  : 'text-neutral-600 hover:bg-neutral-50'
              }`}
            >
              <div className="leading-snug">{s.title}</div>
              <div className="text-[10px] text-neutral-400 mt-0.5">{s.chapter}</div>
            </button>
          ))}
        </nav>
      </aside>

      {/* Right scene render area */}
      <main className="flex-1 overflow-y-auto p-6 bg-neutral-50">
        <SceneShell meta={effectiveActive}>
          <ActiveComponent />
        </SceneShell>
      </main>
    </div>
  );
}

export default VisualizerPage;
