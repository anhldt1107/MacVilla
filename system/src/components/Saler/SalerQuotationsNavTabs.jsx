import { NavLink, useLocation } from "react-router-dom";
import { cn } from "@/lib/utils";

const TABS = [
  { to: "/saler/quotations/queue", label: "Chờ tiếp nhận", end: true },
  { to: "/saler/quotations/mine", label: "Của tôi", end: true },
  { to: "/saler/quotations", label: "Liên quan", end: true, isActive: salerQuotationsAllTabActive },
];

function salerQuotationsAllTabActive(pathname) {
  const parts = pathname.split("/").filter(Boolean);
  if (parts[0] !== "saler" || parts[1] !== "quotations") return false;
  if (parts.length === 2) return true;
  const reserved = new Set(["queue", "mine", "create"]);
  if (parts.length === 3 && !reserved.has(parts[2])) return true;
  return false;
}

/**
 * Tab chuyển chế độ báo giá Saler (thay 3 mục sidebar).
 */
export function SalerQuotationsNavTabs() {
  const location = useLocation();

  return (
    <nav
      className="inline-flex flex-wrap gap-1 rounded-lg border border-slate-200 bg-slate-50/80 p-1 dark:border-slate-700 dark:bg-slate-900/50"
      aria-label="Chế độ báo giá"
    >
      {TABS.map((tab) => (
        <NavLink
          key={tab.to}
          to={tab.to}
          end={tab.end ?? false}
          className={({ isActive: navActive }) => {
            const active =
              typeof tab.isActive === "function" ? tab.isActive(location.pathname) : navActive;
            return cn(
              "rounded-md px-3 py-1.5 text-xs font-semibold transition-colors",
              active
                ? "bg-white text-indigo-800 shadow-sm ring-1 ring-slate-200/80 dark:bg-slate-950 dark:text-indigo-200 dark:ring-slate-600"
                : "text-slate-600 hover:bg-white/60 hover:text-slate-900 dark:text-slate-400 dark:hover:bg-slate-800/60 dark:hover:text-slate-100"
            );
          }}
        >
          {tab.label}
        </NavLink>
      ))}
    </nav>
  );
}
