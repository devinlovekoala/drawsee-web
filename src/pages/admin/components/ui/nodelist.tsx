import Nodecard from "./nodecard";
import {KnowledgeNode} from "@/api/types/knowledge.types.ts";

interface NodeListProps {
    nodes: KnowledgeNode[];
    onEdit: (node: KnowledgeNode) => void;
    onAddChild: (parent: KnowledgeNode) => void;
}

const Nodelist = ({ nodes, onEdit, onAddChild }: NodeListProps) => {
    return (
        <div className="space-y-4">
            {nodes.filter((n) => !n.childrenIds.length).map((node) => (
                <Nodecard key={node.id} node={node} onEdit={onEdit} onAddChild={onAddChild} />
            ))}
        </div>
    );
};

export default Nodelist;
