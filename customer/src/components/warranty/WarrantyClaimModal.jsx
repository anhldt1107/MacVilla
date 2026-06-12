import { useEffect, useMemo, useState } from 'react'
import {
  MAX_WARRANTY_EVIDENCE_FILES,
  storeMeCreateWarrantyClaim,
  storeMeUploadWarrantyEvidence,
} from '../../api/store/storeMeWarrantyApi'
import { getApiErrorMessage } from '../../lib/errors/apiErrorMessage'

/** @param {Record<string, unknown>} data */
function pickSecureUrl(data) {
  const u = data.secureUrl ?? data.SecureUrl
  return typeof u === 'string' ? u.trim() : ''
}

function formatDate(iso) {
  if (!iso) return ''
  const d = new Date(iso)
  if (Number.isNaN(d.getTime())) return ''
  return d.toLocaleDateString('vi-VN', {
    day: '2-digit',
    month: '2-digit',
    year: 'numeric',
  })
}

/**
 * @param {{
 *   open: boolean
 *   onClose: () => void
 *   accessToken: string | null
 *   mode: 'order' | 'ticket'
 *   orderId?: number | null
 *   warrantyTicketId?: number | null
 *   lineOptions: {
 *     orderItemId: number
 *     variantId: number
 *     label: string
 *     isValid?: boolean
 *     daysRemaining?: number | null
 *     validUntil?: unknown
 *   }[]
 *   preselectedOrderItemId?: number | null
 *   onSuccess?: (data: unknown) => void
 *   createWarrantyClaim?: typeof storeMeCreateWarrantyClaim
 * }} props
 */
export function WarrantyClaimModal({
  open,
  onClose,
  accessToken,
  mode,
  orderId,
  warrantyTicketId,
  lineOptions,
  preselectedOrderItemId,
  onSuccess,
  createWarrantyClaim = storeMeCreateWarrantyClaim,
}) {
  const [orderItemId, setOrderItemId] = useState('')
  const [defectDescription, setDefectDescription] = useState('')
  const [evidenceFiles, setEvidenceFiles] = useState([])
  const [busy, setBusy] = useState(false)
  /** @type {'idle' | 'upload' | 'claim'} */
  const [submitPhase, setSubmitPhase] = useState('idle')
  const [error, setError] = useState('')

  const eligibleOptions = useMemo(() => {
    const raw = Array.isArray(lineOptions) ? lineOptions : []
    return raw.filter((o) => o.isValid !== false)
  }, [lineOptions])

  useEffect(() => {
    if (!open) {
      setOrderItemId('')
      setDefectDescription('')
      setEvidenceFiles([])
      setError('')
      setBusy(false)
      setSubmitPhase('idle')
      return
    }
    if (preselectedOrderItemId != null && Number(preselectedOrderItemId) > 0) {
      setOrderItemId(String(preselectedOrderItemId))
    }
  }, [open, preselectedOrderItemId])

  if (!open) return null

  const selected = eligibleOptions.find((o) => String(o.orderItemId) === orderItemId)

  const handleSubmit = async () => {
    if (!accessToken) return
    setError('')
    const oi = Number(orderItemId)
    const vid = selected?.variantId != null ? Number(selected.variantId) : NaN
    if (!Number.isFinite(oi) || oi <= 0) {
      setError('Chọn sản phẩm.')
      return
    }
    if (!Number.isFinite(vid) || vid <= 0) {
      setError('Chọn sản phẩm hợp lệ.')
      return
    }
    const files = Array.isArray(evidenceFiles) ? evidenceFiles : []

    setBusy(true)
    setSubmitPhase(files.length ? 'upload' : 'claim')
    try {
      const urls = []
      for (let i = 0; i < files.length; i += 1) {
        const file = files[i]
        const uploaded = await storeMeUploadWarrantyEvidence(accessToken, file)
        const url = pickSecureUrl(uploaded)
        if (!url) {
          throw new Error(
            `Không nhận được URL sau khi tải “${file.name}”. Vui lòng thử lại.`,
          )
        }
        urls.push(url)
      }
      setSubmitPhase('claim')

      const imagesUrlJoined = urls.length ? urls.join(',') : null
      const orderItemPayload = oi > 0 ? oi : undefined
      const body =
        mode === 'order'
          ? {
              orderId: orderId != null ? Number(orderId) : undefined,
              orderItemId: orderItemPayload,
              variantId: vid,
              defectDescription,
              imagesUrl: imagesUrlJoined,
            }
          : {
              warrantyTicketId:
                warrantyTicketId != null ? Number(warrantyTicketId) : undefined,
              orderItemId: orderItemPayload,
              variantId: vid,
              defectDescription,
              imagesUrl: imagesUrlJoined,
            }
      const data = await createWarrantyClaim(accessToken, body)
      onSuccess?.(data)
      onClose()
    } catch (err) {
      setError(getApiErrorMessage(err))
    } finally {
      setBusy(false)
      setSubmitPhase('idle')
    }
  }

  /** @param {import('react').ChangeEvent<HTMLInputElement>} e */
  const onEvidencePick = (e) => {
    const picked = Array.from(e.target.files || [])
    setEvidenceFiles((prev) => {
      const merged = [...prev]
      for (const f of picked) {
        if (merged.length >= MAX_WARRANTY_EVIDENCE_FILES) break
        merged.push(f)
      }
      return merged
    })
    e.target.value = ''
  }

  const removeEvidenceAt = (idx) => {
    setEvidenceFiles((prev) => prev.filter((_, i) => i !== idx))
  }

  const disabledNoLines = eligibleOptions.length === 0

  const busyLabel =
    submitPhase === 'upload'
      ? 'Đang tải tệp tin…'
      : submitPhase === 'claim'
        ? 'Đang gửi yêu cầu…'
        : 'Đang gửi…'

  const expiredHint =
    selected?.isValid === false && selected?.validUntil
      ? `Hết hạn từ ${formatDate(selected.validUntil)}`
      : ''

  return (
    <div className="fixed inset-0 z-[100] flex items-center justify-center p-4" role="presentation">
      <button
        type="button"
        aria-label="Đóng"
        disabled={busy}
        onClick={onClose}
        className="absolute inset-0 bg-slate-900/60 dark:bg-black/70 backdrop-blur-[2px]"
      />
      <div
        role="dialog"
        aria-modal="true"
        className="relative z-[1] w-full max-w-lg min-w-0 rounded-xl border border-slate-200 dark:border-slate-700 bg-white dark:bg-slate-900 shadow-2xl p-6 max-h-[90vh] overflow-x-hidden overflow-y-auto"
      >
        <h3 className="text-lg font-bold text-slate-900 dark:text-white mb-4">Yêu cầu bảo hành</h3>

        <div className="space-y-4">
          <div className="min-w-0">
            <span
              className="block text-sm font-semibold text-slate-700 dark:text-slate-300 mb-1"
              id="warranty-claim-line-label"
            >
              Sản phẩm
            </span>
            <div
              className="max-h-44 overflow-y-auto overflow-x-hidden rounded-lg border border-slate-200 dark:border-slate-700 divide-y divide-slate-100 dark:divide-slate-800"
              role="listbox"
              aria-labelledby="warranty-claim-line-label"
            >
              {eligibleOptions.map((o) => {
                const selected = String(o.orderItemId) === orderItemId
                return (
                  <button
                    key={o.orderItemId}
                    type="button"
                    role="option"
                    aria-selected={selected}
                    title={o.label}
                    disabled={busy}
                    className={`block w-full min-w-0 max-w-full truncate px-3 py-2.5 text-left text-sm transition-colors ${
                      selected
                        ? 'bg-primary/10 font-semibold text-primary dark:bg-primary/20'
                        : 'hover:bg-slate-50 dark:hover:bg-slate-800/80'
                    }`}
                    onClick={() => setOrderItemId(String(o.orderItemId))}
                  >
                    {o.label}
                  </button>
                )
              })}
            </div>
            {!orderItemId && !disabledNoLines ? (
              <p className="text-xs text-slate-500 mt-1">Chọn sản phẩm ở trên.</p>
            ) : null}
            {disabledNoLines ? (
              <p className="text-xs text-amber-700 dark:text-amber-300 mt-1">
                Không có sản phẩm còn hạn bảo hành.
              </p>
            ) : null}
            {expiredHint ? (
              <p className="text-xs text-slate-500 mt-1">{expiredHint}</p>
            ) : null}
          </div>
          <div>
            <label className="block text-sm font-semibold text-slate-700 dark:text-slate-300 mb-1">
              Mô tả lỗi
            </label>
            <textarea
              value={defectDescription}
              onChange={(e) => setDefectDescription(e.target.value)}
              rows={4}
              disabled={busy}
              className="w-full px-3 py-2 rounded-lg border border-slate-200 dark:border-slate-700 bg-white dark:bg-slate-900 text-sm"
            />
          </div>
          <div>
            <label className="block text-sm font-semibold text-slate-700 dark:text-slate-300 mb-1">
              Tệp đính kèm (tuỳ chọn)
            </label>
            <input
              type="file"
              multiple
              accept=".jpg,.jpeg,.png,.gif,.webp,.pdf,.doc,.docx,image/jpeg,image/png,image/gif,image/webp,application/pdf,application/msword,application/vnd.openxmlformats-officedocument.wordprocessingml.document"
              disabled={busy || evidenceFiles.length >= MAX_WARRANTY_EVIDENCE_FILES}
              onChange={onEvidencePick}
              className="block w-full text-sm text-slate-600 dark:text-slate-300 file:mr-3 file:rounded-lg file:border-0 file:bg-slate-100 file:px-3 file:py-2 file:text-sm file:font-semibold dark:file:bg-slate-800"
            />
            {evidenceFiles.length > 0 ? (
              <ul className="mt-2 space-y-1 text-xs text-slate-700 dark:text-slate-300">
                {evidenceFiles.map((f, i) => (
                  <li key={`${f.name}-${f.size}-${i}`} className="flex items-center justify-between gap-2">
                    <span className="truncate" title={f.name}>
                      {f.name}
                    </span>
                    <button
                      type="button"
                      disabled={busy}
                      onClick={() => removeEvidenceAt(i)}
                      className="shrink-0 text-red-600 dark:text-red-400 font-semibold"
                    >
                      Gỡ
                    </button>
                  </li>
                ))}
              </ul>
            ) : null}
          </div>
        </div>

        {error ? (
          <p className="text-sm text-red-600 dark:text-red-400 mt-3" role="alert">
            {error}
          </p>
        ) : null}

        <div className="flex justify-end gap-2 mt-6">
          <button
            type="button"
            disabled={busy}
            onClick={onClose}
            className="px-4 py-2 rounded-lg border border-slate-200 dark:border-slate-600 text-sm font-semibold"
          >
            Hủy
          </button>
          <button
            type="button"
            disabled={
              busy ||
              disabledNoLines ||
              !String(defectDescription).trim() ||
              !orderItemId
            }
            onClick={() => void handleSubmit()}
            className="px-4 py-2 rounded-lg bg-primary text-white text-sm font-bold disabled:opacity-50"
          >
            {busy ? busyLabel : 'Gửi yêu cầu'}
          </button>
        </div>
      </div>
    </div>
  )
}
