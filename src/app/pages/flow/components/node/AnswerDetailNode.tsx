import { BaseNode, ExtendedNodeProps } from './base/BaseNode';
import { useMemo, useEffect } from 'react';
import { useFlowContext } from '@/app/contexts/FlowContext';

/**
 * 详细回答节点组件
 * 用于渲染ANSWER_DETAIL类型的节点，显示特定角度的详细解析
 */
function AnswerDetailNode({ data, ...props }: ExtendedNodeProps<'answer-detail' | 'ANSWER_DETAIL'>) {
  const { addChatTask } = useFlowContext();
  
  // 组件挂载时的初始化逻辑
  useEffect(() => {
    console.log('AnswerDetailNode组件挂载，信息：', {
      id: props.id,
      type: props.type,
      data: data
    });
    
    // 如果有父节点ID，更新父节点的isGenerated状态
    if (data.parentId) {
      const parentId = typeof data.parentId === 'number' ? data.parentId : parseInt(String(data.parentId));
      console.log('AnswerDetailNode更新父节点状态:', parentId);
      
      // 立即更新父节点状态，减少延迟
      addChatTask({
        type: 'data',
        data: {
          nodeId: parentId,
          isGenerated: true,
          process: 'completed' // 明确设置为已完成状态
        }
      });
    }
    // 只在组件挂载时执行一次
  }, [props.id, data.parentId, addChatTask]);
  
  // 添加角度信息到标题
  const headerContent = useMemo(() => {
    if (data.angle) {
      return (
        <div className="angle-badge px-2 py-1 text-xs rounded-full bg-blue-100 text-blue-800 inline-flex items-center">
          <svg className="w-3 h-3 mr-1" fill="none" stroke="currentColor" viewBox="0 0 24 24" xmlns="http://www.w3.org/2000/svg">
            <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M13 16h-1v-4h-1m1-4h.01M21 12a9 9 0 11-18 0 9 9 0 0118 0z" />
          </svg>
          角度: {String(data.angle)}
        </div>
      );
    }
    return undefined;
  }, [data.angle]);

  // 详细回答节点的渲染，增强UI显示
  return (
    <BaseNode
      {...props}
      data={data}
      headerContent={headerContent}
    />
  );
}

export default AnswerDetailNode; 