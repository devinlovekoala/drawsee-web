import { memo } from 'react';
import { Handle, Position, NodeProps } from 'reactflow';

const handleStyle = { width: 4, height: 4, background: '#2563EB', border: '1px solid #fff' };

function JunctionNode({ data }: NodeProps) {
  return (
    <div
      style={{
        width: 8,
        height: 8,
        borderRadius: '50%',
        background: '#2563EB',
        boxShadow: '0 0 2px rgba(37, 99, 235, 0.6)',
        border: '1px solid #fff',
      }}
      title="连接点"
    >
      <Handle
        type="source"
        position={Position.Left}
        id="port-left"
        style={{ ...handleStyle, left: -3 }}
      />
      <Handle
        type="target"
        position={Position.Left}
        id="port-left"
        style={{ ...handleStyle, left: -3, top: 4 }}
      />
      <Handle
        type="source"
        position={Position.Right}
        id="port-right"
        style={{ ...handleStyle, right: -3 }}
      />
      <Handle
        type="target"
        position={Position.Right}
        id="port-right"
        style={{ ...handleStyle, right: -3, top: 4 }}
      />
      <Handle
        type="source"
        position={Position.Top}
        id="port-top"
        style={{ ...handleStyle, top: -3 }}
      />
      <Handle
        type="target"
        position={Position.Top}
        id="port-top"
        style={{ ...handleStyle, top: -3, left: 4 }}
      />
      <Handle
        type="source"
        position={Position.Bottom}
        id="port-bottom"
        style={{ ...handleStyle, bottom: -3 }}
      />
      <Handle
        type="target"
        position={Position.Bottom}
        id="port-bottom"
        style={{ ...handleStyle, bottom: -3, left: 4 }}
      />
    </div>
  );
}

export default memo(JunctionNode);
