import React from "react";
import { Handle, Position } from "reactflow";
import ReactMarkdown from "react-markdown";
import remarkGfm from "remark-gfm";

interface QueryNodeProps {
    data: {
        title: string;
        text: string;
    };
}

const QueryNode: React.FC<QueryNodeProps> = ({ data }) => {
    return (
        <div className="bg-white shadow-md p-4 rounded-lg border border-gray-300 w-80">
            <h3 className="font-bold text-lg text-black">{data.title}</h3>
            <ReactMarkdown
                remarkPlugins={[remarkGfm]}
                components={{
                    p: ({ children }) => <p className="mt-2 text-gray-800">{children}</p>,
                }}
            >
                {data.text}
            </ReactMarkdown>
            <Handle type="source" position={Position.Bottom} />
        </div>
    );
};

export default QueryNode;
