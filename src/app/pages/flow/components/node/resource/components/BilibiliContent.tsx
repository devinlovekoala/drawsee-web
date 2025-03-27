import React, { useCallback, useMemo, useState } from "react";
import { FaExternalLinkAlt, FaPlay } from "react-icons/fa";

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
      <div className="bili-iframe-container"
        style={{
          position: 'relative',
          paddingBottom: '40%', // 16:9 aspect ratio
          height: 0,
          overflow: 'hidden'
        }}
      >
        <iframe
          src={url+'&autoplay=0'}
          style={{
            position: 'absolute',
            top: 0,
            left: 0,
            width: '100%',
            height: '100%'
          }}
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

function BilibiliContent ({urls}: {urls: string[]}) {

  // 使用useMemo缓存B站视频部分的渲染
  const bilibiliContent = useMemo(() => {
    return <BilibiliCardList urls={urls} />;
  }, [urls]);

  return (
    <div className="media-content">
      {bilibiliContent}
    </div>
  );

}

export default BilibiliContent;