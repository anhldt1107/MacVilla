import { useCallback, useEffect, useMemo, useState } from "react";
import { useAuth } from "@/context/AuthContext";
import { ApiRequestError } from "@/services/api/apiEnvelope";
import {
  ADMIN_USER_STATUS_OPTIONS,
  createAdminUser,
  fetchAdminUserById,
  fetchAdminUserRoles,
  fetchAdminUsers,
  resetAdminUserPassword,
  updateAdminUser,
  updateAdminUserStatus,
} from "@/services/admin/adminUsersApi";
import {
  baseUsernameFromFullName,
  buildStaffDefaultPassword,
  staffUsernameVariant,
} from "@/utils/staffUsername";
import { generateResetPassword6 } from "@/utils/resetPassword";
import {
  Check,
  ChevronDown,
  ChevronLeft,
  ChevronRight,
  Copy,
  Loader2,
  KeyRound,
  RefreshCw,
  Search,
  UserCog,
  UserPlus,
} from "lucide-react";
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
const USERNAME_RETRY_MAX = 80;

const fieldInput = cn(
  "h-10 w-full rounded-lg border border-slate-200 bg-white px-3 text-sm text-foreground shadow-sm transition-all",
  "placeholder:text-slate-400 hover:border-slate-300",
  "focus-visible:border-primary/50 focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-primary/20",
  "dark:border-slate-700 dark:bg-slate-950 dark:hover:border-slate-600"
);

const fieldSelect = cn(fieldInput, "cursor-pointer appearance-none bg-transparent pr-10");

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

function statusBadgeClass(status) {
  const s = (status || "").toLowerCase();
  if (s === "active") {
    return "bg-emerald-50 text-emerald-900 ring-1 ring-emerald-200/80 dark:bg-emerald-950/40 dark:text-emerald-200 dark:ring-emerald-800/50";
  }
  if (s === "inactive") {
    return "bg-slate-100 text-slate-700 ring-1 ring-slate-200/80 dark:bg-slate-800 dark:text-slate-200 dark:ring-slate-600";
  }
  return "bg-amber-50 text-amber-950 ring-1 ring-amber-200/80 dark:bg-amber-950/40 dark:text-amber-100 dark:ring-amber-800/55";
}

function labelStatus(status) {
  const hit = ADMIN_USER_STATUS_OPTIONS.find((o) => o.value === status);
  return hit?.label ?? status;
}

/** Chuẩn hóa trạng thái API → Active | Inactive cho dropdown. */
function toAssignedStatusValue(status) {
  return String(status ?? "").toLowerCase() === "inactive" ? "Inactive" : "Active";
}

export function AdminEmployeesPage() {
  const { accessToken, isAuthenticated } = useAuth();
  const [page, setPage] = useState(1);
  const [pageSize, setPageSize] = useState(20);
  const [searchInput, setSearchInput] = useState("");
  const [debouncedSearch, setDebouncedSearch] = useState("");
  const [roleId, setRoleId] = useState("");
  const [status, setStatus] = useState("");
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState("");
  const [data, setData] = useState(null);

  const [roles, setRoles] = useState([]);
  const [rolesLoading, setRolesLoading] = useState(false);
  const [rolesError, setRolesError] = useState("");

  const [createFullName, setCreateFullName] = useState("");
  const [createEmail, setCreateEmail] = useState("");
  const [createPhone, setCreatePhone] = useState("");
  const [createRoleId, setCreateRoleId] = useState("");
  const [createSubmitting, setCreateSubmitting] = useState(false);
  const [createError, setCreateError] = useState("");
  const [createdCredentials, setCreatedCredentials] = useState(null);
  const [copyDone, setCopyDone] = useState(false);
  const [createDialogOpen, setCreateDialogOpen] = useState(false);

  const [detailDialogOpen, setDetailDialogOpen] = useState(false);
  const [detailUserId, setDetailUserId] = useState(null);
  const [detail, setDetail] = useState(null);
  const [detailLoading, setDetailLoading] = useState(false);
  const [detailError, setDetailError] = useState("");
  const [editFullName, setEditFullName] = useState("");
  const [editEmail, setEditEmail] = useState("");
  const [editPhone, setEditPhone] = useState("");
  const [editRoleId, setEditRoleId] = useState("");
  const [detailSaveError, setDetailSaveError] = useState("");
  const [detailSubmitting, setDetailSubmitting] = useState(false);

  const [resetDialogOpen, setResetDialogOpen] = useState(false);
  const [resetTarget, setResetTarget] = useState(null);
  const [resetCandidatePassword, setResetCandidatePassword] = useState("");
  const [resetDone, setResetDone] = useState(false);
  const [resetSubmitting, setResetSubmitting] = useState(false);
  const [resetError, setResetError] = useState("");
  const [resetCopyDone, setResetCopyDone] = useState(false);

  const [statusConfirm, setStatusConfirm] = useState(null);
  const [statusUpdateSubmitting, setStatusUpdateSubmitting] = useState(false);
  const [statusUpdateError, setStatusUpdateError] = useState("");

  const userStatusEditOptions = useMemo(() => ADMIN_USER_STATUS_OPTIONS.filter((o) => o.value !== ""), []);

  const createBaseUsername = useMemo(() => baseUsernameFromFullName(createFullName), [createFullName]);
  const createPasswordPreview = useMemo(() => {
    if (!createBaseUsername) return "";
    return buildStaffDefaultPassword(createBaseUsername, createPhone);
  }, [createBaseUsername, createPhone]);

  useEffect(() => {
    const t = setTimeout(() => setDebouncedSearch(searchInput.trim()), 450);
    return () => clearTimeout(t);
  }, [searchInput]);

  useEffect(() => {
    setPage(1);
  }, [debouncedSearch, roleId, status, pageSize]);

  const loadRoles = useCallback(async () => {
    if (!isAuthenticated || !accessToken) return;
    setRolesLoading(true);
    setRolesError("");
    try {
      const list = await fetchAdminUserRoles(accessToken);
      setRoles(list);
    } catch (e) {
      const msg =
        e instanceof ApiRequestError
          ? e.message
          : e instanceof Error
            ? e.message
            : "Không tải được danh sách vai trò.";
      setRolesError(msg);
      setRoles([]);
    } finally {
      setRolesLoading(false);
    }
  }, [accessToken, isAuthenticated]);

  useEffect(() => {
    loadRoles();
  }, [loadRoles]);

  const load = useCallback(async () => {
    if (!isAuthenticated || !accessToken) {
      setLoading(false);
      return;
    }
    setLoading(true);
    setError("");
    try {
      const result = await fetchAdminUsers(accessToken, {
        page,
        pageSize,
        search: debouncedSearch,
        roleId,
        status,
      });
      setData(result);
    } catch (e) {
      const msg =
        e instanceof ApiRequestError
          ? e.message
          : e instanceof Error
            ? e.message
            : "Không tải được danh sách nhân sự.";
      setError(msg);
      setData(null);
    } finally {
      setLoading(false);
    }
  }, [accessToken, isAuthenticated, page, pageSize, debouncedSearch, roleId, status]);

  useEffect(() => {
    load();
  }, [load]);

  const openEmployeeDetail = useCallback((id) => {
    setDetailUserId(id);
    setDetail(null);
    setDetailError("");
    setDetailSaveError("");
    setEditFullName("");
    setEditEmail("");
    setEditPhone("");
    setEditRoleId("");
    setDetailDialogOpen(true);
  }, []);

  useEffect(() => {
    if (!detailDialogOpen || detailUserId == null || !accessToken) return;
    let cancelled = false;
    setDetailLoading(true);
    setDetailError("");
    (async () => {
      try {
        const d = await fetchAdminUserById(accessToken, detailUserId);
        if (cancelled) return;
        setDetail(d);
        setEditFullName(d.fullName ?? "");
        setEditEmail(d.email ?? "");
        setEditPhone(d.phone ?? "");
        setEditRoleId(String(d.roleId ?? ""));
      } catch (e) {
        if (!cancelled) {
          setDetailError(
            e instanceof ApiRequestError
              ? e.message
              : e instanceof Error
                ? e.message
                : "Không tải được chi tiết nhân sự."
          );
          setDetail(null);
        }
      } finally {
        if (!cancelled) setDetailLoading(false);
      }
    })();
    return () => {
      cancelled = true;
    };
  }, [detailDialogOpen, detailUserId, accessToken]);

  const totalCount = data?.totalCount ?? 0;
  const totalPages = Math.max(1, Math.ceil(totalCount / pageSize) || 1);
  const items = data?.items ?? [];

  const clearFilters = () => {
    setSearchInput("");
    setDebouncedSearch("");
    setRoleId("");
    setStatus("");
  };

  const hasActiveFilters = Boolean(searchInput.trim()) || Boolean(roleId) || Boolean(status);

  const credentialsCopyText = useCallback((username, password) => {
    return `Tên đăng nhập: ${username}\nMật khẩu ban đầu: ${password}\n\n(Lưu ý: nên đổi mật khẩu sau lần đăng nhập đầu tiên.)`;
  }, []);

  const handleCopyCredentials = useCallback(async () => {
    if (!createdCredentials) return;
    const text = credentialsCopyText(createdCredentials.username, createdCredentials.password);
    try {
      await navigator.clipboard.writeText(text);
      setCreateError("");
      setCopyDone(true);
      window.setTimeout(() => setCopyDone(false), 2000);
    } catch {
      setCreateError("Không sao chép được — thử chọn và copy thủ công.");
    }
  }, [createdCredentials, credentialsCopyText]);

  const resetPasswordCopyText = useCallback((username, password) => {
    return `Tên đăng nhập: ${username}\nMật khẩu mới: ${password}\n\n(Lưu ý: chỉ gửi qua kênh an toàn; nên đổi mật khẩu sau khi đăng nhập.)`;
  }, []);

  const openResetPasswordDialog = useCallback((row) => {
    setResetTarget({ id: row.id, username: row.username, fullName: row.fullName ?? "" });
    setResetCandidatePassword(generateResetPassword6());
    setResetDone(false);
    setResetError("");
    setResetCopyDone(false);
    setResetDialogOpen(true);
  }, []);

  const handleResetCopyInfo = useCallback(async () => {
    if (!resetTarget || !resetCandidatePassword) return;
    const text = resetPasswordCopyText(resetTarget.username, resetCandidatePassword);
    try {
      await navigator.clipboard.writeText(text);
      setResetError("");
      setResetCopyDone(true);
      window.setTimeout(() => setResetCopyDone(false), 2000);
    } catch {
      setResetError("Không sao chép được — thử chọn và copy thủ công.");
    }
  }, [resetTarget, resetCandidatePassword, resetPasswordCopyText]);

  const handleConfirmResetPassword = async () => {
    if (!resetTarget || !accessToken || !resetCandidatePassword) return;
    setResetError("");
    setResetSubmitting(true);
    try {
      await resetAdminUserPassword(accessToken, resetTarget.id, resetCandidatePassword);
      setResetDone(true);
      setResetCopyDone(false);
      load();
    } catch (err) {
      setResetError(
        err instanceof ApiRequestError ? err.message : err instanceof Error ? err.message : "Đặt lại mật khẩu thất bại."
      );
    } finally {
      setResetSubmitting(false);
    }
  };

  const handleConfirmStatusUpdate = async () => {
    if (!statusConfirm || !accessToken) return;
    const { userId, toStatus } = statusConfirm;
    setStatusUpdateError("");
    setStatusUpdateSubmitting(true);
    try {
      const updated = await updateAdminUserStatus(accessToken, userId, toStatus);
      setStatusConfirm(null);
      load();
      setDetail((d) => (d && d.id === userId ? { ...d, ...updated } : d));
    } catch (err) {
      setStatusUpdateError(
        err instanceof ApiRequestError ? err.message : err instanceof Error ? err.message : "Cập nhật trạng thái thất bại."
      );
    } finally {
      setStatusUpdateSubmitting(false);
    }
  };

  const handleCreateStaff = async (e) => {
    e.preventDefault();
    setCreateError("");
    const name = createFullName.trim();
    const mail = createEmail.trim();
    const tel = createPhone.trim();
    if (!name) {
      setCreateError("Vui lòng nhập họ tên.");
      return;
    }
    if (!mail) {
      setCreateError("Vui lòng nhập email.");
      return;
    }
    if (!tel) {
      setCreateError("Vui lòng nhập số điện thoại.");
      return;
    }
    if (!createRoleId) {
      setCreateError("Vui lòng chọn vai trò.");
      return;
    }
    if (!accessToken) return;

    const base = baseUsernameFromFullName(name);
    if (!base) {
      setCreateError("Không tạo được tên đăng nhập từ họ tên.");
      return;
    }

    setCreateSubmitting(true);
    try {
      let lastError = null;
      for (let attempt = 0; attempt <= USERNAME_RETRY_MAX; attempt++) {
        const username = staffUsernameVariant(base, attempt);
        const password = buildStaffDefaultPassword(username, tel);
        try {
          const created = await createAdminUser(accessToken, {
            username,
            password,
            fullName: name,
            email: mail,
            phone: tel,
            roleId: Number(createRoleId),
          });
          setCreatedCredentials({ username: created.username, password });
          setCopyDone(false);
          setCreateFullName("");
          setCreateEmail("");
          setCreatePhone("");
          setCreateRoleId("");
          load();
          return;
        } catch (err) {
          lastError = err;
          if (err instanceof ApiRequestError && String(err.errorCode || "").toUpperCase() === "CONFLICT") {
            continue;
          }
          throw err;
        }
      }
      const msg =
        lastError instanceof ApiRequestError
          ? lastError.message
          : "Không còn tên đăng nhập trống sau nhiều lần thử.";
      setCreateError(msg);
    } catch (err) {
      setCreateError(
        err instanceof ApiRequestError ? err.message : err instanceof Error ? err.message : "Tạo tài khoản thất bại."
      );
    } finally {
      setCreateSubmitting(false);
    }
  };

  const handleDetailSave = async (e) => {
    e.preventDefault();
    if (detailUserId == null || !accessToken) return;
    setDetailSaveError("");
    const name = editFullName.trim();
    const mail = editEmail.trim();
    const tel = editPhone.trim();
    if (!name) {
      setDetailSaveError("Vui lòng nhập họ tên.");
      return;
    }
    if (!mail) {
      setDetailSaveError("Vui lòng nhập email.");
      return;
    }
    if (!tel) {
      setDetailSaveError("Vui lòng nhập số điện thoại.");
      return;
    }
    if (!editRoleId) {
      setDetailSaveError("Vui lòng chọn vai trò.");
      return;
    }
    setDetailSubmitting(true);
    try {
      const updated = await updateAdminUser(accessToken, detailUserId, {
        fullName: name,
        email: mail,
        phone: tel,
        roleId: Number(editRoleId),
      });
      setDetail(updated);
      setEditFullName(updated.fullName ?? "");
      setEditEmail(updated.email ?? "");
      setEditPhone(updated.phone ?? "");
      setEditRoleId(String(updated.roleId ?? ""));
      load();
    } catch (err) {
      setDetailSaveError(
        err instanceof ApiRequestError ? err.message : err instanceof Error ? err.message : "Cập nhật thất bại."
      );
    } finally {
      setDetailSubmitting(false);
    }
  };

  return (
    <div className="space-y-6">
      <Dialog
        open={createDialogOpen}
        onOpenChange={(open) => {
          setCreateDialogOpen(open);
          if (!open) {
            setCreateError("");
            setCreatedCredentials(null);
            setCopyDone(false);
          }
        }}
      >
        <DialogContent className="max-h-[90vh] max-w-lg overflow-y-auto sm:max-w-lg">
          {createdCredentials ? (
            <>
              <DialogHeader>
                <DialogTitle>Tạo tài khoản thành công</DialogTitle>
                <DialogDescription>
                  Gửi thông tin đăng nhập cho nhân sự qua kênh an toàn. Nên đổi mật khẩu sau lần đăng nhập đầu tiên.
                </DialogDescription>
              </DialogHeader>
              <div className="space-y-4">
                <div
                  className="rounded-lg border border-emerald-200/90 bg-emerald-50/90 px-4 py-3 text-sm text-emerald-950 dark:border-emerald-900/45 dark:bg-emerald-950/35 dark:text-emerald-100"
                  role="status"
                >
                  <dl className="space-y-2">
                    <div>
                      <dt className="text-xs font-semibold uppercase tracking-wider text-emerald-800/90 dark:text-emerald-300/90">
                        Tên đăng nhập
                      </dt>
                      <dd className="mt-0.5 font-mono text-base font-semibold tracking-tight">{createdCredentials.username}</dd>
                    </div>
                    <div>
                      <dt className="text-xs font-semibold uppercase tracking-wider text-emerald-800/90 dark:text-emerald-300/90">
                        Mật khẩu ban đầu
                      </dt>
                      <dd className="mt-0.5 break-all font-mono text-base font-semibold tracking-tight">{createdCredentials.password}</dd>
                    </div>
                  </dl>
                </div>
                {createError ? (
                  <p className="text-sm text-red-700 dark:text-red-300" role="alert">
                    {createError}
                  </p>
                ) : null}
                <DialogFooter className="flex-col gap-2 sm:flex-row sm:justify-end">
                  <Button
                    type="button"
                    variant="outline"
                    className="gap-2"
                    onClick={handleCopyCredentials}
                  >
                    {copyDone ? (
                      <>
                        <Check className="h-4 w-4 text-emerald-600" />
                        Đã sao chép
                      </>
                    ) : (
                      <>
                        <Copy className="h-4 w-4" />
                        Sao chép thông tin
                      </>
                    )}
                  </Button>
                  <Button
                    type="button"
                    variant="secondary"
                    onClick={() => {
                      setCreatedCredentials(null);
                      setCopyDone(false);
                      setCreateError("");
                    }}
                  >
                    Thêm nhân sự khác
                  </Button>
                  <Button type="button" onClick={() => setCreateDialogOpen(false)}>
                    Đóng
                  </Button>
                </DialogFooter>
              </div>
            </>
          ) : (
            <>
              <DialogHeader>
                <DialogTitle>Thêm nhân sự</DialogTitle>
                <DialogDescription>
                  Tên đăng nhập sinh từ họ tên (ví dụ Nguyễn Văn An → anv). Mật khẩu = tên đăng nhập + 4 số cuối SĐT. Trùng tên
                  thì thử anv1, anv2…
                </DialogDescription>
              </DialogHeader>
              <form onSubmit={handleCreateStaff} className="space-y-4">
                <div className="grid gap-4 sm:grid-cols-2">
                  <div className="space-y-2 sm:col-span-2">
                    <label className="text-xs font-semibold uppercase tracking-wider text-slate-500 dark:text-slate-400" htmlFor="create-fullname">
                      Họ và tên
                    </label>
                    <input
                      id="create-fullname"
                      type="text"
                      autoComplete="name"
                      placeholder="Nguyễn Văn An"
                      value={createFullName}
                      onChange={(e) => setCreateFullName(e.target.value)}
                      className={fieldInput}
                    />
                  </div>
                  <div className="space-y-2">
                    <label className="text-xs font-semibold uppercase tracking-wider text-slate-500 dark:text-slate-400" htmlFor="create-email">
                      Email
                    </label>
                    <input
                      id="create-email"
                      type="email"
                      autoComplete="email"
                      placeholder="ten@email.com"
                      value={createEmail}
                      onChange={(e) => setCreateEmail(e.target.value)}
                      className={fieldInput}
                    />
                  </div>
                  <div className="space-y-2">
                    <label className="text-xs font-semibold uppercase tracking-wider text-slate-500 dark:text-slate-400" htmlFor="create-phone">
                      Số điện thoại
                    </label>
                    <input
                      id="create-phone"
                      type="tel"
                      autoComplete="tel"
                      placeholder="0989892892"
                      value={createPhone}
                      onChange={(e) => setCreatePhone(e.target.value)}
                      className={fieldInput}
                    />
                  </div>
                  <div className="space-y-2 sm:col-span-2">
                    <label className="text-xs font-semibold uppercase tracking-wider text-slate-500 dark:text-slate-400" htmlFor="create-role">
                      Vai trò
                    </label>
                    <div className="relative">
                      <select
                        id="create-role"
                        value={createRoleId}
                        onChange={(e) => setCreateRoleId(e.target.value)}
                        className={fieldSelect}
                        disabled={rolesLoading || roles.length === 0}
                      >
                        <option value="">Chọn vai trò</option>
                        {roles.map((r) => (
                          <option key={r.id} value={String(r.id)} title={r.description || undefined}>
                            {r.roleName}
                          </option>
                        ))}
                      </select>
                      <ChevronDown className="pointer-events-none absolute right-3 top-1/2 h-4 w-4 -translate-y-1/2 text-slate-400" />
                    </div>
                  </div>
                </div>

                {createBaseUsername ? (
                  <div className="rounded-lg border border-slate-200/90 bg-slate-50/80 px-3 py-2 text-xs text-slate-600 dark:border-slate-700 dark:bg-slate-900/40 dark:text-slate-400">
                    <p>
                      <span className="font-medium text-slate-700 dark:text-slate-300">Tên đăng nhập thử đầu:</span>{" "}
                      <span className="font-mono font-semibold text-slate-900 dark:text-slate-100">{createBaseUsername}</span>
                      {createPasswordPreview ? (
                        <>
                          {" "}
                          · <span className="font-medium text-slate-700 dark:text-slate-300">Mật khẩu mẫu:</span>{" "}
                          <span className="font-mono text-slate-800 dark:text-slate-200">{createPasswordPreview}</span>
                          <span className="text-slate-500"> (đổi nếu hệ thống gán hậu tố số)</span>
                        </>
                      ) : null}
                    </p>
                  </div>
                ) : null}

                {createError ? (
                  <p className="text-sm text-red-700 dark:text-red-300" role="alert">
                    {createError}
                  </p>
                ) : null}

                <DialogFooter className="gap-2 sm:gap-0">
                  <Button type="button" variant="outline" onClick={() => setCreateDialogOpen(false)} disabled={createSubmitting}>
                    Hủy
                  </Button>
                  <Button type="submit" className="transition-transform active:scale-[0.98]" disabled={createSubmitting || rolesLoading}>
                    {createSubmitting ? (
                      <>
                        <Loader2 className="mr-2 h-4 w-4 animate-spin" />
                        Đang tạo…
                      </>
                    ) : (
                      "Tạo tài khoản"
                    )}
                  </Button>
                </DialogFooter>
              </form>
            </>
          )}
        </DialogContent>
      </Dialog>

      <Dialog
        open={detailDialogOpen}
        onOpenChange={(open) => {
          setDetailDialogOpen(open);
          if (!open) {
            setDetailUserId(null);
            setDetail(null);
            setDetailError("");
            setDetailSaveError("");
            setDetailLoading(false);
            setDetailSubmitting(false);
            setEditFullName("");
            setEditEmail("");
            setEditPhone("");
            setEditRoleId("");
          }
        }}
      >
        <DialogContent className="max-h-[90vh] max-w-lg overflow-y-auto sm:max-w-lg">
          <DialogHeader className="space-y-3">
            <div className="flex flex-row flex-wrap items-center justify-between gap-3 pr-8 text-left">
              <DialogTitle className="text-left">Chi tiết nhân sự</DialogTitle>
              {detail && !detailLoading && !detailError ? (
                <span
                  className={cn(
                    "inline-flex shrink-0 rounded-full px-2.5 py-0.5 text-xs font-semibold",
                    statusBadgeClass(detail.status)
                  )}
                >
                  {labelStatus(detail.status)}
                </span>
              ) : null}
            </div>
            <DialogDescription>
              Xem thông tin tài khoản, chỉnh họ tên, email, SĐT và vai trò. Tên đăng nhập không đổi từ đây.
            </DialogDescription>
          </DialogHeader>

          {detailLoading ? (
            <div className="flex flex-col items-center justify-center gap-3 py-10 text-slate-500">
              <Loader2 className="h-8 w-8 animate-spin text-emerald-600/70" />
              <span className="text-sm font-medium">Đang tải…</span>
            </div>
          ) : null}

          {!detailLoading && detailError ? (
            <div className="space-y-4">
              <p className="text-sm text-red-700 dark:text-red-300" role="alert">
                {detailError}
              </p>
              <DialogFooter>
                <Button type="button" variant="outline" onClick={() => setDetailDialogOpen(false)}>
                  Đóng
                </Button>
              </DialogFooter>
            </div>
          ) : null}

          {!detailLoading && !detailError && detail ? (
            <form onSubmit={handleDetailSave} className="space-y-4">
              <div className="rounded-lg border border-slate-200/90 bg-slate-50/80 px-3 py-3 text-sm dark:border-slate-700 dark:bg-slate-900/40">
                <dl className="grid gap-2 sm:grid-cols-2">
                  <div>
                    <dt className="text-[11px] font-semibold uppercase tracking-wider text-slate-500 dark:text-slate-400">ID</dt>
                    <dd className="font-mono text-sm font-semibold text-slate-900 dark:text-slate-100">{detail.id}</dd>
                  </div>
                  <div>
                    <dt className="text-[11px] font-semibold uppercase tracking-wider text-slate-500 dark:text-slate-400">Tên đăng nhập</dt>
                    <dd className="font-mono text-sm font-semibold text-slate-900 dark:text-slate-100">{detail.username}</dd>
                  </div>
                  <div>
                    <dt className="text-[11px] font-semibold uppercase tracking-wider text-slate-500 dark:text-slate-400">Tạo lúc</dt>
                    <dd className="text-xs text-slate-700 dark:text-slate-300">{formatDateTime(detail.createdAt)}</dd>
                  </div>
                  <div>
                    <dt className="text-[11px] font-semibold uppercase tracking-wider text-slate-500 dark:text-slate-400">Cập nhật</dt>
                    <dd className="text-xs text-slate-700 dark:text-slate-300">{formatDateTime(detail.updatedAt)}</dd>
                  </div>
                  {detail.ordersHandledCount != null || detail.quotesCreatedCount != null ? (
                    <>
                      <div>
                        <dt className="text-[11px] font-semibold uppercase tracking-wider text-slate-500 dark:text-slate-400">
                          Đơn đã xử lý
                        </dt>
                        <dd className="font-mono text-sm tabular-nums text-slate-900 dark:text-slate-100">
                          {detail.ordersHandledCount ?? "—"}
                        </dd>
                      </div>
                      <div>
                        <dt className="text-[11px] font-semibold uppercase tracking-wider text-slate-500 dark:text-slate-400">
                          Báo giá đã tạo
                        </dt>
                        <dd className="font-mono text-sm tabular-nums text-slate-900 dark:text-slate-100">
                          {detail.quotesCreatedCount ?? "—"}
                        </dd>
                      </div>
                    </>
                  ) : null}
                </dl>
              </div>

              <div className="grid gap-4 sm:grid-cols-2">
                <div className="space-y-2 sm:col-span-2">
                  <label className="text-xs font-semibold uppercase tracking-wider text-slate-500 dark:text-slate-400" htmlFor="detail-fullname">
                    Họ và tên
                  </label>
                  <input
                    id="detail-fullname"
                    type="text"
                    autoComplete="name"
                    value={editFullName}
                    onChange={(e) => setEditFullName(e.target.value)}
                    className={fieldInput}
                  />
                </div>
                <div className="space-y-2">
                  <label className="text-xs font-semibold uppercase tracking-wider text-slate-500 dark:text-slate-400" htmlFor="detail-email">
                    Email
                  </label>
                  <input
                    id="detail-email"
                    type="email"
                    autoComplete="email"
                    value={editEmail}
                    onChange={(e) => setEditEmail(e.target.value)}
                    className={fieldInput}
                  />
                </div>
                <div className="space-y-2">
                  <label className="text-xs font-semibold uppercase tracking-wider text-slate-500 dark:text-slate-400" htmlFor="detail-phone">
                    Số điện thoại
                  </label>
                  <input
                    id="detail-phone"
                    type="tel"
                    autoComplete="tel"
                    value={editPhone}
                    onChange={(e) => setEditPhone(e.target.value)}
                    className={fieldInput}
                  />
                </div>
                <div className="space-y-2 sm:col-span-2">
                  <label className="text-xs font-semibold uppercase tracking-wider text-slate-500 dark:text-slate-400" htmlFor="detail-role">
                    Vai trò
                  </label>
                  <div className="relative">
                    <select
                      id="detail-role"
                      value={editRoleId}
                      onChange={(e) => setEditRoleId(e.target.value)}
                      className={fieldSelect}
                      disabled={rolesLoading || roles.length === 0}
                    >
                      <option value="">Chọn vai trò</option>
                      {roles.map((r) => (
                        <option key={r.id} value={String(r.id)} title={r.description || undefined}>
                          {r.roleName}
                        </option>
                      ))}
                    </select>
                    <ChevronDown className="pointer-events-none absolute right-3 top-1/2 h-4 w-4 -translate-y-1/2 text-slate-400" />
                  </div>
                  {detail.roleDescription ? (
                    <p className="text-xs leading-relaxed text-slate-500 dark:text-slate-400">{detail.roleDescription}</p>
                  ) : null}
                </div>
              </div>

              {detailSaveError ? (
                <p className="text-sm text-red-700 dark:text-red-300" role="alert">
                  {detailSaveError}
                </p>
              ) : null}

              <DialogFooter className="gap-2 sm:gap-0">
                <Button type="button" variant="outline" onClick={() => setDetailDialogOpen(false)} disabled={detailSubmitting}>
                  Đóng
                </Button>
                <Button type="submit" className="transition-transform active:scale-[0.98]" disabled={detailSubmitting || rolesLoading}>
                  {detailSubmitting ? (
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
          ) : null}
        </DialogContent>
      </Dialog>

      <Dialog
        open={resetDialogOpen}
        onOpenChange={(open) => {
          setResetDialogOpen(open);
          if (!open) {
            setResetTarget(null);
            setResetCandidatePassword("");
            setResetDone(false);
            setResetError("");
            setResetCopyDone(false);
            setResetSubmitting(false);
          }
        }}
      >
        <DialogContent className="max-h-[90vh] max-w-md overflow-y-auto sm:max-w-md">
          <DialogHeader>
            <DialogTitle>Đặt lại mật khẩu</DialogTitle>
            <DialogDescription>
              {resetTarget ? (
                <>
                  Tài khoản <span className="font-mono font-semibold text-foreground">{resetTarget.username}</span>
                  {resetTarget.fullName ? (
                    <>
                      {" "}
                      — {resetTarget.fullName}
                    </>
                  ) : null}
                  . Mật khẩu mới gồm 6 ký tự (chữ hoa, thường, số), sinh ngẫu nhiên an toàn.
                </>
              ) : (
                "Chọn nhân sự từ danh sách."
              )}
            </DialogDescription>
          </DialogHeader>

          {resetTarget ? (
            <div className="space-y-4">
              {resetDone ? (
                <div
                  className="rounded-lg border border-emerald-200/90 bg-emerald-50/90 px-4 py-3 text-sm text-emerald-950 dark:border-emerald-900/45 dark:bg-emerald-950/35 dark:text-emerald-100"
                  role="status"
                >
                  <p className="font-medium">Đã đặt lại mật khẩu thành công.</p>
                  <dl className="mt-3 space-y-2">
                    <div>
                      <dt className="text-xs font-semibold uppercase tracking-wider text-emerald-800/90 dark:text-emerald-300/90">
                        Tên đăng nhập
                      </dt>
                      <dd className="mt-0.5 font-mono text-base font-semibold">{resetTarget.username}</dd>
                    </div>
                    <div>
                      <dt className="text-xs font-semibold uppercase tracking-wider text-emerald-800/90 dark:text-emerald-300/90">
                        Mật khẩu mới
                      </dt>
                      <dd className="mt-0.5 break-all font-mono text-base font-semibold">{resetCandidatePassword}</dd>
                    </div>
                  </dl>
                </div>
              ) : (
                <div className="space-y-2">
                  <div className="flex flex-col gap-2 sm:flex-row sm:items-end sm:justify-between">
                    <div className="min-w-0 flex-1 space-y-1.5">
                      <span className="text-xs font-semibold uppercase tracking-wider text-slate-500 dark:text-slate-400">
                        Mật khẩu mới (xem trước)
                      </span>
                      <p className="rounded-lg border border-slate-200 bg-slate-50 px-3 py-2.5 font-mono text-lg font-semibold tracking-wide text-slate-900 dark:border-slate-700 dark:bg-slate-900/50 dark:text-slate-100">
                        {resetCandidatePassword}
                      </p>
                    </div>
                    <Button
                      type="button"
                      variant="outline"
                      size="sm"
                      className="shrink-0"
                      onClick={() => setResetCandidatePassword(generateResetPassword6())}
                    >
                      Tạo mật khẩu khác
                    </Button>
                  </div>
                  <p className="text-xs text-slate-500 dark:text-slate-400">
                    Sau khi xác nhận, mật khẩu cũ không còn hiệu lực. Hãy sao chép và gửi cho nhân sự qua kênh bảo mật.
                  </p>
                </div>
              )}

              {resetError ? (
                <p className="text-sm text-red-700 dark:text-red-300" role="alert">
                  {resetError}
                </p>
              ) : null}

              <DialogFooter className="flex flex-col gap-2 sm:flex-row sm:justify-end">
                {resetDone ? (
                  <>
                    <Button type="button" variant="outline" className="gap-2" onClick={handleResetCopyInfo}>
                      {resetCopyDone ? (
                        <>
                          <Check className="h-4 w-4 text-emerald-600" />
                          Đã sao chép
                        </>
                      ) : (
                        <>
                          <Copy className="h-4 w-4" />
                          Sao chép thông tin
                        </>
                      )}
                    </Button>
                    <Button type="button" onClick={() => setResetDialogOpen(false)}>
                      Đóng
                    </Button>
                  </>
                ) : (
                  <>
                    <Button type="button" variant="outline" onClick={() => setResetDialogOpen(false)} disabled={resetSubmitting}>
                      Hủy
                    </Button>
                    <Button
                      type="button"
                      className="transition-transform active:scale-[0.98]"
                      disabled={resetSubmitting}
                      onClick={handleConfirmResetPassword}
                    >
                      {resetSubmitting ? (
                        <>
                          <Loader2 className="mr-2 h-4 w-4 animate-spin" />
                          Đang xử lý…
                        </>
                      ) : (
                        "Xác nhận đặt lại mật khẩu"
                      )}
                    </Button>
                  </>
                )}
              </DialogFooter>
            </div>
          ) : null}
        </DialogContent>
      </Dialog>

      <Dialog
        open={statusConfirm !== null}
        onOpenChange={(open) => {
          if (!open) {
            setStatusConfirm(null);
            setStatusUpdateError("");
            setStatusUpdateSubmitting(false);
          }
        }}
      >
        <DialogContent className="max-w-md">
          <DialogHeader>
            <DialogTitle>Đổi trạng thái tài khoản?</DialogTitle>
            <DialogDescription>
              {statusConfirm ? (
                <>
                  Tài khoản{" "}
                  <span className="font-mono font-semibold text-foreground">@{statusConfirm.username}</span>
                  {statusConfirm.fullName ? <> ({statusConfirm.fullName})</> : null}: chuyển từ{" "}
                  <span className="font-medium text-foreground">{labelStatus(statusConfirm.fromStatus)}</span> sang{" "}
                  <span className="font-medium text-foreground">{labelStatus(statusConfirm.toStatus)}</span>.
                </>
              ) : null}
            </DialogDescription>
          </DialogHeader>
          {statusUpdateError ? (
            <p className="text-sm text-red-700 dark:text-red-300" role="alert">
              {statusUpdateError}
            </p>
          ) : null}
          <DialogFooter className="gap-2 sm:justify-end">
            <Button
              type="button"
              variant="outline"
              onClick={() => {
                setStatusConfirm(null);
                setStatusUpdateError("");
              }}
              disabled={statusUpdateSubmitting}
            >
              Hủy
            </Button>
            <Button type="button" disabled={statusUpdateSubmitting} onClick={handleConfirmStatusUpdate}>
              {statusUpdateSubmitting ? (
                <>
                  <Loader2 className="mr-2 h-4 w-4 animate-spin" />
                  Đang cập nhật…
                </>
              ) : (
                "Xác nhận"
              )}
            </Button>
          </DialogFooter>
        </DialogContent>
      </Dialog>

      <Card className="overflow-hidden border-slate-200/80 shadow-[0_20px_40px_-15px_rgba(15,23,42,0.06)] dark:border-slate-800 dark:shadow-none">
        <CardHeader className="flex flex-row items-center justify-between gap-3 border-b border-slate-100 py-3 px-4 sm:px-5 dark:border-slate-800">
          <CardTitle className="text-base font-semibold tracking-tight text-slate-900 dark:text-slate-50">Nhân sự</CardTitle>
          <Button
            type="button"
            size="sm"
            className="shrink-0 gap-2 shadow-sm transition-transform active:scale-[0.98]"
            onClick={() => {
              setCreateError("");
              setCreatedCredentials(null);
              setCopyDone(false);
              setCreateDialogOpen(true);
            }}
          >
            <UserPlus className="h-4 w-4" />
            Thêm nhân sự
          </Button>
        </CardHeader>
        <CardContent className="space-y-4 p-4 sm:p-5">
          {rolesError ? (
            <p className="text-xs text-amber-800 dark:text-amber-300" role="status">
              {rolesError} (bộ lọc vai trò có thể trống)
            </p>
          ) : null}
          <div className="grid gap-4 sm:grid-cols-2 lg:grid-cols-12 lg:items-end">
            <div className="space-y-2 sm:col-span-2 lg:col-span-4">
              <label
                className="text-xs font-semibold uppercase tracking-wider text-slate-500 dark:text-slate-400"
                htmlFor="admin-hr-search"
              >
                Tìm kiếm
              </label>
              <div className="relative">
                <Search className="pointer-events-none absolute left-3 top-1/2 h-4 w-4 -translate-y-1/2 text-slate-400" />
                <input
                  id="admin-hr-search"
                  type="search"
                  placeholder="Tên đăng nhập, họ tên…"
                  value={searchInput}
                  onChange={(e) => setSearchInput(e.target.value)}
                  className={cn(fieldInput, "pl-10")}
                />
              </div>
            </div>
            <div className="space-y-2 lg:col-span-4">
              <label
                className="text-xs font-semibold uppercase tracking-wider text-slate-500 dark:text-slate-400"
                htmlFor="admin-hr-role"
              >
                Vai trò
              </label>
              <div className="relative">
                <select
                  id="admin-hr-role"
                  value={roleId}
                  onChange={(e) => setRoleId(e.target.value)}
                  className={fieldSelect}
                  disabled={rolesLoading}
                >
                  <option value="">Tất cả vai trò</option>
                  {roles.map((r) => (
                    <option key={r.id} value={String(r.id)} title={r.description || undefined}>
                      {r.roleName}
                    </option>
                  ))}
                </select>
                <ChevronDown className="pointer-events-none absolute right-3 top-1/2 h-4 w-4 -translate-y-1/2 text-slate-400" />
              </div>
            </div>
            <div className="space-y-2 lg:col-span-2">
              <label
                className="text-xs font-semibold uppercase tracking-wider text-slate-500 dark:text-slate-400"
                htmlFor="admin-hr-status"
              >
                Trạng thái
              </label>
              <div className="relative">
                <select
                  id="admin-hr-status"
                  value={status}
                  onChange={(e) => setStatus(e.target.value)}
                  className={fieldSelect}
                >
                  {ADMIN_USER_STATUS_OPTIONS.map((o) => (
                    <option key={o.value || "all-status"} value={o.value}>
                      {o.label}
                    </option>
                  ))}
                </select>
                <ChevronDown className="pointer-events-none absolute right-3 top-1/2 h-4 w-4 -translate-y-1/2 text-slate-400" />
              </div>
            </div>
            <div className="flex flex-wrap items-center gap-2 sm:col-span-2 lg:col-span-2 lg:justify-end">
              <Button
                type="button"
                size="sm"
                className="gap-1.5 shadow-sm transition-transform active:scale-[0.98]"
                onClick={() => {
                  loadRoles();
                  load();
                }}
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
            <CardTitle className="text-lg font-semibold tracking-tight">Danh sách tài khoản</CardTitle>
            <CardDescription className="mt-1 text-xs sm:text-sm">
              {loading
                ? "Đang đồng bộ dữ liệu…"
                : `${totalCount.toLocaleString("vi-VN")} tài khoản — nhấn một dòng để xem chi tiết và cập nhật.`}
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
            <table className="w-full min-w-[1060px] border-collapse text-left text-sm">
              <thead>
                <tr className="border-b border-slate-200 bg-slate-50/95 text-[11px] font-semibold uppercase tracking-wider text-slate-500 dark:border-slate-800 dark:bg-slate-900/80 dark:text-slate-400">
                  <th className="px-5 py-3.5 pl-6 font-mono">ID</th>
                  <th className="px-5 py-3.5">Tên đăng nhập</th>
                  <th className="px-5 py-3.5">Họ tên</th>
                  <th className="px-5 py-3.5">Liên hệ</th>
                  <th className="px-5 py-3.5">Vai trò</th>
                  <th className="px-5 py-3.5">Trạng thái</th>
                  <th className="px-5 py-3.5">Tạo lúc</th>
                  <th className="px-5 py-3.5">Cập nhật</th>
                  <th className="px-5 py-3.5 pr-6 text-center">Thao tác</th>
                </tr>
              </thead>
              <tbody className="divide-y divide-slate-100 dark:divide-slate-800">
                {loading && items.length === 0 ? (
                  <tr>
                    <td colSpan={9} className="px-6 py-16 text-center">
                      <div className="inline-flex flex-col items-center gap-3 text-slate-500">
                        <Loader2 className="h-8 w-8 animate-spin text-emerald-600/70" />
                        <span className="text-sm font-medium">Đang tải dữ liệu…</span>
                      </div>
                    </td>
                  </tr>
                ) : null}
                {!loading && items.length === 0 ? (
                  <tr>
                    <td colSpan={9} className="px-6 py-16 text-center">
                      <p className="text-sm font-medium text-slate-600 dark:text-slate-300">Không có nhân sự phù hợp</p>
                      <p className="mt-1 text-xs text-slate-500">Thử đổi bộ lọc hoặc từ khóa tìm kiếm.</p>
                    </td>
                  </tr>
                ) : null}
                {items.map((row, idx) => (
                  <tr
                    key={row.id}
                    role="button"
                    tabIndex={0}
                    aria-label={`Xem chi tiết ${row.fullName || row.username}`}
                    className={cn(
                      "cursor-pointer transition-colors hover:bg-emerald-500/[0.04] dark:hover:bg-emerald-500/[0.06]",
                      idx % 2 === 1 && "bg-slate-50/40 dark:bg-slate-900/25"
                    )}
                    onClick={() => openEmployeeDetail(row.id)}
                    onKeyDown={(ev) => {
                      if (ev.key === "Enter" || ev.key === " ") {
                        ev.preventDefault();
                        openEmployeeDetail(row.id);
                      }
                    }}
                  >
                    <td className="whitespace-nowrap px-5 py-3.5 pl-6 align-middle font-mono text-xs tabular-nums text-slate-500 dark:text-slate-400">
                      {row.id}
                    </td>
                    <td className="whitespace-nowrap px-5 py-3.5 align-middle">
                      <span className="font-mono text-sm font-semibold text-slate-900 dark:text-slate-100">{row.username}</span>
                    </td>
                    <td className="max-w-[200px] px-5 py-3.5 align-middle">
                      <span className="font-medium text-slate-900 dark:text-slate-100">{row.fullName}</span>
                    </td>
                    <td className="max-w-[220px] px-5 py-3.5 align-middle">
                      <div className="truncate text-xs text-slate-600 dark:text-slate-400">{row.email || "—"}</div>
                      <div className="truncate font-mono text-xs text-slate-500 dark:text-slate-500">{row.phone || "—"}</div>
                    </td>
                    <td className="px-5 py-3.5 align-middle">
                      <span
                        className="inline-flex max-w-[11rem] truncate rounded-full bg-slate-100 px-2.5 py-0.5 text-xs font-medium text-slate-800 ring-1 ring-slate-200/80 dark:bg-slate-800 dark:text-slate-200 dark:ring-slate-600"
                        title={roles.find((r) => r.id === row.roleId)?.description}
                      >
                        {row.roleName}
                      </span>
                    </td>
                    <td
                      className="px-5 py-3.5 align-middle"
                      onClick={(e) => e.stopPropagation()}
                      onKeyDown={(e) => e.stopPropagation()}
                    >
                      <div className="relative min-w-[10.5rem] max-w-[14rem]">
                        <select
                          aria-label={`Trạng thái ${row.username}`}
                          className={cn(
                            fieldSelect,
                            "h-8 w-full appearance-none py-0 pl-2 pr-8 text-xs font-semibold",
                            statusBadgeClass(row.status)
                          )}
                          value={toAssignedStatusValue(row.status)}
                          disabled={statusUpdateSubmitting}
                          onClick={(e) => e.stopPropagation()}
                          onMouseDown={(e) => e.stopPropagation()}
                          onChange={(e) => {
                            e.stopPropagation();
                            const next = e.target.value;
                            const cur = toAssignedStatusValue(row.status);
                            if (next === cur) return;
                            setStatusUpdateError("");
                            setStatusConfirm({
                              userId: row.id,
                              username: row.username,
                              fullName: row.fullName ?? "",
                              fromStatus: cur,
                              toStatus: next,
                            });
                          }}
                        >
                          {userStatusEditOptions.map((o) => (
                            <option key={o.value} value={o.value}>
                              {o.label}
                            </option>
                          ))}
                        </select>
                        <ChevronDown className="pointer-events-none absolute right-2 top-1/2 h-3.5 w-3.5 -translate-y-1/2 opacity-60" />
                      </div>
                    </td>
                    <td className="whitespace-nowrap px-5 py-3.5 align-middle text-xs text-slate-600 dark:text-slate-400">
                      {formatDateTime(row.createdAt)}
                    </td>
                    <td className="whitespace-nowrap px-5 py-3.5 align-middle text-xs text-slate-600 dark:text-slate-400">
                      {formatDateTime(row.updatedAt)}
                    </td>
                    <td className="whitespace-nowrap px-5 py-3.5 pr-6 align-middle text-center">
                      <Button
                        type="button"
                        variant="outline"
                        size="sm"
                        className="h-8 gap-1.5 px-2.5"
                        title="Đặt lại mật khẩu"
                        aria-label={`Đặt lại mật khẩu ${row.username}`}
                        onClick={(e) => {
                          e.stopPropagation();
                          openResetPasswordDialog(row);
                        }}
                      >
                        <KeyRound className="h-3.5 w-3.5" />
                        <span className="hidden sm:inline">Đặt lại MK</span>
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
                  tài khoản
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
