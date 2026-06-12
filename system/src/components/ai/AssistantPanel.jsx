import { useEffect, useRef, useState } from "react";
import { Loader2, Plus, Send, Trash2, X } from "lucide-react";
import { cn } from "@/lib/utils";
import { Button } from "@/components/ui/button";
import { useAiAssistant } from "@/hooks/useAiAssistant";
import { MessageBubble } from "./MessageBubble";
import { SuggestedPrompts } from "./SuggestedPrompts";

const HEADER_TITLE = {
  admin: "Trợ lý quản lý",
  manager: "Trợ lý quản lý",
  sales: "Trợ lý của tôi",
};

const PLACEHOLDER = {
  admin: "Hỏi về doanh thu, công nợ, tồn kho...",
  manager: "Hỏi về doanh thu, công nợ, tồn kho...",
  sales: "Hỏi về báo giá, đơn của tôi...",
};

function formatThreadTime(iso) {
  if (!iso) return "";
  try {
    return new Date(iso).toLocaleString("vi-VN", {
      day: "2-digit",
      month: "2-digit",
      hour: "2-digit",
      minute: "2-digit",
    });
  } catch {
    return "";
  }
}

/**
 * Drawer chính chứa sidebar threads + messages + composer ( §10.2).
 *
 * @param {{ role: "admin" | "manager" | "sales"; open: boolean; onClose: () => void }} props
 */
export function AssistantPanel({ role, open, onClose }) {
  const ai = useAiAssistant();
  const [draft, setDraft] = useState("");
  const [confirmDeleteId, setConfirmDeleteId] = useState(/** @type {number | null} */ (null));
  const messagesRef = useRef(/** @type {HTMLDivElement | null} */ (null));

  useEffect(() => {
    if (!open) return;
    const el = messagesRef.current;
    if (el) el.scrollTop = el.scrollHeight;
  }, [open, ai.messages.length, ai.pending]);

  useEffect(() => {
    function onKey(e) {
      if (e.key === "Escape" && open) onClose();
    }
    window.addEventListener("keydown", onKey);
    return () => window.removeEventListener("keydown", onKey);
  }, [open, onClose]);

  if (!open) return null;

  const handleSend = async (text) => {
    const value = String(text ?? draft).trim();
    if (!value || ai.pending) return;
    setDraft("");
    await ai.send(value);
  };

  const onSubmit = (e) => {
    e.preventDefault();
    handleSend();
  };

  const onKeyDown = (e) => {
    if (e.key === "Enter" && !e.shiftKey) {
      e.preventDefault();
      handleSend();
    }
  };

  return (
    <div className="fixed inset-0 z-50 flex" role="dialog" aria-modal="true" aria-label={HEADER_TITLE[role]}>
      <div className="flex-1 bg-black/40" onClick={onClose} aria-hidden />
      <aside
        className={cn(
          "flex h-full w-full max-w-md flex-col border-l border-slate-200 bg-white shadow-2xl dark:border-slate-800 dark:bg-slate-950",
          "sm:max-w-[420px]"
        )}
      >
        <header className="flex items-center justify-between border-b border-slate-200 px-4 py-3 dark:border-slate-800">
          <div className="flex items-center gap-2">
            <h2 className="text-sm font-semibold text-slate-900 dark:text-slate-100">
              {HEADER_TITLE[role] ?? "Trợ lý"}
            </h2>
            {ai.pending ? <Loader2 className="h-4 w-4 animate-spin text-primary" aria-hidden /> : null}
          </div>
          <div className="flex items-center gap-1">
            <Button variant="ghost" size="sm" onClick={() => ai.newThread()} disabled={ai.pending}>
              <Plus className="h-4 w-4" /> Phiên mới
            </Button>
            <Button variant="ghost" size="icon" onClick={onClose} aria-label="Đóng">
              <X className="h-4 w-4" />
            </Button>
          </div>
        </header>

        <div className="flex min-h-0 flex-1">
          <nav className="hidden w-44 shrink-0 flex-col border-r border-slate-200 bg-slate-50/60 dark:border-slate-800 dark:bg-slate-900/40 md:flex">
            <div className="flex items-center justify-between px-3 py-2 text-[11px] font-medium uppercase tracking-wide text-slate-500 dark:text-slate-400">
              <span>Phiên gần đây</span>
            </div>
            <div className="flex-1 overflow-y-auto">
              {ai.threads.length === 0 ? (
                <p className="px-3 py-4 text-xs text-slate-500 dark:text-slate-400">Chưa có phiên nào.</p>
              ) : (
                <ul className="space-y-0.5 px-1.5 pb-2">
                  {ai.threads.map((t) => {
                    const active = ai.activeThreadId === t.id;
                    return (
                      <li key={t.id}>
                        <button
                          type="button"
                          onClick={() => ai.selectThread(t.id)}
                          className={cn(
                            "group relative w-full rounded-md px-2 py-1.5 text-left text-xs transition-colors",
                            active
                              ? "bg-primary/10 text-primary"
                              : "text-slate-700 hover:bg-slate-200/70 dark:text-slate-200 dark:hover:bg-slate-800"
                          )}
                        >
                          <span className="block truncate font-medium">{t.title || "Phiên không tiêu đề"}</span>
                          <span className="mt-0.5 block text-[10px] opacity-70">
                            {formatThreadTime(t.updatedAt || t.createdAt)} · {t.messageCount} tin
                          </span>
                          <span
                            role="button"
                            tabIndex={0}
                            onClick={(e) => {
                              e.stopPropagation();
                              setConfirmDeleteId(t.id);
                            }}
                            onKeyDown={(e) => {
                              if (e.key === "Enter" || e.key === " ") {
                                e.preventDefault();
                                e.stopPropagation();
                                setConfirmDeleteId(t.id);
                              }
                            }}
                            className="absolute right-1 top-1 inline-flex h-5 w-5 items-center justify-center rounded text-slate-400 opacity-0 transition-opacity hover:bg-rose-100 hover:text-rose-600 group-hover:opacity-100 dark:hover:bg-rose-900/40"
                            aria-label="Xóa phiên"
                          >
                            <Trash2 className="h-3 w-3" />
                          </span>
                        </button>
                      </li>
                    );
                  })}
                </ul>
              )}
            </div>
          </nav>

          <div className="flex min-w-0 flex-1 flex-col">
            <div ref={messagesRef} className="flex-1 space-y-3 overflow-y-auto px-4 py-4">
              {ai.messages.length === 0 && !ai.pending ? (
                <SuggestedPrompts role={role} onPick={(p) => handleSend(p)} disabled={ai.pending} />
              ) : (
                ai.messages.map((m) => (
                  <MessageBubble key={m.id} role={m.role} content={m.content} toolsUsed={m.toolsUsed} />
                ))
              )}
              {ai.pending ? (
                <div className="flex items-center gap-2 rounded-full bg-slate-100 px-3 py-1.5 text-xs text-slate-600 dark:bg-slate-900 dark:text-slate-300">
                  <Loader2 className="h-3 w-3 animate-spin" aria-hidden />
                  <span>{ai.phase === "loading_data" ? "Đang lấy dữ liệu, vui lòng chờ..." : "Đang xử lý..."}</span>
                </div>
              ) : null}
              {ai.error ? (
                <div role="alert" className="rounded-md border border-rose-200 bg-rose-50 px-3 py-2 text-xs text-rose-700 dark:border-rose-900/50 dark:bg-rose-950/30 dark:text-rose-200">
                  {ai.error}
                </div>
              ) : null}
            </div>

            <form onSubmit={onSubmit} className="border-t border-slate-200 p-3 dark:border-slate-800">
              <div className="flex items-end gap-2">
                <textarea
                  rows={2}
                  maxLength={4000}
                  value={draft}
                  onChange={(e) => setDraft(e.target.value)}
                  onKeyDown={onKeyDown}
                  placeholder={PLACEHOLDER[role] ?? PLACEHOLDER.manager}
                  className={cn(
                    "min-h-[44px] flex-1 resize-none rounded-lg border border-slate-200 bg-white px-3 py-2 text-sm shadow-sm",
                    "placeholder:text-slate-400 focus-visible:border-primary/50 focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-primary/20",
                    "disabled:cursor-not-allowed disabled:opacity-60",
                    "dark:border-slate-700 dark:bg-slate-950"
                  )}
                  disabled={ai.pending}
                />
                <Button
                  type="submit"
                  size="icon"
                  disabled={ai.pending || !draft.trim()}
                  title={ai.pending ? "Đang chờ phản hồi..." : "Gửi"}
                  aria-label="Gửi"
                >
                  {ai.pending ? <Loader2 className="h-4 w-4 animate-spin" /> : <Send className="h-4 w-4" />}
                </Button>
              </div>
              <p className="mt-1 text-[11px] text-slate-400">Enter để gửi · Shift+Enter để xuống dòng · Tối đa 4000 ký tự</p>
            </form>
          </div>
        </div>

        {confirmDeleteId != null ? (
          <div className="absolute inset-0 z-10 flex items-center justify-center bg-black/40 p-4">
            <div className="w-full max-w-xs rounded-lg border border-slate-200 bg-white p-4 shadow-xl dark:border-slate-700 dark:bg-slate-950">
              <h3 className="text-sm font-semibold">Xóa phiên chat?</h3>
              <p className="mt-1 text-xs text-slate-600 dark:text-slate-400">
                Toàn bộ tin nhắn của phiên này sẽ bị xóa và không thể khôi phục.
              </p>
              <div className="mt-3 flex justify-end gap-2">
                <Button variant="outline" size="sm" onClick={() => setConfirmDeleteId(null)}>
                  Hủy
                </Button>
                <Button
                  variant="destructive"
                  size="sm"
                  onClick={async () => {
                    const id = confirmDeleteId;
                    setConfirmDeleteId(null);
                    if (id != null) await ai.removeThread(id);
                  }}
                >
                  Xóa
                </Button>
              </div>
            </div>
          </div>
        ) : null}
      </aside>
    </div>
  );
}
