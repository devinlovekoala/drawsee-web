import { getResourceUrl } from "@/api/methods/flow.methods";
import React, { useCallback, useEffect, useRef, useState } from "react";

interface GeneratedAnimationContentProps {
  objectName?: string;
  progress?: string;
  frame?: Uint8Array;
}

function GeneratedAnimationContent({objectName, progress, frame}: GeneratedAnimationContentProps) {
  // 状态管理
  const [videoUrl, setVideoUrl] = useState<string | null>(null);
  const [isLoading, setIsLoading] = useState(false);
  const [videoError, setVideoError] = useState(false);
  const [displayMode, setDisplayMode] = useState<'native' | 'iframe'>('iframe');
  const [retryCount, setRetryCount] = useState(0); // 添加重试计数器
  const [lastError, setLastError] = useState<string | null>(null); // 添加错误信息存储
  
  // refs
  const isMountedRef = useRef(true);
  const frameRef = useRef<HTMLImageElement>(null);
  const retryTimerRef = useRef<NodeJS.Timeout | null>(null);
  const prevObjectNameRef = useRef<string | undefined>(objectName);
  
  // 生命周期管理
  useEffect(() => {
    isMountedRef.current = true;
    return () => {
      isMountedRef.current = false;
      // 清除定时器
      if (retryTimerRef.current) {
        clearTimeout(retryTimerRef.current);
      }
    };
  }, []);
  
  // 监控objectName变化
  useEffect(() => {
    if (objectName !== prevObjectNameRef.current) {
      console.log(`GeneratedAnimationContent: objectName从${prevObjectNameRef.current || 'undefined'}变为${objectName || 'undefined'}`);
      prevObjectNameRef.current = objectName;
    }
  }, [objectName]);
  
  // 当有objectName时，获取视频资源URL
  useEffect(() => {
    if (!objectName) return;
    
    const fetchVideoUrl = async () => {
      setIsLoading(true);
      setVideoError(false);
      
      try {
        console.log(`获取视频资源URL: ${objectName}, 第${retryCount+1}次尝试`);
        const response = await getResourceUrl(objectName).send();
        
        if (isMountedRef.current) {
          console.log(`成功获取视频URL: ${response.url}`);
          setVideoUrl(response.url);
          setIsLoading(false);
          setRetryCount(0); // 重置重试计数
          setLastError(null); // 清除错误信息
        }
      } catch (error) {
        const errorMessage = error instanceof Error ? error.message : '未知错误';
        console.error(`获取视频URL失败:`, error);
        setLastError(errorMessage);
        
        if (isMountedRef.current) {
          setIsLoading(false);
          setVideoError(true);
          
          // 如果重试次数小于3次，自动重试
          if (retryCount < 3) {
            console.log(`将在3秒后进行第${retryCount+2}次重试`);
            if (retryTimerRef.current) {
              clearTimeout(retryTimerRef.current);
            }
            
            retryTimerRef.current = setTimeout(() => {
              if (isMountedRef.current) {
                setRetryCount(prev => prev + 1);
              }
            }, 3000);
          }
        }
      }
    };
    
    fetchVideoUrl();
  }, [objectName, retryCount]); // 添加retryCount作为依赖，以便触发重试
  
  // 处理视频错误
  const handleVideoError = useCallback((event: React.SyntheticEvent<HTMLVideoElement, Event>) => {
    console.error(`视频加载失败:`, event);
    setLastError('视频播放器加载失败');
    setVideoError(true);
    
    // 如果重试次数小于3次，自动重试
    if (retryCount < 3) {
      if (retryTimerRef.current) {
        clearTimeout(retryTimerRef.current);
      }
      
      retryTimerRef.current = setTimeout(() => {
        if (isMountedRef.current) {
          setRetryCount(prev => prev + 1);
        }
      }, 3000);
    }
  }, [retryCount]);
  
  // 手动重试
  const handleRetry = useCallback(() => {
    setVideoError(false);
    setRetryCount(prev => prev + 1);
  }, []);
  
  // 切换显示模式
  const toggleDisplayMode = useCallback(() => {
    setDisplayMode(prev => prev === 'native' ? 'iframe' : 'native');
    setVideoError(false);
  }, []);
  
  // 处理帧数据显示
  useEffect(() => {
    if (!frame || !frameRef.current) return;
    
    // 将 Uint8Array 转换为 base64 字符串
    const blob = new Blob([frame], { type: 'image/jpeg' });
    const url = URL.createObjectURL(blob);
    
    frameRef.current.src = url;
    
    // 清理函数
    return () => {
      URL.revokeObjectURL(url);
    };
  }, [frame]);
  
  // 渲染进度阶段
  if (progress && !objectName) {
    return (
      <div className="flex flex-col items-center justify-center p-6 rounded-lg bg-gradient-to-br from-purple-50 to-pink-50 border border-purple-200">
        <div className="relative w-24 h-24 mb-4">
          {/* 动画加载器 */}
          <div className="absolute w-full h-full border-4 border-purple-200 rounded-full"></div>
          <div className="absolute w-full h-full border-4 border-transparent border-t-purple-500 rounded-full animate-spin"></div>
          
          {/* 如果有帧数据，显示帧图像 */}
          {frame && (
            <div className="absolute inset-2 rounded-full overflow-hidden bg-white">
              <img
                ref={frameRef}
                alt="动画帧"
                className="w-full h-full object-cover"
              />
            </div>
          )}
        </div>
        
        <div className="text-purple-700 font-medium text-lg">{progress}</div>
        
        {/* 渐变进度条 */}
        <div className="w-full mt-4 h-2 bg-purple-100 rounded-full overflow-hidden">
          <div className="h-full bg-gradient-to-r from-purple-400 to-pink-400 animate-pulse"></div>
        </div>
      </div>
    );
  }
  
  // 视频渲染阶段 - 当有objectName时 - 注意：即使progress存在也优先显示视频
  if (objectName) {
    // 加载中状态
    if (isLoading) {
      return (
        <div className="flex flex-col items-center justify-center p-8 rounded-lg bg-gradient-to-br from-purple-50 to-pink-50 border border-purple-200">
          <div className="animation-loading-spinner mb-4"></div>
          <span className="text-purple-700">加载视频中...</span>
          {retryCount > 0 && (
            <span className="text-purple-500 text-sm mt-2">第 {retryCount + 1} 次尝试</span>
          )}
        </div>
      );
    }
    
    return (
      <div className="media-content">
        <div className="animation-section">
          <div className="section-header">
            <button 
              onClick={toggleDisplayMode}
              className="toggle-mode-btn"
            >
              {displayMode === 'native' ? "使用iframe嵌入" : "使用原生播放器"}
            </button>
          </div>
          
          <div className="animation-list">
            <div className="animation-item">
              {videoUrl && !videoError ? (
                displayMode === 'native' ? (
                  // 原生视频播放器
                  <video
                    key={`video-${retryCount}-${objectName}`} // 添加objectName确保在objectName更新时强制重新渲染
                    src={videoUrl}
                    controls
                    width="100%"
                    height="200"
                    className="animation-video"
                    onError={handleVideoError}
                    crossOrigin="anonymous"
                    preload="metadata"
                    playsInline
                    autoPlay
                  >
                    <source src={videoUrl} type="video/mp4" />
                    您的浏览器不支持视频播放
                  </video>
                ) : (
                  // iframe嵌入
                  <iframe
                    key={`iframe-${retryCount}-${objectName}`} // 添加objectName确保在objectName更新时强制重新渲染
                    src={videoUrl}
                    width="100%"
                    height="200"
                    frameBorder="0"
                    allowFullScreen
                    title="生成的动画视频"
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
                  {lastError && (
                    <p className="animation-error-detail text-xs mt-1 mb-2">{lastError}</p>
                  )}
                  <div className="animation-error-actions">
                    {videoUrl && (
                      <button 
                        className="animation-error-btn"
                        onClick={() => window.open(videoUrl, '_blank')}
                      >
                        在新窗口打开
                      </button>
                    )}
                    <button 
                      className="animation-error-btn"
                      onClick={handleRetry}
                    >
                      {retryCount >= 3 ? "再次重试" : "重试"}
                    </button>
                  </div>
                  {retryCount > 0 && (
                    <div className="text-xs mt-2 text-red-300">已尝试 {retryCount} 次</div>
                  )}
                </div>
              )}
            </div>
          </div>
        </div>
      </div>
    );
  }
  
  // 默认状态 (没有进度也没有objectName)
  return (
    <div className="flex items-center justify-center p-8 rounded-lg bg-gradient-to-br from-purple-50 to-pink-50 border border-purple-200">
      <span className="text-purple-500">等待生成动画...</span>
    </div>
  );
}

export default GeneratedAnimationContent;

