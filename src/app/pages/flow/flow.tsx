import {Background, BackgroundVariant, ReactFlow, type Node, type Edge} from "@xyflow/react";
import {Panel, useEdgesState, useNodesState} from "reactflow";
import RootNode from "@/app/pages/flow/components/node/root-node.tsx";
import QueryNode from "@/app/pages/flow/components/node/quary-node.tsx";
import AnswerNode from "@/app/pages/flow/components/node/answer-node.tsx";
import KnowledgeHeadNode from "@/app/pages/flow/components/node/knowledge-head-node.tsx";
import KnowledgeDetailNode from "@/app/pages/flow/components/node/knowledge-detail-node.tsx";
import {useState} from "react";
import {useLocation, useOutletContext} from "react-router-dom";
import {AppContext} from "@/app/app.tsx";
import {useWatcher} from "alova/client";
import {getNodes} from "@/api/methods/flow.methods.ts";

const nodeTypes = {
  'root': RootNode,
  'query': QueryNode,
  'answer': AnswerNode,
  'knowledge-head': KnowledgeHeadNode,
  'knowledge-detail': KnowledgeDetailNode,
};

export type FlowLocationState = {
  convId: number;
  taskId?: number;
};

function Flow() {

  const [nodes, setNodes] = useState<Node[]>([]);
  const [edges, setEdges] = useState<Edge[]>([]);

  const {handleTitleUpdate} = useOutletContext<AppContext>();

  const location = useLocation();
  const {convId, taskId} = location.state as FlowLocationState;

  useWatcher(getNodes(convId), [convId], {immediate: true})
    .onSuccess(({data}) => {
    });

  return (
    <ReactFlow nodes={nodes} edges={edges} nodeTypes={nodeTypes}>
      <Background variant={BackgroundVariant.Lines} size={10}/>
      <Panel position={"bottom-center"}>
        aaa
      </Panel>
    </ReactFlow>
  );
}

export default Flow;