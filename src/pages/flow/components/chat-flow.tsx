import { Background, BackgroundVariant, ReactFlow } from "@xyflow/react";
import CustomNode from "./ui/custom-node.tsx";
import { NodeVO } from "@/api/types/flow.types.ts";
import VideoPlayer from "@/pages/flow/components/ui/video-player";

const nodeTypes = { customNode: CustomNode };

interface ChatFlowProps {
    nodes: NodeVO[];
    edges: { id: string; source: string; target: string }[];
    onSelectNode: (nodeId: number) => void;
}

const getNodeTitle = (type: string) => {
    switch (type) {
        case "Question":
            return "用户问题";
        case "Answer":
            return "AI 回答";
        case "KnowledgeHeader":
            return "知识点";
        case "KnowledgeName":
            return "知识名称";
        case "KnowledgeBasic":
            return "基本解读";
        case "KnowledgeProblem":
            return "相关问题";
        case "KnowledgeGeometry":
            return "几何意义解读";
        case "KnowledgeBilibili":
            return "相关视频";
        default:
            return "未知节点";
    }
};

const ChatFlow: React.FC<ChatFlowProps> = ({ nodes, edges, onSelectNode }) => {
    return (
        <div style={{ width: "100%", height: "100%" }}>
            <ReactFlow
                nodes={nodes.map(node => ({
                    id: node.id.toString(),
                    position: JSON.parse(node.position),
                    data: {
                        title: getNodeTitle(node.type),
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