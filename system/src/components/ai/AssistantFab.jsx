import { useState } from "react";
import { Bot } from "lucide-react";
import { cn } from "@/lib/utils";
import { useAuth } from "@/context/AuthContext";
import { AssistantPanel } from "./AssistantPanel";

/**
 * FAB góc phải-dưới mở `AssistantPanel` ( §10.1).
 * @param {{ role: "admin" | "manager" | "sales"; className?: string }} props
 */
export function AssistantFab({ role, className }) {
  const { isAuthenticated } = useAuth();
  const [open, setOpen] = useState(false);

  if (!isAuthenticated) return null;

  return (
    <>
      <button
        type="button"
        onClick={() => setOpen(true)}
        aria-label="Mở trợ lý AI"
        className={cn(
          "fixed bottom-6 right-6 z-40 inline-flex h-12 w-12 items-center justify-center rounded-full bg-primary text-primary-foreground shadow-lg ring-1 ring-primary/20 transition-transform hover:scale-105 hover:shadow-xl focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-ring focus-visible:ring-offset-2",
          open && "opacity-0 pointer-events-none",
          className
        )}
      >
        <Bot className="h-5 w-5" aria-hidden />
      </button>
      <AssistantPanel role={role} open={open} onClose={() => setOpen(false)} />
    </>
  );
}
