import './ResourceNode.css';
import BilibiliContent from './components/BilibiliContent';
import AnimationContent from './components/AnimationContent';
import { useMemo } from 'react';
import BaseNode, { ExtendedNodeProps } from '../base/BaseNode';
import { FaVideo, FaFilePdf, FaFileWord } from 'react-icons/fa';
import GeneratedAnimationContent from './components/GeneratedAnimationContent';
import { WordDocViewer, PdfViewer } from './components/DocumentContent';

function ResourceNode({data, ...props}: ExtendedNodeProps<'resource'>) {

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
    } else if (data.subtype === 'word') {
      return <WordDocViewer urls={data.urls} />;
    } else if (data.subtype === 'pdf') {
      return <PdfViewer urls={data.urls} />;
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
            生成动画
          </div>
        )}
        {data.subtype === 'word' && (
          <div className="badge badge-blue">
            <FaFileWord className="badge-icon" />
            {data.urls.length} 个Word文档
          </div>
        )}
        {data.subtype === 'pdf' && (
          <div className="badge badge-red">
            <FaFilePdf className="badge-icon" />
            {data.urls.length} 个PDF文档
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
