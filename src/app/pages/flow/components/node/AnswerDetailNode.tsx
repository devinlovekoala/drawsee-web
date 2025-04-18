import { BaseNode, ExtendedNodeProps } from './base/BaseNode';
import React, { useMemo } from 'react';

/**
 * 详细回答节点组件
 * 用于渲染ANSWER_DETAIL类型的节点，显示特定角度的详细解析
 */
function AnswerDetailNode({ data, ...props }: ExtendedNodeProps<'answer-detail' | 'ANSWER_DETAIL'>) {
  // 添加角度信息到标题
  const headerContent = useMemo(() => {
    if (data.angle) {
      return (
        <div className="angle-badge px-2 py-1 text-xs rounded-full bg-blue-100 text-blue-800 inline-flex items-center">
          <svg className="w-3 h-3 mr-1" fill="none" stroke="currentColor" viewBox="0 0 24 24" xmlns="http://www.w3.org/2000/svg">
            <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M13 16h-1v-4h-1m1-4h.01M21 12a9 9 0 11-18 0 9 9 0 0118 0z" />
          </svg>
          角度: {data.angle}
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