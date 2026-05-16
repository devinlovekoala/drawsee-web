import { useCallback, useRef, type ReactNode } from 'react';
import { Download } from 'lucide-react';
import type { SceneMeta } from '../types';

interface Props {
  meta: SceneMeta;
  children: ReactNode;
}

const COURSE_BADGE: Record<SceneMeta['course'], string> = {
  analog: 'bg-blue-50 text-blue-700 border-blue-200',
  digital: 'bg-violet-50 text-violet-700 border-violet-200',
};

const COURSE_LABEL: Record<SceneMeta['course'], string> = {
  analog: '模拟电路',
  digital: '数字电路',
};

function exportSceneAsPng(contentEl: HTMLElement | null, title: string) {
  if (!contentEl) return;

  const svgs = contentEl.querySelectorAll<SVGSVGElement>('svg');
  if (!svgs.length) return;

  const svg = svgs[0];
  const svgWidth = svg.width.baseVal.value || 800;
  const svgHeight = svg.height.baseVal.value || 400;

  const clone = svg.cloneNode(true) as SVGSVGElement;
  const bg = document.createElementNS('http://www.w3.org/2000/svg', 'rect');
  bg.setAttribute('width', String(svgWidth));
  bg.setAttribute('height', String(svgHeight));
  bg.setAttribute('fill', '#0f172a');
  clone.insertBefore(bg, clone.firstChild);

  const watermark = document.createElementNS('http://www.w3.org/2000/svg', 'text');
  watermark.setAttribute('x', '8');
  watermark.setAttribute('y', String(svgHeight - 6));
  watermark.setAttribute('fill', '#475569');
  watermark.setAttribute('font-size', '9');
  watermark.setAttribute('font-family', 'sans-serif');
  watermark.textContent = `昭析 · ${title}`;
  clone.appendChild(watermark);

  const serializer = new XMLSerializer();
  const svgStr = serializer.serializeToString(clone);
  const blob = new Blob([svgStr], { type: 'image/svg+xml;charset=utf-8' });
  const url = URL.createObjectURL(blob);

  const img = new Image();
  img.onload = () => {
    const scale = 2;
    const canvas = document.createElement('canvas');
    canvas.width = svgWidth * scale;
    canvas.height = svgHeight * scale;
    const ctx = canvas.getContext('2d')!;
    ctx.scale(scale, scale);
    ctx.drawImage(img, 0, 0);
    URL.revokeObjectURL(url);

    canvas.toBlob(pngBlob => {
      if (!pngBlob) return;
      const a = document.createElement('a');
      a.href = URL.createObjectURL(pngBlob);
      a.download = `昭析-${title}.png`;
      a.click();
      setTimeout(() => URL.revokeObjectURL(a.href), 5000);
    }, 'image/png');
  };
  img.src = url;
}

export function SceneShell({ meta, children }: Props) {
  const contentRef = useRef<HTMLDivElement>(null);

  const handleExport = useCallback(() => {
    exportSceneAsPng(contentRef.current, meta.title);
  }, [meta.title]);

  return (
    <div className="rounded-xl border border-neutral-200 bg-white shadow-sm overflow-hidden">
      {/* Header */}
      <div className="px-5 py-3 border-b border-neutral-100 bg-neutral-50 flex items-center justify-between gap-3">
        <div className="min-w-0">
          <div className="flex items-center gap-2 flex-wrap">
            <h2 className="text-sm font-semibold text-neutral-900 leading-snug">{meta.title}</h2>
            <span className={`shrink-0 text-[10px] border rounded-full px-2 py-0.5 font-medium ${COURSE_BADGE[meta.course]}`}>
              {COURSE_LABEL[meta.course]}
            </span>
          </div>
          <p className="text-xs text-neutral-500 mt-0.5">{meta.subtitle}</p>
          <div className="mt-0.5 text-[10px] text-neutral-400">{meta.chapter}</div>
        </div>
        <button
          onClick={handleExport}
          title="导出图表为 PNG，可直接粘贴到 PPT / Notion / 飞书"
          className="shrink-0 flex items-center gap-1.5 px-3 py-1.5 rounded-lg border border-neutral-200 bg-white text-xs text-neutral-600 hover:bg-neutral-50 hover:border-blue-300 hover:text-blue-600 transition-colors"
        >
          <Download size={13} />
          导出 PNG
        </button>
      </div>

      {/* Scene content */}
      <div className="p-5" ref={contentRef}>{children}</div>
    </div>
  );
}
