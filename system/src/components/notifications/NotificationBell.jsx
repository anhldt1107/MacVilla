import { useNavigate } from "react-router-dom";
import { Bell, Loader2 } from "lucide-react";
import { useAuth } from "@/context/AuthContext";
import { useNotifications } from "@/hooks/useNotifications";
import { Button } from "@/components/ui/button";
import {
  DropdownMenu,
  DropdownMenuContent,
  DropdownMenuItem,
  DropdownMenuLabel,
  DropdownMenuSeparator,
  DropdownMenuTrigger,
} from "@/components/ui/dropdown-menu";
import { cn } from "@/lib/utils";

function formatRelativeTime(iso) {
  if (!iso) return "";
  try {
    const d = new Date(iso);
    const diff = Date.now() - d.getTime();
    const mins = Math.floor(diff / 60000);
    if (mins < 1) return "Vừa xong";
    if (mins < 60) return `${mins} phút`;
    const hrs = Math.floor(mins / 60);
    if (hrs < 24) return `${hrs} giờ`;
    const days = Math.floor(hrs / 24);
    return `${days} ngày`;
  } catch {
    return "";
  }
}

/**
 * Chuông thông báo in-app — poll unread, click navigate deep link.
 */
export function NotificationBell({ className }) {
  const navigate = useNavigate();
  const { accessToken, isAuthenticated } = useAuth();
  const { unreadCount, items, listLoading, open, setOpen, markRead, markAllRead } = useNotifications({
    accessToken,
    isAuthenticated,
  });

  if (!isAuthenticated) return null;

  const handleOpenChange = (next) => {
    setOpen(next);
  };

  const handleItemClick = async (item) => {
    const path = String(item.deepLinkPath ?? "").trim();
    if (!item.isRead && item.id) await markRead(item.id);
    setOpen(false);
    if (path) navigate(path);
  };

  return (
    <DropdownMenu open={open} onOpenChange={handleOpenChange}>
      <DropdownMenuTrigger asChild>
        <Button
          type="button"
          variant="ghost"
          size="icon"
          className={cn("relative h-9 w-9 shrink-0", className)}
          aria-label={unreadCount > 0 ? `Thông báo, ${unreadCount} chưa đọc` : "Thông báo"}
        >
          <Bell className="h-5 w-5" aria-hidden />
          {unreadCount > 0 ? (
            <span className="absolute -right-0.5 -top-0.5 flex h-4 min-w-4 items-center justify-center rounded-full bg-red-600 px-1 text-[10px] font-bold text-white">
              {unreadCount > 99 ? "99+" : unreadCount}
            </span>
          ) : null}
        </Button>
      </DropdownMenuTrigger>
      <DropdownMenuContent align="end" className="w-80 max-w-[calc(100vw-1rem)]">
        <DropdownMenuLabel className="flex items-center justify-between gap-2">
          <span>Thông báo</span>
          {unreadCount > 0 ? (
            <button
              type="button"
              className="text-xs font-medium text-violet-700 hover:underline dark:text-violet-400"
              onClick={(e) => {
                e.preventDefault();
                void markAllRead();
              }}
            >
              Đọc tất cả
            </button>
          ) : null}
        </DropdownMenuLabel>
        <DropdownMenuSeparator />
        {listLoading ? (
          <div className="flex items-center justify-center py-8 text-muted-foreground">
            <Loader2 className="h-5 w-5 animate-spin" aria-hidden />
          </div>
        ) : items.length === 0 ? (
          <p className="px-3 py-6 text-center text-sm text-muted-foreground">Không có thông báo</p>
        ) : (
          <div className="max-h-[min(60vh,320px)] overflow-y-auto">
            {items.map((item) => (
              <DropdownMenuItem
                key={item.id}
                className={cn(
                  "flex cursor-pointer flex-col items-start gap-0.5 py-2.5",
                  !item.isRead && "bg-violet-50/80 dark:bg-violet-950/30"
                )}
                onClick={() => void handleItemClick(item)}
              >
                <span className="text-sm font-medium leading-snug">{item.title}</span>
                {item.body ? (
                  <span className="line-clamp-2 text-xs text-muted-foreground">{String(item.body)}</span>
                ) : null}
                <span className="text-[10px] text-muted-foreground">{formatRelativeTime(item.createdAt)}</span>
              </DropdownMenuItem>
            ))}
          </div>
        )}
      </DropdownMenuContent>
    </DropdownMenu>
  );
}
