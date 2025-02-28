import { useState } from "react";
import { Plus, Edit, Trash, ChevronDown, ChevronUp } from "lucide-react";
import {KnowledgeNode} from "@/api/types/knowledge.types.ts";
import {deleteKnowledgeNodeByName} from "@/api/methods/knowledge.methods.ts";
import { Button } from "@/pages/admin/components/ui/button.tsx";

interface NodeCardProps {
    node: KnowledgeNode;
    onEdit: (node: KnowledgeNode) => void;
    onAddChild: (parent: KnowledgeNode) => void;
}

const Nodecard = ({ node, onEdit, onAddChild }: NodeCardProps) => {
    const [expanded, setExpanded] = useState(false);

    const handleDelete = async () => {
        await deleteKnowledgeNodeByName(node.label);
        window.location.reload();
    };

    return (
        <div className="border rounded-lg p-4 shadow">
            <div className="flex justify-between items-center">
                <h2 className="text-lg font-semibold">{node.label}</h2>
                <div className="flex gap-2">
                    <Button variant="ghost" size="icon" onClick={() => setExpanded(!expanded)}>
                        {expanded ? <ChevronUp /> : <ChevronDown />}
                    </Button>
                    <Button variant="outline" size="icon" onClick={() => onEdit(node)}>
                        <Edit />
                    </Button>
                    <Button variant="destructive" size="icon" onClick={handleDelete}>
                        <Trash />
                    </Button>
                    <Button variant="default" size="icon" onClick={() => onAddChild(node)}>
                        <Plus />
                    </Button>
                </div>
            </div>
            {expanded && (
                <div className="ml-4 mt-2 space-y-2">
                    {node.childrenIds.length ? (
                        node.childrenIds.map((childId) => (
                            <Nodecard
                                key={childId}
                                node={{
                                    id: childId,
                                    label: `子节点 ${childId}`,
                                    names: [],
                                    resources: [],
                                    level: 1,
                                    childrenIds: [],
                                    iframeData: {
                                        knowledgeName: "",
                                        basicLlmExplain: "",
                                        problemLlmExplain: "",
                                        geometryLlmExplain: "",
                                        animationUrls: [],
                                        bilibiliUrls: [],
                                        exampleUrls: []
                                    }
                                }}
                                onEdit={onEdit}
                                onAddChild={onAddChild}
                            />

                        ))
                    ) : (
                        <p className="text-sm text-gray-500">暂无子节点</p>
                    )}
                </div>
            )}
        </div>
    );
};

export default Nodecard;
