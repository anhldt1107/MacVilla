/** Chuẩn hóa key status (đồng bộ kiểu BE, không phân biệt hoa thường). */
function canonicalTicketStatus(raw) {
  const lower = String(raw ?? '')
    .trim()
    .toLowerCase()
  const canon = /** @type {Record<string, string>} */ ({
    active: 'Active',
    expired: 'Expired',
    voided: 'Voided',
    cancelled: 'Cancelled',
  })
  return canon[lower] ?? String(raw ?? '').trim()
}

/** Phiếu còn trạng thái đang hoạt động (BE Active). */
export function warrantyTicketIsActive(raw) {
  return canonicalTicketStatus(raw) === 'Active'
}

/**
 * Phiếu bảo hành — status (BE: WarrantyTicketStatuses).
 * @param {string | null | undefined} raw
 */
export function warrantyTicketStatusLabel(raw) {
  if (raw == null || raw === '') return '—'
  const key = canonicalTicketStatus(raw)
  const map = {
    Active: 'Đang hiệu lực',
    Expired: 'Hết hạn',
    Voided: 'Đã vô hiệu hóa',
    Cancelled: 'Đã hủy',
  }
  return map[key] || key
}

/** @param {string | null | undefined} raw */
export function warrantyTicketStatusBadgeClass(raw) {
  if (raw == null || raw === '') {
    return 'bg-slate-100 text-slate-700 dark:bg-slate-800 dark:text-slate-300'
  }
  const key = canonicalTicketStatus(raw)
  const classes = {
    Active: 'bg-emerald-100 text-emerald-900 dark:bg-emerald-900/30 dark:text-emerald-300',
    Expired: 'bg-slate-200 text-slate-700 dark:bg-slate-700 dark:text-slate-300',
    Voided: 'bg-amber-100 text-amber-900 dark:bg-amber-900/40 dark:text-amber-200',
    Cancelled: 'bg-rose-100 text-rose-900 dark:bg-rose-900/30 dark:text-rose-300',
  }
  return classes[key] || 'bg-slate-100 text-slate-800 dark:bg-slate-800 dark:text-slate-400'
}

function canonicalClaimStatus(raw) {
  const lower = String(raw ?? '')
    .trim()
    .toLowerCase()
    .replace(/\s+/g, '_')
  const canon = /** @type {Record<string, string>} */ ({
    pending_check: 'Pending_Check',
    checking: 'Checking',
    confirmed_defect: 'Confirmed_Defect',
    repairing: 'Repairing',
    waiting_pickup: 'Waiting_Pickup',
    completed: 'Completed',
    rejected: 'Rejected',
    cancelled: 'Cancelled',
    approved: 'Approved',
    repaired: 'Repaired',
    replaced: 'Replaced',
  })
  return canon[lower] ?? String(raw ?? '').trim()
}

/**
 * Claim — status (BE: WarrantyClaimStatuses; thêm legacy nếu dữ liệu cũ).
 * @param {string | null | undefined} raw
 */
export function warrantyClaimStatusLabel(raw) {
  if (raw == null || raw === '') return '—'
  const key = canonicalClaimStatus(raw)
  const map = {
    Pending_Check: 'Chờ tiếp nhận',
    Checking: 'Đang kiểm tra',
    Confirmed_Defect: 'Đã xác nhận lỗi',
    Repairing: 'Đang sửa chữa',
    Waiting_Pickup: 'Chờ nhận hàng',
    Completed: 'Hoàn thành',
    Rejected: 'Từ chối bảo hành',
    Cancelled: 'Đã hủy',
    Approved: 'Đã duyệt',
    Repaired: 'Đã sửa xong',
    Replaced: 'Đã thay thế',
  }
  if (map[key]) return map[key]
  return key ? key.replace(/_/g, ' ') : '—'
}

/** @param {string | null | undefined} raw */
export function warrantyClaimStatusBadgeClass(raw) {
  if (raw == null || raw === '') {
    return 'bg-slate-100 text-slate-700 dark:bg-slate-800 dark:text-slate-300'
  }
  const key = canonicalClaimStatus(raw)
  const classes = {
    Pending_Check: 'bg-amber-100 text-amber-900 dark:bg-amber-900/30 dark:text-amber-300',
    Checking: 'bg-sky-100 text-sky-900 dark:bg-sky-900/30 dark:text-sky-300',
    Confirmed_Defect: 'bg-indigo-100 text-indigo-900 dark:bg-indigo-900/30 dark:text-indigo-300',
    Repairing: 'bg-violet-100 text-violet-900 dark:bg-violet-900/30 dark:text-violet-300',
    Waiting_Pickup: 'bg-cyan-100 text-cyan-900 dark:bg-cyan-900/30 dark:text-cyan-300',
    Completed: 'bg-emerald-100 text-emerald-900 dark:bg-emerald-900/30 dark:text-emerald-300',
    Rejected: 'bg-rose-100 text-rose-900 dark:bg-rose-900/30 dark:text-rose-300',
    Cancelled: 'bg-slate-200 text-slate-800 dark:bg-slate-700 dark:text-slate-300',
    Approved: 'bg-blue-100 text-blue-900 dark:bg-blue-900/30 dark:text-blue-300',
    Repaired: 'bg-emerald-100 text-emerald-900 dark:bg-emerald-900/30 dark:text-emerald-300',
    Replaced: 'bg-teal-100 text-teal-900 dark:bg-teal-900/30 dark:text-teal-300',
  }
  return classes[key] || 'bg-slate-100 text-slate-800 dark:bg-slate-800 dark:text-slate-400'
}

/** Trạng thái claim còn đang xử lý (khớp BE AfterSalesQuantityRules). */
export function isActiveWarrantyClaimStatus(raw) {
  const s = String(raw ?? '').trim()
  if (!s) return false
  const terminal = new Set(['Completed', 'Rejected', 'Cancelled'])
  return !terminal.has(s)
}

/** @param {unknown[]} claims */
export function activeClaimIdByOrderItem(claims) {
  /** @type {Map<number, number>} */
  const map = new Map()
  if (!Array.isArray(claims)) return map
  for (const row of claims) {
    const o = row && typeof row === 'object' ? /** @type {Record<string, unknown>} */ (row) : {}
    const oi = o.orderItemId ?? o.OrderItemId
    const id = o.id ?? o.Id
    const st = o.status ?? o.Status
    if (oi == null || id == null || !isActiveWarrantyClaimStatus(st)) continue
    const key = Number(oi)
    if (!Number.isFinite(key) || key <= 0) continue
    if (!map.has(key)) map.set(key, Number(id))
  }
  return map
}

/** @param {unknown} raw */
export function parseWarrantyTicketLine(raw) {
  const o = raw && typeof raw === 'object' ? /** @type {Record<string, unknown>} */ (raw) : {}
  const orderItemId = o.orderItemId ?? o.OrderItemId
  const variantId = o.variantId ?? o.VariantId
  if (orderItemId == null || variantId == null) return null
  return {
    id: o.id ?? o.Id,
    orderItemId: Number(orderItemId),
    variantId: Number(variantId),
    sku: String(o.sku ?? o.Sku ?? ''),
    variantName: String(o.variantName ?? o.VariantName ?? ''),
    productName: String(o.productName ?? o.ProductName ?? ''),
    variantImageUrl: o.variantImageUrl ?? o.VariantImageUrl ?? null,
    imageUrl: o.imageUrl ?? o.ImageUrl ?? null,
    quantity: Number(o.quantity ?? o.Quantity ?? 1),
    warrantyPeriodMonths: Number(o.warrantyPeriodMonths ?? o.WarrantyPeriodMonths ?? 12),
    issueDate: o.issueDate ?? o.IssueDate,
    validUntil: o.validUntil ?? o.ValidUntil,
    isValid: o.isValid === true || o.IsValid === true,
    daysRemaining: o.daysRemaining ?? o.DaysRemaining,
    activeClaimId:
      o.activeClaimId != null
        ? Number(o.activeClaimId)
        : o.ActiveClaimId != null
          ? Number(o.ActiveClaimId)
          : null,
  }
}

/** @param {Record<string, unknown> | null | undefined} detail */
export function parseWarrantyTicketLines(detail) {
  if (!detail || typeof detail !== 'object') return []
  const raw = detail.lines ?? detail.Lines
  if (!Array.isArray(raw)) return []
  return raw.map(parseWarrantyTicketLine).filter(Boolean)
}

/** @param {{ isValid?: boolean, activeClaimId?: number | null }} line */
export function customerWarrantyLineCanClaim(line) {
  if (line?.activeClaimId != null && Number.isFinite(Number(line.activeClaimId))) return false
  return line?.isValid === true
}

/**
 * @param {{
 *   sku?: string
 *   variantName?: string
 *   productName?: string
 *   quantity?: number
 *   warrantyPeriodMonths?: number
 *   isValid?: boolean
 *   daysRemaining?: number | null
 * }} line
 */
export function formatWarrantyLineOptionLabel(line) {
  const name = line.variantName || line.productName || line.sku || 'Sản phẩm'
  const sku = line.sku && name !== line.sku ? ` (${line.sku})` : ''
  const qty = line.quantity > 1 ? ` ×${line.quantity}` : ''
  const months = line.warrantyPeriodMonths ? ` — ${line.warrantyPeriodMonths} tháng` : ''
  const activeId = line.activeClaimId != null ? Number(line.activeClaimId) : null
  const status =
    activeId != null && Number.isFinite(activeId)
      ? ` [Đang xử lý #${activeId}]`
      : line.isValid === false
        ? ' [Hết hạn]'
        : line.daysRemaining != null && Number(line.daysRemaining) <= 30
          ? ` [Còn ${line.daysRemaining} ngày]`
          : ''
  return `${name}${sku}${qty}${months}${status}`
}

/**
 * Dropdown claim theo dòng phiếu BH.
 * @param {Record<string, unknown> | null | undefined} detail
 * @returns {{ orderItemId: number, variantId: number, label: string, isValid: boolean, daysRemaining?: number | null, validUntil?: unknown }[]}
 */
export function warrantyLineOptionsFromTicket(detail) {
  const claimMap = activeClaimIdByOrderItem(
    detail && typeof detail === 'object'
      ? /** @type {Record<string, unknown>} */ (detail).claims ??
          /** @type {Record<string, unknown>} */ (detail).Claims
      : []
  )
  return parseWarrantyTicketLines(detail).map((line) => {
    const activeClaimId =
      line.activeClaimId != null && Number.isFinite(Number(line.activeClaimId))
        ? Number(line.activeClaimId)
        : claimMap.get(line.orderItemId) ?? null
    const enriched = { ...line, activeClaimId }
    return {
      orderItemId: line.orderItemId,
      variantId: line.variantId,
      label: formatWarrantyLineOptionLabel(enriched),
      isValid: customerWarrantyLineCanClaim(enriched),
      activeClaimId,
      daysRemaining: line.daysRemaining,
      validUntil: line.validUntil,
    }
  })
}

/**
 * Gộp dòng đơn với hạn BH từ phiếu (nếu có).
 * @param {unknown[]} orderLines
 * @param {ReturnType<typeof parseWarrantyTicketLine>[]} [ticketLines]
 */
export function warrantyOrderLineOptions(orderLines, ticketLines, claims) {
  if (!Array.isArray(orderLines)) return []
  const byOi = new Map()
  for (const tl of ticketLines || []) {
    if (tl) byOi.set(tl.orderItemId, tl)
  }
  const claimMap = activeClaimIdByOrderItem(claims ?? [])
  const out = []
  for (const row of orderLines) {
    const ln = row && typeof row === 'object' ? /** @type {Record<string, unknown>} */ (row) : {}
    const rawOi = ln.id ?? ln.orderItemId ?? ln.OrderItemId
    const rawVid = ln.variantId ?? ln.VariantId
    if (rawVid == null) continue
    const variantId = Number(rawVid)
    if (!Number.isFinite(variantId) || variantId <= 0) continue
    const orderItemId =
      rawOi != null && Number.isFinite(Number(rawOi)) && Number(rawOi) > 0 ? Number(rawOi) : null
    const ticketLine = orderItemId != null ? byOi.get(orderItemId) : undefined
    const sku =
      ln.skuSnapshot != null
        ? String(ln.skuSnapshot).trim()
        : ln.sku != null
          ? String(ln.sku).trim()
          : ticketLine?.sku ?? ''
    const variantName =
      ln.variantName != null && String(ln.variantName).trim()
        ? String(ln.variantName).trim()
        : ticketLine?.variantName ?? ''
    const productName =
      ln.productName != null && String(ln.productName).trim()
        ? String(ln.productName).trim()
        : ticketLine?.productName ?? ''
    const quantity = Number(ln.quantity ?? ln.Quantity ?? ticketLine?.quantity ?? 1)
    const activeClaimId =
      ticketLine?.activeClaimId != null && Number.isFinite(Number(ticketLine.activeClaimId))
        ? Number(ticketLine.activeClaimId)
        : orderItemId != null
          ? claimMap.get(orderItemId) ?? null
          : null
    const line = {
      sku,
      variantName,
      productName,
      quantity,
      warrantyPeriodMonths: ticketLine?.warrantyPeriodMonths,
      isValid: ticketLine ? ticketLine.isValid : true,
      daysRemaining: ticketLine?.daysRemaining,
      activeClaimId,
    }
    const isValid = customerWarrantyLineCanClaim(line)
    out.push({
      orderItemId: orderItemId ?? 0,
      variantId,
      label: formatWarrantyLineOptionLabel(line),
      isValid,
      activeClaimId,
      daysRemaining: ticketLine?.daysRemaining,
      validUntil: ticketLine?.validUntil,
    })
  }
  return out.filter((o) => o.isValid && o.orderItemId > 0)
}

/**
 * Cho phép gửi thêm claim khi có ít nhất một dòng còn hạn (UI; BE vẫn validate).
 * @param {Record<string, unknown> | null | undefined} detail
 */
export function customerWarrantyTicketCanAddClaim(detail) {
  if (!detail || typeof detail !== 'object') return false
  const st = String(detail.status ?? '').trim()
  if (st && canonicalTicketStatus(st) !== 'Active') return false
  const lines = parseWarrantyTicketLines(detail)
  if (lines.length > 0) return lines.some((line) => customerWarrantyLineCanClaim(line))
  return detail.isValid === true
}

/**
 * Ước tính số ngày còn lại đến hết hạn (danh sách không có daysRemaining).
 * @param {string | null | undefined} validUntilIso
 * @returns {number | null}
 */
export function warrantyDaysRemainingFromValidUntil(validUntilIso) {
  if (!validUntilIso) return null
  const end = new Date(validUntilIso)
  if (Number.isNaN(end.getTime())) return null
  const diffMs = end.getTime() - Date.now()
  return Math.ceil(diffMs / (1000 * 60 * 60 * 24))
}

/**
 * Dropdown variant từ dòng đơn (store order lines).
 * @param {unknown[]} lines
 * @returns {{ variantId: number, label: string }[]}
 */
export function warrantyVariantOptionsFromOrderLines(lines) {
  if (!Array.isArray(lines)) return []
  const seen = new Set()
  const out = []
  for (const line of lines) {
    const ln = line && typeof line === 'object' ? /** @type {Record<string, unknown>} */ (line) : {}
    const raw = ln.variantId
    if (raw == null) continue
    const vid = Number(raw)
    if (!Number.isFinite(vid) || vid <= 0 || seen.has(vid)) continue
    seen.add(vid)
    const sku =
      ln.skuSnapshot != null
        ? String(ln.skuSnapshot).trim()
        : ln.sku != null
          ? String(ln.sku).trim()
          : ''
    const variantName =
      ln.variantName != null && String(ln.variantName).trim()
        ? String(ln.variantName).trim()
        : ''
    const productName =
      ln.productName != null && String(ln.productName).trim()
        ? String(ln.productName).trim()
        : ''
    const main = variantName || productName || sku || `#${vid}`
    const skuSuffix = sku && main !== sku ? ` (${sku})` : ''
    const qty = ln.quantity != null ? ` ×${ln.quantity}` : ''
    out.push({ variantId: vid, label: `${main}${skuSuffix}${qty}` })
  }
  return out
}
