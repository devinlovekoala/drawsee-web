import { useEffect, useState } from 'react';
import { Button } from 'antd';
import { ArrowLeft, Cpu } from 'lucide-react';
import { useLocation, useNavigate } from 'react-router-dom';
import { CircuitFlowWithProvider } from '../circuit/components/CircuitFlow';
import { CircuitDesign } from '@/api/types/circuit.types';
import { consumeCircuitPrefill } from '../circuit/utils/circuitPrefill';

const DigitalWorkbench = () => {
  const navigate = useNavigate();
  const location = useLocation();
  const classId = location.state?.classId as string || null;
  const statePrefillDesign = location.state?.prefillCircuitDesign as CircuitDesign | undefined;
  const [initialCircuitDesign, setInitialCircuitDesign] = useState<CircuitDesign | null>(() => {
    return statePrefillDesign || consumeCircuitPrefill();
  });

  useEffect(() => {
    if (statePrefillDesign) {
      setInitialCircuitDesign(statePrefillDesign);
      return;
    }
    const prefillDesign = consumeCircuitPrefill();
    if (prefillDesign) {
      setInitialCircuitDesign(prefillDesign);
    }
  }, [statePrefillDesign]);

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
              使用 React Flow 画布搭建数字逻辑，后续可接入 Icarus Verilog 进行仿真
            </p>
          </div>
        </div>
        <div className="text-right text-xs text-slate-500">
          <div>编辑模式：数字逻辑</div>
          <div>提示：当前版本支持搭建和管理电路结构</div>
        </div>
      </header>

      <main className="flex flex-1 overflow-hidden">
        <CircuitFlowWithProvider
          workspaceMode="digital"
          initialCircuitDesign={initialCircuitDesign || undefined}
          classId={classId}
        />
      </main>
    </div>
  );
};

export default DigitalWorkbench;
