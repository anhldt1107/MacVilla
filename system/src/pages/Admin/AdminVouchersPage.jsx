import { useCallback, useEffect, useMemo, useRef, useState } from "react";
import { useAuth } from "@/context/AuthContext";
import { ApiRequestError } from "@/services/api/apiEnvelope";
import { fetchAdminCampaigns } from "@/services/admin/adminCampaignsApi";
import {
  createAdminVoucher,
  fetchAdminVouchers,
  updateAdminVoucher,
  VOUCHER_CREATE_STATUS_OPTIONS,
  VOUCHER_DISCOUNT_TYPE_OPTIONS,
  VOUCHER_STATUS_OPTIONS,
} from "@/services/admin/adminVouchersApi";
import { ChevronDown, ChevronLeft, ChevronRight, Loader2, Pencil, Plus, RefreshCw, Search, Ticket } from "lucide-react";
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

const PAGE_SIZE_OPTIONS = [10, 20, 50];
const CAMPAIGN_PICK_PAGE_SIZE = 500;

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

function formatMoneyVnd(n) {
  if (n == null || Number.isNaN(Number(n))) return "—";
  return `${Number(n).toLocaleString("vi-VN")} đ`;
}

/** So khớp kiểu giảm như BE (không phân biệt hoa thường). */
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

/** Hiển thị giá trị giảm: % hoặc tiền (VND). */
function formatDiscountValue(type, value) {
  const n = normalizeDiscountType(type);
  if (n === "percentage") {
    const v = Number(value);
    if (Number.isNaN(v)) return "—";
    return `${v}%`;
  }
  return formatMoneyVnd(value);
}

/** Đơn tối thiểu: 0 = không yêu cầu. */
function formatMinOrderValue(v) {
  const n = Number(v);
  if (Number.isNaN(n) || n <= 0) return "Không";
  return formatMoneyVnd(n);
}

/**
 * Trần giảm sau khi tính % / cố định; null = không giới hạn thêm.
 * 0 hiển thị rõ là 0 đ (theo dữ liệu API).
 */
function formatMaxDiscountAmount(v) {
  if (v == null) return "Không giới hạn";
  return formatMoneyVnd(v);
}

/** usedCount / usageLimit; null limit = không giới hạn lượt. */
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

/** Chuẩn hóa discountType từ API sang giá trị select form. */
function rowDiscountTypeToForm(t) {
  const n = String(t || "").toLowerCase().replace(/\s/g, "");
  if (n === "fixedamount") return "FixedAmount";
  return "Percentage";
}

export function AdminVouchersPage() {
  const { accessToken, isAuthenticated } = useAuth();
  const [page, setPage] = useState(1);
  const [pageSize, setPageSize] = useState(20);
  const [status, setStatus] = useState("");
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState("");
  const [data, setData] = useState(null);
  const [listTick, setListTick] = useState(0);

  const [createDialogOpen, setCreateDialogOpen] = useState(false);
  const [campaignOptions, setCampaignOptions] = useState([]);
  const [campaignsLoading, setCampaignsLoading] = useState(false);
  const [campaignsLoadError, setCampaignsLoadError] = useState("");

  const [createCampaignId, setCreateCampaignId] = useState("");
  const [createCode, setCreateCode] = useState("");
  const [createDiscountType, setCreateDiscountType] = useState("Percentage");
  const [createDiscountValue, setCreateDiscountValue] = useState("10");
  const [createMinOrderValue, setCreateMinOrderValue] = useState("0");
  const [createMaxDiscountAmount, setCreateMaxDiscountAmount] = useState("");
  const [createUsageLimit, setCreateUsageLimit] = useState("");
  const [createVoucherStatus, setCreateVoucherStatus] = useState("Active");
  const [createSubmitting, setCreateSubmitting] = useState(false);
  const [createError, setCreateError] = useState("");

  const [editDialogOpen, setEditDialogOpen] = useState(false);
  const [editVoucherId, setEditVoucherId] = useState(null);
  const [editCampaignId, setEditCampaignId] = useState("");
  const [editCode, setEditCode] = useState("");
  const [editDiscountType, setEditDiscountType] = useState("Percentage");
  const [editDiscountValue, setEditDiscountValue] = useState("10");
  const [editMinOrderValue, setEditMinOrderValue] = useState("0");
  const [editMaxDiscountAmount, setEditMaxDiscountAmount] = useState("");
  const [editUsageLimit, setEditUsageLimit] = useState("");
  const [editVoucherStatus, setEditVoucherStatus] = useState("Active");
  const [editSubmitting, setEditSubmitting] = useState(false);
  const [editError, setEditError] = useState("");
  const [editCampaignPickerOpen, setEditCampaignPickerOpen] = useState(false);
  const [editCampaignSearchQuery, setEditCampaignSearchQuery] = useState("");
  const editCampaignPickerRef = useRef(null);

  const [campaignPickerOpen, setCampaignPickerOpen] = useState(false);
  const [campaignSearchQuery, setCampaignSearchQuery] = useState("");
  const campaignPickerRef = useRef(null);

  const selectedCampaign = useMemo(
    () => campaignOptions.find((c) => String(c.id) === createCampaignId),
    [campaignOptions, createCampaignId]
  );

  const filteredCampaigns = useMemo(() => {
    const q = campaignSearchQuery.trim().toLowerCase();
    if (!q) return campaignOptions;
    return campaignOptions.filter(
      (c) => String(c.name ?? "").toLowerCase().includes(q) || String(c.id).includes(q)
    );
  }, [campaignOptions, campaignSearchQuery]);

  const selectedEditCampaign = useMemo(
    () => campaignOptions.find((c) => String(c.id) === editCampaignId),
    [campaignOptions, editCampaignId]
  );

  const filteredEditCampaigns = useMemo(() => {
    const q = editCampaignSearchQuery.trim().toLowerCase();
    if (!q) return campaignOptions;
    return campaignOptions.filter(
      (c) => String(c.name ?? "").toLowerCase().includes(q) || String(c.id).includes(q)
    );
  }, [campaignOptions, editCampaignSearchQuery]);

  useEffect(() => {
    if (!campaignPickerOpen) return;
    const onDocMouseDown = (e) => {
      if (campaignPickerRef.current && !campaignPickerRef.current.contains(e.target)) {
        setCampaignPickerOpen(false);
      }
    };
    document.addEventListener("mousedown", onDocMouseDown);
    return () => document.removeEventListener("mousedown", onDocMouseDown);
  }, [campaignPickerOpen]);

  useEffect(() => {
    if (!editCampaignPickerOpen) return;
    const onDocMouseDown = (e) => {
      if (editCampaignPickerRef.current && !editCampaignPickerRef.current.contains(e.target)) {
        setEditCampaignPickerOpen(false);
      }
    };
    document.addEventListener("mousedown", onDocMouseDown);
    return () => document.removeEventListener("mousedown", onDocMouseDown);
  }, [editCampaignPickerOpen]);

  useEffect(() => {
    setPage(1);
  }, [status, pageSize]);

  const loadCampaignsForForm = useCallback(async () => {
    if (!accessToken) return;
    setCampaignsLoading(true);
    setCampaignsLoadError("");
    try {
      const res = await fetchAdminCampaigns(accessToken, {
        page: 1,
        pageSize: CAMPAIGN_PICK_PAGE_SIZE,
        status: "",
      });
      setCampaignOptions((res.items ?? []).map((c) => ({ id: c.id, name: c.name })));
    } catch (e) {
      setCampaignsLoadError(
        e instanceof ApiRequestError
          ? e.message
          : e instanceof Error
            ? e.message
            : "Không tải được danh sách chiến dịch."
      );
      setCampaignOptions([]);
    } finally {
      setCampaignsLoading(false);
    }
  }, [accessToken]);

  useEffect(() => {
    if ((createDialogOpen || editDialogOpen) && accessToken) {
      loadCampaignsForForm();
    }
  }, [createDialogOpen, editDialogOpen, accessToken, loadCampaignsForForm]);

  const openCreateVoucherDialog = useCallback(() => {
    setCreateCampaignId("");
    setCreateCode("");
    setCreateDiscountType("Percentage");
    setCreateDiscountValue("10");
    setCreateMinOrderValue("0");
    setCreateMaxDiscountAmount("");
    setCreateUsageLimit("");
    setCreateVoucherStatus("Active");
    setCreateError("");
    setCampaignsLoadError("");
    setCampaignPickerOpen(false);
    setCampaignSearchQuery("");
    setCreateDialogOpen(true);
  }, []);

  const handleCreateVoucher = async (e) => {
    e.preventDefault();
    setCreateError("");
    if (!accessToken) return;

    if (!createCampaignId) {
      setCreateError("Vui lòng chọn chiến dịch.");
      return;
    }
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
        campaignId: Number(createCampaignId),
        code,
        discountType: createDiscountType,
        discountValue,
        minOrderValue,
        maxDiscountAmount,
        usageLimit,
        status: createVoucherStatus,
      });
      setCreateDialogOpen(false);
      setPage(1);
      setStatus("");
      setListTick((t) => t + 1);
    } catch (err) {
      setCreateError(
        err instanceof ApiRequestError ? err.message : err instanceof Error ? err.message : "Tạo voucher thất bại."
      );
    } finally {
      setCreateSubmitting(false);
    }
  };

  const openEditVoucherDialog = useCallback((row) => {
    const allowedStatus = new Set(VOUCHER_CREATE_STATUS_OPTIONS.map((o) => o.value));
    setEditVoucherId(row.id);
    setEditCampaignId(String(row.campaignId));
    setEditCode(row.code ?? "");
    setEditDiscountType(rowDiscountTypeToForm(row.discountType));
    setEditDiscountValue(String(row.discountValue ?? ""));
    setEditMinOrderValue(String(row.minOrderValue ?? 0));
    setEditMaxDiscountAmount(row.maxDiscountAmount != null ? String(row.maxDiscountAmount) : "");
    setEditUsageLimit(row.usageLimit != null ? String(row.usageLimit) : "");
    setEditVoucherStatus(allowedStatus.has(row.status) ? row.status : "Active");
    setEditError("");
    setEditCampaignPickerOpen(false);
    setEditCampaignSearchQuery("");
    setEditDialogOpen(true);
  }, []);

  const handleUpdateVoucher = async (e) => {
    e.preventDefault();
    setEditError("");
    if (!accessToken || editVoucherId == null) return;

    if (!editCampaignId) {
      setEditError("Vui lòng chọn chiến dịch.");
      return;
    }
    const code = editCode.trim();
    if (!code) {
      setEditError("Vui lòng nhập mã voucher.");
      return;
    }
    if (code.length > 100) {
      setEditError("Mã voucher tối đa 100 ký tự.");
      return;
    }

    const discountValue = Number(editDiscountValue);
    if (Number.isNaN(discountValue) || discountValue < 0.01) {
      setEditError("Giá trị giảm phải ≥ 0,01.");
      return;
    }
    const dt = editDiscountType === "FixedAmount" ? "fixedamount" : "percentage";
    if (dt === "percentage" && (discountValue < 0.01 || discountValue > 100)) {
      setEditError("Phần trăm giảm phải từ 0,01 đến 100.");
      return;
    }

    const minOrderValue = Number(editMinOrderValue);
    if (Number.isNaN(minOrderValue) || minOrderValue < 0) {
      setEditError("Giá trị đơn tối thiểu không hợp lệ.");
      return;
    }

    let maxDiscountAmount = null;
    if (editMaxDiscountAmount.trim() !== "") {
      const m = Number(editMaxDiscountAmount);
      if (Number.isNaN(m) || m < 0) {
        setEditError("Trần giảm không hợp lệ (để trống = không giới hạn).");
        return;
      }
      maxDiscountAmount = m;
    }

    let usageLimit = null;
    if (editUsageLimit.trim() !== "") {
      const u = parseInt(editUsageLimit, 10);
      if (Number.isNaN(u) || u < 1) {
        setEditError("Giới hạn lượt phải là số nguyên ≥ 1 (để trống = không giới hạn).");
        return;
      }
      usageLimit = u;
    }

    setEditSubmitting(true);
    try {
      await updateAdminVoucher(accessToken, editVoucherId, {
        campaignId: Number(editCampaignId),
        code,
        discountType: editDiscountType,
        discountValue,
        minOrderValue,
        maxDiscountAmount,
        usageLimit,
        status: editVoucherStatus,
      });
      setEditDialogOpen(false);
      setEditVoucherId(null);
      setListTick((t) => t + 1);
    } catch (err) {
      setEditError(
        err instanceof ApiRequestError ? err.message : err instanceof Error ? err.message : "Cập nhật voucher thất bại."
      );
    } finally {
      setEditSubmitting(false);
    }
  };

  const load = useCallback(async () => {
    if (!isAuthenticated || !accessToken) {
      setLoading(false);
      return;
    }
    setLoading(true);
    setError("");
    try {
      const result = await fetchAdminVouchers(accessToken, {
        page,
        pageSize,
        status,
      });
      setData(result);
    } catch (e) {
      const msg =
        e instanceof ApiRequestError
          ? e.message
          : e instanceof Error
            ? e.message
            : "Không tải được danh sách voucher.";
      setError(msg);
      setData(null);
    } finally {
      setLoading(false);
    }
  }, [accessToken, isAuthenticated, page, pageSize, status, listTick]);

  useEffect(() => {
    load();
  }, [load]);

  const totalCount = data?.totalCount ?? 0;
  const totalPages = Math.max(1, Math.ceil(totalCount / pageSize) || 1);
  const items = data?.items ?? [];

  const clearFilters = () => setStatus("");
  const hasActiveFilters = Boolean(status);

  return (
    <div className="space-y-6">
      <Dialog
        open={createDialogOpen}
        onOpenChange={(open) => {
          setCreateDialogOpen(open);
          if (!open) {
            setCreateError("");
            setCampaignPickerOpen(false);
            setCampaignSearchQuery("");
          }
        }}
      >
        <DialogContent className="max-h-[90vh] max-w-lg overflow-y-auto sm:max-w-lg">
          <DialogHeader>
            <DialogTitle>Tạo voucher mới</DialogTitle>
            <DialogDescription>
              Mã sẽ được lưu in hoa trên server. Chiến dịch lấy từ danh sách chiến dịch (tối đa {CAMPAIGN_PICK_PAGE_SIZE} bản ghi đầu).
            </DialogDescription>
          </DialogHeader>
          <form onSubmit={handleCreateVoucher} className="space-y-4">
            <div className="space-y-2">
              <span className="text-xs font-semibold uppercase tracking-wider text-slate-500 dark:text-slate-400" id="v-create-campaign-label">
                Chiến dịch
              </span>
              <div className="relative" ref={campaignPickerRef}>
                <button
                  type="button"
                  id="v-create-campaign-trigger"
                  aria-haspopup="listbox"
                  aria-expanded={campaignPickerOpen}
                  aria-labelledby="v-create-campaign-label v-create-campaign-trigger"
                  disabled={campaignsLoading || campaignOptions.length === 0}
                  onClick={() => {
                    if (!campaignsLoading && campaignOptions.length > 0) {
                      setCampaignPickerOpen((o) => !o);
                    }
                  }}
                  className={cn(
                    fieldSelect,
                    "flex h-10 w-full items-center justify-between gap-2 text-left font-normal",
                    (campaignsLoading || campaignOptions.length === 0) && "cursor-not-allowed opacity-60"
                  )}
                >
                  <span className={cn("min-w-0 truncate", !selectedCampaign && "text-slate-400 dark:text-slate-500")}>
                    {campaignsLoading
                      ? "Đang tải…"
                      : campaignOptions.length === 0
                        ? "Không có chiến dịch"
                        : selectedCampaign
                          ? `${selectedCampaign.name} (#${selectedCampaign.id})`
                          : "Chọn chiến dịch"}
                  </span>
                  <ChevronDown
                    className={cn(
                      "h-4 w-4 shrink-0 text-slate-400 transition-transform",
                      campaignPickerOpen && "rotate-180"
                    )}
                    aria-hidden
                  />
                </button>
                {campaignPickerOpen ? (
                  <div
                    className="absolute left-0 right-0 top-full z-[100] mt-1 overflow-hidden rounded-lg border border-slate-200 bg-popover shadow-lg dark:border-slate-700 dark:bg-slate-950"
                    role="listbox"
                    aria-label="Danh sách chiến dịch"
                  >
                    <div className="border-b border-slate-100 p-2 dark:border-slate-800">
                      <div className="relative">
                        <Search className="pointer-events-none absolute left-2.5 top-1/2 h-4 w-4 -translate-y-1/2 text-slate-400" />
                        <input
                          type="search"
                          autoComplete="off"
                          placeholder="Tìm tên hoặc ID…"
                          value={campaignSearchQuery}
                          onChange={(e) => setCampaignSearchQuery(e.target.value)}
                          className={cn(fieldInput, "h-9 pl-9 text-sm")}
                          onKeyDown={(ev) => {
                            if (ev.key === "Escape") {
                              ev.stopPropagation();
                              setCampaignPickerOpen(false);
                            }
                          }}
                        />
                      </div>
                    </div>
                    <ul className="max-h-52 overflow-y-auto py-1">
                      {filteredCampaigns.length === 0 ? (
                        <li className="px-3 py-2.5 text-center text-xs text-slate-500 dark:text-slate-400">
                          Không có chiến dịch khớp
                        </li>
                      ) : (
                        filteredCampaigns.map((c) => (
                          <li key={c.id} role="presentation">
                            <button
                              type="button"
                              role="option"
                              aria-selected={String(c.id) === createCampaignId}
                              className={cn(
                                "flex w-full items-baseline gap-2 px-3 py-2 text-left text-sm transition-colors hover:bg-slate-100 dark:hover:bg-slate-800",
                                String(c.id) === createCampaignId && "bg-amber-50 dark:bg-amber-950/30"
                              )}
                              onMouseDown={(e) => e.preventDefault()}
                              onClick={() => {
                                setCreateCampaignId(String(c.id));
                                setCampaignPickerOpen(false);
                                setCampaignSearchQuery("");
                              }}
                            >
                              <span className="min-w-0 flex-1 truncate font-medium text-slate-900 dark:text-slate-100">{c.name}</span>
                              <span className="shrink-0 font-mono text-xs text-slate-500 dark:text-slate-400">#{c.id}</span>
                            </button>
                          </li>
                        ))
                      )}
                    </ul>
                  </div>
                ) : null}
              </div>
              {campaignsLoadError ? (
                <p className="text-xs text-amber-800 dark:text-amber-300">{campaignsLoadError}</p>
              ) : null}
            </div>

            <div className="space-y-2">
              <label className="text-xs font-semibold uppercase tracking-wider text-slate-500 dark:text-slate-400" htmlFor="v-create-code">
                Mã voucher
              </label>
              <input
                id="v-create-code"
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
              <label className="text-xs font-semibold uppercase tracking-wider text-slate-500 dark:text-slate-400" htmlFor="v-create-dtype">
                Loại giảm
              </label>
              <div className="relative">
                <select
                  id="v-create-dtype"
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
                <label className="text-xs font-semibold uppercase tracking-wider text-slate-500 dark:text-slate-400" htmlFor="v-create-dval">
                  {createDiscountType === "Percentage" ? "Phần trăm giảm" : "Số tiền giảm (đ)"}
                </label>
                <input
                  id="v-create-dval"
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
                <label className="text-xs font-semibold uppercase tracking-wider text-slate-500 dark:text-slate-400" htmlFor="v-create-min">
                  Đơn tối thiểu (đ)
                </label>
                <input
                  id="v-create-min"
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
              <label className="text-xs font-semibold uppercase tracking-wider text-slate-500 dark:text-slate-400" htmlFor="v-create-max">
                Trần giảm (đ)
              </label>
              <input
                id="v-create-max"
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
              <label className="text-xs font-semibold uppercase tracking-wider text-slate-500 dark:text-slate-400" htmlFor="v-create-limit">
                Giới hạn lượt dùng
              </label>
              <input
                id="v-create-limit"
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
              <label className="text-xs font-semibold uppercase tracking-wider text-slate-500 dark:text-slate-400" htmlFor="v-create-status">
                Trạng thái
              </label>
              <div className="relative">
                <select
                  id="v-create-status"
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
              <Button
                type="submit"
                className="transition-transform active:scale-[0.98]"
                disabled={createSubmitting || campaignsLoading || campaignOptions.length === 0}
              >
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
        open={editDialogOpen}
        onOpenChange={(open) => {
          setEditDialogOpen(open);
          if (!open) {
            setEditError("");
            setEditVoucherId(null);
            setEditCampaignPickerOpen(false);
            setEditCampaignSearchQuery("");
          }
        }}
      >
        <DialogContent className="max-h-[90vh] max-w-lg overflow-y-auto sm:max-w-lg">
          <DialogHeader>
            <DialogTitle>Cập nhật voucher</DialogTitle>
            <DialogDescription>
              Chỉnh chiến dịch, mã, loại giảm, điều kiện và trạng thái. Chiến dịch lấy từ danh sách (tối đa {CAMPAIGN_PICK_PAGE_SIZE} bản ghi đầu).
            </DialogDescription>
          </DialogHeader>
          <form onSubmit={handleUpdateVoucher} className="space-y-4">
            <div className="space-y-2">
              <span
                className="text-xs font-semibold uppercase tracking-wider text-slate-500 dark:text-slate-400"
                id="v-edit-campaign-label"
              >
                Chiến dịch
              </span>
              <div className="relative" ref={editCampaignPickerRef}>
                <button
                  type="button"
                  id="v-edit-campaign-trigger"
                  aria-haspopup="listbox"
                  aria-expanded={editCampaignPickerOpen}
                  aria-labelledby="v-edit-campaign-label v-edit-campaign-trigger"
                  disabled={campaignsLoading || campaignOptions.length === 0}
                  onClick={() => {
                    if (!campaignsLoading && campaignOptions.length > 0) {
                      setEditCampaignPickerOpen((o) => !o);
                    }
                  }}
                  className={cn(
                    fieldSelect,
                    "flex h-10 w-full items-center justify-between gap-2 text-left font-normal",
                    (campaignsLoading || campaignOptions.length === 0) && "cursor-not-allowed opacity-60"
                  )}
                >
                  <span className={cn("min-w-0 truncate", !selectedEditCampaign && "text-slate-400 dark:text-slate-500")}>
                    {campaignsLoading
                      ? "Đang tải…"
                      : campaignOptions.length === 0
                        ? "Không có chiến dịch"
                        : selectedEditCampaign
                          ? `${selectedEditCampaign.name} (#${selectedEditCampaign.id})`
                          : "Chọn chiến dịch"}
                  </span>
                  <ChevronDown
                    className={cn(
                      "h-4 w-4 shrink-0 text-slate-400 transition-transform",
                      editCampaignPickerOpen && "rotate-180"
                    )}
                    aria-hidden
                  />
                </button>
                {editCampaignPickerOpen ? (
                  <div
                    className="absolute left-0 right-0 top-full z-[100] mt-1 overflow-hidden rounded-lg border border-slate-200 bg-popover shadow-lg dark:border-slate-700 dark:bg-slate-950"
                    role="listbox"
                    aria-label="Danh sách chiến dịch"
                  >
                    <div className="border-b border-slate-100 p-2 dark:border-slate-800">
                      <div className="relative">
                        <Search className="pointer-events-none absolute left-2.5 top-1/2 h-4 w-4 -translate-y-1/2 text-slate-400" />
                        <input
                          type="search"
                          autoComplete="off"
                          placeholder="Tìm tên hoặc ID…"
                          value={editCampaignSearchQuery}
                          onChange={(e) => setEditCampaignSearchQuery(e.target.value)}
                          className={cn(fieldInput, "h-9 pl-9 text-sm")}
                          onKeyDown={(ev) => {
                            if (ev.key === "Escape") {
                              ev.stopPropagation();
                              setEditCampaignPickerOpen(false);
                            }
                          }}
                        />
                      </div>
                    </div>
                    <ul className="max-h-52 overflow-y-auto py-1">
                      {filteredEditCampaigns.length === 0 ? (
                        <li className="px-3 py-2.5 text-center text-xs text-slate-500 dark:text-slate-400">
                          Không có chiến dịch khớp
                        </li>
                      ) : (
                        filteredEditCampaigns.map((c) => (
                          <li key={c.id} role="presentation">
                            <button
                              type="button"
                              role="option"
                              aria-selected={String(c.id) === editCampaignId}
                              className={cn(
                                "flex w-full items-baseline gap-2 px-3 py-2 text-left text-sm transition-colors hover:bg-slate-100 dark:hover:bg-slate-800",
                                String(c.id) === editCampaignId && "bg-amber-50 dark:bg-amber-950/30"
                              )}
                              onMouseDown={(e) => e.preventDefault()}
                              onClick={() => {
                                setEditCampaignId(String(c.id));
                                setEditCampaignPickerOpen(false);
                                setEditCampaignSearchQuery("");
                              }}
                            >
                              <span className="min-w-0 flex-1 truncate font-medium text-slate-900 dark:text-slate-100">{c.name}</span>
                              <span className="shrink-0 font-mono text-xs text-slate-500 dark:text-slate-400">#{c.id}</span>
                            </button>
                          </li>
                        ))
                      )}
                    </ul>
                  </div>
                ) : null}
              </div>
              {campaignsLoadError ? (
                <p className="text-xs text-amber-800 dark:text-amber-300">{campaignsLoadError}</p>
              ) : null}
            </div>

            <div className="space-y-2">
              <label className="text-xs font-semibold uppercase tracking-wider text-slate-500 dark:text-slate-400" htmlFor="v-edit-code">
                Mã voucher
              </label>
              <input
                id="v-edit-code"
                type="text"
                autoComplete="off"
                placeholder="VD: GIAMGIA50K"
                value={editCode}
                onChange={(e) => setEditCode(e.target.value)}
                className={fieldInput}
                maxLength={100}
              />
              <p className="text-xs text-slate-500 dark:text-slate-400">Tối đa 100 ký tự; không trùng mã khác.</p>
            </div>

            <div className="space-y-2">
              <label className="text-xs font-semibold uppercase tracking-wider text-slate-500 dark:text-slate-400" htmlFor="v-edit-dtype">
                Loại giảm
              </label>
              <div className="relative">
                <select
                  id="v-edit-dtype"
                  value={editDiscountType}
                  onChange={(e) => setEditDiscountType(e.target.value)}
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
                <label className="text-xs font-semibold uppercase tracking-wider text-slate-500 dark:text-slate-400" htmlFor="v-edit-dval">
                  {editDiscountType === "Percentage" ? "Phần trăm giảm" : "Số tiền giảm (đ)"}
                </label>
                <input
                  id="v-edit-dval"
                  type="number"
                  step="0.01"
                  min="0.01"
                  max={editDiscountType === "Percentage" ? "100" : undefined}
                  value={editDiscountValue}
                  onChange={(e) => setEditDiscountValue(e.target.value)}
                  className={fieldInput}
                />
              </div>
              <div className="space-y-2">
                <label className="text-xs font-semibold uppercase tracking-wider text-slate-500 dark:text-slate-400" htmlFor="v-edit-min">
                  Đơn tối thiểu (đ)
                </label>
                <input
                  id="v-edit-min"
                  type="number"
                  step="1"
                  min="0"
                  value={editMinOrderValue}
                  onChange={(e) => setEditMinOrderValue(e.target.value)}
                  className={fieldInput}
                />
              </div>
            </div>

            <div className="space-y-2">
              <label className="text-xs font-semibold uppercase tracking-wider text-slate-500 dark:text-slate-400" htmlFor="v-edit-max">
                Trần giảm (đ)
              </label>
              <input
                id="v-edit-max"
                type="number"
                step="1"
                min="0"
                placeholder="Để trống = không giới hạn"
                value={editMaxDiscountAmount}
                onChange={(e) => setEditMaxDiscountAmount(e.target.value)}
                className={fieldInput}
              />
            </div>

            <div className="space-y-2">
              <label className="text-xs font-semibold uppercase tracking-wider text-slate-500 dark:text-slate-400" htmlFor="v-edit-limit">
                Giới hạn lượt dùng
              </label>
              <input
                id="v-edit-limit"
                type="number"
                step="1"
                min="1"
                placeholder="Để trống = không giới hạn"
                value={editUsageLimit}
                onChange={(e) => setEditUsageLimit(e.target.value)}
                className={fieldInput}
              />
            </div>

            <div className="space-y-2">
              <label className="text-xs font-semibold uppercase tracking-wider text-slate-500 dark:text-slate-400" htmlFor="v-edit-status">
                Trạng thái
              </label>
              <div className="relative">
                <select
                  id="v-edit-status"
                  value={editVoucherStatus}
                  onChange={(e) => setEditVoucherStatus(e.target.value)}
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

            {editError ? (
              <p className="text-sm text-red-700 dark:text-red-300" role="alert">
                {editError}
              </p>
            ) : null}

            <DialogFooter className="gap-2 sm:gap-0">
              <Button type="button" variant="outline" onClick={() => setEditDialogOpen(false)} disabled={editSubmitting}>
                Hủy
              </Button>
              <Button
                type="submit"
                className="transition-transform active:scale-[0.98]"
                disabled={editSubmitting || campaignsLoading || campaignOptions.length === 0}
              >
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

      <Card className="overflow-hidden border-slate-200/80 shadow-[0_20px_40px_-15px_rgba(15,23,42,0.06)] dark:border-slate-800 dark:shadow-none">
        <CardHeader className="flex flex-row items-center justify-between gap-3 border-b border-slate-100 py-3 px-4 sm:px-5 dark:border-slate-800">
          <CardTitle className="text-base font-semibold tracking-tight text-slate-900 dark:text-slate-50">
            Voucher khuyến mãi
          </CardTitle>
          <Button
            type="button"
            size="sm"
            className="shrink-0 gap-2 shadow-sm transition-transform active:scale-[0.98]"
            onClick={openCreateVoucherDialog}
          >
            <Plus className="h-4 w-4" />
            Tạo voucher
          </Button>
        </CardHeader>
        <CardContent className="p-4 sm:p-5">
          <div className="grid gap-4 sm:grid-cols-2 lg:grid-cols-12 lg:items-end">
            <div className="space-y-2 lg:col-span-8">
              <label
                className="text-xs font-semibold uppercase tracking-wider text-slate-500 dark:text-slate-400"
                htmlFor="admin-voucher-status"
              >
                Trạng thái
              </label>
              <div className="relative">
                <select
                  id="admin-voucher-status"
                  value={status}
                  onChange={(e) => setStatus(e.target.value)}
                  className={fieldSelect}
                >
                  {VOUCHER_STATUS_OPTIONS.map((o) => (
                    <option key={o.value || "all"} value={o.value}>
                      {o.label}
                    </option>
                  ))}
                </select>
                <ChevronDown className="pointer-events-none absolute right-3 top-1/2 h-4 w-4 -translate-y-1/2 text-slate-400" />
              </div>
            </div>
            <div className="flex flex-wrap items-center gap-2 lg:col-span-4 lg:justify-end">
              <Button
                type="button"
                size="sm"
                className="gap-1.5 shadow-sm transition-transform active:scale-[0.98]"
                onClick={() => load()}
                disabled={loading}
              >
                {loading ? <Loader2 className="h-3.5 w-3.5 animate-spin" /> : <RefreshCw className="h-3.5 w-3.5" />}
                Làm mới
              </Button>
              <Button type="button" variant="outline" size="sm" onClick={clearFilters} disabled={!hasActiveFilters}>
                Xóa bộ lọc
              </Button>
            </div>
          </div>
        </CardContent>
      </Card>

      {error ? (
        <div
          className="flex items-start gap-3 rounded-xl border border-red-200 bg-red-50/90 px-4 py-3 text-sm text-red-800 shadow-sm dark:border-red-900/50 dark:bg-red-950/30 dark:text-red-200"
          role="alert"
        >
          <span className="mt-0.5 inline-block h-2 w-2 shrink-0 rounded-full bg-red-500" aria-hidden />
          <span>{error}</span>
        </div>
      ) : null}

      <Card className="overflow-hidden border-slate-200/80 shadow-md shadow-slate-200/40 dark:border-slate-800 dark:shadow-none">
        <CardHeader className="flex flex-col gap-4 border-b border-slate-100 bg-white pb-4 sm:flex-row sm:items-center sm:justify-between dark:border-slate-800 dark:bg-slate-950">
          <div>
            <CardTitle className="text-lg font-semibold tracking-tight">Danh sách voucher</CardTitle>
            <CardDescription className="mt-1 text-xs sm:text-sm">
              {loading ? "Đang đồng bộ dữ liệu…" : `${totalCount.toLocaleString("vi-VN")} voucher`}
            </CardDescription>
          </div>
          <div className="flex flex-wrap items-center gap-3">
            <div className="flex items-center gap-2 rounded-lg border border-slate-200 bg-slate-50/80 px-3 py-1.5 text-xs dark:border-slate-700 dark:bg-slate-900/50">
              <span className="font-medium text-slate-600 dark:text-slate-300">Hiển thị</span>
              <select
                value={pageSize}
                onChange={(e) => setPageSize(Number(e.target.value))}
                className="h-7 cursor-pointer rounded-md border-0 bg-transparent pr-6 text-sm font-semibold text-foreground focus:ring-0"
              >
                {PAGE_SIZE_OPTIONS.map((n) => (
                  <option key={n} value={n}>
                    {n} / trang
                  </option>
                ))}
              </select>
            </div>
            <div className="rounded-lg border border-slate-200 bg-slate-50/80 px-3 py-1.5 text-xs font-medium text-slate-600 dark:border-slate-700 dark:bg-slate-900/50 dark:text-slate-300">
              Trang{" "}
              <span className="font-mono tabular-nums text-foreground">
                {page} / {totalPages}
              </span>
            </div>
          </div>
        </CardHeader>

        <CardContent className="p-0">
          <div className="overflow-x-auto">
            <table className="w-full min-w-[1280px] border-collapse text-left text-sm">
              <thead>
                <tr className="border-b border-slate-200 bg-slate-50/95 text-[11px] font-semibold uppercase tracking-wider text-slate-500 dark:border-slate-800 dark:bg-slate-900/80 dark:text-slate-400">
                  <th className="px-4 py-3.5 pl-6 font-mono">ID</th>
                  <th className="px-4 py-3.5">Mã</th>
                  <th className="px-4 py-3.5">Chiến dịch</th>
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
                {loading && items.length === 0 ? (
                  <tr>
                    <td colSpan={10} className="px-6 py-16 text-center">
                      <div className="inline-flex flex-col items-center gap-3 text-slate-500">
                        <Loader2 className="h-8 w-8 animate-spin text-amber-600/70" />
                        <span className="text-sm font-medium">Đang tải dữ liệu…</span>
                      </div>
                    </td>
                  </tr>
                ) : null}
                {!loading && items.length === 0 ? (
                  <tr>
                    <td colSpan={10} className="px-6 py-16 text-center">
                      <p className="text-sm font-medium text-slate-600 dark:text-slate-300">Không có voucher phù hợp</p>
                      <p className="mt-1 text-xs text-slate-500">Thử đổi bộ lọc trạng thái hoặc làm mới.</p>
                    </td>
                  </tr>
                ) : null}
                {items.map((row, idx) => (
                  <tr
                    key={row.id}
                    className={cn(
                      "transition-colors hover:bg-amber-500/[0.04] dark:hover:bg-amber-500/[0.06]",
                      idx % 2 === 1 && "bg-slate-50/40 dark:bg-slate-900/25"
                    )}
                  >
                    <td className="whitespace-nowrap px-4 py-3.5 pl-6 align-middle font-mono text-xs tabular-nums text-slate-500 dark:text-slate-400">
                      {row.id}
                    </td>
                    <td className="whitespace-nowrap px-4 py-3.5 align-middle">
                      <span className="font-mono text-sm font-bold tracking-wide text-slate-900 dark:text-slate-100">{row.code}</span>
                    </td>
                    <td className="max-w-[200px] px-4 py-3.5 align-middle">
                      <span className="line-clamp-2 text-sm font-medium text-slate-900 dark:text-slate-100">{row.campaignName}</span>
                      <span className="mt-0.5 block font-mono text-[11px] text-slate-500">ID chiến dịch: {row.campaignId}</span>
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
                        onClick={() => openEditVoucherDialog(row)}
                      >
                        <Pencil className="h-3.5 w-3.5" />
                        Sửa
                      </Button>
                    </td>
                  </tr>
                ))}
              </tbody>
            </table>
          </div>

          <div className="flex flex-col gap-3 border-t border-slate-200 bg-slate-50/50 px-5 py-4 sm:flex-row sm:items-center sm:justify-between dark:border-slate-800 dark:bg-slate-900/40">
            <p className="text-xs text-slate-500 dark:text-slate-400">
              {totalCount > 0 ? (
                <>
                  Hiển thị{" "}
                  <span className="font-medium font-mono tabular-nums text-slate-700 dark:text-slate-200">
                    {(page - 1) * pageSize + 1}–{Math.min(page * pageSize, totalCount)}
                  </span>{" "}
                  trong tổng{" "}
                  <span className="font-medium font-mono tabular-nums text-slate-700 dark:text-slate-200">
                    {totalCount.toLocaleString("vi-VN")}
                  </span>{" "}
                  voucher
                </>
              ) : (
                "Không có bản ghi để phân trang."
              )}
            </p>
            <div className="flex items-center gap-2">
              <Button
                type="button"
                variant="outline"
                size="sm"
                className="h-9 gap-1 border-slate-200 bg-white shadow-sm transition-transform active:scale-[0.98] dark:border-slate-700 dark:bg-slate-950"
                disabled={loading || page <= 1}
                onClick={() => setPage((p) => Math.max(1, p - 1))}
              >
                <ChevronLeft className="h-4 w-4" />
                Trước
              </Button>
              <span className="min-w-[5rem] text-center font-mono text-xs font-medium tabular-nums text-slate-600 dark:text-slate-300">
                {page} / {totalPages}
              </span>
              <Button
                type="button"
                variant="outline"
                size="sm"
                className="h-9 gap-1 border-slate-200 bg-white shadow-sm transition-transform active:scale-[0.98] dark:border-slate-700 dark:bg-slate-950"
                disabled={loading || page >= totalPages}
                onClick={() => setPage((p) => p + 1)}
              >
                Sau
                <ChevronRight className="h-4 w-4" />
              </Button>
            </div>
          </div>
        </CardContent>
      </Card>
    </div>
  );
}
