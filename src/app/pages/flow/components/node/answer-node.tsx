import { useState } from "react";
import { Handle, Position } from "reactflow";
import ReactMarkdown from "react-markdown";
import remarkGfm from "remark-gfm";
import { FaGlobe, FaChevronDown, FaChevronUp } from "react-icons/fa";
import {type Node, NodeProps} from "@xyflow/react";

type AnswerNodeData = {
  title: string;
  text: string;
  search?: string[];
  think?: string;
};

function AnswerNode ({data}: NodeProps<Node<AnswerNodeData, 'answer'>>) {
    const [thinkOpen, setThinkOpen] = useState(false);
    const [searchOpen, setSearchOpen] = useState(false);

    return (
        <div className="bg-gray-100 shadow-md p-4 rounded-lg border border-gray-300 w-96">
            <h3 className="font-bold text-lg text-black">{data.title}</h3>

            {data.think && (
                <div className="mt-2 text-gray-500 cursor-pointer" onClick={() => setThinkOpen(!thinkOpen)}>
                    <span>💭 模型思考 {thinkOpen ? <FaChevronUp /> : <FaChevronDown />}</span>
                    {thinkOpen && <p className="mt-1 text-sm">{data.think}</p>}
                </div>
            )}

            <ReactMarkdown
                remarkPlugins={[remarkGfm]}
                components={{
                    p: ({ children }) => <p className="mt-2 text-gray-800">{children}</p>,
                }}
            >
                {data.text}
            </ReactMarkdown>

            {data.search && data.search.length > 0 && (
                <div className="mt-2 cursor-pointer text-blue-600" onClick={() => setSearchOpen(!searchOpen)}>
                    <FaGlobe className="inline mr-1" /> 搜索来源 {searchOpen ? <FaChevronUp /> : <FaChevronDown />}
                    {searchOpen && (
                        <ul className="mt-1 text-sm">
                            {data.search.map((url, idx) => (
                                <li key={idx}>
                                    <a href={url} target="_blank" rel="noopener noreferrer" className="underline text-blue-500">
                                        {url}
                                    </a>
                                </li>
                            ))}
                        </ul>
                    )}
                </div>
            )}

            <Handle type="source" position={Position.Bottom} />
        </div>
    );
}

export default AnswerNode;
