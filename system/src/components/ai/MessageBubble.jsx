import ReactMarkdown from "react-markdown";
import remarkGfm from "remark-gfm";
import rehypeSanitize from "rehype-sanitize";
import { cn } from "@/lib/utils";
import { ToolChip } from "./ToolChip";

/**
 * Bubble user / assistant. Bot text qua Markdown (sanitize, GFM) —  §10.7.
 * @param {{
 *   role: "user" | "assistant";
 *   content: string;
 *   toolsUsed?: { toolName: string; latencyMs?: number; success?: boolean }[];
 * }} props
 */
export function MessageBubble({ role, content, toolsUsed }) {
  const isUser = role === "user";
  return (
    <div className={cn("flex w-full", isUser ? "justify-end" : "justify-start")}>
      <div className={cn("flex max-w-[88%] flex-col gap-1", isUser ? "items-end" : "items-start")}>
        <div
          className={cn(
            "rounded-2xl px-3 py-2 text-sm leading-relaxed shadow-sm",
            isUser
              ? "rounded-br-md bg-primary text-primary-foreground"
              : "rounded-bl-md border border-slate-200 bg-white text-slate-800 dark:border-slate-700 dark:bg-slate-950 dark:text-slate-100"
          )}
        >
          {isUser ? (
            <p className="whitespace-pre-wrap break-words">{content}</p>
          ) : (
            <div className={cn("ai-md max-w-none break-words")}>
              <ReactMarkdown remarkPlugins={[remarkGfm]} rehypePlugins={[rehypeSanitize]}>
                {content}
              </ReactMarkdown>
            </div>
          )}
        </div>
        {!isUser && Array.isArray(toolsUsed) && toolsUsed.length > 0 ? (
          <div className="flex flex-wrap items-center gap-1">
            {toolsUsed.map((t, idx) => (
              <ToolChip key={`${t.toolName}-${idx}`} toolName={t.toolName} latencyMs={t.latencyMs} success={t.success} />
            ))}
          </div>
        ) : null}
      </div>
    </div>
  );
}
