import { Outlet, useLocation, useNavigate } from "react-router-dom";
import { LogOut } from "lucide-react";
import { Sidebar } from "./Sidebar";
import { adminMenuConfig } from "@/config/admin-menu.config";
import { BRAND_NAME } from "@/config/brand";
import { useAuth } from "@/context/AuthContext";
import { Button } from "@/components/ui/button";
import { AssistantFab } from "@/components/ai";
import { NotificationBell } from "@/components/notifications/NotificationBell";

function titleForPath(pathname: string): string {
  if (pathname === "/admin/sales/quotations-b2b/create" || pathname === "/admin/sales/quotations-b2b/create/") {
    return "Tạo báo giá B2B";
  }
  if (/^\/admin\/sales\/orders\/[^/]+$/.test(pathname)) {
    return "Chi tiết đơn hàng";
  }
  if (/^\/admin\/sales\/customers\/[^/]+$/.test(pathname)) {
    return "Chi tiết khách hàng";
  }
  if (/^\/admin\/sales\/contracts\/[^/]+$/.test(pathname)) {
    return "Chi tiết hợp đồng";
  }
  if (/^\/admin\/accounting\/invoices\/[^/]+$/.test(pathname)) {
    return "Chi tiết hóa đơn";
  }
  if (/^\/admin\/accounting\/payments\/[^/]+$/.test(pathname)) {
    return "Chi tiết thanh toán";
  }
  if (/^\/admin\/accounting\/transfer-notifications\/[^/]+$/.test(pathname)) {
    return "Chi tiết thông báo CK";
  }
  if (pathname === "/admin/after-sales/warranty/claims-queue" || pathname === "/admin/after-sales/warranty/claims-queue/") {
    return "Hàng đợi yêu cầu BH";
  }
  if (/^\/admin\/after-sales\/warranty\/claims\/[^/]+$/.test(pathname)) {
    return "Chi tiết yêu cầu BH";
  }
  if (/^\/admin\/after-sales\/warranty\/[^/]+$/.test(pathname)) {
    return "Chi tiết phiếu bảo hành";
  }
  if (/^\/admin\/after-sales\/returns\/[^/]+$/.test(pathname)) {
    return "Chi tiết đổi trả";
  }
  if (/^\/admin\/products\/[^/]+$/.test(pathname)) {
    return "Chi tiết sản phẩm";
  }
  for (const entry of adminMenuConfig) {
    if (entry.type === "item" && (pathname === entry.to || pathname === entry.to + "/")) {
      return entry.label;
    }
    if (entry.type === "group") {
      const hit = entry.items.find((i) => pathname === i.to || pathname.startsWith(i.to + "/"));
      if (hit) return hit.label;
    }
  }
  return "Admin";
}

export function AdminLayout() {
  const { pathname } = useLocation();
  const navigate = useNavigate();
  const { user, logout } = useAuth();
  const pageTitle = titleForPath(pathname);

  const handleLogout = () => {
    logout();
    navigate("/", { replace: true });
  };

  const userLabel = user?.fullName?.trim() || user?.username || "";

  return (
    <div className="flex h-screen min-h-0 w-full bg-slate-50 text-foreground dark:bg-slate-950">
      <Sidebar />
      <div className="flex min-w-0 flex-1 flex-col">
        <header className="sticky top-0 z-10 flex h-14 shrink-0 items-center justify-between gap-4 border-b border-border bg-background/80 px-6 backdrop-blur-md">
          <div className="min-w-0">
            <h1 className="text-lg font-semibold tracking-tight">{pageTitle}</h1>
            <p className="text-xs text-muted-foreground">
              {BRAND_NAME} · Bảng điều khiển
            </p>
          </div>
          <div className="flex shrink-0 items-center gap-3">
            <NotificationBell />
            {userLabel ? (
              <span className="hidden max-w-[200px] truncate text-sm text-muted-foreground sm:inline" title={userLabel}>
                {userLabel}
              </span>
            ) : null}
            <Button type="button" variant="outline" size="sm" className="gap-2" onClick={handleLogout}>
              <LogOut className="size-4" aria-hidden />
              Đăng xuất
            </Button>
          </div>
        </header>
        <main className="min-h-0 flex-1 overflow-auto p-6">
          <Outlet />
        </main>
      </div>
      <AssistantFab role="admin" />
    </div>
  );
}
