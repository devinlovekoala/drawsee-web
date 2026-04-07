import { FC } from 'react';
import { Button, Tooltip } from 'antd';
import { 
  SaveOutlined, 
  UndoOutlined, 
  RedoOutlined,
  CopyOutlined,
  DeleteOutlined,
  RotateRightOutlined,
  ZoomInOutlined,
  ZoomOutOutlined,
  PlayCircleOutlined,
  ClearOutlined,
  PoweroffOutlined,
  FileAddOutlined,
  PictureOutlined,
  NodeIndexOutlined,
  PlusCircleOutlined,
  ScissorOutlined
  ,
  MenuFoldOutlined,
  MenuUnfoldOutlined,
  SwitcherOutlined
} from '@ant-design/icons';
import { AppstoreOutlined } from '@ant-design/icons';
import { ModelType } from '@/app/pages/flow/components/input/FlowInputPanel';
import { ModelSelector } from '@/app/pages/blank/components/ModelSelector';

type CircuitWorkspaceMode = 'analog' | 'digital' | 'hybrid';

interface CircuitToolbarProps {
  onSave?: () => void;
  onUndo?: () => void;
  onRedo?: () => void;
  onCopy?: () => void;
  onDelete?: () => void;
  onRotate?: () => void;
  onZoomIn?: () => void;
  onZoomOut?: () => void;
  onFitView?: () => void;
  onFullScreen?: () => void;
  onAnalysis?: () => void;
  onClear?: () => void;
  onAnalyze?: () => void;
  onRunSimulation?: () => void;
  isAnalyzing?: boolean;
  isSimulating?: boolean;
  selectedModel?: ModelType;
  onModelChange?: (model: ModelType) => void;
  canUndo?: boolean;
  canRedo?: boolean;
  hasSelectedNode?: boolean;
  hasSelectedEdge?: boolean;
  hasContent?: boolean;
  onSaveAs?: () => void;
  canSaveAs?: boolean;
  onImageImport?: () => void;
  isImportingImage?: boolean;
  onToggleWireMode?: () => void;
  isWireModeActive?: boolean;
  onToggleJunctionMode?: () => void;
  isJunctionModeActive?: boolean;
  onDeleteEdge?: () => void;
  onToggleSidebar?: () => void;
  isSidebarOpen?: boolean;
  onToggleElementLibrary?: () => void;
  isElementLibraryOpen?: boolean;
  workspaceMode?: CircuitWorkspaceMode;
  workspaceModeMismatch?: boolean;
  detectedWorkspaceMode?: CircuitWorkspaceMode;
  onWorkspaceModeToggle?: () => void;
}

export const CircuitToolbar: FC<CircuitToolbarProps> = ({
  onSave,
  onSaveAs,
  onUndo,
  onRedo,
  onCopy,
  onDelete,
  onRotate,
  onZoomIn,
  onZoomOut,
  onClear,
  onAnalysis,
  onRunSimulation,
  isAnalyzing = false,
  canUndo = false,
  canRedo = false,
  hasSelectedNode = false,
  hasSelectedEdge = false,
  hasContent = false,
  isSimulating = false,
  selectedModel,
  onModelChange,
  canSaveAs = false,
  onImageImport,
  isImportingImage = false,
  onToggleWireMode,
  isWireModeActive = false,
  onToggleJunctionMode,
  isJunctionModeActive = false,
  onDeleteEdge,
  onToggleSidebar,
  isSidebarOpen = true,
  onToggleElementLibrary,
  isElementLibraryOpen = true,
  workspaceMode,
  workspaceModeMismatch = false,
  detectedWorkspaceMode,
  onWorkspaceModeToggle,
}) => {

  // 根据按钮是否禁用返回对应的CSS类
  const getButtonClass = (isDisabled: boolean) => {
    return isDisabled 
      ? 'cursor-not-allowed opacity-50' 
      : 'hover:bg-gray-100 cursor-pointer';
  };
  
  // 检查操作功能是否可用
  const workspaceModeDisplayLabels: Record<CircuitWorkspaceMode, string> = {
    analog: '模拟',
    digital: '数字',
    hybrid: '混合'
  };
  const currentWorkspaceLabel = workspaceMode ? workspaceModeDisplayLabels[workspaceMode] : '工作台';
  const detectedWorkspaceLabel = detectedWorkspaceMode ? workspaceModeDisplayLabels[detectedWorkspaceMode] : '';
  const workspaceTooltip = workspaceModeMismatch && detectedWorkspaceLabel
    ? `检测到导入的电路为${detectedWorkspaceLabel}类型，点击切换到对应工作台`
    : `当前：${currentWorkspaceLabel}工作台，点击切换`;

  return (
    <div className="flex items-center gap-2 bg-white p-2 border border-gray-200 rounded-md shadow-sm">
      <Tooltip title="保存电路">
        <Button
          type="text"
          onClick={onSave}
          disabled={!hasContent || !onSave}
          icon={<SaveOutlined />}
          className={getButtonClass(!hasContent || !onSave)}
        />
      </Tooltip>

      <Tooltip title="另存为">
        <Button
          type="text"
          onClick={onSaveAs}
          disabled={!canSaveAs || !onSaveAs}
          icon={<FileAddOutlined />}
          className={getButtonClass(!canSaveAs || !onSaveAs)}
        />
      </Tooltip>

      <Tooltip title={isSidebarOpen ? '收起侧栏' : '展开侧栏'}>
        <Button
          type="text"
          onClick={onToggleSidebar}
          icon={isSidebarOpen ? <MenuFoldOutlined /> : <MenuUnfoldOutlined />}
          className={onToggleSidebar ? 'hover:bg-gray-100 cursor-pointer' : 'cursor-not-allowed opacity-50'}
        />
      </Tooltip>

      <Tooltip title={isElementLibraryOpen ? '隐藏元件库' : '显示元件库'}>
        <Button
          type="text"
          onClick={onToggleElementLibrary}
          icon={<AppstoreOutlined />}
          className={onToggleElementLibrary ? 'hover:bg-gray-100 cursor-pointer' : 'cursor-not-allowed opacity-50'}
        />
      </Tooltip>

      <Tooltip title="图片识别导入">
        <Button
          type="text"
          onClick={onImageImport}
          disabled={!onImageImport}
          icon={<PictureOutlined />}
          loading={isImportingImage}
          className={getButtonClass(!onImageImport)}
        />
      </Tooltip>

      <Tooltip title={workspaceTooltip}>
        <Button
          type={workspaceModeMismatch ? 'primary' : 'text'}
          onClick={onWorkspaceModeToggle}
          disabled={!onWorkspaceModeToggle}
          icon={<SwitcherOutlined />}
          className={getButtonClass(!onWorkspaceModeToggle)}
        />
      </Tooltip>

      <Tooltip title={isWireModeActive ? '退出布线模式 (Esc)' : '布线模式'}>
        <Button
          type={isWireModeActive ? 'primary' : 'text'}
          onClick={onToggleWireMode}
          disabled={!onToggleWireMode}
          icon={<NodeIndexOutlined />}
          className={getButtonClass(!onToggleWireMode)}
        />
      </Tooltip>

      <Tooltip title={isJunctionModeActive ? '退出连接点模式 (Esc)' : '添加连接点'}>
        <Button
          type={isJunctionModeActive ? 'primary' : 'text'}
          onClick={onToggleJunctionMode}
          disabled={!onToggleJunctionMode}
          icon={<PlusCircleOutlined />}
          className={getButtonClass(!onToggleJunctionMode)}
        />
      </Tooltip>

      <Tooltip title="撤销">
        <Button
          type="text"
          onClick={onUndo}
          disabled={!canUndo || !onUndo}
          icon={<UndoOutlined />}
          className={getButtonClass(!canUndo || !onUndo)}
        />
      </Tooltip>

      <Tooltip title="重做">
        <Button
          type="text"
          onClick={onRedo}
          disabled={!canRedo || !onRedo}
          icon={<RedoOutlined />}
          className={getButtonClass(!canRedo || !onRedo)}
        />
      </Tooltip>

      <div className="h-6 mx-2 border-l border-gray-200"></div>

      <Tooltip title="复制">
        <Button
          type="text"
          onClick={onCopy}
          disabled={!hasSelectedNode || !onCopy}
          icon={<CopyOutlined />}
          className={getButtonClass(!hasSelectedNode || !onCopy)}
        />
      </Tooltip>

      <Tooltip title="删除">
        <Button
          type="text"
          onClick={onDelete}
          disabled={!hasSelectedNode || !onDelete}
          icon={<DeleteOutlined />}
          className={getButtonClass(!hasSelectedNode || !onDelete)}
        />
      </Tooltip>

      <Tooltip title="删除连线">
        <Button
          type="text"
          onClick={onDeleteEdge}
          disabled={!hasSelectedEdge || !onDeleteEdge}
          icon={<ScissorOutlined />}
          className={getButtonClass(!hasSelectedEdge || !onDeleteEdge)}
        />
      </Tooltip>

      <Tooltip title="旋转">
        <Button
          type="text"
          onClick={onRotate}
          disabled={!hasSelectedNode || !onRotate}
          icon={<RotateRightOutlined />}
          className={getButtonClass(!hasSelectedNode || !onRotate)}
        />
      </Tooltip>

      <div className="h-6 mx-2 border-l border-gray-200"></div>

      <Tooltip title="放大">
        <Button 
          type="text" 
          onClick={onZoomIn}
          disabled={!onZoomIn}
          icon={<ZoomInOutlined />}
          className={onZoomIn ? "hover:bg-gray-100 cursor-pointer" : "cursor-not-allowed opacity-50"}
        />
      </Tooltip>

      <Tooltip title="缩小">
        <Button 
          type="text" 
          onClick={onZoomOut}
          disabled={!onZoomOut}
          icon={<ZoomOutOutlined />}
          className={onZoomOut ? "hover:bg-gray-100 cursor-pointer" : "cursor-not-allowed opacity-50"}
        />
      </Tooltip>

      <div className="h-6 mx-2 border-l border-gray-200"></div>

      <Tooltip title={isSimulating ? '正在运行模拟' : '运行电路'}>
        <Button
          type="text"
          onClick={onRunSimulation}
          disabled={!hasContent || !onRunSimulation}
          icon={<PoweroffOutlined />}
          className={getButtonClass(!hasContent || !onRunSimulation)}
          loading={isSimulating}
        />
      </Tooltip>

      {/* 模型选择器 */}
      <div className="flex items-center">
        <ModelSelector
          selectedModel={selectedModel || 'deepseekV3'}
          onModelChange={onModelChange || (() => {})}
        />
      </div>

      <Tooltip title="分析电路">
        <Button
          type="text"
          onClick={onAnalysis}
          disabled={!hasContent || !onAnalysis}
          icon={<PlayCircleOutlined />}
          className={getButtonClass(!hasContent || !onAnalysis)}
          loading={isAnalyzing}
        />
      </Tooltip>

      <Tooltip title="清空电路">
        <Button
          type="text"
          onClick={onClear}
          disabled={!hasContent || !onClear}
          icon={<ClearOutlined />}
          className={getButtonClass(!hasContent || !onClear)}
        />
      </Tooltip>
    </div>
  );
};

export default CircuitToolbar; 
