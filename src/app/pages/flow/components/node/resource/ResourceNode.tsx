import './ResourceNode.css';
import BilibiliContent from './components/BilibiliContent';
import AnimationContent from './components/AnimationContent';
import { useEffect, useMemo } from 'react';
import BaseNode, { ExtendedNodeProps } from '../base/BaseNode';
import { FaVideo } from 'react-icons/fa';
import GeneratedAnimationContent from './components/GeneratedAnimationContent';

function ResourceNode({data, ...props}: ExtendedNodeProps<'resource'>) {
  // 为生成的动画节点添加数据变化日志
  useEffect(() => {
    if (data.subtype === 'generated-animation') {
      console.log(`ResourceNode ${props.id} 数据更新:`, {
        objectName: data.objectName,
        progress: data.progress,
        hasFrame: !!data.frame
      });
    }
  }, [data, props.id]);

  const customContent = useMemo(() => {
    if (data.subtype === 'bilibili') {
      return <BilibiliContent urls={data.urls} />;
    } else if (data.subtype === 'animation') {
      return <AnimationContent objectNames={data.objectNames} />;
    } else if (data.subtype === 'generated-animation') {
      return <GeneratedAnimationContent 
        objectName={data.objectName}
        progress={data.progress}
        frame={data.frame}
      />;
    }
    return null;
  }, [data]);

  const footerContent = useMemo(() => {
    return (
      <div className="footer-badges">
        {data.subtype === 'bilibili' && (
          <div className="badge badge-pink">
            <FaVideo className="badge-icon" />
            {data.urls.length} 个视频
          </div>
        )}
        {data.subtype === 'animation' && (
          <div className="badge badge-purple">
            <FaVideo className="badge-icon" />
            {data.objectNames.length} 个动画
          </div>
        )}
        {data.subtype === 'generated-animation' && (
          <div className="badge badge-purple">
            <FaVideo className="badge-icon" />
            {data.objectName ? '生成动画' : '生成中...'}
          </div>
        )}
      </div>
    );
  }, [data]);

  return (
    <BaseNode
      data={data}
      customContent={customContent}
      footerContent={footerContent}
      {...props}
    />
  );
}

export default ResourceNode;
