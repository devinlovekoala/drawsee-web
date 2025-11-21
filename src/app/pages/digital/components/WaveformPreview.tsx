import { Empty, Spin } from 'antd';
import { DigitalSimulationStatus, DigitalWaveformTrace } from '../types';

interface WaveformPreviewProps {
  waveforms?: DigitalWaveformTrace[];
  status: DigitalSimulationStatus;
}

const WaveformPreview = ({ waveforms = [], status }: WaveformPreviewProps) => {
  if (status === 'running') {
    return (
      <div className="flex h-full items-center justify-center gap-2 text-sm text-gray-500">
        <Spin size="small" />
        仿真运行中...
      </div>
    );
  }

  if (!waveforms.length) {
    return (
      <div className="flex h-full flex-col items-center justify-center">
        <Empty description="运行仿真后显示波形" image={Empty.PRESENTED_IMAGE_SIMPLE} />
      </div>
    );
  }

  return (
    <div className="h-full overflow-y-auto">
      <div className="space-y-4 text-xs">
        {waveforms.map((trace) => (
          <div key={trace.signal} className="rounded-lg border border-gray-200 p-3">
            <div className="mb-2 flex items-center justify-between text-gray-600">
              <span className="font-medium text-gray-800">{trace.signal}</span>
              <span>{trace.width} bit</span>
            </div>
            <div className="flex flex-wrap gap-1">
              {trace.samples.slice(0, 18).map((sample) => (
                <span
                  key={`${trace.signal}-${sample.time}`}
                  className="rounded bg-slate-100 px-2 py-1 font-mono text-[11px] text-slate-700"
                >
                  t={sample.time}ns → {sample.value}
                </span>
              ))}
            </div>
          </div>
        ))}
      </div>
    </div>
  );
};

export default WaveformPreview;
