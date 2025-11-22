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
  PictureOutlined
} from '@ant-design/icons';
import { ModelType } from '@/app/pages/flow/components/input/FlowInputPanel';

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
  hasContent?: boolean;
  onSaveAs?: () => void;
  canSaveAs?: boolean;
  onImageImport?: () => void;
  isImportingImage?: boolean;
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
  hasContent = false,
  isSimulating = false,
  canSaveAs = false,
  onImageImport,
  isImportingImage = false,
}) => {

  // 只在开发环境下输出日志
  if (process.env.NODE_ENV === 'development') {
    // 限制日志频率，使用requestAnimationFrame来降低日志输出频率
    const debug = () => {
      if (Math.random() < 0.01) { // 只有1%的概率输出日志
        console.log('CircuitToolbar 渲染 - hasSelectedNode:', hasSelectedNode, 'canUndo:', canUndo, 'canRedo:', canRedo, 'hasContent:', hasContent);
      }
    };
    
    // 使用requestAnimationFrame来避免在同一帧内重复输出日志
    requestAnimationFrame(debug);
  }

  // 根据按钮是否禁用返回对应的CSS类
  const getButtonClass = (isDisabled: boolean) => {
    return isDisabled 
      ? 'cursor-not-allowed opacity-50' 
      : 'hover:bg-gray-100 cursor-pointer';
  };
  
  // 检查操作功能是否可用
  const isOperationEnabled = (operation: (() => void) | undefined, condition: boolean): boolean => {
    return !!operation && condition;
  };

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
