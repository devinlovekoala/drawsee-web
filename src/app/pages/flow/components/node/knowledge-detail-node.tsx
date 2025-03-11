import {NodeProps, type Node} from "@xyflow/react";

type KnowledgeDetailNodeData = {
	title: string;
	text: string;
	media?: {
		animationObjectKeys?: string[];
		bilibiliUrls?: string[];
	};
};

function KnowledgeDetailNode ({ data }: NodeProps<Node<KnowledgeDetailNodeData, 'knowledge-detail'>>) {
	return (
		<div className="knowledge-detail-node">
			<h3>{data.title}</h3>
			<p>{data.text}</p>
			{data.media?.bilibiliUrls && (
				<div>
					<h4>相关视频：</h4>
					{data.media.bilibiliUrls.map((url, index) => (
						<a key={index} href={url} target="_blank" rel="noopener noreferrer">
							观看视频 {index + 1}
						</a>
					))}
				</div>
			)}
		</div>
	);
}

export default KnowledgeDetailNode;
