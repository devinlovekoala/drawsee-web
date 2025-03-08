import { useState } from "react";
import { AppSidebar } from "@/pages/flow/components/app-sidebar";
import {
  Breadcrumb, BreadcrumbItem, BreadcrumbLink, BreadcrumbList, BreadcrumbPage, BreadcrumbSeparator
} from "@/pages/flow/components/ui/breadcrumb";
import { Separator } from "@/pages/flow/components/ui/separator";
import {
  SidebarInset, SidebarProvider, SidebarTrigger
} from "@/pages/flow/components/ui/sidebar";
import ChatFlow from "@/pages/flow/components/chat-flow";
import { createAiTask, getNodes } from "@/api/methods/flow.methods";
import {CreateAiTaskDTO, NodeVO} from "@/api/types/flow.types";
import ChatInput from "@/pages/flow/components/chat-input";

function Flow() {
  const [question] = useState("");
  const [nodes, setNodes] = useState<NodeVO[]>([]);
  const [edges, setEdges] = useState<{ id: string; source: string; target: string; }[]>([]);
  const [selectedNodeId, setSelectedNodeId] = useState<number | null>(null);
  const [mode] = useState<string>("general");
  const [conversationId, setConversationId] = useState<number | null>(null);
  const handleSubmit = async () => {
    if (!question || (!conversationId && selectedNodeId !== null)) return;

    try {
      const requestBody = {
        convI: conversationId,
        parentId: selectedNodeId,
        prompt: question,
        promptParams: { key: "" },
        type: mode,
      };

      const response = await createAiTask(requestBody as CreateAiTaskDTO);
      setConversationId(response.convId);

      const newNodes = await getNodes(response.convId);
      setNodes(newNodes);

      const newEdges = newNodes.map((node) => ({
        id: `e1-${node.id}`,
        source: node.parentId ? node.parentId.toString() : "0",
        target: node.id.toString(),
      }));
      setEdges(newEdges);
    } catch (error) {
      console.error("Error creating task:", error);
    }
  };

  const handleSelectNode = (nodeId: number) => {
    setSelectedNodeId(nodeId);
  };

  return (
      <SidebarProvider>
        <AppSidebar />
        <SidebarInset>
          <header className="flex h-16 shrink-0 items-center gap-2 select-none">
            <div className="flex items-center gap-2 px-4">
              <SidebarTrigger className="-ml-1" />
              <Separator orientation="vertical" className="mr-2 h-4" />
              <Breadcrumb>
                <BreadcrumbList>
                  <BreadcrumbItem className="hidden md:block">
                    <BreadcrumbLink href="#">Choose Answer Mode</BreadcrumbLink>
                  </BreadcrumbItem>
                  <BreadcrumbSeparator className="hidden md:block" />
                  <BreadcrumbItem>
                    <BreadcrumbPage>Continue AITask</BreadcrumbPage>
                  </BreadcrumbItem>
                </BreadcrumbList>
              </Breadcrumb>
            </div>
          </header>
          <div className="flex flex-1 flex-col gap-4 p-4 pt-0">
            <ChatFlow nodes={nodes} edges={edges} onSelectNode={handleSelectNode} />
            <ChatInput onSubmit={handleSubmit} disabled={!conversationId && selectedNodeId === null} />
          </div>
        </SidebarInset>
      </SidebarProvider>
  );
}

export default Flow;
