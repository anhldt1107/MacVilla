import { useMemo, useState, useEffect, useCallback } from 'react'
import { Link, useSearchParams } from 'react-router-dom'
import { Icon } from '../components/ui/Icon'
import { PartnerPaymentsPageHeader } from '../components/partner/PartnerPaymentsPageHeader'
import { B2B_PAYMENTS_BANK_INFO } from '../data/b2bDashboard'
import { storeB2bFetchInvoices } from '../api/store/storeB2bDebtInvoicesApi'
import { storeB2bFetchBankTransferInfo } from '../api/store/storeB2bPaymentsApi'
import { storeB2bFetchOrders } from '../api/store/storeB2bOrdersApi'
import { storeCreatePayOsPaymentLink } from '../api/store/storePaymentsApi'
import { getApiErrorMessage } from '../lib/errors/apiErrorMessage'
import { useAuth } from '../contexts/AuthContext'

function formatVnd(n) {
  if (n == null || Number.isNaN(Number(n))) return '—'
  return new Intl.NumberFormat('vi-VN').format(Number(n)) + ' đ'
}

function formatDue(iso) {
  if (!iso) return '—'
  const d = new Date(iso)
  if (Number.isNaN(d.getTime())) return '—'
  return d.toLocaleDateString('vi-VN', {
    day: '2-digit',
    month: '2-digit',
    year: 'numeric',
  })
}

function isPayOsMethod(pm) {
  return String(pm ?? '')
    .trim()
    .toLowerCase() === 'payos'
}

export function PartnerPaymentsPayPage() {
  const { accessToken, isAuthenticated } = useAuth()
  const [searchParams] = useSearchParams()
  const invoiceNumberFromUrl = searchParams.get('invoiceNumber') || ''
  const invoiceIdFromUrl = searchParams.get('invoiceId') || ''
  const payosReturn = searchParams.get('payosReturn')
  const payosCancel = searchParams.get('payosCancel')

  const [bankInfo, setBankInfo] = useState(() => ({
    beneficiary: B2B_PAYMENTS_BANK_INFO.beneficiary,
    account: B2B_PAYMENTS_BANK_INFO.account,
    bank: B2B_PAYMENTS_BANK_INFO.bank,
    transferSyntaxPrefix: B2B_PAYMENTS_BANK_INFO.transferSyntaxPrefix,
  }))

  const [invoiceRows, setInvoiceRows] = useState(
    /** @type {{ id: number, invoiceNumber: string, dueDate?: string|null, remainingAmount: number, orderCode?: string|null }[]} */ ([]),
  )
  const [payOsOrders, setPayOsOrders] = useState(
    /** @type {{ orderCode: string, payableTotal: number, createdAt?: string }[]} */ ([]),
  )
  const [loadError, setLoadError] = useState('')
  const [payOsBusyCode, setPayOsBusyCode] = useState(/** @type {string|null} */ (null))
  const [loadingLists, setLoadingLists] = useState(true)

  const [selectedInvoiceId, setSelectedInvoiceId] = useState(/** @type {number|null} */ (null))

  const loadLists = useCallback(async () => {
    if (!accessToken) {
      setInvoiceRows([])
      setPayOsOrders([])
      setLoadingLists(false)
      setLoadError('')
      return
    }
    setLoadingLists(true)
    setLoadError('')
    try {
      const bank = await storeB2bFetchBankTransferInfo(accessToken).catch(() => null)
      if (bank && typeof bank === 'object') {
        const b = /** @type {Record<string, unknown>} */ (bank)
        setBankInfo({
          beneficiary:
            typeof b.beneficiary === 'string' && b.beneficiary.trim()
              ? b.beneficiary.trim()
              : B2B_PAYMENTS_BANK_INFO.beneficiary,
          account:
            typeof b.accountNumber === 'string' && b.accountNumber.trim()
              ? b.accountNumber.trim()
              : B2B_PAYMENTS_BANK_INFO.account,
          bank:
            typeof b.bankName === 'string' && b.bankName.trim()
              ? b.bankName.trim()
              : B2B_PAYMENTS_BANK_INFO.bank,
          transferSyntaxPrefix:
            typeof b.transferSyntaxPrefix === 'string' && b.transferSyntaxPrefix.trim()
              ? b.transferSyntaxPrefix.trim()
              : B2B_PAYMENTS_BANK_INFO.transferSyntaxPrefix,
        })
      }

      /** @type {typeof invoiceRows} */
      const unpaidInv = []
      let page = 1
      const pageSize = 50
      for (let i = 0; i < 8; i++) {
        const invData = await storeB2bFetchInvoices(accessToken, { page, pageSize })
        const chunk = Array.isArray(invData?.items) ? invData.items : []
        for (const raw of chunk) {
          if (raw == null || typeof raw !== 'object') continue
          const o = /** @type {Record<string, unknown>} */ (raw)
          const id = Number(o.id)
          const remaining = Number(o.remainingAmount ?? 0)
          if (!Number.isFinite(id) || remaining <= 0) continue
          unpaidInv.push({
            id,
            invoiceNumber: o.invoiceNumber != null ? String(o.invoiceNumber) : '',
            dueDate: o.dueDate != null ? String(o.dueDate) : null,
            remainingAmount: remaining,
            orderCode: o.orderCode != null ? String(o.orderCode) : null,
          })
        }
        if (chunk.length < pageSize) break
        page += 1
      }
      setInvoiceRows(unpaidInv)

      const ordData = await storeB2bFetchOrders(accessToken, {
        paymentStatus: 'Unpaid',
        page: 1,
        pageSize: 50,
      })
      const ordChunk = Array.isArray(ordData?.items) ? ordData.items : []
      /** @type {typeof payOsOrders} */
      const pos = []
      for (const raw of ordChunk) {
        if (raw == null || typeof raw !== 'object') continue
        const o = /** @type {Record<string, unknown>} */ (raw)
        if (!isPayOsMethod(o.paymentMethod)) continue
        const code = o.orderCode != null ? String(o.orderCode) : ''
        if (!code) continue
        pos.push({
          orderCode: code,
          payableTotal: Number(o.payableTotal ?? 0) || 0,
          createdAt: o.createdAt != null ? String(o.createdAt) : undefined,
        })
      }
      setPayOsOrders(pos)
    } catch (err) {
      setLoadError(getApiErrorMessage(err))
      setInvoiceRows([])
      setPayOsOrders([])
    } finally {
      setLoadingLists(false)
    }
  }, [accessToken])

  useEffect(() => {
    void loadLists()
  }, [loadLists])

  useEffect(() => {
    if (!invoiceIdFromUrl || invoiceRows.length === 0) return
    const targetId = Number(invoiceIdFromUrl)
    if (!Number.isFinite(targetId)) return
    if (invoiceRows.some((r) => r.id === targetId)) {
      setSelectedInvoiceId(targetId)
    }
  }, [invoiceIdFromUrl, invoiceRows])

  useEffect(() => {
    if (!invoiceNumberFromUrl || invoiceRows.length === 0) return
    const found = invoiceRows.find(
      (r) => r.invoiceNumber && r.invoiceNumber.toLowerCase() === invoiceNumberFromUrl.trim().toLowerCase(),
    )
    if (found) {
      setSelectedInvoiceId(found.id)
    }
  }, [invoiceNumberFromUrl, invoiceRows])

  const selectedInvoice = useMemo(
    () => invoiceRows.find((r) => r.id === selectedInvoiceId) ?? null,
    [invoiceRows, selectedInvoiceId],
  )

  const primaryRef = selectedInvoice?.invoiceNumber?.trim()
    ? selectedInvoice.invoiceNumber.trim()
    : 'MA_THAM_CHIEU'

  const uploadHref = useMemo(() => {
    if (!selectedInvoice) return '/partner/payments/upload'
    const q = new URLSearchParams({
      invoiceId: String(selectedInvoice.id),
      invoiceNumber: selectedInvoice.invoiceNumber || String(selectedInvoice.id),
      remaining: String(selectedInvoice.remainingAmount),
    })
    return `/partner/payments/upload?${q.toString()}`
  }, [selectedInvoice])

  const transferContent = `${bankInfo.transferSyntaxPrefix} ${primaryRef}`.toUpperCase()

  const copy = async (text) => {
    try {
      await navigator.clipboard.writeText(text)
    } catch {
      /* ignore */
    }
  }

  const startPayOs = async (orderCode) => {
    if (!accessToken || !orderCode) return
    const origin = window.location.origin
    setPayOsBusyCode(orderCode)
    try {
      const data = await storeCreatePayOsPaymentLink(accessToken, {
        orderCode,
        returnUrl: `${origin}/partner/payments/pay?payosReturn=1`,
        cancelUrl: `${origin}/partner/payments/pay?payosCancel=1`,
      })
      const url =
        data && typeof data === 'object' && /** @type {Record<string, unknown>} */ (data).checkoutUrl != null
          ? String(/** @type {Record<string, unknown>} */ (data).checkoutUrl).trim()
          : ''
      if (!url) {
        throw new Error('Thiếu checkoutUrl từ PayOS.')
      }
      window.location.href = url
    } catch (e) {
      setLoadError(getApiErrorMessage(e))
      setPayOsBusyCode(null)
    }
  }

  return (
    <>
      <PartnerPaymentsPageHeader title="Thanh toán CK · PayOS" paymentsNav />

      {payosReturn ? (
        <div className="mx-8 mt-4 max-w-6xl rounded-xl border border-emerald-200 bg-emerald-50 dark:border-emerald-900/40 dark:bg-emerald-950/30 px-4 py-3 text-sm text-emerald-900 dark:text-emerald-100">
          PayOS đã kết thúc luồng thanh toán. Nếu tiền đã trừ, trạng thái đơn sẽ cập nhật sau ít phút.
        </div>
      ) : null}
      {payosCancel ? (
        <div className="mx-8 mt-4 max-w-6xl rounded-xl border border-amber-200 bg-amber-50 dark:border-amber-900/40 dark:bg-amber-950/30 px-4 py-3 text-sm text-amber-900 dark:text-amber-100">
          Đã hủy / chưa hoàn tất PayOS. Bạn có thể bấm thanh toán lại hoặc dùng chuyển khoản theo hóa đơn.
        </div>
      ) : null}

      {(invoiceNumberFromUrl || invoiceIdFromUrl) && !payosReturn && !payosCancel ? (
        <div className="mx-8 mt-4 max-w-6xl rounded-xl border border-primary/30 bg-primary/5 px-4 py-3 text-sm text-slate-800 dark:text-slate-100">
          <span className="font-bold">Tham chiếu hóa đơn: </span>
          {invoiceNumberFromUrl ? <span className="font-mono">{invoiceNumberFromUrl}</span> : null}
          {invoiceNumberFromUrl && invoiceIdFromUrl ? <span> · </span> : null}
          {invoiceIdFromUrl ? (
            <span>
              ID: <span className="font-mono">{invoiceIdFromUrl}</span>
            </span>
          ) : null}
          <span className="text-slate-600 dark:text-slate-400"> · ghi đúng nội dung CK để đối soát.</span>
        </div>
      ) : null}

      {!isAuthenticated || !accessToken ? (
        <div className="mx-8 mt-4 rounded-xl border border-amber-200 bg-amber-50 px-4 py-3 text-sm text-amber-900 dark:border-amber-900 dark:bg-amber-950/40 dark:text-amber-100">
          Vui lòng{' '}
          <Link to="/login" className="font-bold underline">
            đăng nhập doanh nghiệp
          </Link>{' '}
          để xem khoản cần thanh toán.
        </div>
      ) : null}

      {loadError ? (
        <div className="mx-8 mt-4 rounded-xl border border-red-200 bg-red-50 px-4 py-3 text-sm text-red-800 dark:border-red-900 dark:bg-red-950/40 dark:text-red-200 flex flex-wrap justify-between gap-2">
          {loadError}
          <button type="button" onClick={() => void loadLists()} className="font-bold text-primary hover:underline">
            Thử lại
          </button>
        </div>
      ) : null}

      <section className="p-8 pt-6">
        <div className="grid grid-cols-1 xl:grid-cols-5 gap-8">
          <div className="xl:col-span-3 space-y-6">
            <div className="bg-white dark:bg-slate-900 rounded-xl border border-slate-200 dark:border-slate-800 overflow-hidden shadow-sm">
              <div className="px-6 py-4 border-b border-slate-200 dark:border-slate-800 flex justify-between items-center flex-wrap gap-2">
                <h3 className="font-bold text-slate-900 dark:text-slate-50">Hóa đơn — chuyển khoản</h3>
                <Link
                  to="/partner/payments/debt"
                  className="text-sm font-semibold text-primary hover:underline inline-flex items-center gap-1"
                >
                  <Icon name="arrow_back" className="text-base" />
                  Công nợ
                </Link>
              </div>
              {loadingLists ? (
                <p className="p-6 text-sm text-slate-500">Đang tải hóa đơn…</p>
              ) : invoiceRows.length === 0 ? (
                <p className="p-6 text-sm text-slate-500">Không có hóa đơn còn số phải trả.</p>
              ) : (
                <ul className="divide-y divide-slate-200 dark:divide-slate-800">
                  {invoiceRows.map((line) => {
                    const on = selectedInvoiceId === line.id
                    return (
                      <li key={line.id}>
                        <label className="flex gap-4 p-5 cursor-pointer hover:bg-slate-50 dark:hover:bg-slate-800/40 transition-colors items-start">
                          <input
                            type="radio"
                            name="pay-invoice"
                            checked={on}
                            onChange={() => setSelectedInvoiceId(line.id)}
                            className="mt-1 w-4 h-4 border-slate-300 text-primary focus:ring-primary"
                          />
                          <div className="flex-1 min-w-0">
                            <div className="flex flex-wrap justify-between gap-2">
                              <Link
                                to={`/partner/payments/invoices/${encodeURIComponent(line.invoiceNumber)}`}
                                className="font-bold text-primary hover:underline font-mono text-sm"
                                onClick={(e) => e.stopPropagation()}
                              >
                                {line.invoiceNumber || `#${line.id}`}
                              </Link>
                              <span className="text-sm text-slate-500">Hạn: {formatDue(line.dueDate)}</span>
                            </div>
                            {line.orderCode ? (
                              <p className="text-xs text-slate-500 mt-1 font-mono">Đơn: {line.orderCode}</p>
                            ) : null}
                            <p className="text-lg font-black text-slate-900 dark:text-slate-50 mt-2">
                              {formatVnd(line.remainingAmount)}
                            </p>
                          </div>
                        </label>
                      </li>
                    )
                  })}
                </ul>
              )}
              <div className="px-6 py-4 bg-slate-50 dark:bg-slate-800/50 border-t border-slate-200 dark:border-slate-800 flex flex-wrap justify-between items-center gap-3">
                <span className="text-sm font-medium text-slate-600 dark:text-slate-400">
                  {selectedInvoice
                    ? `Hóa đơn ${selectedInvoice.invoiceNumber || `#${selectedInvoice.id}`}`
                    : 'Chọn một hóa đơn để thanh toán'}
                </span>
                <span className="text-xl font-black text-primary">
                  {selectedInvoice ? formatVnd(selectedInvoice.remainingAmount) : '—'}
                </span>
              </div>
            </div>

            <div className="bg-white dark:bg-slate-900 rounded-xl border border-slate-200 dark:border-slate-800 overflow-hidden shadow-sm">
              <div className="px-6 py-4 border-b border-slate-200 dark:border-slate-800 flex justify-between items-center flex-wrap gap-2">
                <h3 className="font-bold text-slate-900 dark:text-slate-50">Đơn PayOS</h3>
                <Link to="/partner/orders" className="text-sm font-semibold text-primary hover:underline">
                  Đơn hàng
                </Link>
              </div>
              {loadingLists ? (
                <p className="p-6 text-sm text-slate-500">Đang tải…</p>
              ) : payOsOrders.length === 0 ? (
                <p className="p-6 text-sm text-slate-500">Không có đơn chờ PayOS.</p>
              ) : (
                <ul className="divide-y divide-slate-200 dark:divide-slate-800">
                  {payOsOrders.map((o) => (
                    <li key={o.orderCode} className="p-5 flex flex-wrap items-center justify-between gap-4">
                      <div>
                        <p className="font-mono font-bold text-slate-900 dark:text-white">{o.orderCode}</p>
                        <p className="text-lg font-black text-primary mt-1">{formatVnd(o.payableTotal)}</p>
                      </div>
                      <button
                        type="button"
                        disabled={payOsBusyCode != null}
                        onClick={() => void startPayOs(o.orderCode)}
                        className="inline-flex items-center gap-2 px-4 py-2.5 rounded-lg bg-slate-900 dark:bg-slate-100 text-white dark:text-slate-900 text-sm font-bold hover:opacity-90 disabled:opacity-50"
                      >
                        {payOsBusyCode === o.orderCode ? (
                          <>
                            <Icon name="autorenew" className="animate-spin" />
                            Đang mở PayOS…
                          </>
                        ) : (
                          <>
                            <Icon name="qr_code_2" />
                            Thanh toán PayOS
                          </>
                        )}
                      </button>
                    </li>
                  ))}
                </ul>
              )}
            </div>
          </div>

          <div className="xl:col-span-2">
            <div className="bg-white dark:bg-slate-900 rounded-xl border border-slate-200 dark:border-slate-800 shadow-sm overflow-hidden sticky top-6">
              <div className="px-6 py-4 border-b border-slate-200 dark:border-slate-800 bg-primary/5">
                <h3 className="font-bold text-slate-900 dark:text-slate-50 flex items-center gap-2">
                  <Icon name="account_balance" className="text-primary text-xl" />
                  Chuyển khoản
                </h3>
              </div>
              <div className="p-6 space-y-5">
                <div>
                  <p className="text-xs font-bold text-slate-500 uppercase tracking-wider mb-1">Chủ tài khoản</p>
                  <p className="text-sm font-semibold text-slate-900 dark:text-slate-100 leading-snug">
                    {bankInfo.beneficiary}
                  </p>
                </div>
                <div>
                  <p className="text-xs font-bold text-slate-500 uppercase tracking-wider mb-1">Số tài khoản</p>
                  <div className="flex flex-wrap items-center gap-2">
                    <span className="text-lg font-mono font-bold text-slate-900 dark:text-slate-50 tracking-wide">
                      {bankInfo.account}
                    </span>
                    <button
                      type="button"
                      onClick={() => void copy(String(bankInfo.account).replace(/\s/g, ''))}
                      className="p-1.5 rounded-lg text-slate-500 hover:bg-slate-100 dark:hover:bg-slate-800 hover:text-primary transition-colors"
                      title="Sao chép STK"
                    >
                      <Icon name="content_copy" className="text-lg" />
                    </button>
                  </div>
                </div>
                <div>
                  <p className="text-xs font-bold text-slate-500 uppercase tracking-wider mb-1">Ngân hàng</p>
                  <p className="text-sm text-slate-700 dark:text-slate-200">{bankInfo.bank}</p>
                </div>
                <div className="rounded-lg bg-amber-50 dark:bg-amber-950/30 border border-amber-200 dark:border-amber-900/50 p-4">
                  <p className="text-xs font-bold text-amber-800 dark:text-amber-200 uppercase tracking-wider mb-2">
                    Nội dung chuyển khoản
                  </p>
                  <p className="font-mono text-sm font-bold text-amber-950 dark:text-amber-100 break-all">
                    {transferContent}
                  </p>
                  <button
                    type="button"
                    onClick={() => void copy(transferContent)}
                    className="mt-3 inline-flex items-center gap-2 text-sm font-bold text-amber-800 dark:text-amber-200 hover:underline"
                  >
                    <Icon name="content_copy" className="text-base" />
                    Sao chép nội dung
                  </button>
                </div>
                <div className="pt-2 border-t border-slate-200 dark:border-slate-800">
                  <p className="text-xs text-slate-500 mb-3">Sau CK: upload chứng từ.</p>
                  <Link
                    to={uploadHref}
                    aria-disabled={!selectedInvoice}
                    className={`w-full flex items-center justify-center gap-2 py-3 rounded-lg font-bold text-sm transition-colors ${
                      selectedInvoice
                        ? 'bg-primary text-white hover:bg-primary/90'
                        : 'bg-slate-200 text-slate-500 pointer-events-none dark:bg-slate-800 dark:text-slate-500'
                    }`}
                  >
                    <Icon name="upload_file" />
                    Upload chứng từ
                  </Link>
                </div>
              </div>
            </div>
          </div>
        </div>
      </section>
    </>
  )
}
