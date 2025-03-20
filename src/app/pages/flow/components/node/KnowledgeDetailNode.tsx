import { useState, useEffect, useRef, useCallback, useMemo } from 'react';
import { BaseNode, ExtendedNodeProps } from './base/BaseNode';
import { FaVideo, FaPlay, FaExternalLinkAlt } from 'react-icons/fa';
import { getResourceUrl } from '@/api/methods/flow.methods';
import MarkdownWithLatex from '../markdown/MarkdownWithLatex';
import React from 'react';
import './styles/knowledgeNode.css';

/**
 * B站视频卡片组件 - 使用React.memo避免不必要的重渲染
 */
const BilibiliCard = React.memo(({ url, index }: { url: string, index: number }) => {
  const [showIframe, setShowIframe] = useState(false);
  
  // 从URL中提取视频ID和标题 - 使用useMemo缓存结果
  const { bvId, title } = useMemo(() => {
    // 尝试提取BV号
    // https://player.bilibili.com/player.html?isOutside=true&bvid=BV18Z421M7w9&p=1
    const bvMatch = url.match(/&bvid=(BV[a-zA-Z0-9]+)&/);
    const bvId = bvMatch ? bvMatch[1] : '未知视频';
    
    // 尝试提取标题 (如果URL中包含)
    const titleMatch = url.match(/\/video\/[^/]+\/\?.*title=([^&]+)/);
    const title = titleMatch ? decodeURIComponent(titleMatch[1]) : `B站视频 ${index + 1}`;
    
    return { bvId, title };
  }, [url, index]);
  
  // 使用useCallback避免不必要的函数重建
  const handleToggleIframe = useCallback(() => {
    setShowIframe(prev => !prev);
  }, []);
  
  // 使用useMemo缓存iframe部分的渲染
  const iframeContent = useMemo(() => {
    if (!showIframe) return null;
    
    return (
      <div className="bili-iframe-container">
        <iframe
          src={url+'&autoplay=0'}
          width="100%"
          height="200"
          frameBorder="0"
          allowFullScreen
          title={title}
          className="w-full"
          sandbox="allow-top-navigation allow-same-origin allow-forms allow-scripts allow-popups"
          loading="lazy"
        />
        <button 
          onClick={handleToggleIframe}
          className="bili-toggle-btn"
          title="切换到卡片模式"
        >
          <FaExternalLinkAlt size={14} />
        </button>
      </div>
    );
  }, [showIframe, url, title, handleToggleIframe]);
  
  // 使用useMemo缓存卡片部分的渲染
  const cardContent = useMemo(() => {
    if (showIframe) return null;
    
    return (
      <div className="bili-card-content">
        {/* 视频缩略图/播放按钮 */}
        <div 
          className="bili-thumbnail"
          onClick={handleToggleIframe}
        >
          <div className="bili-thumbnail-overlay"></div>
          <div className="bili-thumbnail-content">
            <div className="bili-play-btn">
              <FaPlay className="bili-play-icon" size={20} />
            </div>
            <span className="bili-bvid">
              {bvId}
            </span>
          </div>
        </div>
        
        {/* 视频信息 */}
        <div className="bili-info">
          <h3 className="bili-title">{title}</h3>
          <p className="bili-desc">点击左侧播放按钮加载视频</p>
          
          <div className="bili-actions">
            <button 
              onClick={handleToggleIframe}
              className="bili-action-btn bili-play-action"
            >
              <FaPlay size={10} />
              播放视频
            </button>
            <a 
              href={url} 
              target="_blank" 
              rel="noopener noreferrer"
              className="bili-action-btn bili-open-action"
            >
              <FaExternalLinkAlt size={10} />
              在B站打开
            </a>
          </div>
        </div>
      </div>
    );
  }, [showIframe, bvId, title, url, handleToggleIframe]);
  
  return (
    <div className="bili-card">
      {showIframe ? iframeContent : cardContent}
    </div>
  );
}, (prevProps, nextProps) => {
  // 自定义比较函数，仅当URL变化时才重新渲染
  return prevProps.url === nextProps.url && prevProps.index === nextProps.index;
});

// 确保组件有显示名称，便于调试
BilibiliCard.displayName = 'BilibiliCard';

/**
 * 渲染BilibiliCards的集合组件
 * 抽离出来并使用memo避免父组件重新渲染时重复渲染所有卡片
 */
const BilibiliCardList = React.memo(({ urls }: { urls: string[] }) => {
  return (
    <div className="bili-card-list">
      {urls.map((url, index) => (
        <BilibiliCard key={`bilibili-${index}`} url={url} index={index} />
      ))}
    </div>
  );
});

BilibiliCardList.displayName = 'BilibiliCardList';

/**
 * 动画视频集合组件
 */
const AnimationVideos = React.memo(({ 
  isLoading, 
  videoUrls, 
  videoErrors, 
  displayMode, 
  handleVideoError,
  setVideoErrors
}: { 
  isLoading: boolean;
  videoUrls: string[];
  videoErrors: Record<number, boolean>;
  displayMode: 'native' | 'iframe';
  handleVideoError: (index: number, event: React.SyntheticEvent<HTMLVideoElement, Event>) => void;
  setVideoErrors: React.Dispatch<React.SetStateAction<Record<number, boolean>>>;
}) => {
  if (isLoading) {
    return (
      <div className="animation-loading">
        <div className="animation-loading-spinner"></div>
        <span className="animation-loading-text">加载视频中...</span>
      </div>
    );
  }
  
  if (videoUrls.length === 0) {
    return (
      <div className="animation-empty">
        <span>无法加载视频资源</span>
      </div>
    );
  }
  
  return (
    <div className="animation-list">
      {videoUrls.map((url, index) => (
        <div key={`animation-${index}`} className="animation-item">
          {!videoErrors[index] ? (
            displayMode === 'native' ? (
              // 原生视频播放器
              <video
                key={`video-${index}`}
                src={url}
                controls
                width="100%"
                height="200"
                className="animation-video"
                onError={(e) => handleVideoError(index, e)}
                crossOrigin="anonymous"
                preload="metadata"
                playsInline
              >
                <source src={url} type="video/mp4" />
                您的浏览器不支持视频播放
              </video>
            ) : (
              // iframe嵌入
              <iframe
                key={`iframe-${index}`}
                src={url}
                width="100%"
                height="200"
                frameBorder="0"
                allowFullScreen
                title={`视频 ${index + 1}`}
                className="animation-iframe"
                sandbox="allow-same-origin allow-scripts"
                loading="lazy"
              />
            )
          ) : (
            // 错误状态
            <div className="animation-error">
              <svg xmlns="http://www.w3.org/2000/svg" className="animation-error-icon" fill="none" viewBox="0 0 24 24" stroke="currentColor">
                <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M12 8v4m0 4h.01M21 12a9 9 0 11-18 0 9 9 0 0118 0z" />
              </svg>
              <p className="animation-error-text">视频加载失败</p>
              <div className="animation-error-actions">
                <button 
                  className="animation-error-btn"
                  onClick={() => window.open(url, '_blank')}
                >
                  在新窗口打开
                </button>
                <button 
                  className="animation-error-btn"
                  onClick={() => {
                    setVideoErrors(prev => ({...prev, [index]: false}));
                  }}
                >
                  重试
                </button>
              </div>
            </div>
          )}
        </div>
      ))}
    </div>
  );
});

AnimationVideos.displayName = 'AnimationVideos';

/**
 * 知识详情节点组件
 * 支持显示 Bilibili 视频和自定义动画
 */
const KnowledgeDetailNode = React.memo(function KnowledgeDetailNode({ 
  showSourceHandle, 
  showTargetHandle, 
  ...props 
}: ExtendedNodeProps<'knowledge-detail'>) {
  // 检测是否有媒体内容 - 使用useMemo避免重复计算
  const { hasBilibiliUrls, hasAnimations, bilibiliUrls, animationObjectNames } = useMemo(() => {
    const hasBilibiliUrls = props.data.media?.bilibiliUrls?.length ? true : false;
    const hasAnimations = props.data.media?.animationObjectNames?.length ? true : false;
    return { 
      hasBilibiliUrls, 
      hasAnimations,
      bilibiliUrls: props.data.media?.bilibiliUrls || [],
      animationObjectNames: props.data.media?.animationObjectNames || []
    };
  }, [props.data.media]);
  
  // 状态管理
  const [videoUrls, setVideoUrls] = useState<string[]>([]);
  const [isLoading, setIsLoading] = useState(false);
  const [videoErrors, setVideoErrors] = useState<Record<number, boolean>>({});
  const [displayMode, setDisplayMode] = useState<'native' | 'iframe'>('iframe');
  
  // refs
  const isMountedRef = useRef(true);
  
  // 组件生命周期
  useEffect(() => {
    isMountedRef.current = true;
    return () => {
      isMountedRef.current = false;
    };
  }, []);

  // 获取视频资源URL
  useEffect(() => {
    const fetchVideoUrls = async () => {
      if (!hasAnimations || !animationObjectNames.length) return;
      
      setIsLoading(true);
      setVideoErrors({});
      
      try {
        const urls = await Promise.all(
          animationObjectNames.map(async (objectName) => {
            const response = await getResourceUrl(objectName).send();
            return response.url;
          })
        );
        
        if (isMountedRef.current) {
          setVideoUrls(urls);
          setIsLoading(false);
        }
      } catch (error) {
        console.error('获取视频URL失败:', error);
        if (isMountedRef.current) {
          setIsLoading(false);
        }
      }
    };
    
    fetchVideoUrls();
  }, [hasAnimations, animationObjectNames]);

  // 处理视频错误 - 使用useCallback避免重渲染
  const handleVideoError = useCallback((index: number, event: React.SyntheticEvent<HTMLVideoElement, Event>) => {
    console.error(`视频 ${index + 1} 加载失败:`, event);
    if (!videoErrors[index]) {
      setVideoErrors(prev => ({ ...prev, [index]: true }));
    }
  }, [videoErrors]);

  // 切换显示模式 - 使用useCallback避免重渲染
  const toggleDisplayMode = useCallback(() => {
    setDisplayMode(prev => prev === 'native' ? 'iframe' : 'native');
    setVideoErrors({});
  }, []);
  
  // 使用useMemo缓存文本内容的渲染
  const textContent = useMemo(() => {
    if (!props.data.text) return null;
    
    return (
      <article className="node-content prose prose-xl max-w-none px-3">
        <MarkdownWithLatex className="scrollbar-hide" text={props.data.text} />
      </article>
    );
  }, [props.data.text]);
  
  // 使用useMemo缓存动画视频部分的渲染
  const animationContent = useMemo(() => {
    if (!hasAnimations) return null;
    
    return (
      <div className="animation-section">
        <div className="section-header">
          <h4 className="section-title">相关动画</h4>
          <button 
            onClick={toggleDisplayMode}
            className="toggle-mode-btn"
          >
            {displayMode === 'native' ? "使用iframe嵌入" : "使用原生播放器"}
          </button>
        </div>
        
        <AnimationVideos
          isLoading={isLoading}
          videoUrls={videoUrls}
          videoErrors={videoErrors}
          displayMode={displayMode}
          handleVideoError={handleVideoError}
          setVideoErrors={setVideoErrors}
        />
      </div>
    );
  }, [hasAnimations, isLoading, videoUrls, videoErrors, displayMode, toggleDisplayMode, handleVideoError]);
  
  // 使用useMemo缓存B站视频部分的渲染
  const bilibiliContent = useMemo(() => {
    if (!hasBilibiliUrls) return null;
    
    return (
      <div className="bili-section">
        <h4 className="section-title">B站视频</h4>
        <BilibiliCardList urls={bilibiliUrls} />
      </div>
    );
  }, [hasBilibiliUrls, bilibiliUrls]);
  
  // 使用useMemo缓存页脚内容的渲染
  const footerContent = useMemo(() => {
    return (
      <div className="footer-badges">
        {hasBilibiliUrls && (
          <div className="badge badge-pink">
            <FaVideo className="badge-icon" />
            {bilibiliUrls.length} 个视频
          </div>
        )}
        {hasAnimations && (
          <div className="badge badge-purple">
            {animationObjectNames.length} 个动画
          </div>
        )}
      </div>
    );
  }, [hasBilibiliUrls, hasAnimations, bilibiliUrls.length, animationObjectNames.length]);
  
  // 使用useMemo缓存所有媒体内容的渲染
  const mediaContent = useMemo(() => {
    if (!hasBilibiliUrls && !hasAnimations) return null;
    
    return (
      <div className="media-content">
        {animationContent}
        {bilibiliContent}
      </div>
    );
  }, [hasBilibiliUrls, hasAnimations, animationContent, bilibiliContent]);
  
  // 合并所有自定义内容
  const customContent = useMemo(() => {
    return (
      <>
        {textContent}
        {mediaContent}
      </>
    );
  }, [textContent, mediaContent]);
  
  return (
    <BaseNode
      {...props}
      showSourceHandle={showSourceHandle}
      showTargetHandle={showTargetHandle}
      customContent={customContent}
      footerContent={footerContent}
    />
  );
}, (prevProps, nextProps) => {
  // 性能优化：自定义比较函数，只有在关键属性变化时才重新渲染
  if (prevProps.selected !== nextProps.selected) return false;
  if (prevProps.data.text !== nextProps.data.text) return false;
  
  // 检查媒体对象变化
  const prevMedia = prevProps.data.media;
  const nextMedia = nextProps.data.media;
  
  // 如果一个有媒体而另一个没有，则需要重新渲染
  if (Boolean(prevMedia) !== Boolean(nextMedia)) return false;
  
  // 如果两者都有媒体，比较媒体内容
  if (prevMedia && nextMedia) {
    // 比较B站URL数组
    const prevBilibili = prevMedia.bilibiliUrls;
    const nextBilibili = nextMedia.bilibiliUrls;
    if (Boolean(prevBilibili?.length) !== Boolean(nextBilibili?.length)) return false;
    if (prevBilibili && nextBilibili && prevBilibili.length !== nextBilibili.length) return false;
    
    // 比较动画对象名数组
    const prevAnimation = prevMedia.animationObjectNames;
    const nextAnimation = nextMedia.animationObjectNames;
    if (Boolean(prevAnimation?.length) !== Boolean(nextAnimation?.length)) return false;
    if (prevAnimation && nextAnimation && prevAnimation.length !== nextAnimation.length) return false;
  }
  
  // 如果以上都相同，就不需要重新渲染
  return true;
});

export default KnowledgeDetailNode; 