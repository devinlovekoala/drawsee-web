import { NodeProps, Position, Handle } from 'reactflow';
import { CircuitElement } from '../../../api/types/element.types';
import { ComponentVisualConfig } from '../../../config/componentVisual';

// 自定义节点组件
interface CircuitNodeData {
    element: CircuitElement;
    onNodeClick: (id: string) => void;
}

const CircuitNode = ({ data, id }: NodeProps<CircuitNodeData>) => {
    const config = ComponentVisualConfig[data.element.type];
    
    const handleElementDoubleClick = (e: React.MouseEvent<HTMLDivElement>) => {
        // 阻止事件冒泡，避免触发拖拽或选择
        e.stopPropagation();
        // 调用父组件传入的点击处理函数
        data.onNodeClick(id);
    };
    
    return (
        <div className="circuit-node relative" style={{ width: config.width, height: config.height }}>
            {/* 渲染端口 */}
            {data.element.ports.map(port => (
                <Handle
                    key={port.id}
                    type={port.type === 'input' ? 'target' : 'source'}
                    position={
                        port.position.side === 'left' ? Position.Left :
                        port.position.side === 'right' ? Position.Right :
                        port.position.side === 'top' ? Position.Top :
                        Position.Bottom
                    }
                    id={port.id}
                    style={{
                        background: port.type === 'input' ? '#4ADE80' : '#F87171',
                        width: 8,
                        height: 8,
                        position: 'absolute',
                        top: port.position.side === 'top' ? '0%' :
                             port.position.side === 'bottom' ? '100%' :
                             `${port.position.y}%`,
                        left: port.position.side === 'left' ? '0%' :
                              port.position.side === 'top' || port.position.side === 'bottom' ? `${port.position.x}%` :
                              'auto',
                        right: port.position.side === 'right' ? '0%' : 'auto',
                        transform: port.position.side === 'top' ? 'translate(-50%, -50%)' :
                                 port.position.side === 'bottom' ? 'translate(-50%, -50%)' :
                                 port.position.side === 'left' ? 'translate(-50%, -50%)' :
                                 port.position.side === 'right' ? 'translate(50%, -50%)' :
                                 'none',
                        cursor: 'pointer',
                        border: '2px solid white',
                        zIndex: 10,
                    }}
                />
            ))}
            
            {/* 渲染元件主体 */}
            <div 
                className="w-full h-full rounded flex items-center justify-center cursor-pointer"
                style={{ backgroundColor: config.color }}
                onDoubleClick={handleElementDoubleClick}
            >
                {config.svg && (
                    <svg width="24" height="24" viewBox="0 0 60 40" className="text-white">
                        <path d={config.svg} stroke="currentColor" fill="none" strokeWidth="2" />
                    </svg>
                )}
            </div>
            
            {/* 元件标签 */}
            <div className="absolute -bottom-6 left-0 right-0 text-xs text-center text-gray-600">
                {data.element.type}
            </div>
        </div>
    );
};

export default CircuitNode;