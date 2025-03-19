import {Handle, Position} from '@xyflow/react';
import { ExtendedNodeProps } from './base/BaseNode';

function RootNode({ showSourceHandle = true, selected }: ExtendedNodeProps<'root'>) {
  return (
    <div 
      className={`root-node ${selected ? 'root-node-selected root-node-pulse' : ''}`}
    >
      <RootSvg className={`root-node-icon ${selected ? 'selected' : 'default'}`} />
      {showSourceHandle && (
        <Handle 
          type="source" 
          position={Position.Bottom} 
          className={`node-handle ${selected ? 'selected' : ''}`}
        />
      )}
    </div>
  );
}

const RootSvg = ({className}: {className: string}) => {
  return (
    <svg stroke="currentColor" fill="none" strokeWidth="2" viewBox="0 0 24 24" strokeLinecap="round"
         strokeLinejoin="round" className={className}
         height="1em" width="1em" xmlns="http://www.w3.org/2000/svg">
      <path d="M6 3v12"></path>
      <path d="M18 9a3 3 0 1 0 0-6 3 3 0 0 0 0 6z"></path>
      <path d="M6 21a3 3 0 1 0 0-6 3 3 0 0 0 0 6z"></path>
      <path d="M15 6a9 9 0 0 0-9 9"></path>
      <path d="M18 15v6"></path>
      <path d="M21 18h-6"></path>
    </svg>
  );
};

export default RootNode;
