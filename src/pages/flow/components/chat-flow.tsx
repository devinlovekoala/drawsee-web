import { Background, BackgroundVariant, ReactFlow } from "@xyflow/react";
import CustomNode from "./ui/custom-node.tsx";
import { NodeVO } from "@/api/types/flow.types.ts";
import VideoPlayer from "@/pages/flow/components/ui/video-player";
import { NODE_TITLES } from "@/common/constant/node-titles.ts";

const nodeTypes = { customNode: CustomNode };

interface ChatFlowProps {
    nodes: NodeVO[];
    edges: { id: string; source: string; target: string }[];
    onSelectNode: (nodeId: number) => void;
}

const ChatFlow: React.FC<ChatFlowProps> = ({ nodes, edges, onSelectNode }) => {
    return (
        <div style={{ width: "100%", height: "100%" }}>
            <ReactFlow
                nodes={nodes.map(node => ({
                    id: node.id.toString(),
                    position: JSON.parse(node.position),
                    data: {
                        title: NODE_TITLES[node.type] || NODE_TITLES["default"],
                        description: node.data,
                        onSelect: () => onSelectNode(node.id),
                        isGeometryNode: node.type === "KnowledgeGeometry"
                    },
                    type: "customNode"
                }))}
                edges={edges}
                nodeTypes={nodeTypes}
            >
                <Background variant={BackgroundVariant.Lines} size={10} />
            </ReactFlow>
            {nodes.map(node => node.type === "KnowledgeGeometry" && (
                <div key={node.id} className="video-container">
                    <VideoPlayer taskId={node.id} />
                </div>
            ))}
        </div>
    );
};

export default ChatFlow;