import {type Node, NodeProps} from "@xyflow/react";

type KnowledgeHeadNodeData = {
  title: string;
};

function KnowledgeHeadNode ({ data }: NodeProps<Node<KnowledgeHeadNodeData, 'knowledge-head'>>) {
  return (
    <div className="knowledge-head-node">
        <h3>{data.title}</h3>
        <button onClick={() => {}}>继续生成</button>
    </div>
  );
}

export default KnowledgeHeadNode;
