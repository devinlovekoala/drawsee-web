import React from "react";
import { Handle, Position } from "reactflow";
import ReactMarkdown from "react-markdown";
import remarkGfm from "remark-gfm";

interface KnowledgeDetailProps {
    data: {
        title: string;
        text: string;
        media?: string[];
    };
}

const KnowledgeDetail: React.FC<KnowledgeDetailProps> = ({ data }) => {
    return (
        <div className="bg-green-100 shadow-md p-4 rounded-lg border border-green-300 w-96">
            <h3 className="font-bold text-lg text-black">{data.title}</h3>

            <ReactMarkdown
                remarkPlugins={[remarkGfm]}
                components={{
                    p: ({ children }) => <p className="mt-2 text-gray-800">{children}</p>,
                }}
            >
                {data.text}
            </ReactMarkdown>

            {data.media && data.media.length > 0 && (
                <div className="mt-2 text-blue-600">
                    <h4 className="font-bold">相关资源：</h4>
                    <ul className="text-sm">
                        {data.media.map((url, idx) => (
                            <li key={idx}>
                                <a href={url} target="_blank" rel="noopener noreferrer" className="underline text-blue-500">
                                    {url}
                                </a>
                            </li>
                        ))}
                    </ul>
                </div>
            )}

            <Handle type="source" position={Position.Bottom} />
        </div>
    );
};

export default KnowledgeDetail;
