import { useEffect, useRef } from 'react';
import { Circuit, Monitor, MonitorView, IOPanelView } from 'digitaljs';

interface DigitalJsConnector {
  name?: string;
}

interface DigitalJsProject {
  connectors?: DigitalJsConnector[];
  [key: string]: unknown;
}

interface DigitalCanvasProps {
  project?: DigitalJsProject;
}

const DigitalCanvas = ({ project }: DigitalCanvasProps) => {
  const paperRef = useRef<HTMLDivElement>(null);
  const ioPanelRef = useRef<HTMLDivElement>(null);
  const monitorRef = useRef<HTMLDivElement>(null);

  useEffect(() => {
    if (!project || !paperRef.current) return;
    const circuit = new Circuit(project, { windowCallback: () => undefined });
    const paper = circuit.displayOn(paperRef.current);
    const monitorInstance = monitorRef.current ? new Monitor(circuit) : null;
    const monitorView =
      monitorInstance && monitorRef.current
        ? new MonitorView({ model: monitorInstance, el: monitorRef.current })
        : null;
    const panelView =
      ioPanelRef.current ? new IOPanelView({ model: circuit, el: ioPanelRef.current }) : null;

    if (monitorInstance && project?.connectors?.length) {
      project.connectors
        .map((conn) => conn?.name)
        .filter((netName): netName is string => Boolean(netName))
        .slice(0, 8)
        .forEach((netName) => {
          const wire = circuit.findWireByLabel(netName);
          if (wire) {
            monitorInstance.addWire(wire);
          }
        });
    }

    circuit.start();
    return () => {
      monitorView?.shutdown?.();
      panelView?.shutdown?.();
      circuit.shutdown();
      paper?.remove?.();
    };
  }, [project]);

  if (!project) {
    return (
      <div className="flex flex-1 items-center justify-center rounded-lg border border-dashed border-gray-300 bg-white">
        <p className="text-sm text-gray-500">尚未选择 DigitalJS 电路。导入或新建一个项目以开始。</p>
      </div>
    );
  }

  return (
    <div className="flex h-full flex-col gap-3">
      <div ref={paperRef} className="min-h-[360px] flex-1 overflow-hidden rounded-lg border bg-white" />
      <div className="grid h-48 grid-cols-2 gap-3">
        <div
          ref={ioPanelRef}
          className="overflow-auto rounded-lg border bg-white p-2 text-xs text-gray-700"
        />
        <div
          ref={monitorRef}
          className="overflow-auto rounded-lg border bg-white p-2 text-xs text-gray-700"
        />
      </div>
    </div>
  );
};

export default DigitalCanvas;
