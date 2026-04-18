import React, { useEffect, useMemo, useRef, useState } from 'react';
import { Button, Drawer } from 'antd';
import { ScopePanelResult, ScopeSample, ScopeTraceResult } from '@/simulation/types/simResult';

interface OscilloscopeWorkspaceProps {
  panels: ScopePanelResult[];
  visible?: boolean;
  selectedElementId?: string | null;
  onVisibilityChange?: (visible: boolean) => void;
  viewport?: {
    x: number;
    y: number;
    zoom: number;
  };
}

type TimeWindowPreset = 'auto' | '100us' | '500us' | '2ms' | '10ms';

type PanelPreferences = {
  minimized: boolean;
  frozen: boolean;
  timeWindow: TimeWindowPreset;
  visibleTraceKeys: string[];
};

type PersistedPreferences = Record<string, Omit<PanelPreferences, 'frozen'>>;
type PanelControlAction = 'expand' | 'minimize' | 'showAllChannels' | 'resetTimebase';

const STORAGE_KEY = 'drawsee:oscilloscope-workspace-preferences';
const DEFAULT_TIMEBASE: TimeWindowPreset = '2ms';
const CHART_WIDTH = 456;
const CHART_HEIGHT = 180;

const controlButtonClass =
  'rounded-md border border-slate-200 bg-white px-2 py-1 text-[11px] font-medium text-slate-600 transition hover:border-blue-300 hover:text-blue-700';

const workspaceButtonClass =
  'rounded-full border border-slate-200 bg-white px-3 py-1.5 text-[11px] font-medium text-slate-600 transition hover:border-blue-300 hover:text-blue-700';

const TIMEBASE_PRESETS: TimeWindowPreset[] = ['auto', '100us', '500us', '2ms', '10ms'];

const formatTimeLabel = (seconds: number) => {
  if (seconds >= 1) return `${seconds.toFixed(2)} s`;
  if (seconds >= 1e-3) return `${(seconds * 1e3).toFixed(2)} ms`;
  if (seconds >= 1e-6) return `${(seconds * 1e6).toFixed(0)} us`;
  return `${(seconds * 1e9).toFixed(0)} ns`;
};

const formatVoltageLabel = (voltage: number) => {
  const abs = Math.abs(voltage);
  if (abs >= 1e6) return `${(voltage / 1e6).toFixed(2)} MV`;
  if (abs >= 1e3) return `${(voltage / 1e3).toFixed(2)} kV`;
  if (abs >= 1) return `${voltage.toFixed(2)} V`;
  if (abs >= 1e-3) return `${(voltage * 1e3).toFixed(1)} mV`;
  return `${(voltage * 1e6).toFixed(0)} uV`;
};

const readPersistedPreferences = (): PersistedPreferences => {
  if (typeof window === 'undefined') return {};
  try {
    const raw = window.localStorage.getItem(STORAGE_KEY);
    if (!raw) return {};
    const parsed = JSON.parse(raw) as PersistedPreferences;
    return parsed && typeof parsed === 'object' ? parsed : {};
  } catch {
    return {};
  }
};

const createDefaultPreferences = (panel: ScopePanelResult): PanelPreferences => ({
  minimized: false,
  frozen: false,
  timeWindow: DEFAULT_TIMEBASE,
  visibleTraceKeys: panel.traces.map((trace) => trace.key),
});

const TIMEBASE_WINDOWS: Record<Exclude<TimeWindowPreset, 'auto'>, number> = {
  '100us': 100e-6,
  '500us': 500e-6,
  '2ms': 2e-3,
  '10ms': 10e-3,
};

const buildWaveformPath = (
  samples: ScopeSample[],
  width: number,
  height: number,
  min: number,
  max: number,
) => {
  if (samples.length < 2) return '';
  const range = Math.max(max - min, 1e-9);
  return samples
    .map((sample, index) => {
      const x = (index / Math.max(samples.length - 1, 1)) * width;
      const y = height - (((sample.value - min) / range) * height);
      return `${index === 0 ? 'M' : 'L'} ${x.toFixed(2)} ${y.toFixed(2)}`;
    })
    .join(' ');
};

const filterTraceSamples = (samples: ScopeSample[], timeWindow: TimeWindowPreset) => {
  if (samples.length === 0 || timeWindow === 'auto') return samples;
  const lastTime = samples[samples.length - 1]?.time ?? 0;
  const threshold = lastTime - TIMEBASE_WINDOWS[timeWindow];
  return samples.filter((sample) => sample.time >= threshold);
};

const getDisplayTraceLabel = (trace: ScopeTraceResult, index: number) => {
  if (trace.label) return trace.label;
  return `CH${index + 1}`;
};

const TraceLegend: React.FC<{
  trace: ScopeTraceResult;
  index: number;
  active: boolean;
  onToggle: () => void;
}> = ({ trace, index, active, onToggle }) => (
  <button
    type="button"
    onClick={onToggle}
    className={`flex items-center gap-2 rounded-md border px-2 py-1 text-[11px] transition ${
      active
        ? 'border-blue-300 bg-blue-50 text-blue-700'
        : 'border-slate-200 bg-white text-slate-500 hover:border-slate-300 hover:text-slate-700'
    }`}
  >
    <span className="h-2.5 w-2.5 rounded-full" style={{ backgroundColor: trace.color }} />
    <span className="font-semibold">{`CH${index + 1}`}</span>
    <span className="max-w-[180px] truncate">{getDisplayTraceLabel(trace, index)}</span>
  </button>
);

export const OscilloscopeWorkspace: React.FC<OscilloscopeWorkspaceProps> = ({
  panels,
  visible = true,
  selectedElementId,
  onVisibilityChange,
}) => {
  const [preferences, setPreferences] = useState<Record<string, PanelPreferences>>(() => {
    const persisted = readPersistedPreferences();
    return Object.fromEntries(
      Object.entries(persisted).map(([elementId, pref]) => [
        elementId,
        {
          ...pref,
          frozen: false,
        },
      ]),
    );
  });
  const [frozenSnapshots, setFrozenSnapshots] = useState<Record<string, ScopeTraceResult[]>>({});
  const persistedRef = useRef<PersistedPreferences>(readPersistedPreferences());

  useEffect(() => {
    setPreferences((current) => {
      const next: Record<string, PanelPreferences> = { ...current };
      panels.forEach((panel) => {
        const persisted = persistedRef.current[panel.elementId];
        const currentPref = next[panel.elementId];
        next[panel.elementId] = {
          ...createDefaultPreferences(panel),
          ...currentPref,
          ...persisted,
          frozen: currentPref?.frozen ?? false,
          visibleTraceKeys:
            (currentPref?.visibleTraceKeys || persisted?.visibleTraceKeys || [])
              .filter((key) => panel.traces.some((trace) => trace.key === key))
              .length > 0
              ? (currentPref?.visibleTraceKeys || persisted?.visibleTraceKeys || [])
                  .filter((key) => panel.traces.some((trace) => trace.key === key))
              : panel.traces.map((trace) => trace.key),
        };
      });
      Object.keys(next).forEach((elementId) => {
        if (!panels.some((panel) => panel.elementId === elementId)) {
          delete next[elementId];
        }
      });
      return next;
    });
  }, [panels]);

  useEffect(() => {
    if (typeof window === 'undefined') return;
    const serializable = Object.fromEntries(
      Object.entries(preferences).map(([elementId, pref]) => [
        elementId,
        {
          minimized: pref.minimized,
          timeWindow: pref.timeWindow,
          visibleTraceKeys: pref.visibleTraceKeys,
        },
      ]),
    );
    window.localStorage.setItem(STORAGE_KEY, JSON.stringify(serializable));
  }, [preferences]);

  const enrichedPanels = useMemo(() => {
    return panels.map((panel) => {
      const pref = preferences[panel.elementId] || createDefaultPreferences(panel);
      const sourceTraces = pref.frozen ? (frozenSnapshots[panel.elementId] || panel.traces) : panel.traces;
      const visibleTraceKeys = pref.visibleTraceKeys.length > 0
        ? pref.visibleTraceKeys
        : panel.traces.map((trace) => trace.key);
      const traces = sourceTraces
        .filter((trace) => visibleTraceKeys.includes(trace.key))
        .map((trace) => ({
          ...trace,
          samples: filterTraceSamples(trace.samples, pref.timeWindow),
        }));
      const allValues = traces.flatMap((trace) => trace.samples.map((sample) => sample.value));
      const min = allValues.length > 0 ? Math.min(...allValues) : -1;
      const max = allValues.length > 0 ? Math.max(...allValues) : 1;
      const lastTime = traces.reduce((latest, trace) => {
        const value = trace.samples[trace.samples.length - 1]?.time ?? 0;
        return Math.max(latest, value);
      }, 0);
      const totalPoints = traces.reduce((total, trace) => total + trace.samples.length, 0);

      return {
        panel,
        pref,
        traces,
        min,
        max,
        lastTime,
        totalPoints,
      };
    });
  }, [frozenSnapshots, panels, preferences]);

  const orderedPanels = useMemo(() => {
    return [...enrichedPanels].sort((left, right) => {
      const leftSelected = left.panel.elementId === selectedElementId ? 1 : 0;
      const rightSelected = right.panel.elementId === selectedElementId ? 1 : 0;
      if (leftSelected !== rightSelected) {
        return rightSelected - leftSelected;
      }
      return left.panel.label.localeCompare(right.panel.label, 'zh-Hans-CN');
    });
  }, [enrichedPanels, selectedElementId]);

  const latestScopeTime = orderedPanels.reduce((latest, item) => Math.max(latest, item.lastTime), 0);
  const totalActiveTraces = orderedPanels.reduce((count, item) => count + item.traces.length, 0);
  const hasPanels = panels.length > 0;

  const applyToPanels = (action: PanelControlAction) => {
    setPreferences((current) => {
      const next = { ...current };
      panels.forEach((panel) => {
        const pref = next[panel.elementId] || createDefaultPreferences(panel);
        if (action === 'expand') {
          next[panel.elementId] = { ...pref, minimized: false };
          return;
        }
        if (action === 'minimize') {
          next[panel.elementId] = { ...pref, minimized: true };
          return;
        }
        if (action === 'showAllChannels') {
          next[panel.elementId] = {
            ...pref,
            visibleTraceKeys: panel.traces.map((trace) => trace.key),
          };
          return;
        }
        next[panel.elementId] = {
          ...pref,
          timeWindow: DEFAULT_TIMEBASE,
        };
      });
      return next;
    });
  };

  const renderPanelCard = (
    item: {
      panel: ScopePanelResult;
      pref: PanelPreferences;
      traces: ScopeTraceResult[];
      min: number;
      max: number;
      lastTime: number;
      totalPoints: number;
    },
  ) => {
    const { panel, pref, traces, min, max, lastTime, totalPoints } = item;
    const range = Math.max(max - min, 1e-9);
    const isSelected = panel.elementId === selectedElementId;

    return (
      <div
        key={panel.elementId}
        className={`rounded-md border bg-white p-3 shadow-sm transition ${
          isSelected ? 'border-blue-300 ring-1 ring-blue-200' : 'border-slate-200'
        }`}
      >
        <div className="flex items-start justify-between gap-3">
          <div className="min-w-0">
            <div className="flex flex-wrap items-center gap-2 text-sm font-medium text-slate-700">
              <span className="truncate">{panel.label}</span>
              <span className={`rounded px-2 py-0.5 text-[11px] ${
                pref.frozen ? 'bg-amber-50 text-amber-700' : 'bg-emerald-50 text-emerald-700'
              }`}>
                {pref.frozen ? '已冻结' : '实时'}
              </span>
              {isSelected && (
                <span className="rounded bg-blue-50 px-2 py-0.5 text-[11px] text-blue-700">
                  当前选中
                </span>
              )}
            </div>
            <div className="mt-2 flex flex-wrap gap-2 text-xs text-slate-500">
              <span>时基: {pref.timeWindow === 'auto' ? 'Auto' : pref.timeWindow}</span>
              <span>采样至: {formatTimeLabel(lastTime)}</span>
              <span>{totalPoints} 点</span>
              <span>幅度窗: {formatVoltageLabel(range)}</span>
            </div>
          </div>
          <div className="flex flex-wrap justify-end gap-1">
            <button
              type="button"
              className={controlButtonClass}
              onClick={() => {
                setPreferences((current) => ({
                  ...current,
                  [panel.elementId]: {
                    ...(current[panel.elementId] || createDefaultPreferences(panel)),
                    frozen: !pref.frozen,
                  },
                }));
                setFrozenSnapshots((current) => {
                  if (pref.frozen) {
                    const next = { ...current };
                    delete next[panel.elementId];
                    return next;
                  }
                  return {
                    ...current,
                    [panel.elementId]: panel.traces.map((trace) => ({
                      ...trace,
                      samples: [...trace.samples],
                    })),
                  };
                });
              }}
            >
              {pref.frozen ? '继续' : '冻结'}
            </button>
            <button
              type="button"
              className={controlButtonClass}
              onClick={() => {
                setPreferences((current) => ({
                  ...current,
                  [panel.elementId]: {
                    ...(current[panel.elementId] || createDefaultPreferences(panel)),
                    minimized: !pref.minimized,
                  },
                }));
              }}
            >
              {pref.minimized ? '展开' : '收起'}
            </button>
            <button
              type="button"
              className={controlButtonClass}
              onClick={() => {
                setPreferences((current) => ({
                  ...current,
                  [panel.elementId]: {
                    ...(current[panel.elementId] || createDefaultPreferences(panel)),
                    timeWindow: DEFAULT_TIMEBASE,
                    visibleTraceKeys: panel.traces.map((trace) => trace.key),
                    minimized: false,
                  },
                }));
              }}
            >
              默认
            </button>
          </div>
        </div>

        {!pref.minimized && (
          <div className="mt-3 space-y-3">
            <div className="flex flex-wrap gap-2">
              {panel.traces.map((trace, index) => (
                <TraceLegend
                  key={trace.key}
                  trace={trace}
                  index={index}
                  active={pref.visibleTraceKeys.includes(trace.key)}
                  onToggle={() => {
                    setPreferences((current) => {
                      const currentPref = current[panel.elementId] || createDefaultPreferences(panel);
                      const exists = currentPref.visibleTraceKeys.includes(trace.key);
                      const nextVisibleKeys = exists
                        ? currentPref.visibleTraceKeys.filter((key) => key !== trace.key)
                        : [...currentPref.visibleTraceKeys, trace.key];
                      return {
                        ...current,
                        [panel.elementId]: {
                          ...currentPref,
                          visibleTraceKeys: nextVisibleKeys,
                        },
                      };
                    });
                  }}
                />
              ))}
            </div>

            <div className="flex flex-wrap gap-2">
              {TIMEBASE_PRESETS.map((preset) => (
                <button
                  key={preset}
                  type="button"
                  className={`rounded-full border px-2.5 py-1 text-[11px] font-medium transition ${
                    pref.timeWindow === preset
                      ? 'border-blue-300 bg-blue-50 text-blue-700'
                      : 'border-slate-200 bg-white text-slate-500 hover:border-slate-300 hover:text-slate-700'
                  }`}
                  onClick={() => {
                    setPreferences((current) => ({
                      ...current,
                      [panel.elementId]: {
                        ...(current[panel.elementId] || createDefaultPreferences(panel)),
                        timeWindow: preset,
                      },
                    }));
                  }}
                >
                  {preset}
                </button>
              ))}
            </div>

            <div className="overflow-hidden rounded-md border border-slate-200 bg-slate-50 p-2">
              <svg
                width="100%"
                height={CHART_HEIGHT}
                viewBox={`0 0 ${CHART_WIDTH} ${CHART_HEIGHT}`}
                className="block"
                preserveAspectRatio="none"
              >
                <rect x="0" y="0" width={CHART_WIDTH} height={CHART_HEIGHT} rx="10" fill="#0f172a" />
                {Array.from({ length: 10 }).map((_, index) => {
                  const x = (index / 9) * CHART_WIDTH;
                  return (
                    <line
                      key={`vx-${panel.elementId}-${index}`}
                      x1={x}
                      x2={x}
                      y1={0}
                      y2={CHART_HEIGHT}
                      stroke="rgba(148,163,184,0.18)"
                      strokeDasharray={index === 0 || index === 9 ? undefined : '3 5'}
                    />
                  );
                })}
                {Array.from({ length: 8 }).map((_, index) => {
                  const y = (index / 7) * CHART_HEIGHT;
                  return (
                    <line
                      key={`hy-${panel.elementId}-${index}`}
                      x1={0}
                      x2={CHART_WIDTH}
                      y1={y}
                      y2={y}
                      stroke="rgba(148,163,184,0.18)"
                      strokeDasharray={index === 0 || index === 7 ? undefined : '3 5'}
                    />
                  );
                })}
                {traces.length === 0 && (
                  <text
                    x={CHART_WIDTH / 2}
                    y={CHART_HEIGHT / 2}
                    textAnchor="middle"
                    fill="rgba(148,163,184,0.72)"
                    fontSize="13"
                    fontFamily="ui-monospace, SFMono-Regular, Menlo, Monaco, Consolas, monospace"
                  >
                    请选择至少一个通道
                  </text>
                )}
                {traces.map((trace) => (
                  <path
                    key={`trace-${panel.elementId}-${trace.key}`}
                    d={buildWaveformPath(trace.samples, CHART_WIDTH, CHART_HEIGHT, min, max)}
                    fill="none"
                    stroke={trace.color}
                    strokeWidth="2.2"
                    strokeLinejoin="round"
                    strokeLinecap="round"
                  />
                ))}
              </svg>
            </div>

            <div className="grid grid-cols-2 gap-3">
              {traces.map((trace, index) => {
                const values = trace.samples.map((sample) => sample.value);
                const latest = values[values.length - 1] ?? 0;
                const minValue = values.length > 0 ? Math.min(...values) : 0;
                const maxValue = values.length > 0 ? Math.max(...values) : 0;
                const peakToPeak = maxValue - minValue;
                return (
                  <div key={`${panel.elementId}-${trace.key}`} className="rounded-md border border-slate-200 bg-slate-50 px-3 py-2">
                    <div className="mb-1 flex items-center gap-2 text-[11px] text-slate-500">
                      <span className="h-2.5 w-2.5 rounded-full" style={{ backgroundColor: trace.color }} />
                      <span className="font-semibold text-slate-700">{`CH${index + 1}`}</span>
                      <span className="truncate">{getDisplayTraceLabel(trace, index)}</span>
                    </div>
                    <div className="font-mono text-[11px] text-slate-600">Now {formatVoltageLabel(latest)}</div>
                    <div className="font-mono text-[11px] text-slate-600">Vpp {formatVoltageLabel(peakToPeak)}</div>
                    <div className="font-mono text-[11px] text-slate-600">Min {formatVoltageLabel(minValue)}</div>
                    <div className="font-mono text-[11px] text-slate-600">Max {formatVoltageLabel(maxValue)}</div>
                  </div>
                );
              })}
            </div>
          </div>
        )}
      </div>
    );
  };

  return (
    <>
      <Drawer
        title="模拟示波器"
        placement="right"
        width={520}
        mask={false}
        open={visible}
        onClose={() => onVisibilityChange?.(false)}
        destroyOnClose={false}
        extra={(
          <div className="flex flex-col gap-2 sm:flex-row">
            <Button onClick={() => applyToPanels('expand')} disabled={!hasPanels}>
              全部展开
            </Button>
            <Button type="primary" onClick={() => onVisibilityChange?.(false)}>
              收起
            </Button>
          </div>
        )}
        rootClassName="analog-scope-drawer"
      >
        {hasPanels ? (
          <div className="space-y-4">
            <div className="rounded-md border border-slate-200 bg-white p-3 shadow-sm">
              <div className="flex items-start justify-between gap-3">
                <div>
                  <div className="text-sm font-semibold text-slate-700">实时示波器工作区</div>
                  <div className="mt-1 text-xs leading-5 text-slate-500">
                    布局和数字仿真结果区统一。双击电路中的示波器元件，会自动打开并高亮对应卡片。
                  </div>
                </div>
                <span className="rounded bg-emerald-50 px-2 py-1 text-[11px] font-medium text-emerald-700">
                  LIVE
                </span>
              </div>
              <div className="mt-3 flex flex-wrap gap-2 text-xs text-slate-500">
                <span>示波器数量: {panels.length}</span>
                <span>激活通道: {totalActiveTraces}</span>
                <span>采样至: {formatTimeLabel(latestScopeTime)}</span>
              </div>
              <div className="mt-3 flex flex-wrap gap-2">
                <button type="button" className={workspaceButtonClass} onClick={() => applyToPanels('expand')}>
                  全部展开
                </button>
                <button type="button" className={workspaceButtonClass} onClick={() => applyToPanels('minimize')}>
                  全部收起
                </button>
                <button type="button" className={workspaceButtonClass} onClick={() => applyToPanels('showAllChannels')}>
                  显示全部通道
                </button>
                <button type="button" className={workspaceButtonClass} onClick={() => applyToPanels('resetTimebase')}>
                  默认时基
                </button>
              </div>
            </div>

            {orderedPanels.map(renderPanelCard)}
          </div>
        ) : (
          <div className="rounded border border-dashed border-slate-200 p-6 text-center text-sm text-slate-500">
            当前实时仿真里还没有可用示波器，请先放置“示波器 (OSC)”元件并接入电路节点。
          </div>
        )}
      </Drawer>


    </>
  );
};
