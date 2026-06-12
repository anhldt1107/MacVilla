import { useState } from "react";
import { ChevronDown, ChevronUp } from "lucide-react";
import { StockInternalDashboard } from "@/components/dashboard-internal";
import { WarehouseOpsQueue } from "@/components/warehouse/WarehouseOpsQueue";
import { Button } from "@/components/ui/button";

/** Trang chủ thủ kho — hàng đợi vận hành + biểu đồ (thu gọn). */
export function StockManagerHomePage() {
  const [chartsOpen, setChartsOpen] = useState(true);

  return (
    <div className="space-y-6">
      <h1 className="text-2xl font-semibold tracking-tight">Trang chủ kho</h1>

      <section className="space-y-3">
        <h2 className="text-sm font-semibold text-muted-foreground uppercase tracking-wider">Việc cần xử lý</h2>
        <WarehouseOpsQueue />
      </section>

      <section className="space-y-3">
        <div className="flex items-center justify-between gap-2">
          <h2 className="text-sm font-semibold text-muted-foreground uppercase tracking-wider">Tổng quan & biểu đồ</h2>
          <Button
            type="button"
            variant="ghost"
            size="sm"
            className="gap-1 text-xs"
            onClick={() => setChartsOpen((v) => !v)}
          >
            {chartsOpen ? (
              <>
                Thu gọn <ChevronUp className="h-3.5 w-3.5" />
              </>
            ) : (
              <>
                Mở rộng <ChevronDown className="h-3.5 w-3.5" />
              </>
            )}
          </Button>
        </div>
        {chartsOpen ? <StockInternalDashboard /> : null}
      </section>
    </div>
  );
}
