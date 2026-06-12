import { useCallback, useEffect, useState } from "react";
import { Link } from "react-router-dom";
import { useAuth } from "@/context/AuthContext";
import { fetchDashboardInventoryOverview } from "@/services/admin/adminDashboardApi";
import { fetchAdminFulfillments } from "@/services/admin/adminFulfillmentsApi";
import { fetchAdminReturns } from "@/services/admin/adminReturnsApi";
import { countOrdersEligibleForFulfillment } from "@/lib/warehouseQueueUtils";
import { WAREHOUSE_QUEUE_COPY } from "@/components/dashboard-internal/warehouseDashboardCopy";
import { Card, CardContent } from "@/components/ui/card";
import { Loader2 } from "lucide-react";

const QUEUE_LINKS = {
  pending: "/stock-manager/fulfillments?queue=pending",
  create: "/stock-manager/fulfillments/create",
  returns: "/stock-manager/returns",
  inventory: "/stock-manager/inventory",
};

/**
 * Hàng đợi vận hành — trang chủ thủ kho.
 */
export function WarehouseOpsQueue() {
  const { accessToken, isAuthenticated } = useAuth();
  const [loading, setLoading] = useState(true);
  const [counts, setCounts] = useState({
    pendingFulfillments: 0,
    ordersWithoutTicket: 0,
    returnsApproved: 0,
    lowStockSkus: 0,
  });

  const load = useCallback(async () => {
    if (!isAuthenticated || !accessToken) {
      setLoading(false);
      return;
    }
    setLoading(true);
    try {
      const [pending, eligible, returns, overview] = await Promise.all([
        fetchAdminFulfillments(accessToken, { page: 1, pageSize: 1, status: "Pending" }),
        countOrdersEligibleForFulfillment(accessToken),
        fetchAdminReturns(accessToken, { page: 1, pageSize: 1, status: "Approved" }),
        fetchDashboardInventoryOverview(accessToken, {}),
      ]);
      setCounts({
        pendingFulfillments: pending.totalCount ?? 0,
        ordersWithoutTicket: eligible,
        returnsApproved: returns.totalCount ?? 0,
        lowStockSkus: overview?.lowStockCount ?? 0,
      });
    } catch {
      setCounts({
        pendingFulfillments: 0,
        ordersWithoutTicket: 0,
        returnsApproved: 0,
        lowStockSkus: 0,
      });
    } finally {
      setLoading(false);
    }
  }, [accessToken, isAuthenticated]);

  useEffect(() => {
    void load();
  }, [load]);

  const cards = [
    { key: "pending", label: WAREHOUSE_QUEUE_COPY.pendingFulfillments, count: counts.pendingFulfillments, to: QUEUE_LINKS.pending },
    { key: "orders", label: WAREHOUSE_QUEUE_COPY.ordersWithoutTicket, count: counts.ordersWithoutTicket, to: QUEUE_LINKS.create },
    { key: "returns", label: WAREHOUSE_QUEUE_COPY.returnsApproved, count: counts.returnsApproved, to: QUEUE_LINKS.returns },
    { key: "low", label: WAREHOUSE_QUEUE_COPY.lowStockSkus, count: counts.lowStockSkus, to: QUEUE_LINKS.inventory },
  ];

  return (
    <div className="grid gap-3 sm:grid-cols-2 lg:grid-cols-4">
      {cards.map((c) => (
        <Link key={c.key} to={c.to} className="group block focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-primary/40 rounded-xl">
          <Card className="h-full border-slate-200/80 transition-shadow group-hover:shadow-md dark:border-slate-800">
            <CardContent className="flex flex-col gap-1 p-4">
              <span className="text-xs font-medium text-muted-foreground">{c.label}</span>
              <span className="text-2xl font-semibold tabular-nums text-foreground">
                {loading ? <Loader2 className="inline h-5 w-5 animate-spin text-primary/70" /> : c.count.toLocaleString("vi-VN")}
              </span>
            </CardContent>
          </Card>
        </Link>
      ))}
    </div>
  );
}
