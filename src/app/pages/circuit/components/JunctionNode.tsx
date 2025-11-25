import { memo } from 'react';
import { Handle, Position, NodeProps } from 'reactflow';

function JunctionNode({ data }: NodeProps) {
  return (
    <div
      className="junction-node"
      style={{
        width: 14,
        height: 14,
        borderRadius: '50%',
        border: '2px solid #2563EB',
        background: '#fff',
        boxShadow: '0 0 4px rgba(37, 99, 235, 0.4)',
      }}
    >
      <Handle
        type="source"
        position={Position.Left}
        id="port-left"
        style={{ width: 6, height: 6, left: -4 }}
      />
      <Handle
        type="target"
        position={Position.Left}
        id="port-left"
        style={{ width: 6, height: 6, left: -4, top: 4 }}
      />
      <Handle
        type="source"
        position={Position.Right}
        id="port-right"
        style={{ width: 6, height: 6, right: -4 }}
      />
      <Handle
        type="target"
        position={Position.Right}
        id="port-right"
        style={{ width: 6, height: 6, right: -4, top: 4 }}
      />
      <Handle
        type="source"
        position={Position.Top}
        id="port-top"
        style={{ width: 6, height: 6, top: -4 }}
      />
      <Handle
        type="target"
        position={Position.Top}
        id="port-top"
        style={{ width: 6, height: 6, top: -4, left: 4 }}
      />
      <Handle
        type="source"
        position={Position.Bottom}
        id="port-bottom"
        style={{ width: 6, height: 6, bottom: -4 }}
      />
      <Handle
        type="target"
        position={Position.Bottom}
        id="port-bottom"
        style={{ width: 6, height: 6, bottom: -4, left: 4 }}
      />
    </div>
  );
}

export default memo(JunctionNode);
