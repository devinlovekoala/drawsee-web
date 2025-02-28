import { useState, useEffect } from "react";
import { KnowledgeNode } from "@/api/types/knowledge.types";
import { addKnowledgeNode, updateKnowledgeNode } from "@/api/methods/knowledge.methods";
import { Button } from "@/pages/admin/components/ui/button.tsx";

interface NodeFormProps {
    node?: KnowledgeNode | null;
    parentNode?: KnowledgeNode | null;
    onClose: () => void;
}

const Nodeform = ({ node, parentNode, onClose }: NodeFormProps) => {
    const [formData, setFormData] = useState<KnowledgeNode>({
        id: node?.id || "",
        label: node?.label || "",
        names: node?.names || [],
        resources: node?.resources || [],
        level: node?.level || 1,
        childrenIds: node?.childrenIds || [],
        iframeData: node?.iframeData || {
            knowledgeName: "",
            basicLlmExplain: "",
            problemLlmExplain: "",
            geometryLlmExplain: "",
            animationUrls: [],
            bilibiliUrls: [],
            exampleUrls: [],
        },
    });

    useEffect(() => {
        if (node) {
            setFormData({ ...node });
        }
    }, [node]);

    const handleChange = (e: React.ChangeEvent<HTMLInputElement | HTMLTextAreaElement>) => {
        const { name, value } = e.target;

        setFormData((prev) => ({
            ...prev,
            [name]: name.startsWith("iframeData.") ? {
                ...prev.iframeData,
                [name.replace("iframeData.", "")]: value,
            } : value,
        }));
    };

    const handleSubmit = async () => {
        const newNode: KnowledgeNode = {
            id: formData.id || new Date().toISOString(),
            label: formData.label,
            names: formData.names,
            resources: formData.resources,
            level: formData.level,
            childrenIds: [],
            iframeData: formData.iframeData,
        };

        if (node) {
            await updateKnowledgeNode(newNode);
        } else {
            await addKnowledgeNode(newNode);

            if (parentNode) {
                if (newNode.id != null) {
                    parentNode.childrenIds.push(newNode.id);
                }
                await updateKnowledgeNode(parentNode);
            }
        }

        onClose();
        window.location.reload();
    };

    return (
        <div className="mb-4 border p-4 rounded-lg">
            <input
                type="text"
                name="label"
                value={formData.label}
                onChange={handleChange}
                placeholder="知识节点名称"
                className="border rounded p-2 w-full"
            />
            <textarea
                name="iframeData.basicLlmExplain"
                value={formData.iframeData?.basicLlmExplain || ""}
                onChange={handleChange}
                placeholder="基础 LLM 解释"
                className="border rounded p-2 w-full mt-2"
            />
            <div className="mt-2 flex gap-2">
                <Button variant="default" onClick={handleSubmit}>
                    {node ? "更新" : "添加"}
                </Button>
                <Button variant="outline" onClick={onClose}>
                    取消
                </Button>
            </div>
        </div>
    );
};

export default Nodeform;
