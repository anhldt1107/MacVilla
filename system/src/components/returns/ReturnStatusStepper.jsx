import { labelAdminReturnStatus } from "@/services/admin/adminReturnsApi";
import { cn } from "@/lib/utils";

const STEPS = [
  { key: "requested", match: ["requested", "pendingapproval"] },
  { key: "approved", match: ["approved"] },
  { key: "processing", match: ["processing"] },
  { key: "itemsreceived", match: ["itemsreceived"] },
  { key: "completed", match: ["completed"] },
];

function norm(s) {
  return String(s ?? "").trim().replace(/\s+/g, "").toLowerCase();
}

function stepIndex(status) {
  const n = norm(status);
  if (n.includes("reject") || n.includes("cancel")) return -1;
  const idx = STEPS.findIndex((st) => st.match.some((m) => n === m || n.includes(m)));
  return idx >= 0 ? idx : 0;
}

/**
 * @param {{ status?: string | null; statusOptions?: { value: string; label: string }[] }} props
 */
export function ReturnStatusStepper({ status, statusOptions = [] }) {
  const cur = stepIndex(status);
  const terminal = norm(status).includes("reject") || norm(status).includes("cancel");

  if (terminal) {
    return (
      <p className="text-sm text-slate-600 dark:text-slate-400">
        Trạng thái kết thúc: {labelAdminReturnStatus(status, statusOptions)}
      </p>
    );
  }

  return (
    <ol className="flex flex-wrap gap-2 text-xs">
      {STEPS.map((st, i) => {
        const done = i < cur;
        const active = i === cur;
        const label =
          st.key === "requested"
            ? "Yêu cầu"
            : st.key === "approved"
              ? "Đã duyệt"
              : st.key === "processing"
                ? "Thu hồi"
                : st.key === "itemsreceived"
                  ? "Đã nhận hàng"
                  : "Hoàn tất";
        return (
          <li
            key={st.key}
            className={cn(
              "rounded-full px-2.5 py-1 font-medium ring-1",
              done && "bg-emerald-50 text-emerald-900 ring-emerald-200 dark:bg-emerald-950/40 dark:text-emerald-100",
              active && !done && "bg-violet-50 text-violet-900 ring-violet-300 dark:bg-violet-950/40",
              !done && !active && "bg-slate-50 text-slate-500 ring-slate-200 dark:bg-slate-900"
            )}
          >
            {label}
          </li>
        );
      })}
    </ol>
  );
}
