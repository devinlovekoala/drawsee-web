import { BaseNode, ExtendedNodeProps } from './base/BaseNode';
import { useFlowContext } from '@/app/contexts/FlowContext';
import { CreateAiTaskDTO } from '@/api/types/flow.types';
import { toast } from 'sonner';
import { createAiTask } from '@/api/methods/flow.methods';
import { useState, useCallback, useMemo, useRef, useEffect } from 'react';
import { useAppContext } from '@/app/contexts/AppContext';
import { ModelType } from '../input/FlowInputPanel';
import { ModelSelector } from '@/app/pages/blank/components/ModelSelector';
import { CircuitPointData } from './types/circuitNode.types';
import { useLocation } from 'react-router-dom';
import { Check, X, Pencil } from 'lucide-react';
import { Position, NodeToolbar } from '@xyflow/react';

/**
 * 电路分析点节点组件
 * 用于存储电路分析的不同角度或重点，可点击"继续解析"按钮获取详细内容
 */
function CircuitPointNode({ data, ...props }: ExtendedNodeProps<'circuit-point'>) {
  const {chat, convId, isChatting, addChatTask} = useFlowContext();
  const {handleAiTaskCountPlus} = useAppContext();
  
  const location = useLocation();
  const classId = location.state?.classId as string || null;
  
  const nodeData = data as unknown as CircuitPointData;
  const [isGenerated, setIsGenerated] = useState(nodeData.isGenerated || false);
  const [selectedModel, setSelectedModel] = useState<ModelType>('deepseekV3'); // 默认使用DeepSeekV3模型
  const [isLoading, setIsLoading] = useState(false); // 添加加载状态
  const [isEditing, setIsEditing] = useState(false); // 添加编辑状态
  const [editedText, setEditedText] = useState(nodeData.text || ''); // 编辑内容
  const [editedPointDescription, setEditedPointDescription] = useState(nodeData.pointDescription || ''); // 编辑描述内容
  const [showEditDialog, setShowEditDialog] = useState(false); // 控制编辑对话框显示
  const textareaRef = useRef<HTMLTextAreaElement>(null);
  const descriptionTextareaRef = useRef<HTMLTextAreaElement>(null);
  const nodeRef = useRef<HTMLDivElement>(null);

  // 监听父组件传入的isGenerated状态变化
  useEffect(() => {
    // 同步外部状态到内部状态
    if (nodeData.isGenerated !== undefined) {
      setIsGenerated(nodeData.isGenerated);
    }
    
    // 监听节点process状态变化
    if (nodeData.process === 'completed') {
      console.log(`节点 ${props.id} 流程已完成，设置为已生成状态`);
      setIsGenerated(true);
    }
    
    // 如果有isGenerated为true，也设置内部状态
    if (nodeData.isGenerated === true) {
      console.log(`节点 ${props.id} 已标记为已生成，更新内部状态`);
      setIsGenerated(true);
    }
  }, [nodeData.isGenerated, nodeData.process, props.id]);

  // 编辑状态下，同步更新编辑内容
  useEffect(() => {
    if (!isEditing && !showEditDialog) {
      setEditedText(nodeData.text || '');
      setEditedPointDescription(nodeData.pointDescription || '');
    }
  }, [nodeData.text, nodeData.pointDescription, isEditing, showEditDialog]);

  // 处理模型变更
  const handleModelChange = useCallback((model: ModelType) => {
    setSelectedModel(model);
  }, []);
  
  // 当进入编辑模式时，自动聚焦文本区域并调整其高度
  useEffect(() => {
    if ((isEditing || showEditDialog) && textareaRef.current) {
      textareaRef.current.focus();
      textareaRef.current.style.height = 'auto';
      textareaRef.current.style.height = `${textareaRef.current.scrollHeight}px`;
      
      if (descriptionTextareaRef.current) {
        descriptionTextareaRef.current.style.height = 'auto';
        descriptionTextareaRef.current.style.height = `${descriptionTextareaRef.current.scrollHeight}px`;
      }
    }
  }, [isEditing, showEditDialog]);
  
  // 处理文本区域高度自适应
  const handleTextareaChange = (e: React.ChangeEvent<HTMLTextAreaElement>) => {
    setEditedText(e.target.value);
    e.target.style.height = 'auto';
    e.target.style.height = `${e.target.scrollHeight}px`;
  };
  
  // 处理描述文本区域高度自适应
  const handleDescriptionTextareaChange = (e: React.ChangeEvent<HTMLTextAreaElement>) => {
    setEditedPointDescription(e.target.value);
    e.target.style.height = 'auto';
    e.target.style.height = `${e.target.scrollHeight}px`;
  };
  
  // 点击编辑按钮打开编辑对话框
  const handleEditClick = useCallback(() => {
    if (!isLoading && !isChatting) {
      setShowEditDialog(true);
    }
  }, [isLoading, isChatting]);
  
  // 确认编辑，将修改后的内容保存
  const handleSaveEdit = () => {
    // 只有当内容有变化时才进行更新
    const textChanged = editedText.trim() !== nodeData.text;
    const descriptionChanged = editedPointDescription.trim() !== nodeData.pointDescription;
    
    if (textChanged || descriptionChanged) {
      // 通过addChatTask来更新节点数据
      addChatTask({
        type: 'data',
        data: {
          nodeId: parseInt(props.id),
          text: editedText.trim(),
          pointDescription: editedPointDescription.trim()
        }
      });
      
      // 显示成功提示
      toast.success('内容已更新');
    }
    
    // 退出编辑模式
    setIsEditing(false);
    setShowEditDialog(false);
  };
  
  // 添加点类型标签
  const headerContent = useMemo(() => {
    if (nodeData.pointType) {
      return (
        <div className="point-type-badge px-2 py-1 text-xs rounded-full bg-blue-100 text-blue-800 inline-flex items-center">
          <svg className="w-3 h-3 mr-1" fill="none" stroke="currentColor" viewBox="0 0 24 24" xmlns="http://www.w3.org/2000/svg">
            <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M9 12l2 2 4-4m6 2a9 9 0 11-18 0 9 9 0 0118 0z" />
          </svg>
          {nodeData.pointType}
        </div>
      );
    }
    return undefined;
  }, [nodeData.pointType]);
  
  // 添加点描述内容
  const pointDescriptionContent = useMemo(() => {
    // 如果在编辑模式，不显示描述内容
    if (isEditing) return undefined;
    
    // 优先显示 pointDescription
    if (nodeData.pointDescription) {
      return (
        <div className="point-description mt-2 text-sm text-gray-700">
          {nodeData.pointDescription}
        </div>
      );
    }
    
    // 如果没有 pointDescription，则显示节点 text 内容
    if (nodeData.text) {
      return (
        <div className="point-description mt-2 text-sm text-gray-700">
          {nodeData.text}
        </div>
      );
    }
    
    return undefined;
  }, [nodeData.pointDescription, nodeData.text, isEditing]);

  // 处理电路详情生成
  const handleCircuitDetailGeneration = () => {
    // 再次检查聊天状态，确保可以继续
    if (isChatting) {
      toast.error('正在聊天中，请先完成当前对话');
      return;
    }
    
    if (isGenerated) {
      toast.error('已经生成，请勿重复生成');
      return;
    }
    
    setIsLoading(true); // 设置加载状态
    
    const createAiTaskDTO: CreateAiTaskDTO = {
      type: "CIRCUIT_DETAIL",
      prompt: nodeData.text || "请对该电路分析点进行详细解析",
      promptParams: null, // 修改为null以符合API类型规范
      convId: convId,
      parentId: parseInt(props.id),
      model: selectedModel,
      classId: classId // 添加班级ID
    };
    
    console.log('发送电路详情AI任务', createAiTaskDTO);
    createAiTask(createAiTaskDTO).then((response) => {
      toast.success("电路分析已发送");
      handleAiTaskCountPlus();
      
      // 先在本地更新节点状态，避免重复请求
      setIsGenerated(false); // 先设为false，因为详情还在生成中
      
      // 立即更新节点数据以标记为生成中状态
      addChatTask({
        type: 'data',
        data: {
          nodeId: parseInt(props.id),
          isGenerated: false, // 暂时设为false，因为详情还在生成中
          process: 'generating' // 明确标记为生成中
        }
      });
      
      // 打印调试信息
      console.log('电路详情AI任务创建成功，taskId:', response.taskId, '节点ID:', props.id);
      console.log('即将启动AI任务流程，新创建的详情节点将自动选中');
      
      // 减少延迟时间，与AnswerPointNode保持一致
      setTimeout(() => {
        console.log('开始获取电路详情流式响应，taskId:', response.taskId);
        chat(response.taskId);
        
        // 在启动流式响应后，延迟一段时间自动切换到详情节点
        setTimeout(() => {
          // 通过全局事件通知需要自动选中对应的详情节点
          window.dispatchEvent(new CustomEvent('auto-select-detail-node', {
            detail: {
              parentNodeId: props.id,
              detailNodeType: 'circuit-detail'
            }
          }));
        }, 800); // 给一点时间让节点创建
      }, 200);
    }).catch(error => {
      console.error('电路详情AI任务失败', error);
      // 重置生成状态
      setIsGenerated(false);
      
      // 更新节点状态为失败状态
      addChatTask({
        type: 'data',
        data: {
          nodeId: parseInt(props.id),
          isGenerated: false,
          process: 'failed' // 标记为失败状态
        }
      });
      
      toast.error(error.response?.data?.message || error.message || "创建任务失败，请重试");
    }).finally(() => {
      setIsLoading(false); // 请求完成后重置加载状态
    });
  }
  
  // 编辑器组件
  const editor = (
    <div className="mt-2 mb-3">
      <div className="mb-3">
        <label className="block text-sm font-medium text-gray-700 mb-1">主要内容</label>
        <textarea
          ref={textareaRef}
          value={editedText}
          onChange={handleTextareaChange}
          className="w-full p-3 rounded-md border border-blue-300 focus:border-blue-500 focus:ring-2 focus:ring-blue-500 min-h-[80px] resize-none"
          placeholder="编辑此电路分析点的主要内容..."
        />
      </div>
      <div className="mb-3">
        <label className="block text-sm font-medium text-gray-700 mb-1">描述内容（可选）</label>
        <textarea
          ref={descriptionTextareaRef}
          value={editedPointDescription}
          onChange={handleDescriptionTextareaChange}
          className="w-full p-3 rounded-md border border-blue-300 focus:border-blue-500 focus:ring-2 focus:ring-blue-500 min-h-[80px] resize-none"
          placeholder="添加更详细的描述内容（可选）..."
        />
      </div>
      <div className="flex justify-end mt-2 space-x-2">
        <button 
          onClick={() => setIsEditing(false)} 
          className="p-1.5 rounded-md bg-gray-200 hover:bg-gray-300 text-gray-800 flex items-center px-3"
          title="取消编辑"
        >
          <X size={18} className="mr-1" />
          <span>取消</span>
        </button>
        <button 
          onClick={handleSaveEdit} 
          className="p-1.5 rounded-md bg-green-500 hover:bg-green-600 text-white flex items-center px-3"
          title="保存编辑"
        >
          <Check size={18} className="mr-1" />
          <span>保存</span>
        </button>
      </div>
    </div>
  );
  
  // 悬浮编辑对话框
  const renderEditDialog = () => {
    if (!showEditDialog) return null;
    
    return (
      <div className="fixed inset-0 bg-black bg-opacity-30 flex items-center justify-center z-50" onClick={() => setShowEditDialog(false)}>
        <div className="bg-white rounded-lg shadow-xl p-4 max-w-2xl w-full mx-4" onClick={e => e.stopPropagation()}>
          <div className="flex justify-between items-center mb-4">
            <h3 className="text-lg font-medium text-gray-900">编辑电路分析点内容</h3>
            <button onClick={() => setShowEditDialog(false)} className="text-gray-400 hover:text-gray-500">
              <X size={20} />
            </button>
          </div>
          <div className="mb-4">
            <label className="block text-sm font-medium text-gray-700 mb-1">主要内容</label>
            <textarea
              ref={textareaRef}
              value={editedText}
              onChange={handleTextareaChange}
              className="w-full p-3 rounded-md border border-gray-300 focus:border-blue-500 focus:ring-2 focus:ring-blue-500 min-h-[120px] resize-none"
              placeholder="编辑此电路分析点的主要内容..."
            />
          </div>
          <div className="mb-4">
            <label className="block text-sm font-medium text-gray-700 mb-1">描述内容（可选）</label>
            <textarea
              ref={descriptionTextareaRef}
              value={editedPointDescription}
              onChange={handleDescriptionTextareaChange}
              className="w-full p-3 rounded-md border border-gray-300 focus:border-blue-500 focus:ring-2 focus:ring-blue-500 min-h-[120px] resize-none"
              placeholder="添加更详细的描述内容（可选）..."
            />
          </div>
          <div className="flex justify-end gap-2">
            <button 
              onClick={() => setShowEditDialog(false)} 
              className="px-4 py-2 rounded-md bg-gray-200 hover:bg-gray-300 text-gray-800 flex items-center"
            >
              <X size={18} className="mr-1" />
              <span>取消</span>
            </button>
            <button 
              onClick={handleSaveEdit} 
              className="px-4 py-2 rounded-md bg-green-500 hover:bg-green-600 text-white flex items-center"
            >
              <Check size={18} className="mr-1" />
              <span>保存</span>
            </button>
          </div>
        </div>
      </div>
    );
  };

  return (
    <>
      <div ref={nodeRef}>
        <BaseNode
          {...props}
          data={nodeData}
          headerContent={headerContent}
          customContent={
            isEditing ? editor : (
              <>
                {pointDescriptionContent}
                {!isGenerated && (
                  <div className="mt-2 mb-3">
                    <div className="w-full">
                      <ModelSelector
                        selectedModel={selectedModel}
                        onModelChange={handleModelChange}
                      />
                    </div>
                  </div>
                )}
              </>
            )
          }
          footerContent={
            <button
              onClick={handleCircuitDetailGeneration}
              disabled={!!(
                (isGenerated && nodeData.process === 'completed') || 
                isLoading || 
                isChatting || 
                isEditing || 
                showEditDialog ||
                nodeData.process === 'generating'
              )}
              className={`px-6 py-2.5 font-medium rounded transition-colors ${
                (isGenerated && nodeData.process === 'completed')
                  ? 'bg-green-500 text-white cursor-not-allowed'
                  : isLoading
                    ? 'bg-gray-500 text-white cursor-wait'
                    : nodeData.process === 'generating'
                      ? 'bg-blue-400 text-white cursor-wait'
                      : isEditing || showEditDialog
                        ? 'bg-gray-400 text-white cursor-not-allowed'
                        : nodeData.process === 'failed'
                          ? 'bg-red-500 text-white hover:bg-red-600'
                          : 'bg-blue-500 text-white hover:bg-blue-600'
              }`}
            >
              {(() => {
                if (isGenerated && nodeData.process === 'completed') {
                  return '已完成';
                } else if (isLoading) {
                  return '解析中...';
                } else if (nodeData.process === 'generating') {
                  return '生成中...';
                } else if (isEditing || showEditDialog) {
                  return '正在编辑...';
                } else if (nodeData.process === 'failed') {
                  return '重新解析';
                } else {
                  return '继续解析';
                }
              })()}
            </button>
          }
        />
      </div>
      
      {/* 添加编辑按钮到工具栏 */}
      <NodeToolbar position={Position.Top} align={'end'} >
        <div className="flex items-center gap-2">
          <button 
            onClick={handleEditClick} 
            className="p-2 bg-blue-50 rounded-lg text-blue-600 hover:bg-blue-100 active:bg-blue-200 transition-colors duration-200"
            title="编辑节点内容"
            disabled={isLoading || isChatting}
          >
            <Pencil size={20} />
          </button>
        </div>
      </NodeToolbar>
      
      {/* 渲染悬浮编辑对话框 */}
      {renderEditDialog()}
    </>
  );
}

export default CircuitPointNode; 