import { useEffect, useState } from "react";
import { Plus } from "lucide-react";
import Nodelist from "./ui/nodelist";
import Nodeform from "./ui/nodeform";
import Nodesearch from "./ui/nodesearch";
import Nodefilter from "./ui/nodefilter";
import { fetchAllKnowledgePoints } from "@/api/methods/knowledge.methods";
import type { KnowledgeNode } from "@/api/types/knowledge.types";
import { Button } from "@/pages/admin/components/ui/button.tsx";

const Knowledgenode = () => {
    const [nodes, setNodes] = useState<KnowledgeNode[]>([]);
    const [editingNode, setEditingNode] = useState<KnowledgeNode | null>(null);
    const [parentNode, setParentNode] = useState<KnowledgeNode | null>(null);

    useEffect(() => {
        fetchAllKnowledgePoints().then(setNodes);
    }, []);

    const handleSearch = (query: string) => {
        setNodes(nodes.filter((node) => node.label.includes(query)));
    };

    const handleFilter = (level: number | null) => {
        setNodes(level === null ? nodes : nodes.filter((node) => node.level === level));
    };

    return (
        <div className="p-6">
            <div className="flex justify-between items-center mb-4">
                <h1 className="text-2xl font-bold">📚 知识节点管理</h1>
                <Button variant="default" size="icon" onClick={() => setParentNode(null)}>
                    <Plus />
                </Button>
            </div>
            <div className="flex gap-4 mb-4">
                <Nodesearch onSearch={handleSearch} />
                <Nodefilter onFilterChange={handleFilter} />
            </div>
            <Nodeform node={editingNode} parentNode={parentNode} onClose={() => setEditingNode(null)} />
            <Nodelist nodes={nodes} onEdit={setEditingNode} onAddChild={setParentNode} />
        </div>
    );
};

export default Knowledgenode;
