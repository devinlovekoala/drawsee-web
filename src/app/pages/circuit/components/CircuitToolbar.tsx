import React from 'react';
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
  BorderOutlined,
  FullscreenOutlined,
  ExportOutlined,
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
  onExport?: () => void;
  onClearAll?: () => void;
  onAnalyze?: () => void;
  isAnalyzing?: boolean;
  selectedModel?: ModelType;
  onModelChange?: (model: ModelType) => void;
  canUndo?: boolean;
  canRedo?: boolean;
  hasSelectedNode?: boolean;
  hasContent?: boolean;
}

const CircuitToolbar: React.FC<CircuitToolbarProps> = ({
  onSave,
  onUndo,
  onRedo,
  onCopy,
  onDelete,
  onRotate,
  onZoomIn,
  onZoomOut,
  onFitView,
  onFullScreen,
  onExport,
  onClearAll,
  onAnalyze,
  isAnalyzing = false,
  selectedModel = 'deepseekV3',
  onModelChange,
  canUndo = false,
  canRedo = false,
  hasSelectedNode = false,
  hasContent = false
}) => {
  const modelOptions = [
    { value: 'deepseekV3', label: 'DeepSeek-V3' },
    { value: 'gpt-4o', label: 'GPT-4o' },
    { value: 'doubao', label: '豆包大模型' }
  ];

  return (
    <div className="circuit-toolbar px-3 py-2 bg-white border-b border-gray-200 flex items-center">
      {/* 文件操作 */}
      <div className="toolbar-group">
        <Tooltip title="保存电路设计">
          <Button 
            type="text" 
            icon={<SaveOutlined />} 
            onClick={onSave}
          />
        </Tooltip>
        
        <Tooltip title="导出电路图">
          <Button 
            type="text" 
            icon={<ExportOutlined />} 
            onClick={onExport}
          />
        </Tooltip>
      </div>
      
      <Divider type="vertical" className="h-6 mx-2" />
      
      {/* 编辑操作 */}
      <div className="toolbar-group">
        <Tooltip title="撤销 (Ctrl+Z)">
          <Button 
            type="text" 
            icon={<UndoOutlined />} 
            onClick={onUndo}
            disabled={!canUndo}
          />
        </Tooltip>
        
        <Tooltip title="重做 (Ctrl+Y)">
          <Button 
            type="text" 
            icon={<RedoOutlined />} 
            onClick={onRedo}
            disabled={!canRedo}
          />
        </Tooltip>
        
        <Tooltip title="复制元件 (Ctrl+C)">
          <Button 
            type="text" 
            icon={<CopyOutlined />} 
            onClick={onCopy}
            disabled={!hasSelectedNode}
          />
        </Tooltip>
        
        <Tooltip title="删除元件 (Delete)">
          <Button 
            type="text" 
            icon={<DeleteOutlined />} 
            onClick={onDelete}
            disabled={!hasSelectedNode}
            danger
          />
        </Tooltip>
        
        <Tooltip title="旋转元件 (Ctrl+R)">
          <Button 
            type="text" 
            icon={<RotateRightOutlined />} 
            onClick={onRotate}
            disabled={!hasSelectedNode}
          />
        </Tooltip>
      </div>
      
      <Divider type="vertical" className="h-6 mx-2" />
      
      {/* 视图操作 */}
      <div className="toolbar-group">
        <Tooltip title="放大视图">
          <Button 
            type="text" 
            icon={<ZoomInOutlined />} 
            onClick={onZoomIn}
          />
        </Tooltip>
        
        <Tooltip title="缩小视图">
          <Button 
            type="text" 
            icon={<ZoomOutOutlined />} 
            onClick={onZoomOut}
          />
        </Tooltip>
        
        <Tooltip title="适应画布">
          <Button 
            type="text" 
            icon={<BorderOutlined />} 
            onClick={onFitView}
          />
        </Tooltip>
        
        <Tooltip title="全屏模式">
          <Button 
            type="text" 
            icon={<FullscreenOutlined />} 
            onClick={onFullScreen}
          />
        </Tooltip>
      </div>
      
      <Divider type="vertical" className="h-6 mx-2" />
      
      {/* 分析操作 */}
      <div className="toolbar-group">
        <Popconfirm
          title="确认清除电路"
          description="此操作将清除所有元件和连接，不可恢复"
          onConfirm={onClearAll}
          okText="确认"
          cancelText="取消"
          disabled={!hasContent}
        >
          <Button 
            type="text" 
            danger
            icon={<ClearOutlined />} 
            disabled={!hasContent}
          >
            清除电路
          </Button>
        </Popconfirm>
        
        <Select
          value={selectedModel}
          onChange={onModelChange}
          options={modelOptions}
          className="min-w-[120px] ml-2"
          size="middle"
        />
        
        <Button 
          type="primary" 
          icon={<PlayCircleOutlined />}
          onClick={onAnalyze}
          loading={isAnalyzing}
          className="ml-2"
        >
          开始分析
        </Button>
      </div>
    </div>
  );
};

export default CircuitToolbar; 