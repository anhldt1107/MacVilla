import { useCallback, useEffect, useState } from "react";
import { Link } from "react-router-dom";
import { useAuth } from "@/context/AuthContext";
import { fetchAdminFulfillments, labelFulfillmentStatus } from "@/services/admin/adminFulfillmentsApi";
import { WORKER_QUEUE_COPY } from "@/components/dashboard-internal/warehouseDashboardCopy";
import { Button } from "@/components/ui/button";
import { Card, CardContent } from "@/components/ui/card";
import { Loader2, Package } from "lucide-react";
import { cn } from "@/lib/utils";

const ACTIVE_STATUSES = new Set(["Pending", "Picking", "Packed"]);

function statusBadgeClass(status) {
  const s = (status || "").toLowerCase();
  if (s === "pending") return "bg-amber-50 text-amber-950 ring-amber-200/90 dark:bg-amber-950/35 dark:text-amber-100";
  if (s === "picking") return "bg-sky-50 text-sky-950 ring-sky-200/90 dark:bg-sky-950/40 dark:text-sky-100";
  if (s === "packed") return "bg-violet-50 text-violet-950 ring-violet-200/90 dark:bg-violet-950/35 dark:text-violet-100";
  return "bg-slate-100 text-slate-800 ring-slate-200/80 dark:bg-slate-800 dark:text-slate-200";
}

/**
 * Queue phiếu được gán cho worker hiện tại.
 * @param {string} [fulfillmentsBasePath]
 */
export function WorkerMyWorkQueue({ fulfillmentsBasePath = "/worker/fulfillments" } = {}) {
  const { accessToken, isAuthenticated, user } = useAuth();
  const [loading, setLoading] = useState(true);
  const [items, setItems] = useState([]);

  const load = useCallback(async () => {
    if (!isAuthenticated || !accessToken || !user?.id) {
      setLoading(false);
      setItems([]);
      return;
    }
    setLoading(true);
    try {
      const result = await fetchAdminFulfillments(accessToken, {
        page: 1,
        pageSize: 50,
        assignedWorkerId: Number(user.id),
      });
      const rows = (result.items ?? []).filter((r) => ACTIVE_STATUSES.has(r.status));
      setItems(rows);
    } catch {
      setItems([]);
    } finally {
      setLoading(false);
    }
  }, [accessToken, isAuthenticated, user?.id]);

  useEffect(() => {
    void load();
  }, [load]);

  const base = fulfillmentsBasePath.replace(/\/$/, "");

  if (loading) {
    return (
      <div className="flex items-center justify-center gap-2 py-12 text-sm text-muted-foreground">
        <Loader2 className="h-5 w-5 animate-spin" />
        Đang tải…
      </div>
    );
  }

  if (items.length === 0) {
    return (
      <Card className="border-dashed">
        <CardContent className="flex flex-col items-center gap-2 py-12 text-center text-sm text-muted-foreground">
          <Package className="h-8 w-8 opacity-40" />
          <p>{WORKER_QUEUE_COPY.empty}</p>
          <Button variant="outline" size="sm" asChild>
            <Link to={base}>Xem tất cả phiếu được giao</Link>
          </Button>
        </CardContent>
      </Card>
    );
  }

  return (
    <ul className="space-y-3">
      {items.map((row) => (
        <li key={row.id}>
          <Card className="overflow-hidden border-slate-200/80 dark:border-slate-800">
            <CardContent className="flex flex-col gap-3 p-4 sm:flex-row sm:items-center sm:justify-between">
              <div className="min-w-0 space-y-1">
                <p className="font-mono text-sm font-semibold">Phiếu #{row.id}</p>
                <p className="text-sm text-muted-foreground">
                  Đơn <span className="font-medium text-foreground">{row.orderCode}</span>
                </p>
                <span
                  className={cn(
                    "inline-flex rounded-full px-2.5 py-0.5 text-xs font-medium ring-1",
                    statusBadgeClass(row.status)
                  )}
                >
                  {labelFulfillmentStatus(row.status)}
                </span>
              </div>
              <Button size="sm" asChild className="shrink-0">
                <Link to={`${base}/${row.id}`}>{WORKER_QUEUE_COPY.openTicket}</Link>
              </Button>
            </CardContent>
          </Card>
        </li>
      ))}
    </ul>
  );
}
