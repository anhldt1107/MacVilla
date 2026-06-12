import { useEffect, useState } from "react";
import { Link } from "react-router-dom";
import { CreditCard, Landmark, Loader2, Receipt } from "lucide-react";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import { InternalDashboard } from "@/components/dashboard-internal";
import { useAuth } from "@/context/AuthContext";
import { ApiRequestError } from "@/services/api/apiEnvelope";
import { fetchAdminTransferNotifications } from "@/services/admin/adminTransferNotificationsApi";

export function ManagerDashboardHome() {
  const { accessToken, isAuthenticated } = useAuth();
  const [pendingCkTotal, setPendingCkTotal] = useState(null);
  const [pendingCkLoading, setPendingCkLoading] = useState(false);

  useEffect(() => {
    if (!isAuthenticated || !accessToken) {
      setPendingCkTotal(null);
      return;
    }
    let cancelled = false;
    setPendingCkLoading(true);
    void (async () => {
      try {
        const { totalCount } = await fetchAdminTransferNotifications(accessToken, {
          status: "Pending",
          page: 1,
          pageSize: 1,
        });
        if (!cancelled) setPendingCkTotal(totalCount);
      } catch (e) {
        if (!cancelled) {
          if (e instanceof ApiRequestError && e.status === 403) setPendingCkTotal(null);
          else setPendingCkTotal(null);
        }
      } finally {
        if (!cancelled) setPendingCkLoading(false);
      }
    })();
    return () => {
      cancelled = true;
    };
  }, [accessToken, isAuthenticated]);

  return (
    <div className="space-y-6">
    <div className="grid gap-4 md:grid-cols-2 xl:grid-cols-3">
      <Card className="border-border/60 shadow-sm">
        <CardHeader>
          <CardTitle className="text-base">Dashboard</CardTitle>
        </CardHeader>
        <CardContent className="flex flex-col gap-2 text-sm text-muted-foreground">
          <div className="flex flex-wrap gap-2 pt-1">
            <Button variant="outline" size="sm" asChild>
              <Link to="/manager/accounting/invoices">Hóa đơn</Link>
            </Button>
            <Button variant="outline" size="sm" asChild>
              <Link to="/manager/accounting/payments">Thanh toán</Link>
            </Button>
            <Button variant="outline" size="sm" asChild>
              <Link to="/manager/accounting/transfer-notifications">Thông báo CK</Link>
            </Button>
          </div>
        </CardContent>
      </Card>

      <Card className="border-border/60 shadow-sm">
        <CardHeader className="flex flex-row items-start justify-between space-y-0 pb-2">
          <div className="space-y-1">
            <CardTitle className="text-base">Chuyển khoản chờ đối soát</CardTitle>
          </div>
          <span className="flex h-9 w-9 items-center justify-center rounded-lg bg-muted text-muted-foreground">
            <Landmark className="h-4 w-4" aria-hidden />
          </span>
        </CardHeader>
        <CardContent className="flex flex-col gap-3">
          <div className="text-3xl font-semibold tabular-nums tracking-tight">
            {pendingCkLoading ? (
              <span className="inline-flex items-center gap-2 text-muted-foreground">
                <Loader2 className="h-5 w-5 animate-spin" aria-hidden />
                Đang tải…
              </span>
            ) : pendingCkTotal === null ? (
              <span className="text-muted-foreground">—</span>
            ) : (
              pendingCkTotal.toLocaleString("vi-VN")
            )}
          </div>
          <Button variant="outline" size="sm" className="w-fit gap-1.5" asChild>
            <Link to="/manager/accounting/transfer-notifications">Mở hàng đợi CK</Link>
          </Button>
        </CardContent>
      </Card>

      <Card className="border-border/60 shadow-sm">
        <CardHeader>
          <CardTitle className="text-base">Kế toán nhanh</CardTitle>
        </CardHeader>
        <CardContent className="flex flex-col gap-3 text-sm text-muted-foreground">
          <div className="flex items-center gap-2 text-foreground">
            <Receipt className="h-4 w-4 shrink-0 text-violet-600" aria-hidden />
            <Link className="font-medium text-primary underline-offset-4 hover:underline" to="/manager/accounting/invoices">
              Danh sách hóa đơn
            </Link>
          </div>
          <div className="flex items-center gap-2 text-foreground">
            <CreditCard className="h-4 w-4 shrink-0 text-emerald-600" aria-hidden />
            <Link className="font-medium text-primary underline-offset-4 hover:underline" to="/manager/accounting/payments">
              Sổ thanh toán & hoàn tiền
            </Link>
          </div>
        </CardContent>
      </Card>
    </div>
    {isAuthenticated && accessToken ? (
      <InternalDashboard accessToken={accessToken} />
    ) : null}
    </div>
  );
}
