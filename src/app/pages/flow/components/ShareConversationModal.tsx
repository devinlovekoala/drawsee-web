import { useEffect, useMemo, useState } from "react";
import { X, Copy, Share2, RefreshCcw } from "lucide-react";
import { toast } from "sonner";
import { createConversationShare } from "@/api/methods/flow.methods";
import { ConversationShareVO, CreateConversationShareDTO } from "@/api/types/flow.types";

interface ShareConversationModalProps {
  isOpen: boolean;
  convId: number | null | undefined;
  classId?: string | null;
  onClose: () => void;
}

const ShareConversationModal = ({ isOpen, convId, classId, onClose }: ShareConversationModalProps) => {
  const [allowContinue, setAllowContinue] = useState(true);
  const [isSubmitting, setIsSubmitting] = useState(false);
  const [shareInfo, setShareInfo] = useState<ConversationShareVO | null>(null);

  useEffect(() => {
    if (!isOpen) {
      setShareInfo(null);
      setAllowContinue(true);
      setIsSubmitting(false);
    }
  }, [isOpen]);

  const shareUrl = useMemo(() => {
    if (!shareInfo?.sharePath) return "";
    return `${window.location.origin}${shareInfo.sharePath}`;
  }, [shareInfo]);

  const handleGenerate = async () => {
    if (!convId) {
      toast.error("当前会话不存在，无法分享");
      return;
    }
    setIsSubmitting(true);
    try {
      const payload: CreateConversationShareDTO = {
        allowContinue,
        classId: classId ? Number(classId) : undefined
      };
      const data = await createConversationShare(convId, payload);
      setShareInfo(data);
      toast.success("分享链接已生成");
    } catch (error: any) {
      console.error("生成分享链接失败:", error);
      toast.error("生成分享链接失败，请稍后重试");
    } finally {
      setIsSubmitting(false);
    }
  };

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

  if (!isOpen) return null;

  return (
    <div className="fixed inset-0 z-50 flex items-center justify-center bg-black/50">
      <div className="w-full max-w-lg rounded-xl bg-white p-6 shadow-2xl">
        <div className="mb-4 flex items-center justify-between">
          <div className="flex items-center gap-2">
            <Share2 className="h-5 w-5 text-blue-600" />
            <h3 className="text-lg font-semibold">分享会话</h3>
          </div>
          <button className="btn btn-ghost btn-sm p-0" onClick={onClose}>
            <X className="h-5 w-5" />
          </button>
        </div>

        <div className="space-y-4">
          <div className="rounded-lg border border-blue-100 bg-blue-50/60 p-3 text-sm text-blue-700">
            生成分享链接后，好友可直接预览本会话流程图。
          </div>

          <label className="flex items-center gap-2 text-sm">
            <input
              type="checkbox"
              className="checkbox checkbox-sm"
              checked={allowContinue}
              onChange={(e) => setAllowContinue(e.target.checked)}
            />
            允许继续会话（复制为新会话）
          </label>

          {classId && (
            <div className="text-xs text-base-content/70">
              已关联班级：{classId}
            </div>
          )}

          {shareInfo ? (
            <div className="rounded-lg border border-base-300 bg-base-100 p-3">
              <div className="mb-2 text-xs text-base-content/70">分享链接</div>
              <div className="flex items-center gap-2">
                <input
                  className="input input-bordered input-sm w-full"
                  value={shareUrl}
                  readOnly
                />
                <button className="btn btn-ghost btn-sm" onClick={handleCopy}>
                  <Copy className="h-4 w-4" />
                </button>
              </div>
              <div className="mt-2 text-xs text-base-content/60">
                浏览次数：{shareInfo.viewCount ?? 0}
              </div>
            </div>
          ) : (
            <div className="rounded-lg border border-dashed border-base-300 p-4 text-center text-sm text-base-content/60">
              还未生成分享链接
            </div>
          )}
        </div>

        <div className="mt-6 flex justify-end gap-2">
          <button className="btn btn-ghost" onClick={onClose} disabled={isSubmitting}>
            关闭
          </button>
          <button className="btn btn-primary" onClick={handleGenerate} disabled={isSubmitting}>
            {isSubmitting ? (
              <span className="loading loading-spinner loading-xs"></span>
            ) : shareInfo ? (
              <span className="flex items-center gap-2">
                <RefreshCcw className="h-4 w-4" />
                重新生成
              </span>
            ) : (
              "生成链接"
            )}
          </button>
        </div>
      </div>
    </div>
  );
};

export default ShareConversationModal;
