import { cn } from "@/lib/utils";

/**
 * Màu badge (bảng, UI) + node timeline (bước hiện tại trong dialog).
 * Chỉnh tại một nơi khi đổi palette.
 */
export const ORDER_STATUS_THEME = {
  New: {
    badge:
      "bg-slate-100 text-slate-800 ring-1 ring-slate-300/90 dark:bg-slate-800 dark:text-slate-100 dark:ring-slate-600",
    nodeCurrent:
      "border-slate-600 bg-slate-100 text-slate-900 ring-slate-500 dark:border-slate-400 dark:bg-slate-800 dark:text-slate-50 dark:ring-slate-400",
  },
  AwaitingPayment: {
    badge:
      "bg-amber-50 text-amber-950 ring-1 ring-amber-300/80 dark:bg-amber-950/45 dark:text-amber-100 dark:ring-amber-700/50",
    nodeCurrent:
      "border-amber-500 bg-amber-50 text-amber-950 ring-amber-400 dark:border-amber-400 dark:bg-amber-950/40 dark:text-amber-50 dark:ring-amber-500",
  },
  Confirmed: {
    badge:
      "bg-blue-50 text-blue-900 ring-1 ring-blue-200/90 dark:bg-blue-950/45 dark:text-blue-100 dark:ring-blue-700/50",
    nodeCurrent:
      "border-blue-600 bg-blue-50 text-blue-900 ring-blue-500 dark:border-blue-400 dark:bg-blue-950/50 dark:text-blue-50 dark:ring-blue-400",
  },
  Processing: {
    badge:
      "bg-violet-50 text-violet-900 ring-1 ring-violet-200/90 dark:bg-violet-950/45 dark:text-violet-100 dark:ring-violet-700/50",
    nodeCurrent:
      "border-violet-600 bg-violet-50 text-violet-900 ring-violet-500 dark:border-violet-400 dark:bg-violet-950/50 dark:text-violet-50 dark:ring-violet-400",
  },
  ReadyToShip: {
    badge:
      "bg-sky-50 text-sky-950 ring-1 ring-sky-200/90 dark:bg-sky-950/45 dark:text-sky-100 dark:ring-sky-700/50",
    nodeCurrent:
      "border-sky-600 bg-sky-50 text-sky-950 ring-sky-500 dark:border-sky-400 dark:bg-sky-950/50 dark:text-sky-50 dark:ring-sky-400",
  },
  Shipped: {
    badge:
      "bg-indigo-50 text-indigo-900 ring-1 ring-indigo-200/90 dark:bg-indigo-950/45 dark:text-indigo-100 dark:ring-indigo-700/50",
    nodeCurrent:
      "border-indigo-600 bg-indigo-50 text-indigo-900 ring-indigo-500 dark:border-indigo-400 dark:bg-indigo-950/50 dark:text-indigo-50 dark:ring-indigo-400",
  },
  Delivered: {
    badge:
      "bg-teal-50 text-teal-900 ring-1 ring-teal-200/90 dark:bg-teal-950/45 dark:text-teal-100 dark:ring-teal-700/50",
    nodeCurrent:
      "border-teal-600 bg-teal-50 text-teal-900 ring-teal-500 dark:border-teal-400 dark:bg-teal-950/50 dark:text-teal-50 dark:ring-teal-400",
  },
  Completed: {
    badge:
      "bg-emerald-50 text-emerald-900 ring-1 ring-emerald-200/90 dark:bg-emerald-950/45 dark:text-emerald-100 dark:ring-emerald-700/50",
    nodeCurrent:
      "border-emerald-600 bg-emerald-50 text-emerald-900 ring-emerald-500 dark:border-emerald-400 dark:bg-emerald-950/50 dark:text-emerald-50 dark:ring-emerald-400",
  },
};

const ORDER_DEFAULT_BADGE =
  "bg-slate-100 text-slate-700 ring-1 ring-slate-200/80 dark:bg-slate-800 dark:text-slate-200 dark:ring-slate-600";

const ORDER_DEFAULT_NODE_CURRENT =
  "border-primary bg-primary/10 text-primary ring-primary dark:bg-primary/20 dark:text-primary";

export const PAYMENT_STATUS_THEME = {
  Paid: {
    badge:
      "bg-emerald-50 text-emerald-900 ring-1 ring-emerald-200/80 dark:bg-emerald-950/40 dark:text-emerald-200 dark:ring-emerald-800/60",
    nodeCurrent:
      "border-emerald-600 bg-emerald-50 text-emerald-900 ring-emerald-500 dark:border-emerald-400 dark:bg-emerald-950/50 dark:text-emerald-50 dark:ring-emerald-400",
  },
  Unpaid: {
    badge:
      "bg-amber-50 text-amber-950 ring-1 ring-amber-200/80 dark:bg-amber-950/40 dark:text-amber-100 dark:ring-amber-800/60",
    nodeCurrent:
      "border-amber-500 bg-amber-50 text-amber-950 ring-amber-400 dark:border-amber-400 dark:bg-amber-950/40 dark:text-amber-50 dark:ring-amber-500",
  },
  UnPaid: {
    badge:
      "bg-amber-50 text-amber-950 ring-1 ring-amber-200/80 dark:bg-amber-950/40 dark:text-amber-100 dark:ring-amber-800/60",
    nodeCurrent:
      "border-amber-500 bg-amber-50 text-amber-950 ring-amber-400 dark:border-amber-400 dark:bg-amber-950/40 dark:text-amber-50 dark:ring-amber-500",
  },
  PartiallyPaid: {
    badge:
      "bg-orange-50 text-orange-950 ring-1 ring-orange-200/80 dark:bg-orange-950/45 dark:text-orange-100 dark:ring-orange-800/55",
    nodeCurrent:
      "border-orange-600 bg-orange-50 text-orange-950 ring-orange-500 dark:border-orange-400 dark:bg-orange-950/50 dark:text-orange-50 dark:ring-orange-400",
  },
  Refunded: {
    badge:
      "bg-rose-50 text-rose-900 ring-1 ring-rose-200/80 dark:bg-rose-950/45 dark:text-rose-100 dark:ring-rose-800/55",
    nodeCurrent:
      "border-rose-600 bg-rose-50 text-rose-900 ring-rose-500 dark:border-rose-400 dark:bg-rose-950/50 dark:text-rose-50 dark:ring-rose-400",
  },
};

const PAYMENT_DEFAULT_BADGE =
  "bg-slate-100 text-slate-700 ring-1 ring-slate-200/80 dark:bg-slate-800 dark:text-slate-200 dark:ring-slate-700";

const PAYMENT_DEFAULT_NODE_CURRENT =
  "border-primary bg-primary/10 text-primary ring-primary dark:bg-primary/20 dark:text-primary";

/** Bước đã qua trên timeline (thống nhất — “đã xong”). */
export const ORDER_TIMELINE_DONE_NODE =
  "border-emerald-600 bg-emerald-600 text-white dark:border-emerald-500 dark:bg-emerald-600";

/** Bước chưa tới. */
export const ORDER_TIMELINE_FUTURE_NODE =
  "border-muted-foreground/25 bg-muted/50 text-muted-foreground dark:border-slate-600 dark:bg-slate-800/60";

/**
 * @param {string | undefined | null} status
 */
export function getOrderStatusBadgeClass(status) {
  const key = status || "";
  const t = ORDER_STATUS_THEME[key];
  return t?.badge ?? ORDER_DEFAULT_BADGE;
}

/**
 * Vòng timeline — bước hiện tại.
 * @param {string} code
 */
export function getOrderStatusTimelineCurrentClass(code) {
  const t = ORDER_STATUS_THEME[code];
  return cn(
    "border-2 bg-background font-semibold ring-2 ring-offset-2 ring-offset-background",
    t?.nodeCurrent ?? ORDER_DEFAULT_NODE_CURRENT
  );
}

/**
 * @param {string | undefined | null} status
 */
export function getPaymentStatusBadgeClass(status) {
  const key = status || "";
  const t = PAYMENT_STATUS_THEME[key];
  return t?.badge ?? PAYMENT_DEFAULT_BADGE;
}

/**
 * Vòng timeline thanh toán — bước hiện tại.
 * @param {string} code
 */
export function getPaymentStatusTimelineCurrentClass(code) {
  const key = code === "UnPaid" ? "Unpaid" : code;
  const t = PAYMENT_STATUS_THEME[key];
  return cn(
    "border-2 bg-background font-semibold ring-2 ring-offset-2 ring-offset-background",
    t?.nodeCurrent ?? PAYMENT_DEFAULT_NODE_CURRENT
  );
}
