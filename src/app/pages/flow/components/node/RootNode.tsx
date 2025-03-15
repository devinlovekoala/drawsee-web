import {Handle, Node, NodeProps, Position} from '@xyflow/react';
import { ExtendedNodeProps } from './base/BaseNode';
import { NodeType } from '@/api/types/flow.types';

// 定义根节点选中样式
const rootNodeSelectedStyles = `
@keyframes pulseRootHighlight {
  0% {
    box-shadow: 0 0 0 0 rgba(79, 70, 229, 0.6);
  }
  70% {
    box-shadow: 0 0 0 15px rgba(79, 70, 229, 0);
  }
  100% {
    box-shadow: 0 0 0 0 rgba(79, 70, 229, 0);
  }
}

.root-node-selected {
  border: 4px solid #4F46E5 !important;
  box-shadow: 0 0 0 6px rgba(79, 70, 229, 0.3), 0 8px 16px rgba(0, 0, 0, 0.1) !important;
  transform: scale(1.05);
  transition: all 0.3s ease-in-out;
}

.root-node-pulse {
  animation: pulseRootHighlight 2s infinite;
}
`;

type RootNodeData = {
  title: string;
}

function RootNode({ data, showSourceHandle = true, selected }: ExtendedNodeProps<'root'>) {
  return (
    <>
      <style>{rootNodeSelectedStyles}</style>
      <div 
        className={`w-24 h-24 rounded-full bg-gradient-to-r from-blue-400 to-blue-600 shadow-lg flex justify-center items-center border-4 border-white transition-all duration-300 ${selected ? 'root-node-selected root-node-pulse' : ''}`}
      >
        <RootSvg className={`size-5 ${selected ? 'text-white scale-125' : 'text-indigo-700 dark:text-indigo-400'} transition-all duration-300`} />
        {showSourceHandle && (
          <Handle 
            type="source" 
            position={Position.Bottom} 
            className={`w-3 h-3 ${selected ? 'bg-indigo-500' : 'bg-blue-500'} transition-colors duration-200`}
          />
        )}
      </div>
    </>
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
