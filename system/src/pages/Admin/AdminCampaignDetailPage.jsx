import { useCallback, useEffect, useState } from "react";
import { Link, useParams } from "react-router-dom";
import { useAuth } from "@/context/AuthContext";
import { ApiRequestError } from "@/services/api/apiEnvelope";
import {
  CAMPAIGN_STATUS_OPTIONS,
  CAMPAIGN_UPDATE_STATUS_OPTIONS,
  fetchAdminCampaignById,
  updateAdminCampaign,
} from "@/services/admin/adminCampaignsApi";
import {
  createAdminVoucher,
  updateAdminVoucher,
  VOUCHER_CREATE_STATUS_OPTIONS,
  VOUCHER_DISCOUNT_TYPE_OPTIONS,
  VOUCHER_STATUS_OPTIONS,
} from "@/services/admin/adminVouchersApi";
import { ChevronDown, ChevronRight, Loader2, Pencil, Plus, Target } from "lucide-react";
import { Button } from "@/components/ui/button";
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from "@/components/ui/card";
import {
  Dialog,
  DialogContent,
  DialogDescription,
  DialogFooter,
  DialogHeader,
  DialogTitle,
} from "@/components/ui/dialog";
import { cn } from "@/lib/utils";

const CAMPAIGNS_LIST_PATH = "/admin/marketing/campaigns";

const fieldInput = cn(
  "h-10 w-full rounded-lg border border-slate-200 bg-white px-3 text-sm text-foreground shadow-sm transition-all",
  "placeholder:text-slate-400 hover:border-slate-300",
  "focus-visible:border-primary/50 focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-primary/20",
  "dark:border-slate-700 dark:bg-slate-950 dark:hover:border-slate-600"
);

const fieldSelect = cn(
  "h-10 w-full rounded-lg border border-slate-200 bg-white px-3 text-sm text-foreground shadow-sm transition-all",
  "cursor-pointer appearance-none bg-transparent pr-10",
  "hover:border-slate-300 focus-visible:border-primary/50 focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-primary/20",
  "dark:border-slate-700 dark:bg-slate-950 dark:hover:border-slate-600"
);

function toDatetimeLocalValue(d) {
  const pad = (n) => String(n).padStart(2, "0");
  return `${d.getFullYear()}-${pad(d.getMonth() + 1)}-${pad(d.getDate())}T${pad(d.getHours())}:${pad(d.getMinutes())}`;
}

function datetimeLocalToIso(value) {
  if (!value) return "";
  const d = new Date(value);
  if (Number.isNaN(d.getTime())) return "";
  return d.toISOString();
}

function formatDateTime(iso) {
  if (!iso) return "—";
  try {
    const d = new Date(iso);
    return d.toLocaleString("vi-VN", {
      day: "2-digit",
      month: "2-digit",
      year: "numeric",
      hour: "2-digit",
      minute: "2-digit",
    });
  } catch {
    return iso;
  }
}

function campaignStatusBadgeClass(status) {
  const s = (status || "").toLowerCase();
  if (s === "active") {
    return "bg-emerald-50 text-emerald-900 ring-1 ring-emerald-200/80 dark:bg-emerald-950/40 dark:text-emerald-200 dark:ring-emerald-800/50";
  }
  if (s === "inactive") {
    return "bg-slate-100 text-slate-700 ring-1 ring-slate-200/80 dark:bg-slate-800 dark:text-slate-200 dark:ring-slate-600";
  }
  if (s === "expired") {
    return "bg-amber-50 text-amber-950 ring-1 ring-amber-200/80 dark:bg-amber-950/40 dark:text-amber-100 dark:ring-amber-800/55";
  }
  return "bg-violet-50 text-violet-950 ring-1 ring-violet-200/80 dark:bg-violet-950/35 dark:text-violet-100 dark:ring-violet-800/50";
}

function labelCampaignStatus(status) {
  const hit = CAMPAIGN_STATUS_OPTIONS.find((o) => o.value === status);
  return hit?.label ?? status;
}

function formatMoneyVnd(n) {
  if (n == null || Number.isNaN(Number(n))) return "—";
  return `${Number(n).toLocaleString("vi-VN")} đ`;
}

function normalizeDiscountType(type) {
  const t = String(type || "").toLowerCase().replace(/\s/g, "");
  if (t === "percentage" || t === "percent" || t === "%") return "percentage";
  if (t === "fixedamount") return "fixedamount";
  return t;
}

function labelDiscountType(type) {
  const n = normalizeDiscountType(type);
  if (n === "percentage") return "Theo %";
  if (n === "fixedamount") return "Số tiền cố định";
  return type || "—";
}

function formatDiscountValue(type, value) {
  const n = normalizeDiscountType(type);
  if (n === "percentage") {
    const v = Number(value);
    if (Number.isNaN(v)) return "—";
    return `${v}%`;
  }
  return formatMoneyVnd(value);
}

function formatMinOrderValue(v) {
  const n = Number(v);
  if (Number.isNaN(n) || n <= 0) return "Không";
  return formatMoneyVnd(n);
}

function formatMaxDiscountAmount(v) {
  if (v == null) return "Không giới hạn";
  return formatMoneyVnd(v);
}

function formatUsage(usedCount, usageLimit) {
  const u = usedCount ?? 0;
  if (usageLimit == null) return `${u.toLocaleString("vi-VN")} / ∞`;
  return `${u.toLocaleString("vi-VN")} / ${Number(usageLimit).toLocaleString("vi-VN")}`;
}

function voucherStatusBadgeClass(status) {
  const s = (status || "").toLowerCase();
  if (s === "active") {
    return "bg-emerald-50 text-emerald-900 ring-1 ring-emerald-200/80 dark:bg-emerald-950/40 dark:text-emerald-200 dark:ring-emerald-800/50";
  }
  if (s === "inactive") {
    return "bg-slate-100 text-slate-700 ring-1 ring-slate-200/80 dark:bg-slate-800 dark:text-slate-200 dark:ring-slate-600";
  }
  if (s === "expired") {
    return "bg-amber-50 text-amber-950 ring-1 ring-amber-200/80 dark:bg-amber-950/40 dark:text-amber-100 dark:ring-amber-800/55";
  }
  return "bg-orange-50 text-orange-950 ring-1 ring-orange-200/80 dark:bg-orange-950/35 dark:text-orange-100 dark:ring-orange-800/50";
}

function labelVoucherStatus(status) {
  const hit = VOUCHER_STATUS_OPTIONS.find((o) => o.value === status);
  return hit?.label ?? status;
}

function rowDiscountTypeToForm(t) {
  const n = String(t || "").toLowerCase().replace(/\s/g, "");
  if (n === "fixedamount") return "FixedAmount";
  return "Percentage";
}

export function AdminCampaignDetailPage() {
  const { id } = useParams();
  const { accessToken, isAuthenticated } = useAuth();
  const [detail, setDetail] = useState(null);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState("");

  const [createDialogOpen, setCreateDialogOpen] = useState(false);
  const [createCode, setCreateCode] = useState("");
  const [createDiscountType, setCreateDiscountType] = useState("Percentage");
  const [createDiscountValue, setCreateDiscountValue] = useState("10");
  const [createMinOrderValue, setCreateMinOrderValue] = useState("0");
  const [createMaxDiscountAmount, setCreateMaxDiscountAmount] = useState("");
  const [createUsageLimit, setCreateUsageLimit] = useState("");
  const [createVoucherStatus, setCreateVoucherStatus] = useState("Active");
  const [createSubmitting, setCreateSubmitting] = useState(false);
  const [createError, setCreateError] = useState("");

  const [voucherEditDialogOpen, setVoucherEditDialogOpen] = useState(false);
  const [voucherEditId, setVoucherEditId] = useState(null);
  const [voucherEditCode, setVoucherEditCode] = useState("");
  const [voucherEditDiscountType, setVoucherEditDiscountType] = useState("Percentage");
  const [voucherEditDiscountValue, setVoucherEditDiscountValue] = useState("10");
  const [voucherEditMinOrderValue, setVoucherEditMinOrderValue] = useState("0");
  const [voucherEditMaxDiscountAmount, setVoucherEditMaxDiscountAmount] = useState("");
  const [voucherEditUsageLimit, setVoucherEditUsageLimit] = useState("");
  const [voucherEditStatus, setVoucherEditStatus] = useState("Active");
  const [voucherEditSubmitting, setVoucherEditSubmitting] = useState(false);
  const [voucherEditError, setVoucherEditError] = useState("");

  const [editDialogOpen, setEditDialogOpen] = useState(false);
  const [editName, setEditName] = useState("");
  const [editDescription, setEditDescription] = useState("");
  const [editStartLocal, setEditStartLocal] = useState("");
  const [editEndLocal, setEditEndLocal] = useState("");
  const [editStatus, setEditStatus] = useState("Active");
  const [editSubmitting, setEditSubmitting] = useState(false);
  const [editError, setEditError] = useState("");

  const numericId = id != null && id !== "" ? Number(id) : NaN;
  const idValid = Number.isFinite(numericId) && numericId >= 1;

  const load = useCallback(async () => {
    if (!idValid || !isAuthenticated || !accessToken) {
      setLoading(false);
      if (!idValid) setError("ID chiến dịch không hợp lệ.");
      return;
    }
    setLoading(true);
    setError("");
    try {
      const data = await fetchAdminCampaignById(accessToken, numericId);
      setDetail(data);
    } catch (e) {
      const msg =
        e instanceof ApiRequestError
          ? e.message
          : e instanceof Error
            ? e.message
            : "Không tải được chi tiết chiến dịch.";
      setError(msg);
      setDetail(null);
    } finally {
      setLoading(false);
    }
  }, [accessToken, idValid, isAuthenticated, numericId]);

  useEffect(() => {
    load();
  }, [load]);

  const openEditCampaignDialog = useCallback(() => {
    if (!detail) return;
    setEditName(detail.name ?? "");
    setEditDescription(detail.description ?? "");
    try {
      setEditStartLocal(toDatetimeLocalValue(new Date(detail.startDate)));
      setEditEndLocal(toDatetimeLocalValue(new Date(detail.endDate)));
    } catch {
      setEditStartLocal("");
      setEditEndLocal("");
    }
    const allowed = new Set(CAMPAIGN_UPDATE_STATUS_OPTIONS.map((o) => o.value));
    setEditStatus(allowed.has(detail.status) ? detail.status : "Active");
    setEditError("");
    setEditDialogOpen(true);
  }, [detail]);

  const handleUpdateCampaign = async (e) => {
    e.preventDefault();
    setEditError("");
    if (!accessToken || !idValid) return;

    const name = editName.trim();
    const desc = editDescription.trim();
    if (!name) {
      setEditError("Vui lòng nhập tên chiến dịch.");
      return;
    }
    if (!editStartLocal || !editEndLocal) {
      setEditError("Vui lòng chọn thời gian bắt đầu và kết thúc.");
      return;
    }
    const startIso = datetimeLocalToIso(editStartLocal);
    const endIso = datetimeLocalToIso(editEndLocal);
    if (!startIso || !endIso) {
      setEditError("Thời gian không hợp lệ.");
      return;
    }
    if (new Date(endIso) <= new Date(startIso)) {
      setEditError("Thời gian kết thúc phải sau thời gian bắt đầu.");
      return;
    }

    setEditSubmitting(true);
    try {
      const updated = await updateAdminCampaign(accessToken, numericId, {
        name,
        description: desc || name,
        startDate: startIso,
        endDate: endIso,
        status: editStatus,
      });
      setDetail(updated);
      setEditDialogOpen(false);
    } catch (err) {
      setEditError(
        err instanceof ApiRequestError ? err.message : err instanceof Error ? err.message : "Cập nhật chiến dịch thất bại."
      );
    } finally {
      setEditSubmitting(false);
    }
  };

  const openCreateVoucherDialog = useCallback(() => {
    setCreateCode("");
    setCreateDiscountType("Percentage");
    setCreateDiscountValue("10");
    setCreateMinOrderValue("0");
    setCreateMaxDiscountAmount("");
    setCreateUsageLimit("");
    setCreateVoucherStatus("Active");
    setCreateError("");
    setCreateDialogOpen(true);
  }, []);

  const openVoucherEditDialog = useCallback((row) => {
    const allowedStatus = new Set(VOUCHER_CREATE_STATUS_OPTIONS.map((o) => o.value));
    setVoucherEditId(row.id);
    setVoucherEditCode(row.code ?? "");
    setVoucherEditDiscountType(rowDiscountTypeToForm(row.discountType));
    setVoucherEditDiscountValue(String(row.discountValue ?? ""));
    setVoucherEditMinOrderValue(String(row.minOrderValue ?? 0));
    setVoucherEditMaxDiscountAmount(row.maxDiscountAmount != null ? String(row.maxDiscountAmount) : "");
    setVoucherEditUsageLimit(row.usageLimit != null ? String(row.usageLimit) : "");
    setVoucherEditStatus(allowedStatus.has(row.status) ? row.status : "Active");
    setVoucherEditError("");
    setVoucherEditDialogOpen(true);
  }, []);

  const handleUpdateVoucherInCampaign = async (e) => {
    e.preventDefault();
    setVoucherEditError("");
    if (!accessToken || !idValid || voucherEditId == null) return;

    const code = voucherEditCode.trim();
    if (!code) {
      setVoucherEditError("Vui lòng nhập mã voucher.");
      return;
    }
    if (code.length > 100) {
      setVoucherEditError("Mã voucher tối đa 100 ký tự.");
      return;
    }

    const discountValue = Number(voucherEditDiscountValue);
    if (Number.isNaN(discountValue) || discountValue < 0.01) {
      setVoucherEditError("Giá trị giảm phải ≥ 0,01.");
      return;
    }
    const dt = voucherEditDiscountType === "FixedAmount" ? "fixedamount" : "percentage";
    if (dt === "percentage" && (discountValue < 0.01 || discountValue > 100)) {
      setVoucherEditError("Phần trăm giảm phải từ 0,01 đến 100.");
      return;
    }

    const minOrderValue = Number(voucherEditMinOrderValue);
    if (Number.isNaN(minOrderValue) || minOrderValue < 0) {
      setVoucherEditError("Giá trị đơn tối thiểu không hợp lệ.");
      return;
    }

    let maxDiscountAmount = null;
    if (voucherEditMaxDiscountAmount.trim() !== "") {
      const m = Number(voucherEditMaxDiscountAmount);
      if (Number.isNaN(m) || m < 0) {
        setVoucherEditError("Trần giảm không hợp lệ (để trống = không giới hạn).");
        return;
      }
      maxDiscountAmount = m;
    }

    let usageLimit = null;
    if (voucherEditUsageLimit.trim() !== "") {
      const u = parseInt(voucherEditUsageLimit, 10);
      if (Number.isNaN(u) || u < 1) {
        setVoucherEditError("Giới hạn lượt phải là số nguyên ≥ 1 (để trống = không giới hạn).");
        return;
      }
      usageLimit = u;
    }

    setVoucherEditSubmitting(true);
    try {
      const updated = await updateAdminVoucher(accessToken, voucherEditId, {
        campaignId: numericId,
        code,
        discountType: voucherEditDiscountType,
        discountValue,
        minOrderValue,
        maxDiscountAmount,
        usageLimit,
        status: voucherEditStatus,
      });
      setDetail((prev) => {
        if (!prev) return prev;
        const list = Array.isArray(prev.vouchers) ? prev.vouchers : [];
        const merged = {
          ...updated,
          campaignName: updated.campaignName ?? prev.name,
          campaignId: updated.campaignId ?? numericId,
        };
        const nextVouchers = list.map((v) => (v.id === merged.id ? { ...v, ...merged } : v));
        return { ...prev, vouchers: nextVouchers };
      });
      setVoucherEditDialogOpen(false);
      setVoucherEditId(null);
    } catch (err) {
      setVoucherEditError(
        err instanceof ApiRequestError ? err.message : err instanceof Error ? err.message : "Cập nhật voucher thất bại."
      );
    } finally {
      setVoucherEditSubmitting(false);
    }
  };

  const handleCreateVoucher = async (e) => {
    e.preventDefault();
    setCreateError("");
    if (!accessToken || !idValid) return;

    const code = createCode.trim();
    if (!code) {
      setCreateError("Vui lòng nhập mã voucher.");
      return;
    }
    if (code.length > 100) {
      setCreateError("Mã voucher tối đa 100 ký tự.");
      return;
    }

    const discountValue = Number(createDiscountValue);
    if (Number.isNaN(discountValue) || discountValue < 0.01) {
      setCreateError("Giá trị giảm phải ≥ 0,01.");
      return;
    }
    const dt = createDiscountType === "FixedAmount" ? "fixedamount" : "percentage";
    if (dt === "percentage" && (discountValue < 0.01 || discountValue > 100)) {
      setCreateError("Phần trăm giảm phải từ 0,01 đến 100.");
      return;
    }

    const minOrderValue = Number(createMinOrderValue);
    if (Number.isNaN(minOrderValue) || minOrderValue < 0) {
      setCreateError("Giá trị đơn tối thiểu không hợp lệ.");
      return;
    }

    let maxDiscountAmount = null;
    if (createMaxDiscountAmount.trim() !== "") {
      const m = Number(createMaxDiscountAmount);
      if (Number.isNaN(m) || m < 0) {
        setCreateError("Trần giảm không hợp lệ (để trống = không giới hạn).");
        return;
      }
      maxDiscountAmount = m;
    }

    let usageLimit = null;
    if (createUsageLimit.trim() !== "") {
      const u = parseInt(createUsageLimit, 10);
      if (Number.isNaN(u) || u < 1) {
        setCreateError("Giới hạn lượt phải là số nguyên ≥ 1 (để trống = không giới hạn).");
        return;
      }
      usageLimit = u;
    }

    setCreateSubmitting(true);
    try {
      await createAdminVoucher(accessToken, {
        campaignId: numericId,
        code,
        discountType: createDiscountType,
        discountValue,
        minOrderValue,
        maxDiscountAmount,
        usageLimit,
        status: createVoucherStatus,
      });
      await load();
      setCreateDialogOpen(false);
    } catch (err) {
      setCreateError(
        err instanceof ApiRequestError ? err.message : err instanceof Error ? err.message : "Tạo voucher thất bại."
      );
    } finally {
      setCreateSubmitting(false);
    }
  };

  const vouchers = Array.isArray(detail?.vouchers) ? detail.vouchers : [];

  return (
    <div className="mx-auto max-w-7xl space-y-8 pb-10">
      <nav
        className="flex flex-wrap items-center gap-1 text-xs font-medium text-slate-500 dark:text-slate-400"
        aria-label="Breadcrumb"
      >
        <Link
          to="/admin"
          className="rounded-md px-1.5 py-0.5 transition-colors hover:bg-slate-100 hover:text-slate-900 active:scale-[0.98] dark:hover:bg-slate-800 dark:hover:text-slate-100"
        >
          Dashboard
        </Link>
        <ChevronRight className="h-3.5 w-3.5 shrink-0 opacity-60" aria-hidden />
        <span className="px-1.5 py-0.5 text-slate-400 dark:text-slate-500">Marketing</span>
        <ChevronRight className="h-3.5 w-3.5 shrink-0 opacity-60" aria-hidden />
        <Link
          to={CAMPAIGNS_LIST_PATH}
          className="rounded-md px-1.5 py-0.5 transition-colors hover:bg-slate-100 hover:text-slate-900 active:scale-[0.98] dark:hover:bg-slate-800 dark:hover:text-slate-100"
        >
          Chiến dịch
        </Link>
        <ChevronRight className="h-3.5 w-3.5 shrink-0 opacity-60" aria-hidden />
        <span className="max-w-[min(100%,20rem)] truncate px-1.5 py-0.5 font-semibold text-slate-800 dark:text-slate-200">
          {detail?.name ?? (idValid ? `Chiến dịch #${id}` : "—")}
        </span>
      </nav>

      {loading && !detail ? (
        <div className="flex flex-col items-center justify-center gap-3 py-20 text-slate-500">
          <Loader2 className="h-10 w-10 animate-spin text-violet-600/70" />
          <p className="text-sm font-medium">Đang tải chi tiết…</p>
        </div>
      ) : null}

      {error && !loading ? (
        <div
          className="rounded-xl border border-red-200/90 bg-red-50/90 px-4 py-3 text-sm text-red-800 shadow-sm dark:border-red-900/40 dark:bg-red-950/35 dark:text-red-200"
          role="alert"
        >
          {error}
          <div className="mt-3">
            <Button type="button" variant="outline" size="sm" asChild>
              <Link to={CAMPAIGNS_LIST_PATH}>Về danh sách chiến dịch</Link>
            </Button>
          </div>
        </div>
      ) : null}

      <Dialog
        open={createDialogOpen}
        onOpenChange={(open) => {
          setCreateDialogOpen(open);
          if (!open) setCreateError("");
        }}
      >
        <DialogContent className="max-h-[90vh] max-w-lg overflow-y-auto sm:max-w-lg">
          <DialogHeader>
            <DialogTitle>Tạo voucher trong chiến dịch</DialogTitle>
            <DialogDescription>
              Mã sẽ được lưu in hoa trên server. Voucher gắn với chiến dịch hiện tại.
            </DialogDescription>
          </DialogHeader>
          <form onSubmit={handleCreateVoucher} className="space-y-4">
            <div className="space-y-2">
              <span className="text-xs font-semibold uppercase tracking-wider text-slate-500 dark:text-slate-400">
                Chiến dịch
              </span>
              <p className="rounded-lg border border-slate-200 bg-slate-50/80 px-3 py-2.5 text-sm text-slate-800 dark:border-slate-700 dark:bg-slate-900/50 dark:text-slate-200">
                {detail?.name ? (
                  <>
                    <span className="font-medium">{detail.name}</span>
                    <span className="ml-2 font-mono text-xs text-slate-500 dark:text-slate-400">#{numericId}</span>
                  </>
                ) : idValid ? (
                  <span className="font-mono text-slate-600 dark:text-slate-300">Chiến dịch #{numericId}</span>
                ) : (
                  "—"
                )}
              </p>
            </div>

            <div className="space-y-2">
              <label className="text-xs font-semibold uppercase tracking-wider text-slate-500 dark:text-slate-400" htmlFor="cd-v-create-code">
                Mã voucher
              </label>
              <input
                id="cd-v-create-code"
                type="text"
                autoComplete="off"
                placeholder="VD: GIAMGIA50K"
                value={createCode}
                onChange={(e) => setCreateCode(e.target.value)}
                className={fieldInput}
                maxLength={100}
              />
              <p className="text-xs text-slate-500 dark:text-slate-400">Tối đa 100 ký tự; không trùng mã khác.</p>
            </div>

            <div className="space-y-2">
              <label className="text-xs font-semibold uppercase tracking-wider text-slate-500 dark:text-slate-400" htmlFor="cd-v-create-dtype">
                Loại giảm
              </label>
              <div className="relative">
                <select
                  id="cd-v-create-dtype"
                  value={createDiscountType}
                  onChange={(e) => setCreateDiscountType(e.target.value)}
                  className={fieldSelect}
                >
                  {VOUCHER_DISCOUNT_TYPE_OPTIONS.map((o) => (
                    <option key={o.value} value={o.value}>
                      {o.label}
                    </option>
                  ))}
                </select>
                <ChevronDown className="pointer-events-none absolute right-3 top-1/2 h-4 w-4 -translate-y-1/2 text-slate-400" />
              </div>
            </div>

            <div className="grid gap-4 sm:grid-cols-2">
              <div className="space-y-2">
                <label className="text-xs font-semibold uppercase tracking-wider text-slate-500 dark:text-slate-400" htmlFor="cd-v-create-dval">
                  {createDiscountType === "Percentage" ? "Phần trăm giảm" : "Số tiền giảm (đ)"}
                </label>
                <input
                  id="cd-v-create-dval"
                  type="number"
                  step="0.01"
                  min="0.01"
                  max={createDiscountType === "Percentage" ? "100" : undefined}
                  value={createDiscountValue}
                  onChange={(e) => setCreateDiscountValue(e.target.value)}
                  className={fieldInput}
                />
              </div>
              <div className="space-y-2">
                <label className="text-xs font-semibold uppercase tracking-wider text-slate-500 dark:text-slate-400" htmlFor="cd-v-create-min">
                  Đơn tối thiểu (đ)
                </label>
                <input
                  id="cd-v-create-min"
                  type="number"
                  step="1"
                  min="0"
                  value={createMinOrderValue}
                  onChange={(e) => setCreateMinOrderValue(e.target.value)}
                  className={fieldInput}
                />
              </div>
            </div>

            <div className="space-y-2">
              <label className="text-xs font-semibold uppercase tracking-wider text-slate-500 dark:text-slate-400" htmlFor="cd-v-create-max">
                Trần giảm (đ)
              </label>
              <input
                id="cd-v-create-max"
                type="number"
                step="1"
                min="0"
                placeholder="Để trống = không giới hạn"
                value={createMaxDiscountAmount}
                onChange={(e) => setCreateMaxDiscountAmount(e.target.value)}
                className={fieldInput}
              />
            </div>

            <div className="space-y-2">
              <label className="text-xs font-semibold uppercase tracking-wider text-slate-500 dark:text-slate-400" htmlFor="cd-v-create-limit">
                Giới hạn lượt dùng
              </label>
              <input
                id="cd-v-create-limit"
                type="number"
                step="1"
                min="1"
                placeholder="Để trống = không giới hạn"
                value={createUsageLimit}
                onChange={(e) => setCreateUsageLimit(e.target.value)}
                className={fieldInput}
              />
            </div>

            <div className="space-y-2">
              <label className="text-xs font-semibold uppercase tracking-wider text-slate-500 dark:text-slate-400" htmlFor="cd-v-create-status">
                Trạng thái
              </label>
              <div className="relative">
                <select
                  id="cd-v-create-status"
                  value={createVoucherStatus}
                  onChange={(e) => setCreateVoucherStatus(e.target.value)}
                  className={fieldSelect}
                >
                  {VOUCHER_CREATE_STATUS_OPTIONS.map((o) => (
                    <option key={o.value} value={o.value}>
                      {o.label}
                    </option>
                  ))}
                </select>
                <ChevronDown className="pointer-events-none absolute right-3 top-1/2 h-4 w-4 -translate-y-1/2 text-slate-400" />
              </div>
            </div>

            {createError ? (
              <p className="text-sm text-red-700 dark:text-red-300" role="alert">
                {createError}
              </p>
            ) : null}

            <DialogFooter className="gap-2 sm:gap-0">
              <Button type="button" variant="outline" onClick={() => setCreateDialogOpen(false)} disabled={createSubmitting}>
                Hủy
              </Button>
              <Button type="submit" className="transition-transform active:scale-[0.98]" disabled={createSubmitting || !idValid}>
                {createSubmitting ? (
                  <>
                    <Loader2 className="mr-2 h-4 w-4 animate-spin" />
                    Đang tạo…
                  </>
                ) : (
                  "Tạo voucher"
                )}
              </Button>
            </DialogFooter>
          </form>
        </DialogContent>
      </Dialog>

      <Dialog
        open={voucherEditDialogOpen}
        onOpenChange={(open) => {
          setVoucherEditDialogOpen(open);
          if (!open) {
            setVoucherEditError("");
            setVoucherEditId(null);
          }
        }}
      >
        <DialogContent className="max-h-[90vh] max-w-lg overflow-y-auto sm:max-w-lg">
          <DialogHeader>
            <DialogTitle>Cập nhật voucher</DialogTitle>
            <DialogDescription>
              Chỉnh mã, loại giảm, điều kiện và trạng thái. Voucher vẫn thuộc chiến dịch hiện tại (campaignId cố định).
            </DialogDescription>
          </DialogHeader>
          <form onSubmit={handleUpdateVoucherInCampaign} className="space-y-4">
            <div className="space-y-2">
              <span className="text-xs font-semibold uppercase tracking-wider text-slate-500 dark:text-slate-400">Chiến dịch</span>
              <p className="rounded-lg border border-slate-200 bg-slate-50/80 px-3 py-2.5 text-sm text-slate-800 dark:border-slate-700 dark:bg-slate-900/50 dark:text-slate-200">
                {detail?.name ? (
                  <>
                    <span className="font-medium">{detail.name}</span>
                    <span className="ml-2 font-mono text-xs text-slate-500 dark:text-slate-400">#{numericId}</span>
                  </>
                ) : idValid ? (
                  <span className="font-mono text-slate-600 dark:text-slate-300">Chiến dịch #{numericId}</span>
                ) : (
                  "—"
                )}
              </p>
            </div>

            <div className="space-y-2">
              <label className="text-xs font-semibold uppercase tracking-wider text-slate-500 dark:text-slate-400" htmlFor="cd-v-edit-code">
                Mã voucher
              </label>
              <input
                id="cd-v-edit-code"
                type="text"
                autoComplete="off"
                placeholder="VD: GIAMGIA50K"
                value={voucherEditCode}
                onChange={(e) => setVoucherEditCode(e.target.value)}
                className={fieldInput}
                maxLength={100}
              />
              <p className="text-xs text-slate-500 dark:text-slate-400">Tối đa 100 ký tự; không trùng mã khác.</p>
            </div>

            <div className="space-y-2">
              <label className="text-xs font-semibold uppercase tracking-wider text-slate-500 dark:text-slate-400" htmlFor="cd-v-edit-dtype">
                Loại giảm
              </label>
              <div className="relative">
                <select
                  id="cd-v-edit-dtype"
                  value={voucherEditDiscountType}
                  onChange={(e) => setVoucherEditDiscountType(e.target.value)}
                  className={fieldSelect}
                >
                  {VOUCHER_DISCOUNT_TYPE_OPTIONS.map((o) => (
                    <option key={o.value} value={o.value}>
                      {o.label}
                    </option>
                  ))}
                </select>
                <ChevronDown className="pointer-events-none absolute right-3 top-1/2 h-4 w-4 -translate-y-1/2 text-slate-400" />
              </div>
            </div>

            <div className="grid gap-4 sm:grid-cols-2">
              <div className="space-y-2">
                <label className="text-xs font-semibold uppercase tracking-wider text-slate-500 dark:text-slate-400" htmlFor="cd-v-edit-dval">
                  {voucherEditDiscountType === "Percentage" ? "Phần trăm giảm" : "Số tiền giảm (đ)"}
                </label>
                <input
                  id="cd-v-edit-dval"
                  type="number"
                  step="0.01"
                  min="0.01"
                  max={voucherEditDiscountType === "Percentage" ? "100" : undefined}
                  value={voucherEditDiscountValue}
                  onChange={(e) => setVoucherEditDiscountValue(e.target.value)}
                  className={fieldInput}
                />
              </div>
              <div className="space-y-2">
                <label className="text-xs font-semibold uppercase tracking-wider text-slate-500 dark:text-slate-400" htmlFor="cd-v-edit-min">
                  Đơn tối thiểu (đ)
                </label>
                <input
                  id="cd-v-edit-min"
                  type="number"
                  step="1"
                  min="0"
                  value={voucherEditMinOrderValue}
                  onChange={(e) => setVoucherEditMinOrderValue(e.target.value)}
                  className={fieldInput}
                />
              </div>
            </div>

            <div className="space-y-2">
              <label className="text-xs font-semibold uppercase tracking-wider text-slate-500 dark:text-slate-400" htmlFor="cd-v-edit-max">
                Trần giảm (đ)
              </label>
              <input
                id="cd-v-edit-max"
                type="number"
                step="1"
                min="0"
                placeholder="Để trống = không giới hạn"
                value={voucherEditMaxDiscountAmount}
                onChange={(e) => setVoucherEditMaxDiscountAmount(e.target.value)}
                className={fieldInput}
              />
            </div>

            <div className="space-y-2">
              <label className="text-xs font-semibold uppercase tracking-wider text-slate-500 dark:text-slate-400" htmlFor="cd-v-edit-limit">
                Giới hạn lượt dùng
              </label>
              <input
                id="cd-v-edit-limit"
                type="number"
                step="1"
                min="1"
                placeholder="Để trống = không giới hạn"
                value={voucherEditUsageLimit}
                onChange={(e) => setVoucherEditUsageLimit(e.target.value)}
                className={fieldInput}
              />
            </div>

            <div className="space-y-2">
              <label className="text-xs font-semibold uppercase tracking-wider text-slate-500 dark:text-slate-400" htmlFor="cd-v-edit-status">
                Trạng thái
              </label>
              <div className="relative">
                <select
                  id="cd-v-edit-status"
                  value={voucherEditStatus}
                  onChange={(e) => setVoucherEditStatus(e.target.value)}
                  className={fieldSelect}
                >
                  {VOUCHER_CREATE_STATUS_OPTIONS.map((o) => (
                    <option key={o.value} value={o.value}>
                      {o.label}
                    </option>
                  ))}
                </select>
                <ChevronDown className="pointer-events-none absolute right-3 top-1/2 h-4 w-4 -translate-y-1/2 text-slate-400" />
              </div>
            </div>

            {voucherEditError ? (
              <p className="text-sm text-red-700 dark:text-red-300" role="alert">
                {voucherEditError}
              </p>
            ) : null}

            <DialogFooter className="gap-2 sm:gap-0">
              <Button type="button" variant="outline" onClick={() => setVoucherEditDialogOpen(false)} disabled={voucherEditSubmitting}>
                Hủy
              </Button>
              <Button type="submit" className="transition-transform active:scale-[0.98]" disabled={voucherEditSubmitting || !idValid}>
                {voucherEditSubmitting ? (
                  <>
                    <Loader2 className="mr-2 h-4 w-4 animate-spin" />
                    Đang lưu…
                  </>
                ) : (
                  "Lưu thay đổi"
                )}
              </Button>
            </DialogFooter>
          </form>
        </DialogContent>
      </Dialog>

      <Dialog
        open={editDialogOpen}
        onOpenChange={(open) => {
          setEditDialogOpen(open);
          if (!open) setEditError("");
        }}
      >
        <DialogContent className="max-h-[90vh] max-w-lg overflow-y-auto sm:max-w-lg">
          <DialogHeader>
            <DialogTitle>Cập nhật chiến dịch</DialogTitle>
            <DialogDescription>
              Chỉnh tên, mô tả, khung thời gian và trạng thái.
            </DialogDescription>
          </DialogHeader>
          <form onSubmit={handleUpdateCampaign} className="space-y-4">
            <div className="space-y-2">
              <label className="text-xs font-semibold uppercase tracking-wider text-slate-500 dark:text-slate-400" htmlFor="cd-campaign-edit-name">
                Tên chiến dịch
              </label>
              <input
                id="cd-campaign-edit-name"
                type="text"
                placeholder="Ví dụ: Chiến dịch 30/4 - 1/5"
                value={editName}
                onChange={(e) => setEditName(e.target.value)}
                className={fieldInput}
              />
            </div>
            <div className="space-y-2">
              <label className="text-xs font-semibold uppercase tracking-wider text-slate-500 dark:text-slate-400" htmlFor="cd-campaign-edit-desc">
                Mô tả
              </label>
              <textarea
                id="cd-campaign-edit-desc"
                rows={3}
                placeholder="Mô tả ngắn cho đội vận hành…"
                value={editDescription}
                onChange={(e) => setEditDescription(e.target.value)}
                className={cn(fieldInput, "min-h-[5rem] resize-y py-2.5")}
              />
            </div>
            <div className="grid gap-4 sm:grid-cols-2">
              <div className="space-y-2">
                <label className="text-xs font-semibold uppercase tracking-wider text-slate-500 dark:text-slate-400" htmlFor="cd-campaign-edit-start">
                  Bắt đầu
                </label>
                <input
                  id="cd-campaign-edit-start"
                  type="datetime-local"
                  value={editStartLocal}
                  onChange={(e) => setEditStartLocal(e.target.value)}
                  className={fieldInput}
                />
              </div>
              <div className="space-y-2">
                <label className="text-xs font-semibold uppercase tracking-wider text-slate-500 dark:text-slate-400" htmlFor="cd-campaign-edit-end">
                  Kết thúc
                </label>
                <input
                  id="cd-campaign-edit-end"
                  type="datetime-local"
                  value={editEndLocal}
                  onChange={(e) => setEditEndLocal(e.target.value)}
                  className={fieldInput}
                />
              </div>
            </div>
            <div className="space-y-2">
              <label className="text-xs font-semibold uppercase tracking-wider text-slate-500 dark:text-slate-400" htmlFor="cd-campaign-edit-status">
                Trạng thái
              </label>
              <div className="relative">
                <select
                  id="cd-campaign-edit-status"
                  value={editStatus}
                  onChange={(e) => setEditStatus(e.target.value)}
                  className={fieldSelect}
                >
                  {CAMPAIGN_UPDATE_STATUS_OPTIONS.map((o) => (
                    <option key={o.value} value={o.value}>
                      {o.label}
                    </option>
                  ))}
                </select>
                <ChevronDown className="pointer-events-none absolute right-3 top-1/2 h-4 w-4 -translate-y-1/2 text-slate-400" />
              </div>
            </div>
            {editError ? (
              <p className="text-sm text-red-700 dark:text-red-300" role="alert">
                {editError}
              </p>
            ) : null}
            <DialogFooter className="gap-2 sm:gap-0">
              <Button type="button" variant="outline" onClick={() => setEditDialogOpen(false)} disabled={editSubmitting}>
                Hủy
              </Button>
              <Button type="submit" className="transition-transform active:scale-[0.98]" disabled={editSubmitting || !idValid}>
                {editSubmitting ? (
                  <>
                    <Loader2 className="mr-2 h-4 w-4 animate-spin" />
                    Đang lưu…
                  </>
                ) : (
                  "Lưu thay đổi"
                )}
              </Button>
            </DialogFooter>
          </form>
        </DialogContent>
      </Dialog>

      {!loading && !error && detail ? (
        <>
          <header className="border-b border-slate-200/90 pb-8 dark:border-slate-800">
            <div className="flex flex-col gap-4 sm:flex-row sm:items-start sm:justify-between">
              <div className="flex min-w-0 items-start gap-3">
                <span className="flex h-12 w-12 shrink-0 items-center justify-center rounded-xl bg-violet-500/10 text-violet-700 ring-1 ring-violet-500/15 dark:text-violet-300 dark:ring-violet-500/25">
                  <Target className="h-6 w-6" strokeWidth={2} aria-hidden />
                </span>
                <div className="min-w-0 space-y-2">
                  <p className="text-xs font-semibold uppercase tracking-widest text-slate-500 dark:text-slate-400">
                    Chi tiết chiến dịch
                  </p>
                  <h1 className="text-2xl font-semibold tracking-tight text-slate-900 dark:text-slate-50 sm:text-3xl">{detail.name}</h1>
                  <p className="font-mono text-sm text-slate-600 dark:text-slate-400">ID {detail.id}</p>
                </div>
              </div>
              <div className="flex shrink-0 flex-col items-stretch gap-2 sm:flex-row sm:items-center">
                <Button type="button" variant="outline" size="sm" className="gap-2" onClick={openEditCampaignDialog}>
                  <Pencil className="h-3.5 w-3.5" />
                  Chỉnh sửa
                </Button>
                <span
                  className={cn(
                    "inline-flex w-fit items-center justify-center rounded-full px-3 py-1 text-xs font-bold uppercase tracking-wide",
                    campaignStatusBadgeClass(detail.status)
                  )}
                >
                  {labelCampaignStatus(detail.status)}
                </span>
              </div>
            </div>
          </header>

          <div className="grid gap-6 lg:grid-cols-3">
            <Card className="border-slate-200/80 shadow-sm dark:border-slate-800 lg:col-span-2">
              <CardHeader>
                <CardTitle className="text-base">Thông tin</CardTitle>
                <CardDescription>Mô tả và khung thời gian áp dụng.</CardDescription>
              </CardHeader>
              <CardContent className="space-y-4 text-sm">
                <div>
                  <p className="text-xs font-semibold uppercase tracking-wider text-slate-500 dark:text-slate-400">Mô tả</p>
                  <p className="mt-1 whitespace-pre-wrap text-slate-700 dark:text-slate-300">
                    {detail.description?.trim() || "—"}
                  </p>
                </div>
                <dl className="grid gap-3 sm:grid-cols-2">
                  <div>
                    <dt className="text-xs font-semibold uppercase tracking-wider text-slate-500 dark:text-slate-400">Bắt đầu</dt>
                    <dd className="mt-1 text-slate-800 dark:text-slate-200">{formatDateTime(detail.startDate)}</dd>
                  </div>
                  <div>
                    <dt className="text-xs font-semibold uppercase tracking-wider text-slate-500 dark:text-slate-400">Kết thúc</dt>
                    <dd className="mt-1 text-slate-800 dark:text-slate-200">{formatDateTime(detail.endDate)}</dd>
                  </div>
                </dl>
              </CardContent>
            </Card>

            <Card className="border-slate-200/80 shadow-sm dark:border-slate-800">
              <CardHeader>
                <CardTitle className="text-base">Tóm tắt</CardTitle>
              </CardHeader>
              <CardContent className="space-y-2 text-sm">
                <p className="text-slate-600 dark:text-slate-400">
                  <span className="font-semibold text-slate-900 dark:text-slate-100">{vouchers.length}</span> voucher trong chiến dịch
                </p>
                <Button variant="outline" size="sm" className="mt-2 w-full sm:w-auto" asChild>
                  <Link to={CAMPAIGNS_LIST_PATH}>← Danh sách chiến dịch</Link>
                </Button>
              </CardContent>
            </Card>
          </div>

          <Card className="overflow-hidden border-slate-200/80 shadow-md dark:border-slate-800 dark:shadow-none">
            <CardHeader className="flex flex-col gap-4 border-b border-slate-100 dark:border-slate-800 sm:flex-row sm:items-start sm:justify-between">
              <div className="min-w-0 space-y-1">
                <CardTitle className="text-lg">Voucher trong chiến dịch</CardTitle>
                <CardDescription>Mã giảm giá gắn với chiến dịch này (cùng logic hiển thị như trang Voucher).</CardDescription>
              </div>
              <Button
                type="button"
                className="shrink-0 gap-2 shadow-sm transition-transform active:scale-[0.98]"
                onClick={openCreateVoucherDialog}
              >
                <Plus className="h-4 w-4" />
                Tạo voucher
              </Button>
            </CardHeader>
            <CardContent className="p-0">
              <div className="overflow-x-auto">
                <table className="w-full min-w-[1080px] border-collapse text-left text-sm">
                  <thead>
                    <tr className="border-b border-slate-200 bg-slate-50/95 text-[11px] font-semibold uppercase tracking-wider text-slate-500 dark:border-slate-800 dark:bg-slate-900/80 dark:text-slate-400">
                      <th className="px-4 py-3.5 pl-6 font-mono">ID</th>
                      <th className="px-4 py-3.5">Mã</th>
                      <th className="px-4 py-3.5">Loại giảm</th>
                      <th className="px-4 py-3.5">Giá trị</th>
                      <th className="px-4 py-3.5">Đơn tối thiểu</th>
                      <th className="px-4 py-3.5">Trần giảm</th>
                      <th className="px-4 py-3.5 text-center">Đã dùng / Giới hạn</th>
                      <th className="px-4 py-3.5">Trạng thái</th>
                      <th className="px-4 py-3.5 pr-6 text-right">Thao tác</th>
                    </tr>
                  </thead>
                  <tbody className="divide-y divide-slate-100 dark:divide-slate-800">
                    {vouchers.length === 0 ? (
                      <tr>
                        <td colSpan={9} className="px-6 py-14 text-center text-sm text-slate-500 dark:text-slate-400">
                          Chưa có voucher nào trong chiến dịch này.
                        </td>
                      </tr>
                    ) : (
                      vouchers.map((row, idx) => (
                        <tr
                          key={row.id}
                          className={cn(
                            "transition-colors hover:bg-violet-500/[0.04] dark:hover:bg-violet-500/[0.06]",
                            idx % 2 === 1 && "bg-slate-50/40 dark:bg-slate-900/25"
                          )}
                        >
                          <td className="whitespace-nowrap px-4 py-3.5 pl-6 align-middle font-mono text-xs tabular-nums text-slate-500 dark:text-slate-400">
                            {row.id}
                          </td>
                          <td className="whitespace-nowrap px-4 py-3.5 align-middle">
                            <span className="font-mono text-sm font-bold tracking-wide text-slate-900 dark:text-slate-100">{row.code}</span>
                          </td>
                          <td className="whitespace-nowrap px-4 py-3.5 align-middle text-xs text-slate-700 dark:text-slate-300">
                            {labelDiscountType(row.discountType)}
                          </td>
                          <td className="whitespace-nowrap px-4 py-3.5 align-middle font-mono text-sm tabular-nums text-slate-800 dark:text-slate-200">
                            {formatDiscountValue(row.discountType, row.discountValue)}
                          </td>
                          <td className="whitespace-nowrap px-4 py-3.5 align-middle text-xs text-slate-600 dark:text-slate-400">
                            {formatMinOrderValue(row.minOrderValue)}
                          </td>
                          <td className="whitespace-nowrap px-4 py-3.5 align-middle text-xs text-slate-600 dark:text-slate-400">
                            {formatMaxDiscountAmount(row.maxDiscountAmount)}
                          </td>
                          <td className="whitespace-nowrap px-4 py-3.5 text-center align-middle font-mono text-xs tabular-nums text-slate-700 dark:text-slate-300">
                            {formatUsage(row.usedCount, row.usageLimit)}
                          </td>
                          <td className="px-4 py-3.5 align-middle">
                            <span
                              className={cn(
                                "inline-flex rounded-full px-2.5 py-0.5 text-xs font-semibold",
                                voucherStatusBadgeClass(row.status)
                              )}
                            >
                              {labelVoucherStatus(row.status)}
                            </span>
                          </td>
                          <td className="whitespace-nowrap px-4 py-3.5 pr-6 text-right align-middle">
                            <Button
                              type="button"
                              variant="outline"
                              size="sm"
                              className="h-8 gap-1 px-2.5"
                              onClick={() => openVoucherEditDialog(row)}
                            >
                              <Pencil className="h-3.5 w-3.5" />
                              Sửa
                            </Button>
                          </td>
                        </tr>
                      ))
                    )}
                  </tbody>
                </table>
              </div>
            </CardContent>
          </Card>
        </>
      ) : null}
    </div>
  );
}
