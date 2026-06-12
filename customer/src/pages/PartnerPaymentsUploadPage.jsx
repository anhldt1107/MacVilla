import { useState, useEffect, useCallback, useMemo } from 'react'
import { Link, useSearchParams } from 'react-router-dom'
import { Icon } from '../components/ui/Icon'
import { PartnerPaymentsPageHeader } from '../components/partner/PartnerPaymentsPageHeader'
import { useAuth } from '../contexts/AuthContext'
import {
  storeB2bPostNotifyTransfer,
  storeB2bFetchTransferNotifications,
} from '../api/store/storeB2bPaymentsApi'
import { storeB2bFetchInvoices } from '../api/store/storeB2bDebtInvoicesApi'
import { storeMeUploadWarrantyEvidence } from '../api/store/storeMeWarrantyApi'
import { ApiError } from '../api/httpClient'
import { getApiErrorMessage } from '../lib/errors/apiErrorMessage'
import { resolveStoreMediaUrl } from '../lib/catalog/resolveStoreMediaUrl'

/** Parse "20.000.000" / "20,000,000đ" → 20000000. */
function parseVndAmount(raw) {
  const s = String(raw ?? '').trim()
  if (!s) return NaN
  const cleaned = s.replace(/[^0-9]/g, '')
  if (!cleaned) return NaN
  return Number(cleaned)
}

/** @param {Record<string, unknown>} data */
function pickSecureUrl(data) {
  const u = data.secureUrl ?? data.SecureUrl
  return typeof u === 'string' ? u.trim() : ''
}

/** @param {string} st */
function transferNotifStatusLabel(st) {
  const s = String(st ?? '').trim()
  if (s === 'Pending') return 'Chờ đối soát'
  if (s === 'Verified') return 'Đã xác nhận'
  if (s === 'Rejected') return 'Từ chối'
  return s || '—'
}

/** @param {string} st */
function transferNotifStatusClass(st) {
  const s = String(st ?? '').trim()
  if (s === 'Verified') return 'bg-green-100 text-green-700 dark:bg-green-900/30 dark:text-green-400'
  if (s === 'Rejected') return 'bg-red-100 text-red-700 dark:bg-red-900/30 dark:text-red-400'
  return 'bg-amber-100 text-amber-700 dark:bg-amber-900/30 dark:text-amber-400'
}

function formatMoneyVnd(n) {
  if (n == null || Number.isNaN(Number(n))) return '—'
  return new Intl.NumberFormat('vi-VN').format(Number(n)) + ' đ'
}

function formatDateTimeVi(iso) {
  if (!iso) return '—'
  const d = new Date(iso)
  if (Number.isNaN(d.getTime())) return String(iso)
  return d.toLocaleString('vi-VN', {
    day: '2-digit',
    month: '2-digit',
    year: 'numeric',
    hour: '2-digit',
    minute: '2-digit',
  })
}

export function PartnerPaymentsUploadPage() {
  const { accessToken, isAuthenticated } = useAuth()
  const [searchParams] = useSearchParams()
  const prefillInvoiceId = searchParams.get('invoiceId') || ''
  const prefillInvoiceNumber = searchParams.get('invoiceNumber') || ''
  const prefillRemainingRaw = searchParams.get('remaining') || ''
  const prefillRemaining = Number(prefillRemainingRaw)
  const [file, setFile] = useState(/** @type {File|null} */ (null))
  const [invoiceOptions, setInvoiceOptions] = useState(
    /** @type {{ id: number, label: string, remainingAmount: number }[]} */ ([]),
  )
  const [invoiceId, setInvoiceId] = useState('')
  const [ref, setRef] = useState('')
  const [amount, setAmount] = useState('')
  const [transferDate, setTransferDate] = useState('')
  const [note, setNote] = useState('')
  const [submitting, setSubmitting] = useState(false)
  const [feedback, setFeedback] = useState(/** @type {{type:'success'|'error',message:string}|null} */ (null))

  const [recent, setRecent] = useState(/** @type {Record<string, unknown>[]} */ ([]))
  const [recentLoading, setRecentLoading] = useState(true)

  const loadInvoices = useCallback(async () => {
    if (!accessToken) {
      setInvoiceOptions([])
      return
    }
    try {
      /** @type {typeof invoiceOptions} */
      const opts = []
      let page = 1
      const pageSize = 50
      for (let i = 0; i < 6; i++) {
        const invData = await storeB2bFetchInvoices(accessToken, { page, pageSize })
        const chunk = Array.isArray(invData?.items) ? invData.items : []
        for (const raw of chunk) {
          if (raw == null || typeof raw !== 'object') continue
          const o = /** @type {Record<string, unknown>} */ (raw)
          const id = Number(o.id)
          const remaining = Number(o.remainingAmount ?? 0)
          if (!Number.isFinite(id) || remaining <= 0) continue
          const invNo = o.invoiceNumber != null ? String(o.invoiceNumber) : `#${id}`
          opts.push({ id, label: `${invNo} · còn ${formatMoneyVnd(remaining)}`, remainingAmount: remaining })
        }
        if (chunk.length < pageSize) break
        page += 1
      }
      setInvoiceOptions(opts)
    } catch {
      setInvoiceOptions([])
    }
  }, [accessToken])

  const loadRecent = useCallback(async () => {
    if (!accessToken) {
      setRecent([])
      setRecentLoading(false)
      return
    }
    setRecentLoading(true)
    try {
      const data = await storeB2bFetchTransferNotifications(accessToken, { page: 1, pageSize: 20 })
      const items = Array.isArray(data?.items) ? data.items : []
      setRecent(items)
    } catch {
      setRecent([])
    } finally {
      setRecentLoading(false)
    }
  }, [accessToken])

  useEffect(() => {
    void loadInvoices()
  }, [loadInvoices])

  useEffect(() => {
    if (!prefillInvoiceId.trim()) return
    const id = Math.floor(Number(prefillInvoiceId))
    if (!Number.isFinite(id) || id <= 0) return
    setInvoiceId(String(id))
  }, [prefillInvoiceId])

  const selectedInvoiceRemaining = useMemo(() => {
    const id = Math.floor(Number(invoiceId))
    if (!Number.isFinite(id) || id <= 0) return null
    const opt = invoiceOptions.find((o) => o.id === id)
    return opt?.remainingAmount ?? (Number.isFinite(prefillRemaining) && prefillRemaining > 0 ? prefillRemaining : null)
  }, [invoiceId, invoiceOptions, prefillRemaining])

  const amountExceedsRemaining = useMemo(() => {
    if (selectedInvoiceRemaining == null) return false
    const n = parseVndAmount(amount)
    return Number.isFinite(n) && n > selectedInvoiceRemaining
  }, [amount, selectedInvoiceRemaining])

  useEffect(() => {
    void loadRecent()
  }, [loadRecent])

  const onFile = (e) => {
    const f = e.target.files?.[0]
    setFile(f instanceof File ? f : null)
  }

  const onSubmit = async (e) => {
    e.preventDefault()
    if (submitting) return
    setFeedback(null)

    if (!isAuthenticated || !accessToken) {
      setFeedback({ type: 'error', message: 'Vui lòng đăng nhập tài khoản B2B để gửi chứng từ.' })
      return
    }
    const refTrim = ref.trim()
    if (!refTrim) {
      setFeedback({ type: 'error', message: 'Vui lòng nhập mã tham chiếu.' })
      return
    }
    const amountNum = parseVndAmount(amount)
    if (!Number.isFinite(amountNum) || amountNum <= 0) {
      setFeedback({ type: 'error', message: 'Số tiền không hợp lệ. Ví dụ: 20.000.000.' })
      return
    }
    if (selectedInvoiceRemaining != null && amountNum > selectedInvoiceRemaining) {
      setFeedback({
        type: 'error',
        message: `Số tiền vượt số còn lại của hóa đơn (${formatMoneyVnd(selectedInvoiceRemaining)}).`,
      })
      return
    }

    let attachmentUrl = ''
    if (file) {
      try {
        const uploaded = await storeMeUploadWarrantyEvidence(accessToken, file)
        attachmentUrl = pickSecureUrl(uploaded)
        if (!attachmentUrl) {
          setFeedback({ type: 'error', message: 'Tải file lên thất bại.' })
          return
        }
      } catch (upErr) {
        setFeedback({ type: 'error', message: getApiErrorMessage(upErr) })
        return
      }
    }

    let noteCombined = note.trim()
    if (transferDate.trim()) {
      const line = `Thời gian CK (khách nhập): ${transferDate.trim()}`
      noteCombined = noteCombined ? `${noteCombined}\n${line}` : line
    }

    const invParsed = invoiceId.trim() !== '' ? Math.floor(Number(invoiceId)) : NaN
    const invoiceIdPayload =
      Number.isFinite(invParsed) && invParsed > 0 ? invParsed : null

    try {
      setSubmitting(true)
      await storeB2bPostNotifyTransfer(accessToken, {
        referenceCode: refTrim,
        amount: amountNum,
        note: noteCombined || null,
        attachmentUrl: attachmentUrl || null,
        invoiceId: invoiceIdPayload,
      })
      setRef('')
      setAmount('')
      setTransferDate('')
      setNote('')
      setFile(null)
      setInvoiceId('')
      setFeedback({
        type: 'success',
        message: 'Đã gửi. Kế toán sẽ đối soát.',
      })
      void loadRecent()
    } catch (err) {
      const msg =
        err instanceof ApiError
          ? err.message
          : err instanceof Error
            ? err.message
            : 'Gửi thông báo thất bại. Vui lòng thử lại sau.'
      setFeedback({ type: 'error', message: msg })
    } finally {
      setSubmitting(false)
    }
  }

  return (
    <>
      <PartnerPaymentsPageHeader title="Upload chứng từ" paymentsNav />

      {prefillInvoiceId.trim() ? (
        <div className="mx-8 mt-4 max-w-6xl rounded-xl border border-primary/30 bg-primary/5 px-4 py-3 text-sm text-slate-800 dark:text-slate-100">
          <span className="font-bold">Thanh toán hóa đơn: </span>
          <span className="font-mono">{prefillInvoiceNumber || prefillInvoiceId}</span>
          {Number.isFinite(prefillRemaining) && prefillRemaining > 0 ? (
            <span className="text-slate-600 dark:text-slate-400">
              {' '}
              · còn {formatMoneyVnd(prefillRemaining)}
            </span>
          ) : null}
        </div>
      ) : null}

      <section className="p-8 pt-6">
        <div className="grid grid-cols-1 lg:grid-cols-3 gap-8">
          <div className="lg:col-span-2">
            <form
              className="bg-white dark:bg-slate-900 rounded-xl border border-slate-200 dark:border-slate-800 shadow-sm overflow-hidden"
              onSubmit={(e) => void onSubmit(e)}
            >
              <div className="px-6 py-4 border-b border-slate-200 dark:border-slate-800">
                <h3 className="font-bold text-slate-900 dark:text-slate-50">Gửi chứng từ mới</h3>
              </div>
              <div className="p-6 space-y-6">
                <div>
                  <label className="block text-xs font-bold text-slate-500 uppercase tracking-wider mb-2">
                    Tệp đính kèm (khuyến nghị)
                  </label>
                  <label className="flex flex-col items-center justify-center border-2 border-dashed border-slate-300 dark:border-slate-600 rounded-xl py-12 px-4 cursor-pointer hover:border-primary/50 hover:bg-primary/5 transition-colors">
                    <Icon name="cloud_upload" className="text-4xl text-slate-400 mb-2" />
                    <span className="text-sm font-semibold text-slate-700 dark:text-slate-200">
                      Kéo thả hoặc bấm để chọn
                    </span>
                    <span className="text-xs text-slate-500 mt-1">{file ? file.name : 'Chưa chọn tệp'}</span>
                    <input type="file" accept=".pdf,.jpg,.jpeg,.png" className="hidden" onChange={onFile} />
                  </label>
                </div>

                <div>
                  <label
                    htmlFor="pay-upload-invoice"
                    className="block text-xs font-bold text-slate-500 uppercase tracking-wider mb-2"
                  >
                    Hóa đơn
                  </label>
                  <select
                    id="pay-upload-invoice"
                    value={invoiceId}
                    onChange={(e) => setInvoiceId(e.target.value)}
                    className="w-full px-4 py-2.5 rounded-lg bg-slate-100 dark:bg-slate-800 border-none focus:ring-2 focus:ring-primary text-sm text-slate-900 dark:text-slate-100"
                  >
                    <option value="">— Không chọn —</option>
                    {invoiceOptions.map((o) => (
                      <option key={o.id} value={String(o.id)}>
                        {o.label}
                      </option>
                    ))}
                  </select>
                </div>

                <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
                  <div>
                    <label
                      htmlFor="pay-upload-ref"
                      className="block text-xs font-bold text-slate-500 uppercase tracking-wider mb-2"
                    >
                      Mã tham chiếu
                    </label>
                    <input
                      id="pay-upload-ref"
                      type="text"
                      value={ref}
                      onChange={(e) => setRef(e.target.value)}
                      placeholder="VD: FT12345…"
                      className="w-full px-4 py-2.5 rounded-lg bg-slate-100 dark:bg-slate-800 border-none focus:ring-2 focus:ring-primary text-sm text-slate-900 dark:text-slate-100 placeholder-slate-400"
                    />
                  </div>
                  <div>
                    <label
                      htmlFor="pay-upload-amount"
                      className="block text-xs font-bold text-slate-500 uppercase tracking-wider mb-2"
                    >
                      Số tiền chuyển
                    </label>
                    <input
                      id="pay-upload-amount"
                      type="text"
                      value={amount}
                      onChange={(e) => setAmount(e.target.value)}
                      placeholder={
                        selectedInvoiceRemaining != null
                          ? `Tối đa ${new Intl.NumberFormat('vi-VN').format(selectedInvoiceRemaining)}`
                          : 'VD: 20.000.000'
                      }
                      className="w-full px-4 py-2.5 rounded-lg bg-slate-100 dark:bg-slate-800 border-none focus:ring-2 focus:ring-primary text-sm text-slate-900 dark:text-slate-100 placeholder-slate-400"
                    />
                    {amountExceedsRemaining && selectedInvoiceRemaining != null ? (
                      <p className="mt-1 text-xs text-amber-700 dark:text-amber-300">
                        Vượt số còn lại ({formatMoneyVnd(selectedInvoiceRemaining)}).
                      </p>
                    ) : null}
                  </div>
                </div>

                <div>
                  <label
                    htmlFor="pay-upload-date"
                    className="block text-xs font-bold text-slate-500 uppercase tracking-wider mb-2"
                  >
                    Ngày giờ chuyển khoản
                  </label>
                  <input
                    id="pay-upload-date"
                    type="datetime-local"
                    value={transferDate}
                    onChange={(e) => setTransferDate(e.target.value)}
                    className="w-full max-w-xs px-4 py-2.5 rounded-lg bg-slate-100 dark:bg-slate-800 border-none focus:ring-2 focus:ring-primary text-sm text-slate-900 dark:text-slate-100"
                  />
                </div>

                <div>
                  <label
                    htmlFor="pay-upload-note"
                    className="block text-xs font-bold text-slate-500 uppercase tracking-wider mb-2"
                  >
                    Ghi chú (tuỳ chọn)
                  </label>
                  <textarea
                    id="pay-upload-note"
                    value={note}
                    onChange={(e) => setNote(e.target.value)}
                    rows={3}
                    placeholder="Nội dung hiển thị trên sao kê…"
                    className="w-full px-4 py-2.5 rounded-lg bg-slate-100 dark:bg-slate-800 border-none focus:ring-2 focus:ring-primary text-sm text-slate-900 dark:text-slate-100 placeholder-slate-400 resize-y min-h-[88px]"
                  />
                </div>

                {feedback ? (
                  <div
                    role={feedback.type === 'error' ? 'alert' : 'status'}
                    className={[
                      'rounded-lg border px-4 py-3 text-sm',
                      feedback.type === 'success'
                        ? 'border-emerald-200 bg-emerald-50 text-emerald-800 dark:border-emerald-900/40 dark:bg-emerald-950/30 dark:text-emerald-200'
                        : 'border-rose-200 bg-rose-50 text-rose-700 dark:border-rose-900/40 dark:bg-rose-950/30 dark:text-rose-200',
                    ].join(' ')}
                  >
                    <div className="flex items-start gap-2">
                      <Icon
                        name={feedback.type === 'success' ? 'check_circle' : 'error'}
                        className="text-lg shrink-0"
                      />
                      <div className="min-w-0 flex-1">
                        <p>{feedback.message}</p>
                        {feedback.type === 'success' ? (
                          <Link
                            to="/partner/payments/history"
                            className="mt-1 inline-flex items-center gap-1 text-xs font-semibold text-emerald-900 underline decoration-dotted underline-offset-2 hover:no-underline dark:text-emerald-100"
                          >
                            Xem lịch sử thanh toán
                            <Icon name="arrow_forward" className="text-sm" />
                          </Link>
                        ) : null}
                      </div>
                    </div>
                  </div>
                ) : null}

                <div className="flex flex-wrap gap-3 pt-2">
                  <button
                    type="submit"
                    disabled={submitting}
                    className="inline-flex items-center gap-2 px-6 py-3 rounded-lg bg-primary text-white font-bold text-sm hover:bg-primary/90 transition-colors disabled:cursor-not-allowed disabled:opacity-60"
                  >
                    <Icon
                      name={submitting ? 'autorenew' : 'send'}
                      className={submitting ? 'animate-spin' : ''}
                    />
                    {submitting ? 'Đang gửi…' : 'Gửi chứng từ'}
                  </button>
                  <Link
                    to="/partner/payments/history"
                    className="inline-flex items-center gap-2 px-6 py-3 rounded-lg bg-slate-100 dark:bg-slate-800 text-slate-700 dark:text-slate-200 font-semibold text-sm hover:bg-slate-200 dark:hover:bg-slate-700 transition-colors"
                  >
                    Xem lịch sử ghi nhận
                  </Link>
                </div>
              </div>
            </form>
          </div>

          <div>
            <div className="bg-white dark:bg-slate-900 rounded-xl border border-slate-200 dark:border-slate-800 shadow-sm overflow-hidden">
              <div className="px-5 py-4 border-b border-slate-200 dark:border-slate-800 flex justify-between items-center gap-2">
                <h3 className="font-bold text-slate-900 dark:text-slate-50 text-sm">Thông báo đã gửi</h3>
                <button
                  type="button"
                  onClick={() => void loadRecent()}
                  className="text-xs font-bold text-primary hover:underline"
                >
                  Làm mới
                </button>
              </div>
              {recentLoading ? (
                <p className="p-4 text-sm text-slate-500">Đang tải…</p>
              ) : recent.length === 0 ? (
                <p className="p-4 text-sm text-slate-500">Chưa có thông báo.</p>
              ) : (
                <ul className="divide-y divide-slate-200 dark:divide-slate-800 max-h-[520px] overflow-y-auto">
                  {recent.map((u) => {
                    const id = u.id != null ? Number(u.id) : NaN
                    const st = u.status != null ? String(u.status) : ''
                    const refCode = u.referenceCode != null ? String(u.referenceCode) : ''
                    const att = u.attachmentUrl != null ? String(u.attachmentUrl).trim() : ''
                    const invNo = u.invoiceNumber != null ? String(u.invoiceNumber) : ''
                    const procNote = u.processNote != null ? String(u.processNote).trim() : ''
                    const hrefAtt = att ? resolveStoreMediaUrl(att) : ''
                    return (
                      <li key={Number.isFinite(id) ? id : refCode} className="p-4 hover:bg-slate-50 dark:hover:bg-slate-800/40 transition-colors">
                        <div className="flex items-start gap-3">
                          <div className="p-2 rounded-lg bg-slate-100 dark:bg-slate-800 text-slate-600 dark:text-slate-400 shrink-0">
                            <Icon name="description" className="text-xl" />
                          </div>
                          <div className="min-w-0 flex-1">
                            <p className="text-sm font-semibold text-slate-900 dark:text-slate-100 font-mono">
                              {refCode || `#${id}`}
                            </p>
                            <p className="text-xs text-slate-500 mt-0.5">
                              {formatDateTimeVi(typeof u.createdAt === 'string' ? u.createdAt : '')}
                            </p>
                            {invNo ? (
                              <p className="text-xs text-primary font-medium mt-1">
                                <Link
                                  to={`/partner/payments/invoices/${encodeURIComponent(invNo)}`}
                                  className="hover:underline font-mono"
                                >
                                  {invNo}
                                </Link>
                              </p>
                            ) : null}
                            <div className="flex flex-wrap justify-between items-center gap-2 mt-2">
                              <span className="text-sm font-bold text-slate-800 dark:text-slate-200">
                                {formatMoneyVnd(u.amount)}
                              </span>
                              <span
                                className={`text-[10px] font-bold px-2 py-0.5 rounded-full ${transferNotifStatusClass(st)}`}
                              >
                                {transferNotifStatusLabel(st)}
                              </span>
                            </div>
                            {hrefAtt ? (
                              <a
                                href={hrefAtt}
                                target="_blank"
                                rel="noreferrer"
                                className="text-xs font-semibold text-primary hover:underline mt-2 inline-block"
                              >
                                Xem chứng từ
                              </a>
                            ) : null}
                            {procNote && st === 'Rejected' ? (
                              <p className="text-xs text-slate-500 mt-2">Lý do: {procNote}</p>
                            ) : null}
                          </div>
                        </div>
                      </li>
                    )
                  })}
                </ul>
              )}
            </div>

          </div>
        </div>
      </section>
    </>
  )
}
