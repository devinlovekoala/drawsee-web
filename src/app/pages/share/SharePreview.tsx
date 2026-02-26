import { useEffect, useMemo, useState } from "react";
import { useNavigate, useParams } from "react-router-dom";
import { Background, BackgroundVariant, ReactFlow, type Node as FlowNode, type Edge as FlowEdge } from "@xyflow/react";
import { toast } from "sonner";
import { BrainCircuit, CircuitBoard, Lock, MessageCirclePlus, Sparkles, User } from "lucide-react";
import RootNode from "@/app/pages/flow/components/node/RootNode";
import QueryNode from "@/app/pages/flow/components/node/QueryNode";
import AnswerNode from "@/app/pages/flow/components/node/AnswerNode";
import KnowledgeHeadNode from "@/app/pages/flow/components/node/KnowledgeHeadNode";
import KnowledgeDetailNode from "@/app/pages/flow/components/node/KnowledgeDetailNode";
import CircuitCanvasNode from "@/app/pages/flow/components/node/CircuitCanvasNode";
import CircuitAnalyzeNode from "@/app/pages/flow/components/node/CircuitAnalyzeNode";
import CircuitDetailNode from "@/app/pages/flow/components/node/CircuitDetailNode";
import AnswerPointNode from "@/app/pages/flow/components/node/AnswerPointNode";
import AnswerDetailNode from "@/app/pages/flow/components/node/AnswerDetailNode";
import PdfDocumentNode from "@/app/pages/flow/components/node/PdfDocumentNode";
import PdfAnalysisPointNode from "@/app/pages/flow/components/node/PdfAnalysisPointNode";
import PdfAnalysisDetailNode from "@/app/pages/flow/components/node/PdfAnalysisDetailNode";
import ResourceNode from "@/app/pages/flow/components/node/resource/ResourceNode";
import { FlowContext, FlowLocationState } from "@/app/contexts/FlowContext";
import { getSharedConversation, forkSharedConversation } from "@/api/methods/flow.methods";
import { NodeVO, ShareConversationVO } from "@/api/types/flow.types";
import { LOGIN_FLAG_KEY, SHARE_CONTINUE_TOKEN_KEY } from "@/common/constant/storage-key.constant";
import DrawSeeIcon from "@/assets/svg/昭析.svg";
import "@/app/pages/flow/styles/index.css";

const CompactRootNode = (props: any) => <RootNode {...props} compactMode={true} />;
const CompactQueryNode = (props: any) => <QueryNode {...props} compactMode={true} />;
const CompactAnswerNode = (props: any) => <AnswerNode {...props} compactMode={true} />;
const CompactAnswerPointNode = (props: any) => <AnswerPointNode {...props} compactMode={true} />;
const CompactAnswerDetailNode = (props: any) => <AnswerDetailNode {...props} compactMode={true} />;
const CompactKnowledgeHeadNode = (props: any) => <KnowledgeHeadNode {...props} compactMode={true} />;
const CompactKnowledgeDetailNode = (props: any) => <KnowledgeDetailNode {...props} compactMode={true} />;
const CompactCircuitCanvasNode = (props: any) => <CircuitCanvasNode {...props} compactMode={true} />;
const CompactCircuitAnalyzeNode = (props: any) => <CircuitAnalyzeNode {...props} compactMode={true} />;
const CompactCircuitDetailNode = (props: any) => <CircuitDetailNode {...props} compactMode={true} />;
const CompactResourceNode = (props: any) => <ResourceNode {...props} compactMode={true} />;
const CompactPdfDocumentNode = (props: any) => <PdfDocumentNode {...props} compactMode={true} />;
const CompactPdfAnalysisPointNode = (props: any) => <PdfAnalysisPointNode {...props} compactMode={true} />;
const CompactPdfAnalysisDetailNode = (props: any) => <PdfAnalysisDetailNode {...props} compactMode={true} />;

const nodeTypes = {
  root: CompactRootNode,
  query: CompactQueryNode,
  answer: CompactAnswerNode,
  "answer-point": CompactAnswerPointNode,
  "answer-detail": CompactAnswerDetailNode,
  ANSWER_POINT: CompactAnswerPointNode,
  ANSWER_DETAIL: CompactAnswerDetailNode,
  "knowledge-head": CompactKnowledgeHeadNode,
  "knowledge-detail": CompactKnowledgeDetailNode,
  resource: CompactResourceNode,
  "circuit-canvas": CompactCircuitCanvasNode,
  "circuit-analyze": CompactCircuitAnalyzeNode,
  "circuit-detail": CompactCircuitDetailNode,
  PDF_DOCUMENT: CompactPdfDocumentNode,
  PDF_ANALYSIS_POINT: CompactPdfAnalysisPointNode,
  PDF_ANALYSIS_DETAIL: CompactPdfAnalysisDetailNode,
  "pdf-circuit-point": CompactPdfAnalysisPointNode,
  "pdf-circuit-detail": CompactPdfAnalysisDetailNode
} as const;

function normalizeNodeType(apiType: string | undefined | null): string {
  if (!apiType) return "query";
  const apiTypeStr = String(apiType);
  const t = apiTypeStr.toUpperCase();
  switch (t) {
    case "QUERY":
      return "query";
    case "PDF_CIRCUIT_POINT":
    case "PDF-CIRCUIT-POINT":
      return "pdf-circuit-point";
    case "PDF_CIRCUIT_DETAIL":
    case "PDF-CIRCUIT-DETAIL":
      return "pdf-circuit-detail";
    case "PDF_CIRCUIT_DOCUMENT":
    case "PDF_DOCUMENT":
      return "PDF_DOCUMENT";
    case "PDF_ANALYSIS_POINT":
      return "PDF_ANALYSIS_POINT";
    case "PDF_ANALYSIS_DETAIL":
      return "PDF_ANALYSIS_DETAIL";
    case "CIRCUIT-ANALYZE":
      return "circuit-analyze";
    default:
      return apiTypeStr;
  }
}

const buildFlowNodes = (nodes: NodeVO[]): FlowNode[] =>
  nodes.map((node) => ({
    id: String(node.id),
    type: normalizeNodeType(node.type),
    position: node.position,
    data: {
      ...node.data,
      parentId: node.parentId,
      convId: node.convId,
      userId: node.userId,
      createdAt: node.createdAt,
      updatedAt: node.updatedAt
    },
    draggable: false
  }));

const buildFlowEdges = (nodes: NodeVO[]): FlowEdge[] =>
  nodes
    .filter((node) => node.parentId !== null && node.parentId !== undefined)
    .map((node) => ({
      id: `edge-${node.parentId}-${node.id}`,
      source: String(node.parentId),
      target: String(node.id),
      type: "straight",
      animated: false,
      selectable: false,
      style: {
        stroke: "#999",
        strokeWidth: 5,
        strokeLinecap: "round",
        strokeLinejoin: "round",
        strokeDasharray: "25 30",
        strokeOpacity: 0.85
      }
    }));

export default function SharePreview() {
  const { shareToken } = useParams<{ shareToken: string }>();
  const navigate = useNavigate();
  const [loading, setLoading] = useState(true);
  const [data, setData] = useState<ShareConversationVO | null>(null);
  const [isContinuing, setIsContinuing] = useState(false);
  const [isLogin, setIsLogin] = useState<boolean>(sessionStorage.getItem(LOGIN_FLAG_KEY) === "true");

  useEffect(() => {
    if (!shareToken) return;
    const load = async () => {
      setLoading(true);
      try {
        const res = await getSharedConversation(shareToken);
        setData(res);
      } catch (error) {
        console.error("获取分享会话失败:", error);
        toast.error("分享链接无效或已失效");
      } finally {
        setLoading(false);
      }
    };
    load();
  }, [shareToken]);
  
  useEffect(() => {
    const syncLogin = () => {
      setIsLogin(sessionStorage.getItem(LOGIN_FLAG_KEY) === "true");
    };
    window.addEventListener("storage", syncLogin);
    return () => window.removeEventListener("storage", syncLogin);
  }, []);

  const nodes = useMemo(() => (data ? buildFlowNodes(data.nodes) : []), [data]);
  const edges = useMemo(() => (data ? buildFlowEdges(data.nodes) : []), [data]);

  const shareUrl = data ? `${window.location.origin}${data.share.sharePath}` : "";

  const handleCopy = async () => {
    if (!shareUrl) return;
    try {
      await navigator.clipboard.writeText(shareUrl);
      toast.success("分享链接已复制");
    } catch (error) {
      console.error("复制失败:", error);
      toast.error("复制失败，请手动复制");
    }
  };

  const handleContinue = async () => {
    if (!shareToken || !data?.share.allowContinue) return;
    if (!isLogin) {
      sessionStorage.setItem(SHARE_CONTINUE_TOKEN_KEY, shareToken);
      toast.info("请先登录，再继续会话");
      navigate("/");
      return;
    }
    setIsContinuing(true);
    try {
      const res = await forkSharedConversation(shareToken);
      navigate("/flow", { state: { convId: res.conversation.id } as FlowLocationState });
    } catch (error) {
      console.error("继续会话失败:", error);
      toast.error("继续会话失败，请稍后重试");
    } finally {
      setIsContinuing(false);
    }
  };

  return (
    <FlowContext.Provider
      value={{
        chat: () => {},
        convId: null,
        isChatting: false,
        addChatTask: () => {
          if (!isLogin) {
            toast.info("登录后可进行追问与高级操作");
          }
        },
        applySuggestion: () => {}
      }}
    >
      <div className="min-h-screen bg-neutral-50">
        <div className="flex min-h-screen">
          <aside className="hidden w-64 flex-shrink-0 border-r border-neutral-200 bg-gradient-to-b from-neutral-50 to-neutral-100 md:flex md:flex-col">
            <div className="border-b border-neutral-200 px-5 py-4">
              <div className="flex items-center gap-2">
                <img className="h-7 w-7" src={DrawSeeIcon} alt="DrawSee" />
                <div className="text-lg font-semibold text-neutral-900">昭析</div>
              </div>
              <div className="mt-1 text-xs text-neutral-500">分享会话入口</div>
            </div>
            <div className="flex-1 px-4 py-4 text-sm text-neutral-700">
              <div className="mb-4 text-xs uppercase tracking-widest text-neutral-400">功能导航</div>
              <div className="space-y-2">
                <div className="flex items-center justify-between rounded-lg bg-white px-3 py-2 shadow-sm">
                  <div className="flex items-center gap-2">
                    <BrainCircuit className="h-4 w-4 text-blue-600" />
                    电路智能分析
                  </div>
                  <Lock className="h-4 w-4 text-neutral-400" />
                </div>
                <div className="flex items-center justify-between rounded-lg bg-white px-3 py-2 shadow-sm">
                  <div className="flex items-center gap-2">
                    <CircuitBoard className="h-4 w-4 text-indigo-600" />
                    实验任务分析
                  </div>
                  <Lock className="h-4 w-4 text-neutral-400" />
                </div>
                <div className="flex items-center justify-between rounded-lg bg-white px-3 py-2 shadow-sm">
                  <div className="flex items-center gap-2">
                    <MessageCirclePlus className="h-4 w-4 text-emerald-600" />
                    会话历史
                  </div>
                  <Lock className="h-4 w-4 text-neutral-400" />
                </div>
                <div className="flex items-center justify-between rounded-lg bg-white px-3 py-2 shadow-sm">
                  <div className="flex items-center gap-2">
                    <Sparkles className="h-4 w-4 text-purple-600" />
                    智能体广场
                  </div>
                  <Lock className="h-4 w-4 text-neutral-400" />
                </div>
              </div>
            </div>
            <div className="border-t border-neutral-200 px-4 py-4 text-xs text-neutral-500">
              登录后解锁全部功能
            </div>
          </aside>

          <div className="flex flex-1 flex-col">
            <header className="border-b border-base-200 bg-white px-6 py-4">
              <div className="flex flex-col gap-4 md:flex-row md:items-center md:justify-between">
                <div>
                  <div className="text-xs text-base-content/60">分享会话</div>
                  <h1 className="text-xl font-semibold text-base-content">
                    {data?.conversation?.title || "未命名会话"}
                  </h1>
                  <div className="mt-1 text-xs text-base-content/60">
                    浏览次数：{data?.share?.viewCount ?? 0}
                  </div>
                </div>
                <div className="flex flex-wrap items-center gap-2">
                  <button className="btn btn-ghost btn-sm" onClick={handleCopy}>
                    复制分享链接
                  </button>
                  {data?.share?.allowContinue && (
                    <button
                      className="btn btn-primary btn-sm"
                      onClick={handleContinue}
                      disabled={isContinuing}
                    >
                      {isContinuing ? (
                        <span className="loading loading-spinner loading-xs"></span>
                      ) : (
                        "继续会话"
                      )}
                    </button>
                  )}
                  {!isLogin && (
                    <button
                      className="btn btn-outline btn-sm"
                      onClick={() => navigate("/")}
                    >
                      <User className="mr-1 h-4 w-4" />
                      登录/注册
                    </button>
                  )}
                </div>
              </div>
            </header>

            <div className="px-6 pt-4">
              {!isLogin && (
                <div className="rounded-xl border border-blue-100 bg-blue-50 px-4 py-3 text-sm text-blue-800">
                  当前为分享访问模式。登录后可进行节点追问、保存到会话列表、使用侧边栏高级功能。
                </div>
              )}
            </div>

            <main className="flex-1 px-6 pb-6 pt-4">
              <div className="relative h-full min-h-[520px] overflow-hidden rounded-2xl border border-base-200 bg-white shadow-sm">
                {loading ? (
                  <div className="flex h-full items-center justify-center">
                    <span className="loading loading-spinner loading-lg text-primary"></span>
                  </div>
                ) : (
                  <ReactFlow
                    nodes={nodes}
                    edges={edges}
                    nodeTypes={nodeTypes}
                    fitView
                    nodesDraggable={false}
                    nodesConnectable={false}
                    elementsSelectable={true}
                    minZoom={0.05}
                    maxZoom={3}
                    defaultEdgeOptions={{
                      type: "straight",
                      animated: false,
                      selectable: false
                    }}
                    proOptions={{ hideAttribution: true }}
                  >
                    <Background variant={BackgroundVariant.Lines} size={10} />
                  </ReactFlow>
                )}
              </div>
            </main>
          </div>
        </div>
      </div>
    </FlowContext.Provider>
  );
}
