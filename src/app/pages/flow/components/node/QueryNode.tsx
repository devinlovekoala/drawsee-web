import { AiTaskType } from '@/api/types/flow.types';
import { BaseNode, ExtendedNodeProps } from './base/BaseNode';
import React, { useMemo } from 'react';

const chatTypeMap: Record<AiTaskType, string> = {
  'general': '常规问答',
  'knowledge': '知识问答',
  'knowledge-detail': '知识详情',
  'animation': '动画生成',
};

/**
 * 自定义比较函数，用于React.memo
 * 只有当关键属性发生变化时才重新渲染
 */
function arePropsEqual(
  prevProps: ExtendedNodeProps<'query'>,
  nextProps: ExtendedNodeProps<'query'>
): boolean {
  // 检查选中状态变化
  if (prevProps.selected !== nextProps.selected) return false;
  
  // 检查数据变化
  const prevData = prevProps.data;
  const nextData = nextProps.data;
  
  // 检查关键属性
  if (prevData.title !== nextData.title) return false;
  if (prevData.text !== nextData.text) return false;
  if (prevData.updatedAt !== nextData.updatedAt) return false;
  if (prevData.mode !== nextData.mode) return false;
  
  // 检查句柄显示状态
  if (prevProps.showSourceHandle !== nextProps.showSourceHandle) return false;
  if (prevProps.showTargetHandle !== nextProps.showTargetHandle) return false;
  
  // 其他属性变化不重要，返回true表示不需要重新渲染
  return true;
}

// 使用React.memo包装QueryNode组件，避免不必要的重新渲染
const QueryNode = React.memo(function QueryNode({
  data,
  showSourceHandle, 
  showTargetHandle, 
  ...props 
}: ExtendedNodeProps<'query'>) {
  // 使用useMemo缓存footerContent
  const footerContent = useMemo(() => (
    data.mode ? <span className="inline-flex items-center px-5 py-1 rounded-full font-medium bg-blue-100 text-blue-800">
      {chatTypeMap[data.mode]}
    </span> : <></>
  ), [data.mode]);

  return (
    <BaseNode
      {...props}
      showSourceHandle={showSourceHandle}
      showTargetHandle={showTargetHandle}
      footerContent={footerContent}
      data={data}
    />
  );
}, arePropsEqual);

export default QueryNode; 