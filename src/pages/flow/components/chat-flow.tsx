import { Background, BackgroundVariant, ReactFlow } from "@xyflow/react";
import { useEffect, useState } from "react";
import { NodeVO } from "@/api/types/flow.types.ts";
import RootNode from "./ui/root";
import QueryNode from "@/pages/flow/components/ui/quary.tsx";
import AnswerNode from "@/pages/flow/components/ui/answer.tsx";
import KnowledgeHeadNode from "@/pages/flow/components/ui/knowledge-head.tsx";
import KnowledgeDetailNode from "@/pages/flow/components/ui/knowledge-detail.tsx";
import MediumNode from "@/pages/flow/components/ui/medium.tsx";
import { getNodes } from "@/api/methods/flow.methods.ts";
import {useSSE} from "@/api/sse/useSSE.ts";

const nodeTypes = {
    root: RootNode,
    query: QueryNode,
    answer: AnswerNode,
    knowledgeHead: KnowledgeHeadNode,
    knowledgeDetail: KnowledgeDetailNode,
    medium: MediumNode,
};

interface ChatFlowProps {
    convId: number | null;
    nodes: NodeVO[];
    edges: { id: string; source: string; target: string }[];
    onSelectNode: (nodeId: number) => void;
}

export default function ChatFlow({ convId, edges }: ChatFlowProps) {
    const [streamingNodes, setStreamingNodes] = useState<NodeVO[]>([]);

    useEffect(() => {
        if (!convId) return;

        const fetchNodes = async () => {
            const fetchedNodes = await getNodes(convId);
            setStreamingNodes(fetchedNodes);
        };

        fetchNodes();
    }, [convId]);

    // SSE 监听
    useSSE(`/flow/stream?convId=${convId}`, (parsedData) => {
        if (parsedData.type === "node") {
            setStreamingNodes((prevNodes) => [...prevNodes, parsedData.data]);
        }

        if (parsedData.type === "text") {
            setStreamingNodes((prevNodes) =>
                prevNodes.map((node) =>
                    node.id === parsedData.data.nodeId
                        ? { ...node, data: { ...node.data, text: (node.data.text || "") + parsedData.data.content } }
                        : node
                )
            );
        }
    });

    return (
        <div style={{ width: "100%", height: "100%" }}>
            <ReactFlow nodes={streamingNodes} edges={edges} nodeTypes={nodeTypes}>
                <Background variant={BackgroundVariant.Lines} size={10} />
            </ReactFlow>
        </div>
    );
};

