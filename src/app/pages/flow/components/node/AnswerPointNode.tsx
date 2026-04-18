import { BaseNode, ExtendedNodeProps } from './base/BaseNode';
import { useFlowContext } from '@/app/contexts/FlowContext';
import { CreateAiTaskDTO } from '@/api/types/flow.types';
import { toast } from 'sonner';
import { createAiTask } from '@/api/methods/flow.methods';
import { useState, useCallback, useRef, useEffect } from 'react';
import { useAppContext } from '@/app/contexts/AppContext';
import { ModelType } from '../input/FlowInputPanel';
import { ModelSelector } from '../../../blank/components/ModelSelector';
import { useLocation } from 'react-router-dom';
import { Check, X, Pencil } from 'lucide-react';
import { Position, NodeToolbar } from '@xyflow/react';

/**
 * 回答角度节点组件
 * 用于存储问题可能的不同回答角度，可点击"继续解析"按钮获取详细内容
 */
function AnswerPointNode({ data, ...props }: ExtendedNodeProps<'answer-point' | 'ANSWER_POINT'>) {
  const {chat, convId, isChatting, addChatTask} = useFlowContext();
  const {handleAiTaskCountPlus} = useAppContext();
  
  const location = useLocation();
  const classId = location.state?.classId as string || null;
  
  const [isGenerated, setIsGenerated] = useState(data.isGenerated || false);
  const initialModel = (data as { mode?: ModelType })?.mode;
  const [selectedModel, setSelectedModel] = useState<ModelType>(initialModel || 'deepseekV3'); // 默认使用DeepSeek模型
  const [isLoading, setIsLoading] = useState(false); // 添加加载状态
  const [isEditing, setIsEditing] = useState(false); // 添加编辑状态
  const [editedText, setEditedText] = useState(data.text || ''); // 编辑内容
  const [showEditDialog, setShowEditDialog] = useState(false); // 控制编辑对话框显示
  const textareaRef = useRef<HTMLTextAreaElement>(null);
  const nodeRef = useRef<HTMLDivElement>(null);

  // 编辑状态下，同步更新编辑内容
  useEffect(() => {
    if (!isEditing && !showEditDialog) {
      setEditedText(data.text || '');
    }
  }, [data.text, isEditing, showEditDialog]);
  
  // 监听父组件传入的状态变化
  useEffect(() => {
    // 同步外部状态到内部状态
    if (data.isGenerated !== undefined && typeof data.isGenerated === 'boolean') {
      setIsGenerated(data.isGenerated);
    }
    
    // 监听节点process状态变化
    if (data.process === 'completed' && !isGenerated) {
      console.log(`AnswerPointNode节点 ${props.id} 流程已完成，设置为已生成状态`);
      setIsGenerated(true);
    }
  }, [data.isGenerated, data.process, props.id, isGenerated]);

  // 处理模型变更
  const handleModelChange = useCallback((model: ModelType) => {
    setSelectedModel(model);
    addChatTask({
      type: 'data',
      data: {
        nodeId: parseInt(props.id),
        mode: model
      }
    });
  }, [addChatTask, props.id]);

  useEffect(() => {
    if (data.mode && data.mode !== selectedModel) {
      setSelectedModel(data.mode as ModelType);
    }
  }, [data.mode, selectedModel]);
  
  // 当进入编辑模式时，自动聚焦文本区域并调整其高度
  useEffect(() => {
    if ((isEditing || showEditDialog) && textareaRef.current) {
      textareaRef.current.focus();
      textareaRef.current.style.height = 'auto';
      textareaRef.current.style.height = `${textareaRef.current.scrollHeight}px`;
    }
  }, [isEditing, showEditDialog]);
  
  // 处理文本区域高度自适应
  const handleTextareaChange = (e: React.ChangeEvent<HTMLTextAreaElement>) => {
    setEditedText(e.target.value);
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
    if (editedText.trim() !== data.text) {
      // 这里我们通过addChatTask来更新节点数据
      addChatTask({
        type: 'data',
        data: {
          nodeId: parseInt(props.id),
          text: editedText.trim()
        }
      });
      
      // 显示成功提示
      toast.success('内容已更新');
    }
    
    // 退出编辑模式
    setIsEditing(false);
    setShowEditDialog(false);
  };

  const handleGeneralDetailChat = () => {
    if (isChatting) {
      toast.error('正在聊天中，请先完成当前对话');
      return;
    }
    if (isGenerated) {
      toast.error('已经生成，请勿重复生成');
      return;
    }
    
    setIsLoading(true); // 设置加载状态
    
    // 使用节点本身的文本内容作为问题，如果在编辑状态下，使用编辑后的内容
    const originalQuestion = editedText || data.text || "请完成以该角度为切入点对用户提问的回答";
    
    const createAiTaskDTO: CreateAiTaskDTO = {
      type: "GENERAL_DETAIL",
      prompt: originalQuestion,
      promptParams: null, // 修改为null以修复类型错误
      convId: convId,
      parentId: parseInt(props.id),
      model: selectedModel,
      classId: classId // 添加班级ID
    };
    
    console.log('发送通用详情AI任务', createAiTaskDTO);
    createAiTask(createAiTaskDTO).then((response) => {
      toast.success("问题已发送");
      handleAiTaskCountPlus();
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
      console.log('答案详情AI任务创建成功，taskId:', response.taskId, '节点ID:', props.id);
      console.log('即将启动AI任务流程，新创建的详情节点将自动选中');
      
      setTimeout(() => {
        console.log('开始获取答案详情流式响应，taskId:', response.taskId);
        chat(response.taskId);
        
        // 在启动流式响应后，立即通知需要自动选中对应的详情节点
        setTimeout(() => {
          // 通过全局事件通知需要自动选中对应的详情节点
          window.dispatchEvent(new CustomEvent('auto-select-detail-node', {
            detail: {
              parentNodeId: props.id,
              detailNodeType: 'answer-detail',
              detailNodeTypes: ['answer-detail', 'ANSWER_DETAIL'] // 支持多种类型
            }
          }));
        }, 300); // 减少延迟，更快速地触发自动选择
      }, 100); // 减少初始延迟
    }).catch(error => {
      console.error('通用详情AI任务失败', error);
      toast.error(error.response?.data?.message || error.message || "创建任务失败，请重试");
      setIsGenerated(false); // 任务失败时重置状态
      
      // 更新节点状态为失败状态
      addChatTask({
        type: 'data',
        data: {
          nodeId: parseInt(props.id),
          isGenerated: false,
          process: 'failed' // 标记为失败状态
        }
      });
    }).finally(() => {
      setIsLoading(false); // 请求完成后重置加载状态
    });
  }

  // 模型选择器内容
  const modelSelector = (
    <div className="mt-2 mb-3">
      <div className="w-full">
        <ModelSelector
          selectedModel={selectedModel}
          onModelChange={handleModelChange}
        />
      </div>
    </div>
  );
  
  // 编辑器组件
  const editor = (
    <div className="mt-2 mb-3">
      <textarea
        ref={textareaRef}
        value={editedText}
        onChange={handleTextareaChange}
        className="w-full p-3 rounded-md border border-blue-300 focus:border-blue-500 focus:ring-2 focus:ring-blue-500 min-h-[120px] resize-none"
        placeholder="编辑此回答角度的内容..."
      />
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
            <h3 className="text-lg font-medium text-gray-900">编辑回答角度内容</h3>
            <button onClick={() => setShowEditDialog(false)} className="text-gray-400 hover:text-gray-500">
              <X size={20} />
            </button>
          </div>
          <div className="mb-4">
            <textarea
              ref={textareaRef}
              value={editedText}
              onChange={handleTextareaChange}
              className="w-full p-3 rounded-md border border-gray-300 focus:border-blue-500 focus:ring-2 focus:ring-blue-500 min-h-[200px] resize-none"
              placeholder="编辑此回答角度的内容..."
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
          data={{
            ...data,
            customContent: isEditing ? editor : (
              <>
                {!isGenerated && modelSelector}
              </>
            )
          }}
          footerContent={
            <button
              onClick={handleGeneralDetailChat}
              disabled={!!(
                (isGenerated && data.process === 'completed') || 
                isLoading || 
                isChatting || 
                isEditing || 
                showEditDialog ||
                data.process === 'generating'
              )}
              className={`px-6 py-2.5 font-medium rounded transition-colors ${
                (isGenerated && data.process === 'completed')
                  ? 'bg-green-500 text-white cursor-not-allowed'
                  : isLoading
                    ? 'bg-gray-500 text-white cursor-wait'
                    : data.process === 'generating'
                      ? 'bg-blue-400 text-white cursor-wait'
                      : isEditing || showEditDialog
                        ? 'bg-gray-400 text-white cursor-not-allowed'
                        : data.process === 'failed'
                          ? 'bg-red-500 text-white hover:bg-red-600'
                          : 'bg-blue-500 text-white hover:bg-blue-600'
              }`}
            >
              {(() => {
                if (isGenerated && data.process === 'completed') {
                  return '已完成';
                } else if (isLoading) {
                  return '解析中...';
                } else if (data.process === 'generating') {
                  return '生成中...';
                } else if (isEditing || showEditDialog) {
                  return '正在编辑...';
                } else if (data.process === 'failed') {
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

export default AnswerPointNode;
