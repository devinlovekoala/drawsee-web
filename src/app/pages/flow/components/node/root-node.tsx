import {Handle, Node, NodeProps, Position} from '@xyflow/react';

type RootNodeData = {
  title: string;
}

function RootNode ({data}: NodeProps<Node<RootNodeData, 'root'>>) {
  return (
    <div className="w-24 h-24 rounded-full bg-gradient-to-r from-blue-400 to-blue-600 shadow-lg flex justify-center items-center border-4 border-white">
      <RootSvg className="size-5 group-hover:hidden text-indigo-700 dark:text-indigo-400" />
      <Handle type="source" position={Position.Bottom}/>
    </div>
  );
}

const RootSvg = ({className}: {className: string}) => {
  return (
    <svg stroke="currentColor" fill="none" stroke-width="2" viewBox="0 0 24 24" stroke-linecap="round"
         stroke-linejoin="round" className={className}
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
