import { Handle, Position, NodeProps, useReactFlow, NodeToolbar } from '@xyflow/react';
import { NodeType } from '@/api/types/flow.types';
import { format } from 'date-fns';
import type { NodeData } from '../types/node.types';
import { NODE_MIN_HEIGHT, NODE_DEFAULT_HEIGHT, NODE_WIDTH, COMPACT_NODE_WIDTH, COMPACT_NODE_HEIGHT } from '../../../constants';
import MarkdownWithLatex from '../../markdown/MarkdownWithLatex';
import React, { useMemo, useState, useEffect, useCallback, useRef } from 'react';
import { useAppContext } from '@/app/contexts/AppContext';
import CopyButton from '../../button/CopyButton';
import DownloadImgButton from '../../button/DownloadImgButton';
import { Trash2 } from 'lucide-react';

// 缩放阈值常量 - 调整为更高的阈值，让更多情况下显示大标题
const ZOOM_THRESHOLD = 0.55; // 从0.40提高到0.55，让更多缩放级别下显示醒目标题
const ZOOM_CHECK_INTERVAL = 200; // 检查缩放级别的间隔(ms)
const MIN_PREVIEW_FONT_SIZE = 3.0; // 最小预览文本字体大小(rem) - 增大基础字体
const MAX_PREVIEW_FONT_SIZE = 8; // 最大预览文本字体大小(rem) - 增大最大字体

// 节点类型的视觉配置
const NODE_TYPE_STYLES: Record<string, { bgColor: string; textColor: string; borderColor: string; label: string }> = {
  'query': { bgColor: 'bg-purple-50', textColor: 'text-purple-700', borderColor: 'border-purple-200', label: '提问' },
  'answer': { bgColor: 'bg-green-50', textColor: 'text-green-700', borderColor: 'border-green-200', label: 'AI回答' },
  'answer-point': { bgColor: 'bg-blue-50', textColor: 'text-blue-700', borderColor: 'border-blue-200', label: '回答角度' },
  'ANSWER_POINT': { bgColor: 'bg-blue-50', textColor: 'text-blue-700', borderColor: 'border-blue-200', label: '回答角度' },
  'answer-detail': { bgColor: 'bg-cyan-50', textColor: 'text-cyan-700', borderColor: 'border-cyan-200', label: '详细解析' },
  'ANSWER_DETAIL': { bgColor: 'bg-cyan-50', textColor: 'text-cyan-700', borderColor: 'border-cyan-200', label: '详细解析' },
  'knowledge-head': { bgColor: 'bg-amber-50', textColor: 'text-amber-700', borderColor: 'border-amber-200', label: '知识点' },
  'knowledge-detail': { bgColor: 'bg-orange-50', textColor: 'text-orange-700', borderColor: 'border-orange-200', label: '知识详情' },
  'circuit-canvas': { bgColor: 'bg-pink-50', textColor: 'text-pink-700', borderColor: 'border-pink-200', label: '电路画布' },
  'circuit-analyze': { bgColor: 'bg-rose-50', textColor: 'text-rose-700', borderColor: 'border-rose-200', label: '电路分析' },
  'circuit-detail': { bgColor: 'bg-red-50', textColor: 'text-red-700', borderColor: 'border-red-200', label: '电路详情' },
  'PDF_DOCUMENT': { bgColor: 'bg-indigo-50', textColor: 'text-indigo-700', borderColor: 'border-indigo-200', label: 'PDF文档' },
  'PDF_ANALYSIS_POINT': { bgColor: 'bg-violet-50', textColor: 'text-violet-700', borderColor: 'border-violet-200', label: 'PDF分点' },
  'PDF_ANALYSIS_DETAIL': { bgColor: 'bg-fuchsia-50', textColor: 'text-fuchsia-700', borderColor: 'border-fuchsia-200', label: 'PDF详情' },
  'root': { bgColor: 'bg-gray-50', textColor: 'text-gray-700', borderColor: 'border-gray-200', label: '根节点' },
  'resource': { bgColor: 'bg-teal-50', textColor: 'text-teal-700', borderColor: 'border-teal-200', label: '资源' },
};

// 扩展 NodeProps 的接口
export interface ExtendedNodeProps<T extends NodeType> extends Omit<NodeProps, 'data'> {
  data: NodeData<T>;
  headerContent?: React.ReactNode;
  footerContent?: React.ReactNode;
  customContent?: React.ReactNode;
  showSourceHandle?: boolean;
  showTargetHandle?: boolean;
  compactMode?: boolean; // 新增紧凑模式属性
}

// 全局节点渲染缓存
const nodeContentCache: Record<string, React.ReactNode> = {};

// 从文本中提取第一句话作为预览内容
function extractPreview(text?: string): string {
  if (!text) return '';
  
  // 移除所有LaTeX公式和代码块
  const cleanText = text
    .replace(/\$\$([\s\S]*?)\$\$/g, '')
    .replace(/\$(.*?)\$/g, '')
    .replace(/```[\s\S]*?```/g, '')
    .replace(/#{1,6}\s+/g, '')      // 移除标题标记
    .replace(/\*\*/g, '')           // 移除粗体标记
    .replace(/\*/g, '')             // 移除斜体标记
    .trim();

  // 获取更有意义的预览内容
  // 1. 首先尝试获取第一个完整句子（以。！？.!?结尾）
  const sentenceMatch = cleanText.match(/^[^。！？.!?]+[。！？.!?]/);
  if (sentenceMatch) {
    const firstSentence = sentenceMatch[0].trim();
    // 如果第一句话太长，截取前25个字
    return firstSentence.length > 25 ? firstSentence.substring(0, 25) + '...' : firstSentence;
  }
  
  // 2. 如果没有找到明显的句子，尝试截取前两个短语（以逗号、分号等分隔）
  const phraseMatch = cleanText.match(/^[^，；,;]+[，；,;][^，；,;]+/);
  if (phraseMatch) {
    const phrases = phraseMatch[0].trim();
    return phrases.length > 25 ? phrases.substring(0, 25) + '...' : phrases;
  }
  
  // 3. 如果上述都未找到，直接返回前25个字
  return cleanText.length > 25 ? cleanText.substring(0, 25) + '...' : cleanText;
}

/**
 * 自定义比较函数，用于React.memo
 * 只有当关键属性发生变化时才重新渲染
 */
function arePropsEqual<T extends NodeType>(
  prevProps: ExtendedNodeProps<T>,
  nextProps: ExtendedNodeProps<T>
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
  if (prevData.height !== nextData.height) return false;
  if (prevData.mode !== nextData.mode) return false;
  if (prevData.process !== nextData.process) return false;
  if (prevData.frame !== nextData.frame) return false;
  if (prevData.objectName !== nextData.objectName) return false;
  if (prevData.objectNames !== nextData.objectNames) return false;
  if (prevData.urls !== nextData.urls) return false;

  // 检查自定义内容
  if (prevProps.customContent !== nextProps.customContent) return false;
  if (prevProps.headerContent !== nextProps.headerContent) return false;
  if (prevProps.footerContent !== nextProps.footerContent) return false;
  
  // 检查句柄显示状态
  if (prevProps.showSourceHandle !== nextProps.showSourceHandle) return false;
  if (prevProps.showTargetHandle !== nextProps.showTargetHandle) return false;
  
  // 其他属性变化不重要，返回true表示不需要重新渲染
  return true;
}

// 使用React.memo包装BaseNode组件，避免不必要的重新渲染
export const BaseNode = React.memo(function BaseNode<T extends NodeType>({
  id,
  data,
  type,
  headerContent,
  footerContent,
  customContent,
  showSourceHandle = true,
  showTargetHandle = true,
  selected,
  compactMode = false, // 新增紧凑模式参数
}: ExtendedNodeProps<T>) {
  const nodeData = data as {
    title: string;
    createdAt: number;
    text?: string;
    height?: number;
    [key: string]: unknown;
  };
  const { getViewport } = useReactFlow();
  const { nodeWidth, openDeleteNodeDialog } = useAppContext();
  const nodeRef = useRef<HTMLDivElement>(null);

  // 获取节点类型的视觉样式
  const nodeTypeStyle = useMemo(() => {
    return NODE_TYPE_STYLES[type] || {
      bgColor: 'bg-gray-50',
      textColor: 'text-gray-700',
      borderColor: 'border-gray-200',
      label: type.replace(/-/g, ' ')
    };
  }, [type]);
  
  // 缩放状态
  const [currentZoom, setCurrentZoom] = useState(() => getViewport().zoom);
  const [isSimplifiedView, setIsSimplifiedView] = useState(() => getViewport().zoom < ZOOM_THRESHOLD);

  // 在紧凑模式下，始终使用简化视图
  const shouldUseSimplifiedView = compactMode || isSimplifiedView;

  // 计算预览文本字体大小 - 缩放越小，字体越大
  const previewFontSize = useMemo(() => {
    if (!shouldUseSimplifiedView) return MIN_PREVIEW_FONT_SIZE;
    // 线性插值计算字体大小，缩放越小字体越大
    const zoomFactor = Math.min(ZOOM_THRESHOLD, currentZoom) / ZOOM_THRESHOLD;
    const fontSize = MAX_PREVIEW_FONT_SIZE - zoomFactor * (MAX_PREVIEW_FONT_SIZE - MIN_PREVIEW_FONT_SIZE);
    return Math.max(MIN_PREVIEW_FONT_SIZE, Math.min(MAX_PREVIEW_FONT_SIZE, fontSize));
  }, [currentZoom, shouldUseSimplifiedView]);
  
  // 使用useMemo缓存计算结果
  const { hasTitle, hasText, formattedDate, textPreview, nodeHeight, displayTitle } = useMemo(() => {
    // 智能决定显示标题：优先使用内容摘要，其次使用title
    const contentPreview = extractPreview(nodeData?.text);
    const shouldUseContentPreview = contentPreview && contentPreview.length > 0;

    return {
      hasTitle: nodeData.title !== undefined,
      hasText: nodeData.text !== undefined,
      formattedDate: format(new Date(nodeData.createdAt), 'yyyy-MM-dd HH:mm'),
      textPreview: contentPreview,  // 使用新的提取逻辑
      nodeHeight: nodeData.height || NODE_DEFAULT_HEIGHT,
      displayTitle: shouldUseContentPreview ? contentPreview : nodeData.title // 混合方案：优先内容摘要
    };
  }, [nodeData.title, nodeData.text, nodeData.createdAt, nodeData.height]);
  
  // 分别为简化视图和正常视图设置不同的样式 - 优化更大节点的显示
  const simplifiedNodeStyles = useMemo(() => ({
    width: compactMode ? COMPACT_NODE_WIDTH : (nodeWidth || NODE_WIDTH),
    height: compactMode ? COMPACT_NODE_HEIGHT : `${nodeHeight}px`,
    minHeight: compactMode ? COMPACT_NODE_HEIGHT : `${NODE_MIN_HEIGHT}px`
  }), [nodeHeight, nodeWidth, compactMode]);
  
  const normalNodeStyles = useMemo(() => ({
    width: nodeWidth || NODE_WIDTH,
    minHeight: `${NODE_MIN_HEIGHT}px`
  }), [nodeWidth]);
  
  // 版本号
  const [, setVersion] = useState(0);

  // 清除缓存，当节点关键属性改变时
  useEffect(() => {
    // 清除此节点的旧缓存
    if (nodeContentCache[id]) {
      delete nodeContentCache[id];
      // 强制刷新
      setVersion(v => v + 1);
    }
  }, [
    id, selected, nodeData.title, nodeData.text, nodeData.height, 
    nodeData?.mode, nodeData?.process, nodeData?.frame, nodeData?.objectName, nodeData?.objectNames, nodeData?.urls,
    headerContent, footerContent, customContent, showSourceHandle, showTargetHandle, compactMode
  ]);
  
  // 定期检查缩放级别
  useEffect(() => {
    const checkZoom = () => {
      const { zoom } = getViewport();
      if (zoom !== currentZoom) {
        setCurrentZoom(zoom);
        setIsSimplifiedView(zoom < ZOOM_THRESHOLD);
        
        // 当缩放级别变化较大时，通知整个应用进行布局调整
        if (Math.abs(zoom - currentZoom) > 0.1) {
          // 在DOM上分发一个自定义事件，以便其他组件能够响应
          window.dispatchEvent(new CustomEvent('node-scale-changed', {
            detail: { zoom }
          }));
        }
      }
    };
    
    // 初始检查
    checkZoom();
    
    // 设置定期检查
    const intervalId = setInterval(checkZoom, ZOOM_CHECK_INTERVAL);
    
    return () => clearInterval(intervalId);
  }, [getViewport, currentZoom]);
  
  // 使用缓存渲染或创建新的渲染结果
  const renderContent = useCallback(() => {
    // 如果是紧凑模式或简化视图模式，显示简化内容 - 专注于大标题显示
    if (shouldUseSimplifiedView || compactMode) {
      return (
        <div className="compact-node-content" style={{
          height: '100%',
          width: '100%',
          display: 'flex',
          flexDirection: 'column',
          justifyContent: 'center', // 改为居中对齐，让标题更突出
          alignItems: 'center',
          padding: '16px' // 增加padding给标题更多空间
        }}>
          {/* 主要内容：突出显示大标题 */}
          <div className="compact-node-main flex-1 flex flex-col justify-center items-center">
            {/* 使用displayTitle优先显示内容摘要 */}
            <div
              className="node-title text-center font-bold text-gray-900" // 增加font-bold和更深的颜色
              style={{
                fontSize: compactMode ? '1.25rem' : `${previewFontSize * 1.2}rem`, // 大幅增加字体大小
                fontWeight: '700', // 更粗的字体
                lineHeight: '1.4', // 适当增加行高
                overflow: 'hidden',
                textOverflow: 'ellipsis',
                display: '-webkit-box',
                WebkitLineClamp: compactMode ? 3 : 4, // 增加显示行数
                WebkitBoxOrient: 'vertical',
                maxWidth: '100%',
                wordBreak: 'break-word' // 支持中文换行
              }}
            >
              {displayTitle}
            </div>

            {/* 节点类型标识 - 作为副标题显示，使用视觉配置 */}
            <div className="node-type-indicator mt-2">
              <span
                className={`px-3 py-1 rounded-full border ${nodeTypeStyle.bgColor} ${nodeTypeStyle.textColor} ${nodeTypeStyle.borderColor}`}
                style={{
                  fontSize: '0.75rem',
                  fontWeight: '500'
                }}
              >
                {nodeTypeStyle.label}
              </span>
            </div>
          </div>

          {/* 下半部分：功能按钮 */}
          {compactMode && footerContent && (
            <div className="compact-node-footer mt-2 flex justify-center">
              <div className="compact-footer-content scale-90"> {/* 稍微缩小按钮 */}
                {footerContent}
              </div>
            </div>
          )}
        </div>
      );
    }
    
    // 在非简化视图下，使用缓存 (如果存在)
    if (nodeContentCache[id]) {
      return nodeContentCache[id];
    }
    
    // 如果不是简化视图且没有缓存，创建实际内容
    const content = (
      <>
        {/* Header with light effect */}
        <div className={`base-node-header ${selected ? 'selected' : 'default'}`}>
          <div className="base-node-header-glow"></div>
          {/* 标题 */}
          {hasTitle && <h3 className={`base-node-title ${selected ? 'selected' : 'default'}`}>{nodeData.title}</h3>}
          {/* 其他内容 */}
          {headerContent}
        </div>

        {/* Content with subtle gradient */}
        <div className={`base-node-content nodrag ${selected ? 'select-text nopan' : 'select-none'}`}>
          {customContent ? (
            customContent
          ) : (
            hasText && (
              <article className={`node-content prose prose-xl max-w-none px-3`}>
                <MarkdownWithLatex 
                  className="scrollbar-hide" 
                  text={nodeData.text || ''} 
                />
              </article>
            )
          )}
        </div>

        {/* Footer with timestamp and decorative line */}
        <div className={`base-node-footer ${selected ? 'selected' : 'default'}`}>
          <div>{footerContent}</div>
          <div className="node-timestamp">
            <span className="node-timestamp-icon">
              <svg width="12" height="12" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round">
                <circle cx="12" cy="12" r="10"></circle>
                <polyline points="12 6 12 12 16 14"></polyline>
              </svg>
            </span>
            {formattedDate}
          </div>
        </div>
      </>
    );
    
    // 存入缓存
    nodeContentCache[id] = content;
    return content;
  }, [
    shouldUseSimplifiedView, compactMode, id, selected, hasTitle, nodeData.title, headerContent,
    customContent, hasText, nodeData.text, footerContent, formattedDate,
    textPreview, previewFontSize, type, displayTitle, nodeTypeStyle
  ]);
  
  const canBeDeleted = useMemo(() => {
    const nodeType = type as NodeType;
    return nodeType === 'query' || nodeType === 'knowledge-detail' || nodeType === 'knowledge-head';
  }, [type]);

  const canBeCopied = useMemo(() => {
    const nodeType = type as NodeType;
    return nodeType !== 'resource';
  }, [type]);

  return (
    <>
      <div
        ref={nodeRef}
        className={`base-node ${selected ? 'node-selected' : ''} ${shouldUseSimplifiedView || compactMode ? 'simplified-view' : ''}`} 
        style={shouldUseSimplifiedView || compactMode ? simplifiedNodeStyles : normalNodeStyles}
        data-type={type}
      >
        {renderContent()}
      </div>
      
      {/* 紧凑模式下不显示工具栏 */}
      {!compactMode && (
        <NodeToolbar position={Position.Top} align={'end'} >
          <div className="flex items-center gap-2">
            {/* 灰色背景 */}
            <DownloadImgButton element={nodeRef.current!} size={20} className="bg-gray-50" />
            {
              canBeCopied &&
              <CopyButton getText={() => nodeData.text || ''} size={20} className="bg-gray-50" />
            }
            {
              selected && canBeDeleted &&
              <button
                className="p-2 bg-red-50 rounded-lg text-red-600 hover:bg-red-100 active:bg-red-200 transition-colors duration-200"
                title="删除节点"
                onClick={() => openDeleteNodeDialog(id)}
              >
                <Trash2 size={20} />
              </button>
            }
          </div>
        </NodeToolbar>
      )}

      {/* Handles - 横向布局：从右侧输出，从左侧接入 */}
      {showSourceHandle && (
        <Handle
          type="source"
          position={Position.Right}
          className={`node-handle ${selected ? 'selected' : ''}`}
        />
      )}
      {showTargetHandle && (
        <Handle
          type="target"
          position={Position.Left}
          className={`node-handle ${selected ? 'selected' : ''}`}
        />
      )}
    </>
  );
}, arePropsEqual);

export default BaseNode; 
