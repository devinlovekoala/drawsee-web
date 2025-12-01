import { RefreshCcw, PanelRight, PanelRightClose, ZoomIn, ZoomOut, Eye } from 'lucide-react';
import { useReactFlow } from '@xyflow/react';
import { useAdaptiveZoom } from '../hooks/useAdaptiveZoom';

interface FlowToolBarProps {
  onRelayout: () => void;
  showDetailPanel: boolean;
  onToggleDetailPanel: () => void;
}

function FlowRightToolBar({ 
  onRelayout, 
  showDetailPanel,
  onToggleDetailPanel
}: FlowToolBarProps) {
  const { zoomIn, zoomOut, getNodes } = useReactFlow();
  const { switchToOverviewMode, switchToDetailMode } = useAdaptiveZoom();

  // 概览模式 - 使用智能缩放
  const handleOverviewMode = () => {
    const nodes = getNodes();
    switchToOverviewMode(nodes);
  };

  // 详情模式 - 使用智能缩放
  const handleDetailMode = () => {
    const nodes = getNodes();
    switchToDetailMode(nodes);
  };

  return (
    <div className="bg-white rounded-lg text-[12px] font-[550] px-1.5 py-1.5 flex items-center space-x-2 shadow-[0_0_0_1px_rgba(0,0,0,0.1)]">
      {/* 视图模式切换 */}
      <div className="flex items-center space-x-1">
        <button
          onClick={handleOverviewMode}
          className="flex items-center text-gray-700 bg-white hover:bg-gray-100 active:bg-gray-200 transition duration-200 rounded-lg px-2 py-1 shadow-[0_0_0_1px_rgba(0,0,0,0.1)] h-8"
          title="概览模式 - 查看整体结构"
        >
          <Eye className="mr-1" size={14} />
          概览
        </button>
        <button
          onClick={handleDetailMode}
          className="flex items-center text-gray-700 bg-white hover:bg-gray-100 active:bg-gray-200 transition duration-200 rounded-lg px-2 py-1 shadow-[0_0_0_1px_rgba(0,0,0,0.1)] h-8"
          title="详情模式 - 查看节点细节"
        >
          <ZoomIn className="mr-1" size={14} />
          详情
        </button>
      </div>

      {/* 缩放控制 */}
      <div className="flex items-center space-x-1">
        <button
          onClick={() => zoomOut()}
          className="flex items-center text-gray-700 bg-white hover:bg-gray-100 active:bg-gray-200 transition duration-200 rounded-lg px-2 py-1 shadow-[0_0_0_1px_rgba(0,0,0,0.1)] h-8"
          title="缩小"
        >
          <ZoomOut size={14} />
        </button>
        <button
          onClick={() => zoomIn()}
          className="flex items-center text-gray-700 bg-white hover:bg-gray-100 active:bg-gray-200 transition duration-200 rounded-lg px-2 py-1 shadow-[0_0_0_1px_rgba(0,0,0,0.1)] h-8"
          title="放大"
        >
          <ZoomIn size={14} />
        </button>
      </div>
      
      {/* 重新布局 */}
      <button 
        onClick={onRelayout}
        className="flex items-center text-gray-800 bg-white hover:bg-gray-100 active:bg-gray-200 transition duration-200 rounded-lg px-2 py-1 shadow-[0_0_0_1px_rgba(0,0,0,0.1)] transform hover:scale-105 h-8">
        <RefreshCcw className="mr-2" size={16} />
        重新布局
      </button>

      {/* 详情面板切换按钮 */}
      <button
        onClick={onToggleDetailPanel}
        className="flex items-center text-gray-800 bg-white hover:bg-gray-100 active:bg-gray-200 transition duration-200 rounded-lg px-2 py-1 shadow-[0_0_0_1px_rgba(0,0,0,0.1)] transform hover:scale-105 h-8"
        title={showDetailPanel ? '关闭详情面板' : '打开详情面板'}
      >
        {showDetailPanel ? <PanelRightClose className="mr-2" size={16} /> : <PanelRight className="mr-2" size={16} />}
        {showDetailPanel ? '关闭详情' : '节点详情'}
      </button>
      
    </div>
  );
}

export default FlowRightToolBar;
