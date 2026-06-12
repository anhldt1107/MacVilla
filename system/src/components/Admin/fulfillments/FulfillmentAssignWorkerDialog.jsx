import { useEffect, useMemo, useState } from "react";
import { ApiRequestError } from "@/services/api/apiEnvelope";
import { assignAdminFulfillmentWorker } from "@/services/admin/adminFulfillmentsApi";
import { fetchAdminUserRoles, fetchAdminUsers } from "@/services/admin/adminUsersApi";
import { Loader2, Search, UserPlus } from "lucide-react";
import { Button } from "@/components/ui/button";
import {
  Dialog,
  DialogContent,
  DialogDescription,
  DialogFooter,
  DialogHeader,
  DialogTitle,
} from "@/components/ui/dialog";
import { cn } from "@/lib/utils";

const WORKER_LIST_PAGE_SIZE = 500;

const fieldInput = cn(
  "h-10 w-full rounded-lg border border-slate-200 bg-white px-3 text-sm text-foreground shadow-sm transition-all",
  "placeholder:text-slate-400 hover:border-slate-300",
  "focus-visible:border-primary/50 focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-primary/20",
  "dark:border-slate-700 dark:bg-slate-950 dark:hover:border-slate-600"
);

/**
 * @param {object} props
 * @param {boolean} props.open
 * @param {(open: boolean) => void} props.onOpenChange
 * @param {{ id: number; orderCode?: string } | null} props.fulfillment
 * @param {string | null} props.accessToken
 * @param {(data?: object) => void} [props.onAssigned]
 */
export function FulfillmentAssignWorkerDialog({ open, onOpenChange, fulfillment, accessToken, onAssigned }) {
  const [workers, setWorkers] = useState([]);
  const [listLoading, setListLoading] = useState(false);
  const [listError, setListError] = useState("");
  const [searchQuery, setSearchQuery] = useState("");
  const [selectedWorkerId, setSelectedWorkerId] = useState(null);
  const [submitting, setSubmitting] = useState(false);
  const [formError, setFormError] = useState("");

  useEffect(() => {
    if (!open) {
      setSearchQuery("");
      setSelectedWorkerId(null);
      setFormError("");
      setListError("");
      setWorkers([]);
      return;
    }
    if (!fulfillment || !accessToken) return;

    let cancelled = false;
    (async () => {
      setListLoading(true);
      setListError("");
      setWorkers([]);
      setSelectedWorkerId(null);
      try {
        const roles = await fetchAdminUserRoles(accessToken);
        if (cancelled) return;
        const workerRole = roles.find((r) => String(r.roleName || "").toLowerCase() === "worker");
        if (!workerRole) {
          setListError("Không tìm thấy role Worker trong hệ thống. Kiểm tra cấu hình vai trò người dùng.");
          return;
        }
        const res = await fetchAdminUsers(accessToken, {
          page: 1,
          pageSize: WORKER_LIST_PAGE_SIZE,
          roleId: workerRole.id,
          status: "Active",
        });
        if (cancelled) return;
        setWorkers(res.items ?? []);
      } catch (e) {
        if (cancelled) return;
        setListError(
          e instanceof ApiRequestError
            ? e.message
            : e instanceof Error
              ? e.message
              : "Không tải được danh sách Worker."
        );
      } finally {
        if (!cancelled) setListLoading(false);
      }
    })();

    return () => {
      cancelled = true;
    };
  }, [open, fulfillment?.id, accessToken]);

  const filteredWorkers = useMemo(() => {
    const q = searchQuery.trim().toLowerCase();
    if (!q) return workers;
    return workers.filter((u) => {
      const name = String(u.fullName ?? "").toLowerCase();
      const user = String(u.username ?? "").toLowerCase();
      const mail = String(u.email ?? "").toLowerCase();
      const phone = String(u.phone ?? "").toLowerCase();
      return name.includes(q) || user.includes(q) || mail.includes(q) || phone.includes(q);
    });
  }, [workers, searchQuery]);

  const handleSubmit = async (e) => {
    e.preventDefault();
    if (!accessToken || !fulfillment || selectedWorkerId == null) return;
    setFormError("");
    setSubmitting(true);
    try {
      const data = await assignAdminFulfillmentWorker(accessToken, fulfillment.id, {
        workerId: selectedWorkerId,
      });
      onAssigned?.(data);
      onOpenChange(false);
    } catch (err) {
      setFormError(
        err instanceof ApiRequestError ? err.message : err instanceof Error ? err.message : "Gán Worker thất bại."
      );
    } finally {
      setSubmitting(false);
    }
  };

  return (
    <Dialog open={open} onOpenChange={onOpenChange}>
      <DialogContent className="max-h-[90vh] max-w-lg overflow-hidden sm:max-w-lg">
        <DialogHeader>
          <DialogTitle className="flex items-center gap-2">
            <span className="flex h-9 w-9 items-center justify-center rounded-lg bg-teal-500/10 text-teal-700 dark:text-teal-300">
              <UserPlus className="h-4 w-4" aria-hidden />
            </span>
            Gán nhân viên phụ trách
          </DialogTitle>
          <DialogDescription>
            {fulfillment ? (
              <>
                Phiếu công việc <span className="font-mono font-semibold text-foreground">#{fulfillment.id}</span>
                {fulfillment.orderCode ? (
                  <>
                    {" "}
                    · Đơn{" "}
                    <span className="font-mono font-semibold text-foreground">{fulfillment.orderCode}</span>
                  </>
                ) : null}
                . Chọn tài khoản có vai trò <span className="font-medium">Worker</span>.
              </>
            ) : null}
          </DialogDescription>
        </DialogHeader>

        {fulfillment ? (
          <form onSubmit={handleSubmit} className="flex min-h-0 flex-1 flex-col gap-4">
            <div className="relative shrink-0">
              <Search className="pointer-events-none absolute left-3 top-1/2 h-4 w-4 -translate-y-1/2 text-slate-400" />
              <input
                type="search"
                autoComplete="off"
                placeholder="Tìm theo tên, username, email, SĐT…"
                value={searchQuery}
                onChange={(e) => setSearchQuery(e.target.value)}
                className={cn(fieldInput, "pl-10")}
                disabled={listLoading || workers.length === 0}
              />
            </div>

            {listLoading ? (
              <div className="flex flex-col items-center justify-center gap-2 py-12 text-slate-500">
                <Loader2 className="h-8 w-8 animate-spin text-teal-600/70" />
                <p className="text-sm">Đang tải danh sách Worker…</p>
              </div>
            ) : null}

            {!listLoading && listError ? (
              <p className="text-sm text-amber-800 dark:text-amber-300" role="alert">
                {listError}
              </p>
            ) : null}

            {!listLoading && !listError && workers.length === 0 ? (
              <p className="py-6 text-center text-sm text-slate-500">Không có Worker đang hoạt động.</p>
            ) : null}

            {!listLoading && !listError && workers.length > 0 ? (
              <div className="min-h-[200px] max-h-[min(50vh,320px)] overflow-y-auto rounded-lg border border-slate-200 dark:border-slate-700">
                <ul className="divide-y divide-slate-100 dark:divide-slate-800" role="listbox" aria-label="Danh sách Worker">
                  {filteredWorkers.length === 0 ? (
                    <li className="px-4 py-8 text-center text-sm text-slate-500">Không có kết quả khớp tìm kiếm.</li>
                  ) : (
                    filteredWorkers.map((u) => {
                      const selected = selectedWorkerId === u.id;
                      return (
                        <li key={u.id}>
                          <button
                            type="button"
                            role="option"
                            aria-selected={selected}
                            onClick={() => setSelectedWorkerId(u.id)}
                            className={cn(
                              "flex w-full flex-col gap-0.5 px-4 py-3 text-left text-sm transition-colors",
                              "hover:bg-teal-500/[0.06] dark:hover:bg-teal-500/[0.08]",
                              selected && "bg-teal-50 dark:bg-teal-950/30"
                            )}
                          >
                            <span className="font-medium text-slate-900 dark:text-slate-100">{u.fullName}</span>
                            <span className="font-mono text-xs text-slate-500 dark:text-slate-400">@{u.username}</span>
                            {(u.email || u.phone) && (
                              <span className="text-xs text-slate-500 dark:text-slate-400">
                                {[u.email, u.phone].filter(Boolean).join(" · ")}
                              </span>
                            )}
                          </button>
                        </li>
                      );
                    })
                  )}
                </ul>
              </div>
            ) : null}

            {formError ? (
              <p className="text-sm text-destructive" role="alert">
                {formError}
              </p>
            ) : null}

            <DialogFooter className="shrink-0 gap-2 sm:gap-0">
              <Button type="button" variant="outline" onClick={() => onOpenChange(false)} disabled={submitting}>
                Hủy
              </Button>
              <Button type="submit" disabled={submitting || selectedWorkerId == null || listLoading}>
                {submitting ? "Đang gán…" : "Gán Worker"}
              </Button>
            </DialogFooter>
          </form>
        ) : null}
      </DialogContent>
    </Dialog>
  );
}
