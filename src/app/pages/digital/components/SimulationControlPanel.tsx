import { Button, Input, InputNumber, Tag, message, Tooltip } from 'antd';
import { Download, Play, RefreshCcw } from 'lucide-react';
import { useMemo } from 'react';
import { useDigitalLabStore } from '../store/useDigitalLabStore';

const SimulationControlPanel = () => {
  const { design, updateDesign, simulation, runSimulation } = useDigitalLabStore();
  const [messageApi, contextHolder] = message.useMessage();
  const durationNs = design.simulation?.durationNs ?? 80;

  const statusTag = useMemo(() => {
    switch (simulation.status) {
      case 'running':
        return <Tag color="processing">运行中</Tag>;
      case 'success':
        return <Tag color="success">完成</Tag>;
      case 'error':
        return <Tag color="error">失败</Tag>;
      default:
        return <Tag>待机</Tag>;
    }
  }, [simulation.status]);

  const handleRun = async () => {
    try {
      await runSimulation();
      messageApi.success('仿真完成');
    } catch (err) {
      const messageText = err instanceof Error ? err.message : '仿真失败';
      messageApi.error(messageText);
    }
  };

  const handleDownloadVcd = () => {
    if (!simulation.result?.vcd) {
      messageApi.warning('暂无 VCD 结果');
      return;
    }
    const blob = new Blob([simulation.result.vcd], { type: 'text/plain' });
    const url = URL.createObjectURL(blob);
    const a = document.createElement('a');
    a.href = url;
    a.download = `${simulation.result.dumpFile || 'waves'}.vcd`;
    a.click();
    URL.revokeObjectURL(url);
  };

  const updateTopModule = (value: string) => {
    updateDesign((prev) => ({
      ...prev,
      topModule: value || 'digital_top',
    }));
  };

  const updateDuration = (value: number | null) => {
    const next = value && value > 0 ? value : durationNs;
    updateDesign((prev) => ({
      ...prev,
      simulation: {
        ...prev.simulation,
        durationNs: next,
      },
    }));
  };

  return (
    <div className="flex flex-col gap-4">
      {contextHolder}
      <div>
        <div className="mb-1 flex items-center justify-between text-xs font-medium text-gray-500">
          <span>顶层模块</span>
          {statusTag}
        </div>
        <Input
          allowClear
          value={design.topModule ?? 'digital_top'}
          onChange={(e) => updateTopModule(e.target.value)}
          placeholder="digital_top"
        />
      </div>

      <div>
        <label className="mb-1 block text-xs font-medium text-gray-500">仿真时长（ns）</label>
        <InputNumber
          min={10}
          className="w-full"
          value={durationNs}
          onChange={(val) => updateDuration(val)}
        />
      </div>

      <div className="flex gap-2">
        <Button
          type="primary"
          icon={<Play size={16} />}
          loading={simulation.status === 'running'}
          onClick={handleRun}
          block
        >
          运行仿真
        </Button>
        <Tooltip title="重新准备仿真参数（保持当前设计）">
          <Button
            icon={<RefreshCcw size={16} />}
            onClick={() => messageApi.info('仿真参数重置功能即将上线')}
          />
        </Tooltip>
      </div>

      {simulation.status === 'error' && (
        <div className="rounded-lg border border-red-200 bg-red-50 p-3 text-xs text-red-600">
          {simulation.error || '仿真失败'}
        </div>
      )}

      {simulation.result && (
        <div className="space-y-2 rounded-lg border border-gray-200 bg-gray-50 p-3 text-xs text-gray-600">
          <div className="flex items-center justify-between">
            <span>波形信号</span>
            <span className="font-semibold text-gray-800">
              {simulation.result.waveforms.length}
            </span>
          </div>
          <div className="flex items-center justify-between">
            <span>Dump 文件</span>
            <span className="font-mono text-gray-800">{simulation.result.dumpFile}</span>
          </div>
          <div className="flex items-center justify-between">
            <span>持续时间</span>
            <span className="text-gray-800">{simulation.result.durationNs} ns</span>
          </div>
          <Button
            icon={<Download size={16} />}
            onClick={handleDownloadVcd}
            block
            size="small"
          >
            下载 VCD
          </Button>
        </div>
      )}
    </div>
  );
};

export default SimulationControlPanel;
