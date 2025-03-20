import { Handle, Position, NodeProps, useReactFlow } from '@xyflow/react';
import { NodeType } from '@/api/types/flow.types';
import { format } from 'date-fns';
import type { NodeData } from '../types/node.types';
import { NODE_MIN_HEIGHT, NODE_DEFAULT_HEIGHT, NODE_WIDTH } from '../../../constants';
import MarkdownWithLatex from '../../markdown/MarkdownWithLatex';
import React, { useMemo, useState, useEffect, useCallback, useRef } from 'react';
import { useAppContext } from '@/app/contexts/AppContext';
import CopyButton from '../../button/CopyButton';
import DownloadImgButton from '../../button/DownloadImgButton';

// 缩放阈值常量
const ZOOM_THRESHOLD = 0.40; // 低于此值时使用简化显示
const ZOOM_CHECK_INTERVAL = 200; // 检查缩放级别的间隔(ms)
const MIN_PREVIEW_FONT_SIZE = 2.5; // 最小预览文本字体大小(rem)
const MAX_PREVIEW_FONT_SIZE = 7; // 最大预览文本字体大小(rem)

// 用于类型检查的接口
interface HasTitleText {
  title?: string;
  text?: string;
  createdAt: number;
  height?: number;
}

// 扩展 NodeProps 的接口
export interface ExtendedNodeProps<T extends NodeType> extends Omit<NodeProps, 'data'> {
  data: NodeData<T>;
  headerContent?: React.ReactNode;
  footerContent?: React.ReactNode;
  customContent?: React.ReactNode;
  showSourceHandle?: boolean;
  showTargetHandle?: boolean;
}

// 全局节点渲染缓存
const nodeContentCache: Record<string, React.ReactNode> = {};

// 从文本中提取简化预览内容
function extractPreview(text?: string, maxLength = 50): string {
  if (!text) return '';
  
  // 移除所有LaTeX公式和代码块，替换为简单标识
  const cleanText = text
    .replace(/\$\$([\s\S]*?)\$\$/g, '[公式]')
    .replace(/\$(.*?)\$/g, '[公式]')
    .replace(/```[\s\S]*?```/g, '[代码]')
    .replace(/#{1,6}\s+/g, '') // 移除标题标记
    .replace(/\*\*/g, '')      // 移除粗体标记
    .replace(/\*/g, '')        // 移除斜体标记
    .replace(/\n/g, ' ');      // 将换行替换为空格
  
  return cleanText.length > maxLength 
    ? cleanText.substring(0, maxLength) + '...' 
    : cleanText;
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
  headerContent,
  footerContent,
  customContent,
  showSourceHandle = true,
  showTargetHandle = true,
  selected,
}: ExtendedNodeProps<T>) {
  const nodeData = data as unknown as HasTitleText;
  const { getViewport } = useReactFlow();
  const { nodeWidth } = useAppContext();
  const nodeRef = useRef<HTMLDivElement>(null);
  
  // 缩放状态
  const [currentZoom, setCurrentZoom] = useState(() => getViewport().zoom);
  const [isSimplifiedView, setIsSimplifiedView] = useState(() => getViewport().zoom < ZOOM_THRESHOLD);

  // 计算预览文本字体大小 - 缩放越小，字体越大
  const previewFontSize = useMemo(() => {
    if (!isSimplifiedView) return MIN_PREVIEW_FONT_SIZE;
    // 线性插值计算字体大小，缩放越小字体越大
    const zoomFactor = Math.min(ZOOM_THRESHOLD, currentZoom) / ZOOM_THRESHOLD;
    const fontSize = MAX_PREVIEW_FONT_SIZE - zoomFactor * (MAX_PREVIEW_FONT_SIZE - MIN_PREVIEW_FONT_SIZE);
    return Math.max(MIN_PREVIEW_FONT_SIZE, Math.min(MAX_PREVIEW_FONT_SIZE, fontSize));
  }, [currentZoom, isSimplifiedView]);
  
  // 使用useMemo缓存计算结果
  const { hasTitle, hasText, formattedDate, textPreview, nodeHeight } = useMemo(() => {    
    return {
      hasTitle: nodeData.title !== undefined,
      hasText: nodeData.text !== undefined,
      formattedDate: format(new Date(nodeData.createdAt), 'yyyy-MM-dd HH:mm'),
      textPreview: extractPreview(nodeData.text, 100),
      nodeHeight: nodeData.height || NODE_DEFAULT_HEIGHT
    };
  }, [nodeData.title, nodeData.text, nodeData.createdAt, nodeData.height]);
  
  // 分别为简化视图和正常视图设置不同的样式
  const simplifiedNodeStyles = useMemo(() => ({
    width: nodeWidth || NODE_WIDTH,
    height: `${nodeHeight}px`,
    minHeight: `${NODE_MIN_HEIGHT}px`
  }), [nodeHeight, nodeWidth]);
  
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
  }, [id, nodeData.title, nodeData.text, nodeData.height, selected]);
  
  // 定期检查缩放级别
  useEffect(() => {
    const checkZoom = () => {
      const { zoom } = getViewport();
      if (zoom !== currentZoom) {
        setCurrentZoom(zoom);
        setIsSimplifiedView(zoom < ZOOM_THRESHOLD);
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
    // 如果是简化视图模式，不使用缓存，直接显示骨架屏
    if (isSimplifiedView) {
      return (
        <div className="skeleton-view" style={{ height: '100%', width: '100%' }}>
          <div className="skeleton-gradient-background"></div>
          {textPreview && (
            <div 
              className="node-preview-text"
              style={{ fontSize: `${previewFontSize}rem` }}
            >
              {textPreview}
            </div>
          )}
        </div>
      );
    }
    
    // 在非简化视图下，使用缓存 (如果存在)
    if (nodeContentCache[id]) {
      //console.log('使用缓存', id);
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
          {/* 复制按钮 */}
          <div className="flex items-center gap-2">
            <DownloadImgButton element={nodeRef.current!} size={24} />
            <CopyButton getText={() => nodeData.text || ''} size={24} />
          </div>
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
    isSimplifiedView, id, selected, hasTitle, nodeData.title, headerContent, 
    customContent, hasText, nodeData.text, footerContent, formattedDate, 
    textPreview, previewFontSize
  ]);
  
  return (
    <>
      <div
        ref={nodeRef}
        className={`base-node ${selected ? 'node-selected' : ''} ${isSimplifiedView ? 'simplified-view' : ''}`} 
        style={isSimplifiedView ? simplifiedNodeStyles : normalNodeStyles}
      >
        {renderContent()}
      </div>
      
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