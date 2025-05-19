import { FC } from 'react';
import { Button, Tooltip, Divider, Select, Popconfirm } from 'antd';
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
  ClearOutlined
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
  isAnalyzing?: boolean;
  selectedModel?: ModelType;
  onModelChange?: (model: ModelType) => void;
  canUndo?: boolean;
  canRedo?: boolean;
  hasSelectedNode?: boolean;
  hasContent?: boolean;
}

export const CircuitToolbar: FC<CircuitToolbarProps> = ({
  onSave,
  onUndo,
  onRedo,
  onCopy,
  onDelete,
  onRotate,
  onZoomIn,
  onZoomOut,
  onAnalysis,
  onClear,
  canUndo = false,
  canRedo = false,
  hasSelectedNode = false,
  hasContent = false,
}) => {
  const modelOptions = [
    { value: 'deepseekV3', label: 'DeepSeek-V3' },
    { value: 'gpt-4o', label: 'GPT-4o' },
    { value: 'doubao', label: '豆包大模型' }
  ];

  return (
    <div className="flex items-center gap-2 bg-white p-2 border border-gray-200 rounded-md shadow-sm">
      <Tooltip title="保存电路">
        <Button
          type="text"
          onClick={onSave}
          disabled={!hasContent}
          icon={<SaveOutlined />}
        />
      </Tooltip>

      <Tooltip title="撤销">
        <Button
          type="text"
          onClick={onUndo}
          disabled={!onUndo}
          icon={<UndoOutlined />}
        />
      </Tooltip>

      <Tooltip title="重做">
        <Button
          type="text"
          onClick={onRedo}
          disabled={!onRedo}
          icon={<RedoOutlined />}
        />
      </Tooltip>

      <Divider type="vertical" className="h-6 mx-2" />

      <Tooltip title="复制">
        <Button
          type="text"
          onClick={onCopy}
          disabled={!hasSelectedNode}
          icon={<CopyOutlined />}
        />
      </Tooltip>

      <Tooltip title="删除">
        <Button
          type="text"
          onClick={onDelete}
          disabled={!hasSelectedNode}
          icon={<DeleteOutlined />}
        />
      </Tooltip>

      <Tooltip title="旋转">
        <Button
          type="text"
          onClick={onRotate}
          disabled={!hasSelectedNode}
          icon={<RotateRightOutlined />}
        />
      </Tooltip>

      <Divider type="vertical" className="h-6 mx-2" />

      <Tooltip title="放大">
        <Button 
          type="text" 
          onClick={onZoomIn}
          icon={<ZoomInOutlined />}
        />
      </Tooltip>

      <Tooltip title="缩小">
        <Button 
          type="text" 
          onClick={onZoomOut}
          icon={<ZoomOutOutlined />}
        />
      </Tooltip>

      <Divider type="vertical" className="h-6 mx-2" />

      <Tooltip title="分析电路">
        <Button
          type="text"
          onClick={onAnalysis}
          disabled={!hasContent}
          icon={<PlayCircleOutlined />}
        />
      </Tooltip>

      <Tooltip title="清空电路">
        <Button
          type="text"
          onClick={onClear}
          disabled={!hasContent}
          icon={<ClearOutlined />}
        />
      </Tooltip>
    </div>
  );
};

export default CircuitToolbar; 