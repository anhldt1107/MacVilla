/**
 * @param {Record<string, unknown> | null | undefined} obj
 * @param {string} camel
 * @param {string} pascal
 */
export function pickContractField(obj, camel, pascal) {
  if (!obj || typeof obj !== "object") return undefined;
  const v = obj[camel] ?? obj[pascal];
  return v === undefined || v === null ? undefined : v;
}

const DATE_ONLY_RE = /^\d{4}-\d{2}-\d{2}$/;

/** @param {string | Date | null | undefined} iso */
export function toDateInputValue(iso) {
  if (!iso) return "";
  try {
    const d = new Date(iso);
    if (Number.isNaN(d.getTime())) return "";
    const pad = (n) => String(n).padStart(2, "0");
    return `${d.getFullYear()}-${pad(d.getMonth() + 1)}-${pad(d.getDate())}`;
  } catch {
    return "";
  }
}

/** @deprecated Dùng {@link toDateInputValue} cho hợp đồng (chỉ ngày). */
export function toDatetimeLocalValue(iso) {
  if (!iso) return "";
  try {
    const d = new Date(iso);
    if (Number.isNaN(d.getTime())) return "";
    const pad = (n) => String(n).padStart(2, "0");
    return `${d.getFullYear()}-${pad(d.getMonth() + 1)}-${pad(d.getDate())}T${pad(d.getHours())}:${pad(d.getMinutes())}`;
  } catch {
    return "";
  }
}

/**
 * Chuyển giá trị ô ngày (`YYYY-MM-DD`) hoặc datetime-local (`YYYY-MM-DDTHH:mm`) sang ISO UTC.
 * @param {string | null | undefined} local
 * @param {{ endOfDay?: boolean }} [opts] — `validTo` nên dùng endOfDay để bao trọn cả ngày
 */
export function fromDateInputValue(local, opts = {}) {
  const t = String(local || "").trim();
  if (!t) return null;

  if (DATE_ONLY_RE.test(t)) {
    const [y, m, d] = t.split("-").map(Number);
    const end = Boolean(opts.endOfDay);
    const date = new Date(
      y,
      m - 1,
      d,
      end ? 23 : 0,
      end ? 59 : 0,
      end ? 59 : 0,
      end ? 999 : 0
    );
    if (Number.isNaN(date.getTime())) return null;
    return date.toISOString();
  }

  const parsed = new Date(t);
  if (Number.isNaN(parsed.getTime())) return null;
  return parsed.toISOString();
}

/** @deprecated Dùng {@link fromDateInputValue}. */
export function fromDatetimeLocalValue(local) {
  return fromDateInputValue(local);
}

/**
 * Body PUT cập nhật hợp đồng — luôn gửi validFrom/validTo (null nếu ô trống).
 * @param {{
 *   validFrom?: string;
 *   validTo?: string;
 *   paymentTerms?: string;
 *   attachmentUrl?: string;
 *   notes?: string;
 * }} form
 */
export function buildContractUpdatePayload(form) {
  return {
    validFrom: fromDateInputValue(form.validFrom),
    validTo: fromDateInputValue(form.validTo, { endOfDay: true }),
    paymentTerms: String(form.paymentTerms ?? "").trim() || null,
    attachmentUrl: String(form.attachmentUrl ?? "").trim() || null,
    notes: String(form.notes ?? "").trim() || null,
  };
}

/** @param {Record<string, unknown> | null | undefined} contract */
export function contractToFormFields(contract) {
  return {
    validFrom: toDateInputValue(pickContractField(contract, "validFrom", "ValidFrom")),
    validTo: toDateInputValue(pickContractField(contract, "validTo", "ValidTo")),
    paymentTerms: String(pickContractField(contract, "paymentTerms", "PaymentTerms") ?? ""),
    attachmentUrl: String(pickContractField(contract, "attachmentUrl", "AttachmentUrl") ?? ""),
    notes: String(pickContractField(contract, "notes", "Notes") ?? ""),
  };
}

/** @param {string | Date | null | undefined} iso */
export function formatContractDate(iso) {
  if (!iso) return "—";
  try {
    const d = new Date(iso);
    if (Number.isNaN(d.getTime())) return "—";
    return d.toLocaleDateString("vi-VN", {
      day: "2-digit",
      month: "2-digit",
      year: "numeric",
    });
  } catch {
    return "—";
  }
}

/** @param {string | Date | null | undefined} iso */
export function formatContractDateTime(iso) {
  if (!iso) return "—";
  try {
    const d = new Date(iso);
    if (Number.isNaN(d.getTime())) return "—";
    return d.toLocaleString("vi-VN", {
      day: "2-digit",
      month: "2-digit",
      year: "numeric",
      hour: "2-digit",
      minute: "2-digit",
    });
  } catch {
    return "—";
  }
}

/**
 * @param {string | Date | null | undefined} validFrom
 * @param {string | Date | null | undefined} validTo
 */
export function formatContractValidityRange(validFrom, validTo) {
  if (!validFrom && !validTo) return null;
  return `${formatContractDate(validFrom)} → ${formatContractDate(validTo)}`;
}

/**
 * Payload tạo hợp đồng — validFrom/validTo từ ô ngày.
 * @param {string} validFrom
 * @param {string} validTo
 */
export function buildContractCreateValidity(validFrom, validTo) {
  return {
    validFrom: fromDateInputValue(validFrom),
    validTo: fromDateInputValue(validTo, { endOfDay: true }),
  };
}

/**
 * Kiểm tra đủ ngày hiệu lực trước khi gửi khách xác nhận.
 * @param {string | null | undefined} validFrom
 * @param {string | null | undefined} validTo
 * @returns {string | null} Thông báo lỗi tiếng Việt; `null` nếu hợp lệ
 */
export function getContractValidityValidationError(validFrom, validTo) {
  const from = String(validFrom ?? "").trim();
  const to = String(validTo ?? "").trim();

  if (!from && !to) {
    return "Vui lòng nhập đầy đủ ngày hiệu lực từ và đến trước khi gửi khách.";
  }
  if (!from) {
    return "Vui lòng nhập ngày hiệu lực từ trước khi gửi khách.";
  }
  if (!to) {
    return "Vui lòng nhập ngày hiệu lực đến trước khi gửi khách.";
  }

  const fromIso = fromDateInputValue(from);
  const toIso = fromDateInputValue(to, { endOfDay: true });
  if (!fromIso) return "Ngày hiệu lực từ không hợp lệ.";
  if (!toIso) return "Ngày hiệu lực đến không hợp lệ.";

  if (new Date(fromIso).getTime() > new Date(toIso).getTime()) {
    return "Ngày hiệu lực đến phải sau hoặc bằng ngày hiệu lực từ.";
  }

  return null;
}

/** @param {string | null | undefined} validFrom @param {string | null | undefined} validTo */
export function isContractValidityComplete(validFrom, validTo) {
  return getContractValidityValidationError(validFrom, validTo) === null;
}
