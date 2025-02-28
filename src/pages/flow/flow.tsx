import { useState } from "react";
import { AppSidebar } from "@/pages/flow/components/app-sidebar";
import {
  Breadcrumb,
  BreadcrumbItem,
  BreadcrumbLink,
  BreadcrumbList,
  BreadcrumbPage,
  BreadcrumbSeparator,
} from "@/pages/flow/components/ui/breadcrumb";
import { Separator } from "@/pages/flow/components/ui/separator";
import {
  SidebarInset,
  SidebarProvider,
  SidebarTrigger,
} from "@/pages/flow/components/ui/sidebar";
import ChatFlow from "@/pages/flow/components/chat-flow";
import { Input } from "@/pages/flow/components/ui/input";
import { Button } from "@/pages/flow/components/ui/button";
import { createAiTask, getNodes } from "@/api/methods/flow.methods";
import { NodeVO } from "@/api/types/flow.types";

function Flow() {
  const [question, setQuestion] = useState("");
  const [nodes, setNodes] = useState<NodeVO[]>([]);
  const [edges, setEdges] = useState<{ id: string; source: string; target: string; }[]>([]);
  const [selectedNodeId, setSelectedNodeId] = useState<number | null>(null);

  const handleInputChange = (e: React.ChangeEvent<HTMLInputElement>) => {
    setQuestion(e.target.value);
  };

  const handleSubmit = async () => {
    if (!question || selectedNodeId === null) return;

    try {
      const response = await createAiTask(1, selectedNodeId, question); // 假设 convId 为 1
      const newNodes = await getNodes(response.convId);
      setNodes(newNodes);
      // 构造边
      const newEdges = newNodes.map((node) => ({
        id: `e1-${node.id}`,
        source: "1",
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
                    <BreadcrumbLink href="#">
                      Building Your Application
                    </BreadcrumbLink>
                  </BreadcrumbItem>
                  <BreadcrumbSeparator className="hidden md:block" />
                  <BreadcrumbItem>
                    <BreadcrumbPage>Data Fetching</BreadcrumbPage>
                  </BreadcrumbItem>
                </BreadcrumbList>
              </Breadcrumb>
            </div>
          </header>
          <div className="flex flex-1 flex-col gap-4 p-4 pt-0">
            <ChatFlow nodes={nodes} edges={edges} onSelectNode={handleSelectNode} />
            <div className="mt-4 flex">
              <Input
                  type="text"
                  placeholder="请输入内容..."
                  className="w-full"
                  value={question}
                  onChange={handleInputChange}
              />
              <Button
                  onClick={handleSubmit}
                  variant="default"
                  size="default"
                  className="ml-2"
              >
                提交
              </Button>
            </div>
          </div>
        </SidebarInset>
      </SidebarProvider>
  );
}

export default Flow;