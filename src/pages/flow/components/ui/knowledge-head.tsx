import React from "react";

interface KnowledgeHeadProps {
    data: { title: string };
    onGenerateDetail: () => void;
}

const KnowledgeHeadNode: React.FC<KnowledgeHeadProps> = ({ data, onGenerateDetail }) => {
    return (
        <div className="knowledge-head-node">
            <h3>{data.title}</h3>
            <button onClick={onGenerateDetail}>继续生成</button>
        </div>
    );
};

export default KnowledgeHeadNode;
