import { Button } from 'antd';
import { ArrowLeft, Cpu } from 'lucide-react';
import { useNavigate } from 'react-router-dom';
import SimulationControlPanel from './components/SimulationControlPanel';
import DigitalCanvas from './components/DigitalCanvas';
import WaveformPreview from './components/WaveformPreview';
import { useDigitalLabStore } from './store/useDigitalLabStore';

const DigitalWorkbench = () => {
  const navigate = useNavigate();
  const { design, simulation } = useDigitalLabStore();

  return (
    <div className="flex h-full flex-col bg-slate-50">
      <header className="flex items-center justify-between border-b border-slate-200 bg-white px-6 py-4">
        <div className="flex items-center gap-3">
          <Button icon={<ArrowLeft size={16} />} onClick={() => navigate(-1)}>
            返回
          </Button>
          <div>
            <div className="flex items-center gap-2 text-lg font-semibold text-slate-800">
              <Cpu size={20} className="text-blue-600" />
              数字电路工作台
            </div>
            <p className="text-xs text-slate-500">
              使用 DigitalJS 搭建逻辑电路，调用 Icarus Verilog 后端进行波形仿真
            </p>
          </div>
        </div>
        <div className="text-right text-xs text-slate-500">
          <div>当前设计：{design.name}</div>
          <div>顶层模块：{design.topModule || 'digital_top'}</div>
        </div>
      </header>

      <main className="flex flex-1 overflow-hidden">
        <section className="flex flex-1 flex-col overflow-y-auto p-4">
          <DigitalCanvas project={design.artifacts?.digitalJsProject} />
        </section>
        <aside className="w-96 border-l border-slate-200 bg-white p-4">
          <SimulationControlPanel />
        </aside>
      </main>

      <section className="h-64 border-t border-slate-200 bg-white p-4">
        <h3 className="mb-3 text-xs font-semibold uppercase tracking-wide text-slate-500">
          波形预览
        </h3>
        <WaveformPreview waveforms={simulation.result?.waveforms} status={simulation.status} />
      </section>
    </div>
  );
};

export default DigitalWorkbench;
