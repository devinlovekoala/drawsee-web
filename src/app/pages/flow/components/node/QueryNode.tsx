import { BaseNode, ExtendedNodeProps } from './base/BaseNode';
import React, { useMemo } from 'react';
import { Button } from 'antd';
import { FileTextOutlined, EyeOutlined } from '@ant-design/icons';
import { extractFileNameFromUrl, isHttpUrl } from '@/app/pages/flow/utils/document';
import { isCircuitDiagramIntent } from '@/app/pages/flow/utils/circuitIntent';

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
  if (prevData.qaAnswerText !== nextData.qaAnswerText) return false;
  if (prevData.qaAnswerNodeId !== nextData.qaAnswerNodeId) return false;
  if (prevData.circuitCanvasNodeId !== nextData.circuitCanvasNodeId) return false;
  if (prevData.circuitDesign !== nextData.circuitDesign) return false;
  if (prevData.process !== nextData.process) return false;
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
  // 检测是否为PDF相关查询
  const isPdfQuery = useMemo(() => {
    const mode = String(data.mode || '').toUpperCase();
    return mode === 'PDF_CIRCUIT_ANALYSIS' ||
           mode === 'PDF_CIRCUIT_DESIGN' ||
           mode === 'PDF_CIRCUIT_ANALYSIS_DETAIL';
  }, [data.mode]);

  // 检测text是否为URL
  const isPdfUrl = useMemo(() => isHttpUrl(data.text), [data.text]);

  // 从URL中提取文件名
  const extractFileName = useMemo(() => {
    if (!isPdfUrl || !data.text) return 'PDF实验文档';
    return extractFileNameFromUrl(String(data.text));
  }, [isPdfUrl, data.text]);

  // 预览PDF
  const handlePreview = useMemo(() => {
    return () => {
      if (data.text && typeof data.text === 'string') {
        window.open(data.text, '_blank');
      }
    };
  }, [data.text]);

  // 如果是PDF查询且text是URL，显示为文档卡片
  const customContent = useMemo(() => {
    if (isPdfQuery && isPdfUrl) {
      return (
        <div className="space-y-3">
          {/* 文档标题行 */}
          <div className="flex items-start mb-3">
            <div className="flex-shrink-0 w-10 h-10 bg-indigo-100 rounded-lg flex items-center justify-center mr-3">
              <FileTextOutlined className="text-indigo-600 text-xl" />
            </div>
            <div className="flex-1 min-w-0">
              <h3 className="font-semibold text-base text-gray-800 truncate" title={extractFileName}>
                {extractFileName}
              </h3>
              <p className="text-xs text-gray-500 mt-0.5">PDF实验文档</p>
            </div>
          </div>

          {/* 文档信息卡片 */}
          <div className="p-3 bg-gradient-to-br from-indigo-50 to-blue-50 rounded-lg border border-indigo-100">
            <div className="flex items-start">
              <span className="text-lg mr-2">📋</span>
              <div className="flex-1">
                <div className="text-sm text-indigo-900 font-medium mb-1">
                  实验任务文档
                </div>
                <div className="text-xs text-gray-600 leading-relaxed">
                  包含实验要求、设计规范和技术参数
                </div>
              </div>
            </div>
          </div>

          {/* 预览按钮 */}
          <Button
            size="small"
            icon={<EyeOutlined />}
            onClick={handlePreview}
            type="primary"
            block
            className="mt-2"
          >
            打开预览
          </Button>
        </div>
      );
    }
    return null;
  }, [isPdfQuery, isPdfUrl, extractFileName, handlePreview]);

  // 处理显示文本，确保只显示用户的原始提问内容
  const cleanQueryText = useMemo(() => {
    // 如果是PDF查询且有自定义内容，不需要显示text
    if (isPdfQuery && isPdfUrl) {
      return '';
    }

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
  }, [data.text, isPdfQuery, isPdfUrl]);

  // 使用useMemo缓存footerContent
  const footerContent = useMemo(() => {
    const key = String(data.mode);
    const label = chatTypeMap[key] || chatTypeMap[key.toUpperCase()] || chatTypeMap[key.toLowerCase()];
    const hasCircuitCanvas = Boolean((data as Record<string, unknown>).circuitCanvasNodeId || (data as Record<string, unknown>).circuitDesign);
    const isWaitingForCircuitCanvas = !hasCircuitCanvas &&
      data.process === 'generating' &&
      isCircuitDiagramIntent(data.text, data.qaAnswerText, data.title);
    if (!data.mode && !hasCircuitCanvas && !isWaitingForCircuitCanvas) return <></>;
    return (
      <div className="flex items-center justify-center gap-2">
        {data.mode && (
          <span className="inline-flex items-center px-5 py-1 rounded-full font-medium bg-blue-100 text-blue-800">
            {label || key}
          </span>
        )}
        {hasCircuitCanvas && (
          <span className="inline-flex items-center px-4 py-1 rounded-full font-medium bg-pink-100 text-pink-700">
            电路图
          </span>
        )}
        {isWaitingForCircuitCanvas && (
          <span className="inline-flex items-center px-4 py-1 rounded-full font-medium bg-blue-100 text-blue-700">
            <span className="mr-1 h-2 w-2 rounded-full bg-blue-500 animate-pulse" />
            生成电路图中
          </span>
        )}
      </div>
    );
  }, [data]);

  return (
    <BaseNode
      {...props}
      showSourceHandle={showSourceHandle}
      showTargetHandle={showTargetHandle}
      footerContent={footerContent}
      customContent={customContent}
      data={{
        ...data,
        text: cleanQueryText // 使用清理后的查询文本
      }}
    />
  );
}, arePropsEqual);

export default QueryNode; 
