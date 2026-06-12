import { useEffect, useState } from 'react'
import { Icon } from '../../ui/Icon'
import { AddressAutocompleteInput } from '../../address/AddressAutocompleteInput'

const MAX_INLINE_ADDRESSES = 2

/**
 * Tối đa 2 địa chỉ: ưu tiên địa chỉ đang chọn, sau đó bổ sung theo thứ tự danh sách.
 * @param {{ id: number }[]} addresses
 * @param {number | null} selectedAddressId
 */
function getInlineAddresses(addresses, selectedAddressId) {
  if (addresses.length <= MAX_INLINE_ADDRESSES) return addresses
  const out = []
  const seen = new Set()
  if (selectedAddressId != null) {
    const sel = addresses.find((a) => a.id === selectedAddressId)
    if (sel) {
      out.push(sel)
      seen.add(sel.id)
    }
  }
  for (const a of addresses) {
    if (out.length >= MAX_INLINE_ADDRESSES) break
    if (seen.has(a.id)) continue
    out.push(a)
    seen.add(a.id)
  }
  return out
}

/**
 * @param {{
 *   addr: { id: number, receiverName: string, receiverPhone: string, addressLine: string, isDefault: boolean },
 *   selected: boolean,
 *   onSelect: () => void,
 * }} props
 */
function AddressSelectCard({ addr, selected, onSelect }) {
  return (
    <button
      type="button"
      onClick={onSelect}
      className={`w-full text-left rounded-xl border p-4 transition-colors ${
        selected
          ? 'border-primary bg-primary/5 ring-2 ring-primary/25'
          : 'border-slate-200 dark:border-slate-700 hover:border-slate-300 dark:hover:border-slate-600'
      }`}
    >
      <div className="flex items-start justify-between gap-2">
        <div>
          <p className="font-bold text-slate-900 dark:text-slate-100">
            {addr.receiverName}
            {addr.isDefault ? (
              <span className="ml-2 text-xs font-bold text-primary">
                Mặc định
              </span>
            ) : null}
          </p>
          <p className="text-sm text-slate-600 dark:text-slate-400 mt-1">
            {addr.receiverPhone}
          </p>
          <p className="text-sm text-slate-700 dark:text-slate-300 mt-2">
            {addr.addressLine}
          </p>
        </div>
        <span
          className={`shrink-0 mt-1 h-5 w-5 rounded-full border-2 flex items-center justify-center ${
            selected
              ? 'border-primary bg-primary'
              : 'border-slate-300 dark:border-slate-600'
          }`}
          aria-hidden="true"
        >
          {selected ? (
            <span className="h-2 w-2 rounded-full bg-white" />
          ) : null}
        </span>
      </div>
    </button>
  )
}

/**
 * @param {{
 *   addresses: { id: number, receiverName: string, receiverPhone: string, addressLine: string, isDefault: boolean }[],
 *   loading?: boolean,
 *   error?: string,
 *   selectedAddressId: number | null,
 *   onSelectAddressId: (id: number) => void,
 *   onCreateAddress: (payload: { receiverName: string, receiverPhone: string, addressLine: string, isDefault: boolean }) => Promise<void>,
 * }} props
 */
export function ShippingInfo({
  addresses = [],
  loading = false,
  error = '',
  selectedAddressId,
  onSelectAddressId,
  onCreateAddress,
}) {
  const [showAddForm, setShowAddForm] = useState(false)
  const [submitting, setSubmitting] = useState(false)
  const [formError, setFormError] = useState('')
  const [receiverName, setReceiverName] = useState('')
  const [receiverPhone, setReceiverPhone] = useState('')
  const [addressLine, setAddressLine] = useState('')
  const [isDefault, setIsDefault] = useState(false)
  const [showAllModal, setShowAllModal] = useState(false)

  const inlineAddresses = getInlineAddresses(addresses, selectedAddressId)
  const hasMoreAddresses = addresses.length > MAX_INLINE_ADDRESSES

  useEffect(() => {
    if (!showAllModal) return
    const onKey = (e) => {
      if (e.key === 'Escape') setShowAllModal(false)
    }
    window.addEventListener('keydown', onKey)
    const prevOverflow = document.body.style.overflow
    document.body.style.overflow = 'hidden'
    return () => {
      window.removeEventListener('keydown', onKey)
      document.body.style.overflow = prevOverflow
    }
  }, [showAllModal])

  const resetForm = () => {
    setReceiverName('')
    setReceiverPhone('')
    setAddressLine('')
    setIsDefault(false)
    setFormError('')
  }

  const handleSubmitNew = async (e) => {
    e.preventDefault()
    setFormError('')
    const name = receiverName.trim()
    const phone = receiverPhone.trim()
    const line = addressLine.trim()
    if (!name) {
      setFormError('Vui lòng nhập tên người nhận / nhãn địa chỉ.')
      return
    }
    if (!phone) {
      setFormError('Vui lòng nhập số điện thoại.')
      return
    }
    if (!line) {
      setFormError('Vui lòng nhập địa chỉ.')
      return
    }
    setSubmitting(true)
    try {
      await onCreateAddress({
        receiverName: name,
        receiverPhone: phone,
        addressLine: line,
        isDefault,
      })
      resetForm()
      setShowAddForm(false)
    } catch (err) {
      setFormError(
        err instanceof Error ? err.message : 'Không thêm được địa chỉ.'
      )
    } finally {
      setSubmitting(false)
    }
  }

  return (
    <section className="bg-white dark:bg-slate-900 p-6 rounded-xl border border-slate-200 dark:border-slate-800">
      <div className="flex flex-wrap items-center justify-between gap-3 mb-6">
        <div className="flex items-center gap-2 text-primary">
          <Icon name="local_shipping" className="text-2xl" />
          <h2 className="text-xl font-bold tracking-tight">
            Thông tin nhận hàng
          </h2>
        </div>
        <button
          type="button"
          onClick={() => {
            setShowAddForm((v) => !v)
            setFormError('')
          }}
          className="inline-flex items-center gap-1.5 rounded-lg border border-primary px-4 py-2 text-sm font-bold text-primary hover:bg-primary/5"
        >
          <Icon name="add" className="text-lg" />
          Thêm địa chỉ
        </button>
      </div>

      {loading ? (
        <p className="text-sm text-slate-500 dark:text-slate-400 py-4">
          Đang tải địa chỉ…
        </p>
      ) : null}

      {error ? (
        <p
          className="text-sm text-red-600 dark:text-red-400 mb-4"
          role="alert"
        >
          {error}
        </p>
      ) : null}

      {!loading && !error && addresses.length === 0 && !showAddForm ? (
        <p className="text-sm text-slate-600 dark:text-slate-400 mb-4">
          Bạn chưa có địa chỉ giao hàng. Nhấn &quot;Thêm địa chỉ&quot; để tạo
          mới.
        </p>
      ) : null}

      {addresses.length > 0 ? (
        <>
          <ul
            className={`space-y-3 ${hasMoreAddresses ? 'mb-3' : 'mb-4'}`}
          >
            {inlineAddresses.map((addr) => (
              <li key={addr.id}>
                <AddressSelectCard
                  addr={addr}
                  selected={selectedAddressId === addr.id}
                  onSelect={() => onSelectAddressId(addr.id)}
                />
              </li>
            ))}
          </ul>
          {hasMoreAddresses ? (
            <button
              type="button"
              onClick={() => setShowAllModal(true)}
              className="mb-4 text-sm font-bold text-primary hover:underline"
            >
              Xem tất cả ({addresses.length} địa chỉ)
            </button>
          ) : null}
        </>
      ) : null}

      {showAllModal ? (
        <div
          className="fixed inset-0 z-[100] flex items-end justify-center sm:items-center sm:p-4 bg-black/50"
          role="dialog"
          aria-modal="true"
          aria-labelledby="shipping-addresses-all-title"
          onClick={() => setShowAllModal(false)}
        >
          <div
            className="flex h-[min(100dvh,100vh)] w-full max-h-[100dvh] flex-col rounded-t-2xl border border-slate-200 bg-white shadow-xl dark:border-slate-800 dark:bg-slate-900 sm:h-auto sm:max-h-[85vh] sm:max-w-lg sm:rounded-2xl"
            onClick={(e) => e.stopPropagation()}
          >
            <div className="flex shrink-0 items-center justify-between gap-3 border-b border-slate-200 px-4 py-4 dark:border-slate-800">
              <h3
                id="shipping-addresses-all-title"
                className="text-lg font-bold text-slate-900 dark:text-slate-100"
              >
                Chọn địa chỉ nhận hàng
              </h3>
              <button
                type="button"
                onClick={() => setShowAllModal(false)}
                className="rounded-lg p-2 text-slate-500 hover:bg-slate-100 dark:hover:bg-slate-800"
                aria-label="Đóng"
              >
                <Icon name="close" className="text-2xl" />
              </button>
            </div>
            <ul className="min-h-0 flex-1 space-y-3 overflow-y-auto p-4">
              {addresses.map((addr) => (
                <li key={addr.id}>
                  <AddressSelectCard
                    addr={addr}
                    selected={selectedAddressId === addr.id}
                    onSelect={() => {
                      onSelectAddressId(addr.id)
                      setShowAllModal(false)
                    }}
                  />
                </li>
              ))}
            </ul>
          </div>
        </div>
      ) : null}

      {showAddForm ? (
        <form
          onSubmit={handleSubmitNew}
          className="rounded-xl border border-dashed border-primary/40 bg-slate-50 dark:bg-slate-800/50 p-4 space-y-4"
        >
          <p className="text-sm font-bold text-slate-800 dark:text-slate-200">
            Địa chỉ mới
          </p>
          {formError ? (
            <p className="text-sm text-red-600 dark:text-red-400" role="alert">
              {formError}
            </p>
          ) : null}
          <div>
            <label className="block text-sm font-semibold mb-1.5 text-slate-700 dark:text-slate-300">
              Tên người nhận / nhãn địa chỉ *
            </label>
            <input
              type="text"
              value={receiverName}
              onChange={(e) => setReceiverName(e.target.value)}
              className="w-full rounded-lg border border-slate-200 dark:border-slate-700 dark:bg-slate-800 focus:border-primary focus:ring-2 focus:ring-primary/20 p-3 text-slate-900 dark:text-slate-100"
              placeholder="Ví dụ: Nhà riêng, Văn phòng…"
              disabled={submitting}
            />
          </div>
          <div>
            <label className="block text-sm font-semibold mb-1.5 text-slate-700 dark:text-slate-300">
              Số điện thoại *
            </label>
            <input
              type="tel"
              value={receiverPhone}
              onChange={(e) => setReceiverPhone(e.target.value)}
              className="w-full rounded-lg border border-slate-200 dark:border-slate-700 dark:bg-slate-800 focus:border-primary focus:ring-2 focus:ring-primary/20 p-3 text-slate-900 dark:text-slate-100"
              placeholder="0xxx xxx xxx"
              disabled={submitting}
            />
          </div>
          <div>
            <label className="block text-sm font-semibold mb-1.5 text-slate-700 dark:text-slate-300">
              Địa chỉ *
            </label>
            <AddressAutocompleteInput
              value={addressLine}
              onChange={setAddressLine}
              rows={3}
              className="w-full rounded-lg border border-slate-200 dark:border-slate-700 dark:bg-slate-800 focus:border-primary focus:ring-2 focus:ring-primary/20 p-3 text-slate-900 dark:text-slate-100 resize-y min-h-[5rem]"
              placeholder="Số nhà, đường, phường, quận, tỉnh/thành…"
              disabled={submitting}
            />
          </div>
          <label className="flex items-center gap-2 cursor-pointer">
            <input
              type="checkbox"
              checked={isDefault}
              onChange={(e) => setIsDefault(e.target.checked)}
              className="rounded border-slate-300 text-primary focus:ring-primary"
              disabled={submitting}
            />
            <span className="text-sm text-slate-600 dark:text-slate-400">
              Đặt làm địa chỉ mặc định
            </span>
          </label>
          <div className="flex flex-wrap gap-2">
            <button
              type="submit"
              disabled={submitting}
              className="bg-primary text-white font-bold px-4 py-2 rounded-lg hover:bg-primary/90 disabled:opacity-50"
            >
              {submitting ? 'Đang lưu…' : 'Lưu địa chỉ'}
            </button>
            <button
              type="button"
              disabled={submitting}
              onClick={() => {
                resetForm()
                setShowAddForm(false)
              }}
              className="border border-slate-300 dark:border-slate-600 font-medium px-4 py-2 rounded-lg hover:bg-slate-100 dark:hover:bg-slate-800"
            >
              Hủy
            </button>
          </div>
        </form>
      ) : null}
    </section>
  )
}
