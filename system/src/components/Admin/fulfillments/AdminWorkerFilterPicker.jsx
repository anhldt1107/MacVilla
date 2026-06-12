import { useEffect, useRef, useState } from "react";
import { fetchAdminUserRoles, fetchAdminUsers } from "@/services/admin/adminUsersApi";
import { ChevronDown, Loader2, Search, X } from "lucide-react";
import { Button } from "@/components/ui/button";
import { cn } from "@/lib/utils";

const fieldInput = cn(
  "h-10 w-full rounded-lg border border-slate-200 bg-white px-3 text-sm text-foreground shadow-sm transition-all",
  "placeholder:text-slate-400 hover:border-slate-300",
  "focus-visible:border-primary/50 focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-primary/20",
  "dark:border-slate-700 dark:bg-slate-950 dark:hover:border-slate-600"
);

/**
 * Dropdown lọc phiếu theo Worker đã gán: GET /api/admin/users?roleId=Worker&search= (debounce trong panel).
 *
 * @param {{
 *   accessToken: string | null | undefined;
 *   value: string;
 *   onChange: (workerId: string) => void;
 *   disabled?: boolean;
 *   idPrefix: string;
 *   label?: import("react").ReactNode;
 *   placeholder?: string;
 * }} props
 */
export function AdminWorkerFilterPicker({
  accessToken,
  value,
  onChange,
  disabled = false,
  idPrefix,
  label = "Nhân viên phụ trách",
  placeholder = "Chọn Worker…",
}) {
  const [pick, setPick] = useState(
    /** @type {{ id: number; fullName: string; username: string } | null} */ (null)
  );
  const [open, setOpen] = useState(false);
  const [searchInput, setSearchInput] = useState("");
  const [options, setOptions] = useState(
    /** @type {import("@/services/admin/adminUsersApi").AdminUserListItem[]} */ ([])
  );
  const [loading, setLoading] = useState(false);
  const [roleError, setRoleError] = useState("");
  const workerRoleIdRef = useRef(/** @type {number | null} */ (null));
  const rootRef = useRef(/** @type {HTMLDivElement | null} */ (null));
  const searchRef = useRef(/** @type {HTMLInputElement | null} */ (null));

  const labelId = `${idPrefix}-worker-label`;
  const triggerId = `${idPrefix}-worker-trigger`;
  const searchInputId = `${idPrefix}-worker-search`;

  useEffect(() => {
    const v = value.trim();
    if (!v) {
      setPick(null);
      return;
    }
    setPick((prev) => (prev && String(prev.id) === v ? prev : null));
  }, [value]);

  useEffect(() => {
    if (!open) return;
    const t = window.setTimeout(() => searchRef.current?.focus(), 0);
    return () => window.clearTimeout(t);
  }, [open]);

  useEffect(() => {
    if (!open || !accessToken) {
      if (!open) {
        setOptions([]);
        setRoleError("");
      }
      return;
    }
    let cancelled = false;
    const timer = window.setTimeout(async () => {
      setLoading(true);
      setRoleError("");
      try {
        if (workerRoleIdRef.current == null) {
          const roles = await fetchAdminUserRoles(accessToken);
          if (cancelled) return;
          const workerRole = roles.find((r) => String(r.roleName || "").toLowerCase() === "worker");
          if (!workerRole?.id) {
            setRoleError("Không tìm thấy role Worker.");
            setOptions([]);
            return;
          }
          workerRoleIdRef.current = workerRole.id;
        }
        const r = await fetchAdminUsers(accessToken, {
          page: 1,
          pageSize: 30,
          roleId: workerRoleIdRef.current,
          status: "Active",
          search: searchInput.trim(),
        });
        if (cancelled) return;
        setOptions(Array.isArray(r?.items) ? r.items : []);
      } catch {
        if (cancelled) return;
        setOptions([]);
      } finally {
        if (!cancelled) setLoading(false);
      }
    }, 400);
    return () => {
      cancelled = true;
      window.clearTimeout(timer);
    };
  }, [searchInput, open, accessToken]);

  useEffect(() => {
    if (!open) return;
    const onPointerDown = (e) => {
      const el = rootRef.current;
      if (el && e.target instanceof Node && !el.contains(e.target)) {
        setOpen(false);
      }
    };
    document.addEventListener("pointerdown", onPointerDown);
    return () => document.removeEventListener("pointerdown", onPointerDown);
  }, [open]);

  const hasValue = Boolean(value.trim());
  const showRich = pick && String(pick.id) === value.trim();

  return (
    <div ref={rootRef} className="relative z-[50] w-full min-w-0 space-y-2">
      <label
        className="text-xs font-semibold uppercase tracking-wider text-slate-500 dark:text-slate-400"
        htmlFor={triggerId}
        id={labelId}
      >
        {label}
      </label>
      <div className="flex min-w-0 gap-2">
        <button
          type="button"
          id={triggerId}
          aria-haspopup="listbox"
          aria-expanded={open}
          aria-labelledby={`${labelId} ${triggerId}`}
          disabled={disabled || !accessToken}
          onClick={() => {
            setOpen((o) => {
              const next = !o;
              if (next) setSearchInput("");
              return next;
            });
          }}
          className={cn(
            fieldInput,
            "flex h-auto min-h-10 min-w-0 flex-1 items-center justify-between gap-2 overflow-hidden py-2 text-left",
            !hasValue && "text-slate-400 dark:text-slate-500"
          )}
        >
          <span className="min-w-0 flex-1 truncate text-sm">
            {showRich ? (
              <>
                <span className="font-medium text-slate-900 dark:text-slate-100">{pick.fullName}</span>
                <span className="mx-1.5 text-slate-300 dark:text-slate-600">·</span>
                <span className="font-mono text-xs text-slate-500 dark:text-slate-400">@{pick.username}</span>
              </>
            ) : hasValue ? (
              <span className="tabular-nums text-slate-700 dark:text-slate-300">Worker #{value.trim()}</span>
            ) : (
              placeholder
            )}
          </span>
          <ChevronDown
            className={cn("h-4 w-4 shrink-0 text-slate-400 transition-transform", open && "rotate-180")}
            aria-hidden
          />
        </button>
        {hasValue ? (
          <Button
            type="button"
            variant="outline"
            size="icon"
            className="h-10 w-10 shrink-0 border-slate-200 dark:border-slate-700"
            disabled={disabled}
            title="Bỏ lọc Worker"
            aria-label="Bỏ lọc Worker"
            onClick={() => onChange("")}
          >
            <X className="h-4 w-4" aria-hidden />
          </Button>
        ) : null}
      </div>
      {open ? (
        <div
          className="absolute left-0 right-0 top-full z-[120] mt-1 flex max-h-[min(22rem,calc(100vh-8rem))] flex-col overflow-hidden rounded-xl border border-slate-200 bg-white shadow-xl ring-1 ring-black/5 dark:border-slate-700 dark:bg-slate-950 dark:ring-white/10"
          role="listbox"
          aria-label="Danh sách Worker"
          onMouseDown={(e) => e.preventDefault()}
        >
          <div className="relative shrink-0 border-b border-slate-100 dark:border-slate-800">
            <Search
              className="pointer-events-none absolute left-3 top-1/2 h-4 w-4 -translate-y-1/2 text-slate-400"
              aria-hidden
            />
            <input
              ref={searchRef}
              id={searchInputId}
              type="search"
              value={searchInput}
              onChange={(e) => setSearchInput(e.target.value)}
              placeholder="Tìm theo tên, username, email, SĐT…"
              className={cn(fieldInput, "border-0 pl-9 shadow-none ring-0 focus-visible:ring-0 dark:border-0")}
              autoComplete="off"
              aria-label="Tìm Worker"
            />
          </div>
          <div className="min-h-0 flex-1 overflow-y-auto py-1">
            {loading ? (
              <div className="flex items-center justify-center gap-2 py-8 text-sm text-slate-500">
                <Loader2 className="h-5 w-5 animate-spin text-slate-400" aria-hidden />
                Đang tải…
              </div>
            ) : roleError ? (
              <p className="px-3 py-6 text-center text-sm text-amber-800 dark:text-amber-300">{roleError}</p>
            ) : options.length === 0 ? (
              <p className="px-3 py-6 text-center text-sm text-slate-500 dark:text-slate-400">
                {searchInput.trim() ? "Không có Worker khớp tìm kiếm." : "Không có Worker đang hoạt động."}
              </p>
            ) : (
              options.map((u) => (
                <button
                  key={u.id}
                  type="button"
                  role="option"
                  aria-selected={value.trim() === String(u.id)}
                  className={cn(
                    "flex w-full flex-col gap-0.5 px-3 py-2.5 text-left text-sm transition-colors",
                    "hover:bg-slate-100 dark:hover:bg-slate-800/80",
                    value.trim() === String(u.id) && "bg-teal-50 dark:bg-teal-950/40"
                  )}
                  onClick={() => {
                    onChange(String(u.id));
                    setPick({
                      id: u.id,
                      fullName: u.fullName ?? "",
                      username: u.username ?? "",
                    });
                    setOpen(false);
                  }}
                >
                  <span className="font-medium text-slate-900 dark:text-slate-100">{u.fullName}</span>
                  <span className="font-mono text-xs text-slate-500 dark:text-slate-400">@{u.username}</span>
                  {(u.email || u.phone) && (
                    <span className="text-xs text-slate-500 dark:text-slate-400">
                      {[u.email, u.phone].filter(Boolean).join(" · ")}
                    </span>
                  )}
                </button>
              ))
            )}
          </div>
        </div>
      ) : null}
    </div>
  );
}
