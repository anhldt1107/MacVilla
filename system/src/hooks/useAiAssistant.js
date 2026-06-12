import { useCallback, useEffect, useMemo, useRef, useState } from "react";
import { useAuth } from "@/context/AuthContext";
import { ApiRequestError } from "@/services/api/apiEnvelope";
import {
  deleteAiThread,
  fetchAiThreadMessages,
  fetchAiThreads,
  postAiChat,
} from "@/services/ai/aiAssistantApi";

const LS_PREFIX = "ai-assistant:lastThread:";
const PHASE_UPGRADE_MS = 2000;

/** @typedef {import("@/services/ai/aiAssistantApi").AiChatResponse} AiChatResponse */
/** @typedef {import("@/services/ai/aiAssistantApi").AiThreadSummary} AiThreadSummary */
/** @typedef {import("@/services/ai/aiAssistantApi").AiToolUsed} AiToolUsed */

/**
 * Multi-thread hook cho staff (Admin/Manager/Sales).
 * Render UI chỉ hiển thị `messageRole = user | assistant (có content)` (theo `ai_intergrate.md` §6).
 *
 * @returns {{
 *   threads: AiThreadSummary[];
 *   activeThreadId: number | null;
 *   messages: { id: string | number; role: "user" | "assistant"; content: string; createdAt: string; toolsUsed?: AiToolUsed[] }[];
 *   pending: boolean;
 *   phase: "idle" | "sending" | "loading_data";
 *   error: string | null;
 *   ready: boolean;
 *   loadThreads: () => Promise<void>;
 *   selectThread: (id: number | null) => Promise<void>;
 *   newThread: () => void;
 *   send: (message: string) => Promise<void>;
 *   removeThread: (id: number) => Promise<void>;
 *   reload: () => Promise<void>;
 * }}
 */
export function useAiAssistant() {
  const { accessToken, user } = useAuth();
  const userId = user?.id != null ? String(user.id) : "";
  const lsKey = userId ? `${LS_PREFIX}${userId}` : null;

  const [threads, setThreads] = useState(/** @type {AiThreadSummary[]} */ ([]));
  const [activeThreadId, setActiveThreadId] = useState(/** @type {number | null} */ (null));
  const [messages, setMessages] = useState(
    /** @type {{ id: string | number; role: "user" | "assistant"; content: string; createdAt: string; toolsUsed?: AiToolUsed[] }[]} */ ([])
  );
  const [pending, setPending] = useState(false);
  const [phase, setPhase] = useState(/** @type {"idle" | "sending" | "loading_data"} */ ("idle"));
  const [error, setError] = useState(/** @type {string | null} */ (null));
  const [ready, setReady] = useState(false);

  const phaseTimerRef = useRef(/** @type {ReturnType<typeof setTimeout> | null} */ (null));

  const startPending = useCallback(() => {
    setPending(true);
    setPhase("sending");
    if (phaseTimerRef.current) clearTimeout(phaseTimerRef.current);
    phaseTimerRef.current = setTimeout(() => setPhase("loading_data"), PHASE_UPGRADE_MS);
  }, []);

  const stopPending = useCallback(() => {
    if (phaseTimerRef.current) {
      clearTimeout(phaseTimerRef.current);
      phaseTimerRef.current = null;
    }
    setPending(false);
    setPhase("idle");
  }, []);

  useEffect(() => {
    return () => {
      if (phaseTimerRef.current) clearTimeout(phaseTimerRef.current);
    };
  }, []);

  /** Lọc message render-able + gắn toolsUsed kế cận. */
  const mapMessagesForRender = useCallback((rawList) => {
    if (!Array.isArray(rawList)) return [];
    /** @type {{ id: string | number; role: "user" | "assistant"; content: string; createdAt: string; toolsUsed?: AiToolUsed[] }[]} */
    const out = [];
    /** @type {AiToolUsed[]} */
    let pendingTools = [];
    for (const m of rawList) {
      if (!m) continue;
      const role = String(m.messageRole || "").toLowerCase();
      if (role === "assistant" && m.toolName && !m.content) {
        pendingTools.push({ toolName: m.toolName });
        continue;
      }
      if (role === "tool") continue;
      if (role === "user" && m.content) {
        out.push({
          id: m.id,
          role: "user",
          content: String(m.content),
          createdAt: m.createdAt,
        });
        pendingTools = [];
        continue;
      }
      if (role === "assistant" && m.content) {
        out.push({
          id: m.id,
          role: "assistant",
          content: String(m.content),
          createdAt: m.createdAt,
          toolsUsed: pendingTools.length ? pendingTools : undefined,
        });
        pendingTools = [];
      }
    }
    return out;
  }, []);

  const loadThreads = useCallback(async () => {
    if (!accessToken) return;
    try {
      const data = await fetchAiThreads(accessToken, { page: 1, pageSize: 20 });
      setThreads(Array.isArray(data?.items) ? data.items : []);
    } catch (err) {
      const msg = err instanceof ApiRequestError ? err.message : "Không tải được danh sách phiên.";
      setError(msg);
    }
  }, [accessToken]);

  const selectThread = useCallback(
    async (id) => {
      if (!accessToken) return;
      if (id == null) {
        setActiveThreadId(null);
        setMessages([]);
        return;
      }
      try {
        startPending();
        setActiveThreadId(id);
        const data = await fetchAiThreadMessages(accessToken, id);
        setMessages(mapMessagesForRender(data));
        if (lsKey) {
          try {
            localStorage.setItem(lsKey, String(id));
          } catch {
            /* noop */
          }
        }
      } catch (err) {
        const msg = err instanceof ApiRequestError ? err.message : "Không tải được phiên chat.";
        setError(msg);
      } finally {
        stopPending();
      }
    },
    [accessToken, lsKey, mapMessagesForRender, startPending, stopPending]
  );

  const newThread = useCallback(() => {
    setActiveThreadId(null);
    setMessages([]);
    setError(null);
    if (lsKey) {
      try {
        localStorage.removeItem(lsKey);
      } catch {
        /* noop */
      }
    }
  }, [lsKey]);

  const send = useCallback(
    async (raw) => {
      const message = String(raw ?? "").trim();
      if (!message || !accessToken) return;
      setError(null);
      const userBubble = {
        id: `local-${Date.now()}`,
        role: /** @type {"user"} */ ("user"),
        content: message,
        createdAt: new Date().toISOString(),
      };
      setMessages((prev) => [...prev, userBubble]);
      try {
        startPending();
        const res = await postAiChat(accessToken, {
          threadId: activeThreadId ?? null,
          message,
        });
        const nextThreadId = res?.threadId ?? activeThreadId ?? null;
        if (nextThreadId != null && nextThreadId !== activeThreadId) {
          setActiveThreadId(nextThreadId);
          if (lsKey) {
            try {
              localStorage.setItem(lsKey, String(nextThreadId));
            } catch {
              /* noop */
            }
          }
        }
        setMessages((prev) => [
          ...prev,
          {
            id: `local-${Date.now()}-a`,
            role: "assistant",
            content: String(res?.assistantMessage ?? ""),
            createdAt: new Date().toISOString(),
            toolsUsed: Array.isArray(res?.toolsUsed) ? res.toolsUsed : undefined,
          },
        ]);
        loadThreads();
      } catch (err) {
        const msg = err instanceof ApiRequestError ? err.message : "Trợ lý đang bận, bạn thử lại trong giây lát.";
        setError(msg);
        setMessages((prev) => prev.filter((m) => m.id !== userBubble.id));
      } finally {
        stopPending();
      }
    },
    [accessToken, activeThreadId, loadThreads, lsKey, startPending, stopPending]
  );

  const removeThread = useCallback(
    async (id) => {
      if (!accessToken || id == null) return;
      try {
        await deleteAiThread(accessToken, id);
        if (id === activeThreadId) {
          setActiveThreadId(null);
          setMessages([]);
          if (lsKey) {
            try {
              localStorage.removeItem(lsKey);
            } catch {
              /* noop */
            }
          }
        }
        await loadThreads();
      } catch (err) {
        const msg = err instanceof ApiRequestError ? err.message : "Không xóa được phiên.";
        setError(msg);
      }
    },
    [accessToken, activeThreadId, loadThreads, lsKey]
  );

  const reload = useCallback(async () => {
    await loadThreads();
    if (activeThreadId != null) await selectThread(activeThreadId);
  }, [activeThreadId, loadThreads, selectThread]);

  useEffect(() => {
    let cancelled = false;
    async function bootstrap() {
      if (!accessToken) {
        setReady(false);
        setThreads([]);
        setMessages([]);
        setActiveThreadId(null);
        return;
      }
      setReady(false);
      await loadThreads();
      if (cancelled) return;
      let storedId = null;
      if (lsKey) {
        try {
          const raw = localStorage.getItem(lsKey);
          if (raw) {
            const parsed = Number(raw);
            if (!Number.isNaN(parsed) && parsed > 0) storedId = parsed;
          }
        } catch {
          /* noop */
        }
      }
      if (storedId != null) {
        await selectThread(storedId);
      }
      if (!cancelled) setReady(true);
    }
    bootstrap().catch(() => {
      if (!cancelled) setReady(true);
    });
    return () => {
      cancelled = true;
    };
  }, [accessToken, loadThreads, lsKey, selectThread]);

  return useMemo(
    () => ({
      threads,
      activeThreadId,
      messages,
      pending,
      phase,
      error,
      ready,
      loadThreads,
      selectThread,
      newThread,
      send,
      removeThread,
      reload,
    }),
    [
      threads,
      activeThreadId,
      messages,
      pending,
      phase,
      error,
      ready,
      loadThreads,
      selectThread,
      newThread,
      send,
      removeThread,
      reload,
    ]
  );
}
