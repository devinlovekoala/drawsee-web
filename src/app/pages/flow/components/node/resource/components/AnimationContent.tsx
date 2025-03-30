import { getResourceUrl } from "@/api/methods/flow.methods";
import React, { useCallback, useEffect, useMemo, useRef, useState } from "react";

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
    <div className="animation-list" style={{ position: 'relative' }}>
      {videoUrls.map((url, index) => (
        <div 
          key={`animation-${index}`} 
          className="animation-item"
          style={{
            position: 'relative',
            paddingBottom: '40%', // 16:9 aspect ratio
            height: 0,
            overflow: 'hidden'
          }}
        >
          {!videoErrors[index] ? (
            displayMode === 'native' ? (
              // 原生视频播放器
              <video
                key={`video-${index}`}
                src={url}
                controls
                style={{
                  position: 'absolute',
                  top: 0,
                  left: 0,
                  width: '100%',
                  height: '100%'
                }}
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
                style={{
                  position: 'absolute',
                  top: 0,
                  left: 0,
                  width: '100%',
                  height: '100%'
                }}
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

function AnimationContent ({objectNames}: {objectNames: string[]}) {

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
      setIsLoading(true);
      setVideoErrors({});
      
      try {
        const urls = await Promise.all(
          objectNames.map(async (objectName) => {
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
  }, [objectNames]);

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

  // 使用useMemo缓存动画视频部分的渲染
  const animationContent = useMemo(() => {
    
    return (
      <div className="animation-section">
        <div className="section-header">
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
  }, [isLoading, videoUrls, videoErrors, displayMode, toggleDisplayMode, handleVideoError]);

  return (
    <div className="media-content">
      {animationContent}
    </div>
  );
}

export default AnimationContent;