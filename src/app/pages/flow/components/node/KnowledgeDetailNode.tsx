import { useState, useEffect, useRef, useCallback, useMemo } from 'react';
import { BaseNode, ExtendedNodeProps } from './base/BaseNode';
import { FaVideo } from 'react-icons/fa';
import { getResourceUrl } from '@/api/methods/flow.methods';
import MarkdownWithLatex from '../markdown/MarkdownWithLatex';

/**
 * 知识详情节点组件
 * 支持显示 Bilibili 视频和自定义动画
 */
function KnowledgeDetailNode({ showSourceHandle, showTargetHandle, ...props }: ExtendedNodeProps<'knowledge-detail'>) {
  const hasBilibiliUrls = props.data.media?.bilibiliUrls?.length ? true : false;
  const hasAnimations = props.data.media?.animationObjectNames?.length ? true : false;
  const [videoUrls, setVideoUrls] = useState<string[]>([]);
  const [isLoading, setIsLoading] = useState(false);
  const [videoErrors, setVideoErrors] = useState<Record<number, boolean>>({});
  const [displayMode, setDisplayMode] = useState<'native' | 'iframe'>('iframe');
  
  // 渲染计数器（用于调试）
  const renderCountRef = useRef<Record<number, number>>({});
  const isMountedRef = useRef(true);
  
  useEffect(() => {
    console.log('KnowledgeDetailNode 组件已挂载');
    isMountedRef.current = true;
    return () => {
      console.log('KnowledgeDetailNode 组件已卸载');
      isMountedRef.current = false;
    };
  }, []);

  // 获取视频资源URL
  useEffect(() => {
    const fetchVideoUrls = async () => {
      if (!hasAnimations || !props.data.media?.animationObjectNames?.length) return;
      
      setIsLoading(true);
      setVideoErrors({});
      
      try {
        const urls = await Promise.all(
          props.data.media.animationObjectNames.map(async (objectName) => {
            const response = await getResourceUrl(objectName).send();
            return response.url;
          })
        );
        console.log('获取到的资源 URLs: ', urls);
        
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
  }, [hasAnimations, props.data.media?.animationObjectNames]);

  // 处理视频错误 - 使用useCallback避免重渲染
  const handleVideoError = useCallback((index: number, event: React.SyntheticEvent<HTMLVideoElement, Event>) => {
    console.error(`视频 ${index + 1} 加载失败:`, event);
    console.error(`错误详情:`, {
      url: videoUrls[index],
      errorType: event.type,
      errorMessage: event.eventPhase,
      errorTarget: event.target
    });
    if (!videoErrors[index]) {
      setVideoErrors(prev => ({ ...prev, [index]: true }));
    }
  }, [videoUrls, videoErrors]);

  // 切换显示模式 - 使用useCallback避免重渲染
  const toggleDisplayMode = useCallback(() => {
    setDisplayMode(prev => prev === 'native' ? 'iframe' : 'native');
    setVideoErrors({});
  }, []);
 
  // 媒体内容组件 - 使用useMemo避免重渲染
  const MediaContent = useMemo(() => {
    console.log('MediaContent 重新渲染, 模式:', displayMode);
    
    return () => (
      <div className="mt-4 space-y-4">
        {/* 动画视频 */}
        {hasAnimations && (
          <div className="space-y-3 mt-4">
            <div className="flex justify-between items-center">
              <h4 className="text-3xl font-medium text-gray-700">相关动画</h4>
              <button 
                onClick={toggleDisplayMode}
                className="text-xs px-2 py-1 bg-purple-100 text-purple-700 rounded hover:bg-purple-200"
              >
                {displayMode === 'native' ? "使用iframe嵌入" : "使用原生播放器"}
              </button>
            </div>
            
            <div className="space-y-3">
              {isLoading ? (
                // 加载中状态
                <div className="flex justify-center items-center py-8 rounded-lg border border-purple-200 bg-purple-50">
                  <div className="animate-spin rounded-full h-8 w-8 border-b-2 border-purple-500"></div>
                  <span className="ml-3 text-purple-700">加载视频中...</span>
                </div>
              ) : videoUrls.length > 0 ? (
                // 显示视频
                videoUrls.map((url, index) => {
                  // 跟踪渲染次数
                  renderCountRef.current[index] = (renderCountRef.current[index] || 0) + 1;
                  console.log(`视频 ${index + 1} 渲染次数: ${renderCountRef.current[index]}`);
                  
                  return (
                    <div key={`animation-${index}`} className="rounded-lg overflow-hidden border border-purple-200 bg-purple-50">
                      {!videoErrors[index] ? (
                        displayMode === 'native' ? (
                          // 原生视频播放器
                          <video
                            key={`video-${index}`} // 使用稳定的key
                            src={url}
                            controls
                            width="100%"
                            height="200"
                            className="w-full"
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
                            key={`iframe-${index}`} // 使用稳定的key
                            src={url}
                            width="100%"
                            height="200"
                            frameBorder="0"
                            allowFullScreen
                            title={`视频 ${index + 1}`}
                            className="w-full"
                            sandbox="allow-same-origin allow-scripts"
                            loading="lazy"
                          />
                        )
                      ) : (
                        // 错误状态
                        <div className="flex flex-col items-center justify-center h-[200px] bg-red-50 text-red-500 p-4">
                          <svg xmlns="http://www.w3.org/2000/svg" className="h-10 w-10 mb-2" fill="none" viewBox="0 0 24 24" stroke="currentColor">
                            <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M12 8v4m0 4h.01M21 12a9 9 0 11-18 0 9 9 0 0118 0z" />
                          </svg>
                          <p className="text-center">视频加载失败</p>
                          <div className="flex mt-2 space-x-2">
                            <button 
                              className="px-3 py-1 bg-red-100 rounded-md hover:bg-red-200 text-sm"
                              onClick={() => window.open(url, '_blank')}
                            >
                              在新窗口打开
                            </button>
                            <button 
                              className="px-3 py-1 bg-red-100 rounded-md hover:bg-red-200 text-sm"
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
                  );
                })
              ) : (
                // 无视频状态
                <div className="flex justify-center items-center py-8 rounded-lg border border-purple-200 bg-purple-50">
                  <span className="text-purple-700">无法加载视频资源</span>
                </div>
              )}
            </div>
          </div>
        )}
        
        {/* Bilibili 视频 */}
        {hasBilibiliUrls && (
          <div className="space-y-3 mt-10">
            <h4 className="text-3xl font-medium text-gray-700">B站视频</h4>
            <div className="space-y-3">
              {props.data.media?.bilibiliUrls?.map((url, index) => {
                return (
                  <div key={`bilibili-${index}`} className="rounded-lg overflow-hidden border border-pink-200 bg-pink-50">
                    <iframe
                      src={url+'&autoplay=0'}
                      width="100%"
                      height="200"
                      frameBorder="0"
                      allowFullScreen
                      title={`Bilibili Video ${index + 1}`}
                      className="w-full"
                      sandbox="allow-top-navigation allow-same-origin allow-forms allow-scripts allow-popups"
                      loading="lazy"
                    />
                  </div>
                );
              })}
            </div>
          </div>
        )}
      </div>
    );
  }, [displayMode, hasAnimations, hasBilibiliUrls, isLoading, videoUrls, videoErrors, props.data.media?.bilibiliUrls, handleVideoError, toggleDisplayMode]);
  
  // 自定义内容，包括文本和媒体
  const customContent = (
    <>
      {/* 文本内容 */}
      {props.data.text && (
        <article className="node-content select-text prose prose-sm max-w-none px-3">
          <MarkdownWithLatex className="scrollbar-hide" text={props.data.text || ''}></MarkdownWithLatex>
        </article>
      )}
      
      {/* 媒体内容 */}
      {(hasBilibiliUrls || hasAnimations) && (
        <MediaContent />
      )}
    </>
  );
  
  return (
    <BaseNode
      {...props}
      showSourceHandle={showSourceHandle}
      showTargetHandle={showTargetHandle}
      customContent={customContent}
      footerContent={
        <div className="flex space-x-2">
          {hasBilibiliUrls && (
            <div className="inline-flex items-center px-2 py-1 text-xs font-medium text-pink-700 bg-pink-100 rounded">
              <FaVideo className="mr-1" />
              {props.data.media?.bilibiliUrls?.length} 个视频
            </div>
          )}
          {hasAnimations && (
            <div className="inline-flex items-center px-2 py-1 text-xs font-medium text-purple-700 bg-purple-100 rounded">
              {props.data.media?.animationObjectNames?.length} 个动画
            </div>
          )}
        </div>
      }
    />
  );
}

export default KnowledgeDetailNode; 