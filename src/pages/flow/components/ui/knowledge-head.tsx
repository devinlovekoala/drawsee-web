import React from "react";
import { Handle, Position } from "reactflow";

interface KnowledgeHeadProps {
    data: {
        title: string;
        text: string;
    };
}

const KnowledgeHead: React.FC<KnowledgeHeadProps> = ({ data }) => {
    return (
        <div className="bg-blue-100 shadow-md p-6 rounded-lg border border-blue-300 w-96 text-center">
            <h3 className="font-bold text-lg text-black">{data.title}</h3>
            <p className="mt-2 text-2xl text-gray-800">{data.text}</p>
            <Handle type="source" position={Position.Bottom} />
        </div>
    );
};

export default KnowledgeHead;
