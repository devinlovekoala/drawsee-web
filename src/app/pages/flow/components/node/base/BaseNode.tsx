import { Handle, Position, NodeProps, useReactFlow, NodeToolbar } from '@xyflow/react';
import { NodeType } from '@/api/types/flow.types';
import { format } from 'date-fns';
import type { NodeData } from '../types/node.types';
import { NODE_MIN_HEIGHT, NODE_DEFAULT_HEIGHT, NODE_WIDTH } from '../../../constants';
import MarkdownWithLatex from '../../markdown/MarkdownWithLatex';
import React, { useMemo, useState, useEffect, useCallback, useRef } from 'react';
import { useAppContext } from '@/app/contexts/AppContext';
import CopyButton from '../../button/CopyButton';
import DownloadImgButton from '../../button/DownloadImgButton';
import { Trash2 } from 'lucide-react';

// 缩放阈值常量
const ZOOM_THRESHOLD = 0.40; // 低于此值时使用简化显示
const ZOOM_CHECK_INTERVAL = 200; // 检查缩放级别的间隔(ms)
const MIN_PREVIEW_FONT_SIZE = 2.5; // 最小预览文本字体大小(rem)
const MAX_PREVIEW_FONT_SIZE = 7; // 最大预览文本字体大小(rem)

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
  const { hasTitle, hasText, formattedDate, textPreview, nodeHeight } = useMemo(() => {    
    return {
      hasTitle: nodeData.title !== undefined,
      hasText: nodeData.text !== undefined,
      formattedDate: format(new Date(nodeData.createdAt), 'yyyy-MM-dd HH:mm'),
      textPreview: extractPreview(nodeData?.text),  // 使用新的提取逻辑
      nodeHeight: nodeData.height || NODE_DEFAULT_HEIGHT
    };
  }, [nodeData.title, nodeData.text, nodeData.createdAt, nodeData.height]);
  
  // 分别为简化视图和正常视图设置不同的样式
  const simplifiedNodeStyles = useMemo(() => ({
    width: compactMode ? 320 : (nodeWidth || NODE_WIDTH), // 紧凑模式下使用更大的宽度
    height: compactMode ? 150 : `${nodeHeight}px`, // 紧凑模式下使用更大的高度
    minHeight: compactMode ? 150 : `${NODE_MIN_HEIGHT}px`
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
    // 如果是紧凑模式或简化视图模式，显示简化内容
    if (shouldUseSimplifiedView || compactMode) {
      return (
        <div className="compact-node-content" style={{ 
          height: '100%', 
          width: '100%', 
          display: 'flex', 
          flexDirection: 'column', 
          justifyContent: 'space-between',
          padding: '12px' 
        }}>
          {/* 上半部分：标题和内容预览 */}
          <div className="compact-node-main flex-1 flex flex-col justify-center items-center">
            {hasTitle ? (
              <div 
                className="node-title text-center text-sm font-medium text-gray-800 mb-2"
                style={{ 
                  fontSize: compactMode ? '0.875rem' : `${previewFontSize * 0.8}rem`, 
                  fontWeight: 'bold',
                  lineHeight: '1.3',
                  overflow: 'hidden',
                  textOverflow: 'ellipsis',
                  display: '-webkit-box',
                  WebkitLineClamp: 2,
                  WebkitBoxOrient: 'vertical'
                }}
              >
                {nodeData.title}
              </div>
            ) : null}
            {textPreview && (
              <div 
                className="node-preview text-center text-xs text-gray-600 mb-2"
                style={{ 
                  fontSize: compactMode ? '0.75rem' : `${previewFontSize * 0.6}rem`,
                  lineHeight: '1.2',
                  overflow: 'hidden',
                  textOverflow: 'ellipsis',
                  display: '-webkit-box',
                  WebkitLineClamp: compactMode ? 2 : 3,
                  WebkitBoxOrient: 'vertical'
                }}
              >
                {textPreview}
              </div>
            )}
            {/* 紧凑模式下显示节点类型标识 */}
            {compactMode && (
              <div className="node-type-indicator">
                <span className="text-xs px-2 py-1 rounded-full bg-blue-100 text-blue-600">
                  {type}
                </span>
              </div>
            )}
          </div>
          
          {/* 下半部分：功能按钮 */}
          {compactMode && footerContent && (
            <div className="compact-node-footer mt-3 flex justify-center">
              <div className="compact-footer-content">
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
    textPreview, previewFontSize, type
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

      {/* Handles 始终保持相同位置 */}
      {showSourceHandle && (
        <Handle
          type="source"
          position={Position.Bottom}
          className={`node-handle ${selected ? 'selected' : ''}`}
        />
      )}
      {showTargetHandle && (
        <Handle
          type="target"
          position={Position.Top}
          className={`node-handle ${selected ? 'selected' : ''}`}
        />
      )}
    </>
  );
}, arePropsEqual);

export default BaseNode; 