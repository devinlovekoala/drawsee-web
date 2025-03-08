import React, { useState } from "react";
import {useSSE} from "@/api/sse/useSSE.ts";

interface KnowledgeDetailProps {
    id: string;
    data: {
        title: string;
        text: string;
        media?: {
            animationObjectKeys?: string[];
            bilibiliUrls?: string[];
        };
    };
}

const KnowledgeDetailNode: React.FC<KnowledgeDetailProps> = ({ id, data }) => {
    const [text, setText] = useState(data.text);

    useSSE(`/knowledge-detail/stream?nodeId=${id}`, (parsedData: { type: string; data: { nodeId: string; content: string; }; }) => {
        if (parsedData.type === "text" && parsedData.data.nodeId === id) {
            setText((prevText) => prevText + parsedData.data.content);
        }
    });

    return (
        <div className="knowledge-detail-node">
            <h3>{data.title}</h3>
            <p>{text}</p>
            {data.media?.bilibiliUrls && (
                <div>
                    <h4>相关视频：</h4>
                    {data.media.bilibiliUrls.map((url, index) => (
                        <a key={index} href={url} target="_blank" rel="noopener noreferrer">
                            观看视频 {index + 1}
                        </a>
                    ))}
                </div>
            )}
        </div>
    );
};

export default KnowledgeDetailNode;
