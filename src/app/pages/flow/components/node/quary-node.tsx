import { NodeProps, Node, Handle, Position } from "@xyflow/react";
import ReactMarkdown from "react-markdown";
import remarkGfm from "remark-gfm";

type QueryNodeData = {
	title: string;
	text: string;
}

function QueryNode ({ data }: NodeProps<Node<QueryNodeData, 'query'>>) {
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
}

export default QueryNode;
