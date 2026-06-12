import { useState, useEffect, useCallback } from 'react'
import { Link } from 'react-router-dom'
import { Icon } from '../ui/Icon'
import { useAuth } from '../../contexts/AuthContext'
import {
  storeFetchAddresses,
  storeCreateAddress,
  storeUpdateAddress,
  storeDeleteAddress,
  storeSetDefaultAddress,
} from '../../api/store/storeAddressesApi'
import { ApiError } from '../../api/httpClient'
import { getApiErrorMessage } from '../../lib/errors/apiErrorMessage'
import { mapValidationErrorsToFirstMessage } from '../../lib/auth/mapValidationErrors'
import { AddressAutocompleteInput } from '../address/AddressAutocompleteInput'

/**
 * @typedef {{ id: number, receiverName: string, receiverPhone: string, addressLine: string, isDefault: boolean }} StoreAddressRow
 */

const inputClass =
  'w-full px-4 py-2.5 rounded-lg border border-slate-200 dark:border-slate-700 bg-white dark:bg-slate-900 text-sm text-slate-900 dark:text-slate-100 placeholder-slate-400 focus:ring-2 focus:ring-primary focus:border-primary'

function resetAddressForm() {
  return {
    receiverName: '',
    receiverPhone: '',
    addressLine: '',
    isDefault: false,
  }
}

/**
 * Sổ địa chỉ (B2C & B2B).
 * @param {{ variant?: 'partner' | 'account' }} props
 */
export function StoreAddressBook({ variant = 'partner' }) {
  const { accessToken } = useAuth()
  const [items, setItems] = useState(/** @type {StoreAddressRow[]} */ ([]))
  const [loading, setLoading] = useState(true)
  const [fetchError, setFetchError] = useState('')

  /** @type {null | 'create' | 'edit'} */
  const [addressDialog, setAddressDialog] = useState(null)
  const [editingRow, setEditingRow] = useState(/** @type {StoreAddressRow | null} */ (null))
  const [receiverName, setReceiverName] = useState('')
  const [receiverPhone, setReceiverPhone] = useState('')
  const [addressLine, setAddressLine] = useState('')
  const [isDefault, setIsDefault] = useState(false)
  const [addressSaving, setAddressSaving] = useState(false)
  const [createError, setCreateError] = useState('')
  const [createSuccess, setCreateSuccess] = useState('')
  const [settingDefaultId, setSettingDefaultId] = useState(/** @type {number | null} */ (null))
  const [deletingId, setDeletingId] = useState(/** @type {number | null} */ (null))
  const [fieldErrors, setFieldErrors] = useState(
    /** @type {Record<string, string>} */ ({})
  )

  const formId = `store-address-form-${variant}`
  const idPrefix = `addr-${variant}`

  const load = useCallback(
    async (options = /** @type {{ showLoading?: boolean }} */ ({})) => {
      const showLoading = options.showLoading !== false
      if (!accessToken) {
        setItems([])
        setLoading(false)
        setFetchError('')
        return
      }
      if (showLoading) setLoading(true)
      setFetchError('')
      try {
        const list = await storeFetchAddresses(accessToken)
        setItems(Array.isArray(list) ? list : [])
      } catch (err) {
        setFetchError(getApiErrorMessage(err))
        setItems([])
      } finally {
        if (showLoading) setLoading(false)
      }
    },
    [accessToken]
  )

  useEffect(() => {
    void load()
  }, [load])

  const dialogOpen = addressDialog != null

  useEffect(() => {
    if (!dialogOpen) return
    const prevOverflow = document.body.style.overflow
    document.body.style.overflow = 'hidden'
    const onKey = (e) => {
      if (e.key === 'Escape' && !addressSaving) {
        setAddressDialog(null)
        setEditingRow(null)
      }
    }
    window.addEventListener('keydown', onKey)
    return () => {
      document.body.style.overflow = prevOverflow
      window.removeEventListener('keydown', onKey)
    }
  }, [dialogOpen, addressSaving])

  useEffect(() => {
    if (!createSuccess) return
    const t = window.setTimeout(() => setCreateSuccess(''), 4500)
    return () => window.clearTimeout(t)
  }, [createSuccess])

  const openCreateModal = () => {
    const r = resetAddressForm()
    setReceiverName(r.receiverName)
    setReceiverPhone(r.receiverPhone)
    setAddressLine(r.addressLine)
    setIsDefault(r.isDefault)
    setEditingRow(null)
    setCreateError('')
    setFieldErrors({})
    setAddressDialog('create')
  }

  /** @param {StoreAddressRow} row */
  const openEditModal = (row) => {
    setEditingRow(row)
    setReceiverName(row.receiverName || '')
    setReceiverPhone(row.receiverPhone || '')
    setAddressLine(row.addressLine || '')
    setIsDefault(Boolean(row.isDefault))
    setCreateError('')
    setFieldErrors({})
    setAddressDialog('edit')
  }

  const closeAddressModal = () => {
    if (addressSaving) return
    setAddressDialog(null)
    setEditingRow(null)
  }

  const validateAddressFields = () => {
    const next = /** @type {Record<string, string>} */ ({})
    if (!receiverName.trim()) next.receiverName = 'Vui lòng nhập tên người nhận.'
    if (!receiverPhone.trim()) next.receiverPhone = 'Vui lòng nhập số điện thoại.'
    if (!addressLine.trim()) next.addressLine = 'Vui lòng nhập địa chỉ.'
    return next
  }

  const handleAddressSubmit = async (e) => {
    e.preventDefault()
    if (!accessToken || !addressDialog) return
    setCreateError('')
    setFieldErrors({})

    const next = validateAddressFields()
    if (Object.keys(next).length > 0) {
      setFieldErrors(next)
      return
    }

    const payload = {
      receiverName: receiverName.trim(),
      receiverPhone: receiverPhone.trim(),
      addressLine: addressLine.trim(),
      isDefault,
    }

    setAddressSaving(true)
    try {
      if (addressDialog === 'create') {
        await storeCreateAddress(accessToken, payload)
        setCreateSuccess('Thêm địa chỉ thành công.')
      } else if (addressDialog === 'edit' && editingRow) {
        await storeUpdateAddress(accessToken, editingRow.id, payload)
        setCreateSuccess('Cập nhật địa chỉ thành công.')
      }
      setAddressDialog(null)
      setEditingRow(null)
      const r = resetAddressForm()
      setReceiverName(r.receiverName)
      setReceiverPhone(r.receiverPhone)
      setAddressLine(r.addressLine)
      setIsDefault(r.isDefault)
      await load({ showLoading: false })
    } catch (err) {
      if (err instanceof ApiError && err.errorCode === 'VALIDATION_ERROR') {
        setFieldErrors(mapValidationErrorsToFirstMessage(err.errors))
      }
      setCreateError(getApiErrorMessage(err))
    } finally {
      setAddressSaving(false)
    }
  }

  /** @param {number} id */
  const handleSetDefault = async (id) => {
    if (!accessToken) return
    setSettingDefaultId(id)
    setFetchError('')
    try {
      await storeSetDefaultAddress(accessToken, id)
      setCreateSuccess('Đã đặt địa chỉ mặc định.')
      await load({ showLoading: false })
    } catch (err) {
      setFetchError(getApiErrorMessage(err))
    } finally {
      setSettingDefaultId(null)
    }
  }

  /** @param {StoreAddressRow} row */
  const handleDelete = async (row) => {
    if (!accessToken) return
    const ok = window.confirm(
      `Xóa địa chỉ #${row.id} (${row.receiverName || '—'})? Thao tác có thể bị từ chối nếu địa chỉ đã dùng trong đơn.`
    )
    if (!ok) return
    setDeletingId(row.id)
    setFetchError('')
    try {
      await storeDeleteAddress(accessToken, row.id)
      setCreateSuccess('Đã xóa địa chỉ.')
      await load({ showLoading: false })
    } catch (err) {
      setFetchError(getApiErrorMessage(err))
    } finally {
      setDeletingId(null)
    }
  }

  const backLink =
    variant === 'account' ? (
      <Link
        to="/account"
        className="inline-flex items-center gap-1 text-sm text-slate-500 hover:text-primary transition-colors"
      >
        <Icon name="chevron_left" className="text-lg" />
        Tài khoản của tôi
      </Link>
    ) : (
      <Link
        to="/partner/company"
        className="inline-flex items-center gap-1 text-sm text-slate-500 hover:text-primary transition-colors"
      >
        <Icon name="chevron_left" className="text-lg" />
        Thông tin doanh nghiệp
      </Link>
    )

  return (
    <>
      <div className="flex flex-wrap items-center justify-between gap-3 mb-6">
        {backLink}
        <div className="flex flex-wrap items-center gap-2">
          <button
            type="button"
            onClick={openCreateModal}
            className="inline-flex items-center gap-2 px-4 py-2 rounded-lg bg-primary text-white text-sm font-bold hover:bg-primary/90 transition-colors"
          >
            <Icon name="add" className="text-lg" />
            Thêm địa chỉ
          </button>
          <button
            type="button"
            onClick={() => void load()}
            disabled={loading}
            className="inline-flex items-center gap-2 px-4 py-2 rounded-lg border border-slate-200 dark:border-slate-700 text-sm font-semibold text-slate-700 dark:text-slate-200 hover:bg-slate-50 dark:hover:bg-slate-800 disabled:opacity-50"
          >
            <Icon name="refresh" className={`text-lg ${loading ? 'animate-spin' : ''}`} />
            Tải lại
          </button>
        </div>
      </div>

      {createSuccess ? (
        <div
          className="mb-4 rounded-lg border border-emerald-200 dark:border-emerald-900/50 bg-emerald-50 dark:bg-emerald-950/30 px-4 py-3 text-sm text-emerald-800 dark:text-emerald-200"
          role="status"
        >
          {createSuccess}
        </div>
      ) : null}

      {fetchError ? (
        <div
          className="mb-6 rounded-lg border border-red-200 dark:border-red-900/50 bg-red-50 dark:bg-red-950/30 px-4 py-3 text-sm text-red-800 dark:text-red-200"
          role="alert"
        >
          {fetchError}
        </div>
      ) : null}

      <div className="bg-white dark:bg-slate-900 rounded-xl border border-slate-200 dark:border-slate-800 overflow-hidden shadow-sm">
        <div className="px-6 py-4 border-b border-slate-200 dark:border-slate-800">
          <h3 className="font-bold text-slate-900 dark:text-slate-50">Danh sách địa chỉ</h3>
          <p className="text-xs text-slate-500 mt-1">
            {loading ? 'Đang tải…' : `${items.length} địa chỉ`}
          </p>
        </div>
        <div className="overflow-x-auto">
          {loading ? (
            <p className="text-center text-slate-500 py-12 text-sm">Đang tải danh sách…</p>
          ) : items.length === 0 ? (
            <div className="text-center py-12 px-6">
              <Icon name="location_off" className="text-4xl text-slate-400 mx-auto mb-3" />
              <p className="text-slate-600 dark:text-slate-400 text-sm font-medium">
                Chưa có địa chỉ giao hàng.
              </p>
              <p className="text-slate-500 text-xs mt-2 max-w-md mx-auto">
                Nhấn <span className="font-semibold text-slate-700 dark:text-slate-300">Thêm địa chỉ</span> hoặc thêm khi thanh toán trên cửa hàng.
              </p>
              <div className="flex flex-wrap justify-center gap-3 mt-5">
                <button
                  type="button"
                  onClick={openCreateModal}
                  className="inline-flex items-center gap-2 px-4 py-2 rounded-lg bg-primary text-white text-sm font-bold hover:bg-primary/90"
                >
                  <Icon name="add" className="text-lg" />
                  Thêm địa chỉ
                </button>
                <Link
                  to="/checkout"
                  className="inline-flex items-center gap-2 px-4 py-2 rounded-lg border border-slate-200 dark:border-slate-700 text-sm font-semibold text-slate-700 dark:text-slate-200 hover:bg-slate-50 dark:hover:bg-slate-800"
                >
                  Đến thanh toán
                </Link>
              </div>
            </div>
          ) : (
            <table className="w-full text-left border-collapse min-w-[880px]">
              <thead>
                <tr className="bg-slate-50 dark:bg-slate-800/50 border-b border-slate-200 dark:border-slate-800">
                  <th className="px-4 sm:px-6 py-3 text-xs font-bold text-slate-500 uppercase tracking-wider whitespace-nowrap">
                    ID
                  </th>
                  <th className="px-4 sm:px-6 py-3 text-xs font-bold text-slate-500 uppercase tracking-wider">
                    Người nhận
                  </th>
                  <th className="px-4 sm:px-6 py-3 text-xs font-bold text-slate-500 uppercase tracking-wider whitespace-nowrap">
                    Điện thoại
                  </th>
                  <th className="px-4 sm:px-6 py-3 text-xs font-bold text-slate-500 uppercase tracking-wider min-w-[200px]">
                    Địa chỉ
                  </th>
                  <th className="px-4 sm:px-6 py-3 text-xs font-bold text-slate-500 uppercase tracking-wider text-center whitespace-nowrap">
                    Mặc định
                  </th>
                  <th className="px-4 sm:px-6 py-3 text-xs font-bold text-slate-500 uppercase tracking-wider text-right min-w-[200px]">
                    Hành động
                  </th>
                </tr>
              </thead>
              <tbody className="divide-y divide-slate-200 dark:divide-slate-800">
                {items.map((row) => (
                  <tr
                    key={row.id}
                    className="hover:bg-slate-50 dark:hover:bg-slate-800/30 transition-colors"
                  >
                    <td className="px-4 sm:px-6 py-3.5 text-sm font-mono text-slate-500 whitespace-nowrap">
                      {row.id}
                    </td>
                    <td className="px-4 sm:px-6 py-3.5 text-sm font-semibold text-slate-900 dark:text-slate-100">
                      {row.receiverName || '—'}
                    </td>
                    <td className="px-4 sm:px-6 py-3.5 text-sm text-slate-600 dark:text-slate-400 font-mono whitespace-nowrap">
                      {row.receiverPhone || '—'}
                    </td>
                    <td className="px-4 sm:px-6 py-3.5 text-sm text-slate-700 dark:text-slate-300">
                      {row.addressLine || '—'}
                    </td>
                    <td className="px-4 sm:px-6 py-3.5 text-center">
                      {row.isDefault ? (
                        <span className="inline-flex text-[10px] font-bold uppercase tracking-wider px-2.5 py-1 rounded-full bg-primary/10 text-primary border border-primary/20">
                          Mặc định
                        </span>
                      ) : (
                        <span className="text-sm text-slate-400">—</span>
                      )}
                    </td>
                    <td className="px-4 sm:px-6 py-3.5 text-right">
                      <div className="flex flex-wrap justify-end gap-1.5">
                        {!row.isDefault ? (
                          <button
                            type="button"
                            disabled={settingDefaultId != null || deletingId != null}
                            onClick={() => void handleSetDefault(row.id)}
                            className="inline-flex items-center gap-1 px-2.5 py-1.5 rounded-lg text-xs font-bold text-primary border border-primary/30 hover:bg-primary/10 disabled:opacity-50"
                          >
                            {settingDefaultId === row.id ? (
                              <Icon name="progress_activity" className="text-sm animate-spin" />
                            ) : (
                              <Icon name="star" className="text-sm" />
                            )}
                            Đặt mặc định
                          </button>
                        ) : null}
                        <button
                          type="button"
                          disabled={addressSaving || deletingId != null}
                          onClick={() => openEditModal(row)}
                          className="inline-flex items-center gap-1 px-2.5 py-1.5 rounded-lg text-xs font-bold text-slate-700 dark:text-slate-200 border border-slate-200 dark:border-slate-600 hover:bg-slate-50 dark:hover:bg-slate-800 disabled:opacity-50"
                        >
                          <Icon name="edit" className="text-sm" />
                          Sửa
                        </button>
                        <button
                          type="button"
                          disabled={deletingId != null || settingDefaultId != null}
                          onClick={() => void handleDelete(row)}
                          className="inline-flex items-center gap-1 px-2.5 py-1.5 rounded-lg text-xs font-bold text-red-700 dark:text-red-300 border border-red-200 dark:border-red-900/50 hover:bg-red-50 dark:hover:bg-red-950/30 disabled:opacity-50"
                        >
                          {deletingId === row.id ? (
                            <Icon name="progress_activity" className="text-sm animate-spin" />
                          ) : (
                            <Icon name="delete" className="text-sm" />
                          )}
                          Xóa
                        </button>
                      </div>
                    </td>
                  </tr>
                ))}
              </tbody>
            </table>
          )}
        </div>
      </div>

      {dialogOpen ? (
        <div
          className="fixed inset-0 z-[100] flex items-center justify-center p-4"
          role="presentation"
        >
          <button
            type="button"
            aria-label="Đóng"
            disabled={addressSaving}
            onClick={closeAddressModal}
            className="absolute inset-0 bg-slate-900/60 dark:bg-black/70 backdrop-blur-[2px] disabled:cursor-not-allowed"
          />
          <div
            role="dialog"
            aria-modal="true"
            aria-labelledby={`${idPrefix}-dialog-title`}
            className="relative z-[1] w-full max-w-lg rounded-xl border border-slate-200 dark:border-slate-700 bg-white dark:bg-slate-900 shadow-2xl max-h-[min(90vh,640px)] flex flex-col"
          >
            <div className="flex items-start justify-between gap-4 px-6 py-4 border-b border-slate-200 dark:border-slate-800 shrink-0">
              <div>
                <h2
                  id={`${idPrefix}-dialog-title`}
                  className="text-lg font-bold text-slate-900 dark:text-slate-50"
                >
                  {addressDialog === 'edit' ? 'Sửa địa chỉ giao hàng' : 'Thêm địa chỉ giao hàng'}
                </h2>
                <p className="text-xs text-slate-500 mt-1">
                  Nhập tên người nhận, số điện thoại và địa chỉ giao hàng.
                </p>
              </div>
              <button
                type="button"
                onClick={closeAddressModal}
                disabled={addressSaving}
                className="p-2 rounded-lg text-slate-500 hover:bg-slate-100 dark:hover:bg-slate-800 disabled:opacity-50"
                aria-label="Đóng hộp thoại"
              >
                <Icon name="close" className="text-xl" />
              </button>
            </div>

            <form
              id={formId}
              onSubmit={handleAddressSubmit}
              className="px-6 py-5 overflow-y-auto flex-1 min-h-0 space-y-4"
            >
              {createError ? (
                <div
                  className="rounded-lg border border-red-200 dark:border-red-900/50 bg-red-50 dark:bg-red-950/30 px-4 py-3 text-sm text-red-800 dark:text-red-200"
                  role="alert"
                >
                  {createError}
                </div>
              ) : null}

              <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
                <div>
                  <label
                    htmlFor={`${idPrefix}-name`}
                    className="block text-xs font-bold text-slate-500 uppercase tracking-wider mb-1.5"
                  >
                    Người nhận
                  </label>
                  <input
                    id={`${idPrefix}-name`}
                    type="text"
                    value={receiverName}
                    onChange={(e) => setReceiverName(e.target.value)}
                    className={inputClass}
                    autoComplete="name"
                    maxLength={500}
                  />
                  {fieldErrors.receiverName ? (
                    <p className="text-xs text-red-600 mt-1">{fieldErrors.receiverName}</p>
                  ) : null}
                </div>
                <div>
                  <label
                    htmlFor={`${idPrefix}-phone`}
                    className="block text-xs font-bold text-slate-500 uppercase tracking-wider mb-1.5"
                  >
                    Số điện thoại
                  </label>
                  <input
                    id={`${idPrefix}-phone`}
                    type="tel"
                    value={receiverPhone}
                    onChange={(e) => setReceiverPhone(e.target.value)}
                    className={inputClass}
                    autoComplete="tel"
                    maxLength={50}
                  />
                  {fieldErrors.receiverPhone ? (
                    <p className="text-xs text-red-600 mt-1">{fieldErrors.receiverPhone}</p>
                  ) : null}
                </div>
              </div>

              <div className="relative z-20 overflow-visible">
                <label
                  htmlFor={`${idPrefix}-line`}
                  className="block text-xs font-bold text-slate-500 uppercase tracking-wider mb-1.5"
                >
                  Địa chỉ
                </label>
                <AddressAutocompleteInput
                  id={`${idPrefix}-line`}
                  rows={3}
                  value={addressLine}
                  onChange={setAddressLine}
                  className={`${inputClass} resize-y min-h-[88px]`}
                  maxLength={2000}
                  disabled={addressSaving}
                />
                {fieldErrors.addressLine ? (
                  <p className="text-xs text-red-600 mt-1">{fieldErrors.addressLine}</p>
                ) : null}
              </div>

              <label className="flex items-center gap-2 cursor-pointer select-none text-sm text-slate-700 dark:text-slate-300">
                <input
                  type="checkbox"
                  checked={isDefault}
                  onChange={(e) => setIsDefault(e.target.checked)}
                  className="rounded border-slate-300 text-primary focus:ring-primary"
                />
                Đặt làm địa chỉ mặc định
              </label>
            </form>

            <div className="px-6 py-4 border-t border-slate-200 dark:border-slate-800 flex flex-wrap justify-end gap-2 shrink-0 bg-slate-50/80 dark:bg-slate-900/80">
              <button
                type="button"
                onClick={closeAddressModal}
                disabled={addressSaving}
                className="px-4 py-2.5 rounded-lg border border-slate-200 dark:border-slate-600 text-sm font-semibold text-slate-700 dark:text-slate-200 hover:bg-slate-100 dark:hover:bg-slate-800 disabled:opacity-50"
              >
                Hủy
              </button>
              <button
                type="submit"
                form={formId}
                disabled={addressSaving}
                className="px-6 py-2.5 rounded-lg bg-primary text-white text-sm font-bold hover:bg-primary/90 disabled:opacity-60"
              >
                {addressSaving ? 'Đang lưu…' : addressDialog === 'edit' ? 'Cập nhật' : 'Lưu địa chỉ'}
              </button>
            </div>
          </div>
        </div>
      ) : null}
    </>
  )
}
