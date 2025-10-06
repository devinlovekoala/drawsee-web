import { BaseNode, ExtendedNodeProps } from './base/BaseNode';
import React, { useMemo } from 'react';

const chatTypeMap: Record<string, string> = {
  'general': '常规问答',
  'knowledge': '知识问答',
  'animation': '动画生成',
  'solver-first': '解题模式',
  'planner': '目标解析',
  'html-maker': '网页生成',
  // 追加PDF电路相关模式的显示名称（来自后端AiTaskType）
  'PDF_CIRCUIT_ANALYSIS': 'PDF实验分析',
  'PDF_CIRCUIT_ANALYSIS_DETAIL': 'PDF分析详情',
  'PDF_CIRCUIT_DESIGN': '电路方案设计'
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
  // 处理显示文本，确保只显示用户的原始提问内容
  const cleanQueryText = useMemo(() => {
    if (!data.text) return '';
    
    // 处理包含引用的情况
    if (data.text.includes('对于之前内容中的：')) {
      const parts = data.text.split('\n\n');
      if (parts.length >= 3) {
        const lastPart = parts[parts.length - 1];
        if (lastPart.startsWith('我的问题是：')) {
          return lastPart.replace('我的问题是：', '').trim();
        }
      }
    }
    
    // 处理包含"我的问题是："的情况
    const questionMatch = data.text.match(/我的问题是：([\s\S]*)/);
    if (questionMatch && questionMatch[1]) {
      return questionMatch[1].trim();
    }
    
    // 移除可能的分析部分（通常在第一个双换行后出现）
    const firstParagraphMatch = data.text.split(/\n\n|\r\n\r\n/);
    if (firstParagraphMatch && firstParagraphMatch.length > 0) {
      return firstParagraphMatch[0].trim();
    }
    
    return data.text;
  }, [data.text]);

  // 使用useMemo缓存footerContent
  const footerContent = useMemo(() => {
    if (!data.mode) return <></>;
    const key = String(data.mode);
    const label = chatTypeMap[key] || chatTypeMap[key.toUpperCase()] || chatTypeMap[key.toLowerCase()];
    return (
      <span className="inline-flex items-center px-5 py-1 rounded-full font-medium bg-blue-100 text-blue-800">
        {label || key}
      </span>
    );
  }, [data.mode]);

  return (
    <BaseNode
      {...props}
      showSourceHandle={showSourceHandle}
      showTargetHandle={showTargetHandle}
      footerContent={footerContent}
      data={{
        ...data,
        text: cleanQueryText // 使用清理后的查询文本
      }}
    />
  );
}, arePropsEqual);

export default QueryNode; 