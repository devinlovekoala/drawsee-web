import { NodeProps } from '@xyflow/react';
import { useState, useEffect, useRef } from 'react';
import type { KnowledgeDetailNode as KnowledgeDetailNodeType } from './types/node.types';
import { BaseNode, ExtendedNodeProps } from './base/BaseNode';
import { FaVideo } from 'react-icons/fa';
import { getResourceUrl } from '@/api/methods/flow.methods';
import MarkdownWithLatex from '../markdown/MarkdownWithLatex';
import ReactPlayer from 'react-player'

/**
 * 知识详情节点组件
 * 支持显示 Bilibili 视频和自定义动画
 */
function KnowledgeDetailNode({ showSourceHandle, showTargetHandle, ...props }: ExtendedNodeProps<'knowledge-detail'>) {
  const hasBilibiliUrls = props.data.media?.bilibiliUrls?.length > 0;
  const hasAnimations = props.data.media?.animationObjectNames?.length > 0;
  
  // 存储动画资源 URL 和下载后的视频 Blob URL
  const [animationUrls, setAnimationUrls] = useState<string[]>([]);
  const [videoBlobUrls, setVideoBlobUrls] = useState<string[]>([]);
  const [isLoading, setIsLoading] = useState(false);
  const [downloadProgress, setDownloadProgress] = useState<number[]>([]);
  /*
  // 清理函数，用于组件卸载时释放 Blob URL
  useEffect(() => {
    return () => {
      // 释放所有创建的 Blob URL
      videoBlobUrls.forEach(url => URL.revokeObjectURL(url));
    };
  }, [videoBlobUrls]);

  // 获取动画资源 URL 并下载视频
  useEffect(() => {
    const fetchAnimationUrls = async () => {
      console.log('fetchAnimationUrls');

      if (!hasAnimations) return;
      
      setIsLoading(true);
      try {
        // 获取资源 URL
        const urls = await Promise.all(
          props.data.media.animationObjectNames.map(async (objectName) => {
            const response = await getResourceUrl(objectName).send();
            return response.url;
          })
        );
        console.log('获取到的资源 URLs: ', urls);
        setAnimationUrls(urls);
        
        // 初始化下载进度数组
        setDownloadProgress(new Array(urls.length).fill(0));
        
        // 下载视频
        const blobUrls = await Promise.all(
          urls.map((url, index) => downloadVideo(url, index))
        );
        
        setVideoBlobUrls(blobUrls.filter(Boolean) as string[]);
      } catch (error) {
        console.error('获取或下载动画失败:', error);
      } finally {
        setIsLoading(false);
      }
    };
    
    fetchAnimationUrls();
  }, [hasAnimations, props.data.media?.animationObjectNames]);
  
  // 下载视频并创建 Blob URL
  const downloadVideo = async (url: string, index: number): Promise<string | null> => {
    try {
      const response = await fetch(url);
      
      if (!response.ok) {
        throw new Error(`HTTP error! status: ${response.status}`);
      }
      
      // 获取响应体的 reader
      const reader = response.body?.getReader();
      if (!reader) {
        throw new Error('无法获取响应体的 reader');
      }
      
      // 获取内容长度（如果有）
      const contentLength = Number(response.headers.get('Content-Length') || '0');
      
      // 读取数据块
      let receivedLength = 0;
      const chunks: Uint8Array[] = [];
      
      while (true) {
        const { done, value } = await reader.read();
        
        if (done) {
          break;
        }
        
        chunks.push(value);
        receivedLength += value.length;
        
        // 更新下载进度
        if (contentLength) {
          const progress = Math.round((receivedLength / contentLength) * 100);
          setDownloadProgress(prev => {
            const newProgress = [...prev];
            newProgress[index] = progress;
            return newProgress;
          });
        }
      }
      
      // 合并所有块并创建 Blob
      const blob = new Blob(chunks, { type: 'video/mp4' });
      const blobUrl = URL.createObjectURL(blob);
      
      console.log(`视频 ${index + 1} 下载完成，创建 Blob URL:`, blobUrl);
      return blobUrl;
      
    } catch (error) {
      console.error(`下载视频 ${index + 1} 失败:`, error);
      return null;
    }
  };
  */
 
  // 媒体内容组件
  const MediaContent = () => (
    <div className="mt-4 space-y-4">
      {/* 动画视频 */}
      {hasAnimations && false && (
        <div className="space-y-3">
          <h4 className="text-sm font-medium text-gray-700">相关动画</h4>
          <div className="space-y-3">
            {videoBlobUrls.length > 0 ? (
              // 显示已下载的视频
              videoBlobUrls.map((blobUrl, index) => (
                <div key={`animation-${index}`} className="rounded-lg overflow-hidden border border-purple-200 bg-purple-50">
                  <ReactPlayer url={blobUrl} width="100%" height="200" controls />
                </div>
              ))
            ) : (
              // 显示下载进度
              animationUrls.map((_, index) => (
                <div key={`animation-progress-${index}`} className="rounded-lg overflow-hidden border border-purple-200 bg-purple-50 p-4">
                  <div className="flex flex-col items-center justify-center h-[150px]">
                    <div className="w-full bg-gray-200 rounded-full h-2.5 mb-2">
                      <div 
                        className="bg-purple-600 h-2.5 rounded-full" 
                        style={{ width: `${downloadProgress[index]}%` }}
                      ></div>
                    </div>
                    <p className="text-sm text-gray-600">
                      正在下载动画 {index + 1}: {downloadProgress[index]}%
                    </p>
                  </div>
                </div>
              ))
            )}
          </div>
        </div>
      )}
      
      {/* Bilibili 视频 */}
      {hasBilibiliUrls && false && (
        <div className="space-y-3">
          <h4 className="text-sm font-medium text-gray-700">B站视频</h4>
          <div className="space-y-3">
            {props.data.media.bilibiliUrls.map((url, index) => (
              <div key={`bilibili-${index}`} className="rounded-lg overflow-hidden border border-pink-200 bg-pink-50">
                <iframe
                  src={url+"&autoplay=0"}
                  width="100%"
                  height="200"
                  frameBorder="0"
                  allowFullScreen
                  title={`Bilibili Video ${index + 1}`}
                  className="w-full"
                />
              </div>
            ))}
          </div>
        </div>
      )}
    </div>
  );
  
  // 自定义内容，包括文本和媒体
  const customContent = (
    <>
      {/* 文本内容 */}
      {props.data.text && (
        <article className="node-content select-text prose prose-sm max-w-none">
          <MarkdownWithLatex className="scrollbar-hide">{props.data.text || ''}</MarkdownWithLatex>
        </article>
      )}
      
      {/* 媒体内容 */}
      {(hasBilibiliUrls || hasAnimations) && (
        <MediaContent />
      )}
      
      {/* 加载中状态 */}
      {isLoading && !videoBlobUrls.length && !downloadProgress.some(p => p > 0) && (
        <div className="flex justify-center items-center py-4">
          <div className="animate-spin rounded-full h-6 w-6 border-b-2 border-purple-500"></div>
        </div>
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
              {props.data.media.bilibiliUrls.length} 个视频
            </div>
          )}
          {hasAnimations && (
            <div className="inline-flex items-center px-2 py-1 text-xs font-medium text-purple-700 bg-purple-100 rounded">
              {props.data.media.animationObjectNames.length} 个动画
            </div>
          )}
        </div>
      }
    />
  );
}

export default KnowledgeDetailNode; 