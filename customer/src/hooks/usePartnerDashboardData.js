import { useCallback, useEffect, useState } from 'react'
import { storeB2bFetchQuotes } from '../api/store/storeB2bQuotesApi'
import { storeB2bFetchContracts } from '../api/store/storeB2bContractsApi'
import { storeB2bFetchOrders } from '../api/store/storeB2bOrdersApi'
import { storeB2bFetchDebtSummary } from '../api/store/storeB2bDebtInvoicesApi'
import { getApiErrorMessage } from '../lib/errors/apiErrorMessage'
import { quoteStatusLabel } from '../lib/quotationStatus'

const DONE_ORDER_STATUSES = new Set(['Completed', 'Cancelled'])

export function usePartnerDashboardData(accessToken) {
  const [loading, setLoading] = useState(true)
  const [error, setError] = useState('')
  const [data, setData] = useState(null)

  const load = useCallback(async () => {
    if (!accessToken) {
      setLoading(false)
      setError('')
      setData(null)
      return
    }
    setLoading(true)
    setError('')
    try {
      const [
        quotesApprovedPaged,
        quotesCounterPaged,
        contractsPendingPaged,
        debtSummary,
        ordersPageForCount,
        quotesRecentPaged,
        contractsRecentPaged,
        ordersRecentPaged,
      ] = await Promise.all([
        storeB2bFetchQuotes(accessToken, {
          status: 'Approved',
          page: 1,
          pageSize: 1,
        }),
        storeB2bFetchQuotes(accessToken, {
          status: 'CounterOffer',
          page: 1,
          pageSize: 1,
        }),
        storeB2bFetchContracts(accessToken, {
          status: 'PendingConfirmation',
          page: 1,
          pageSize: 1,
        }),
        storeB2bFetchDebtSummary(accessToken),
        storeB2bFetchOrders(accessToken, { page: 1, pageSize: 50 }),
        storeB2bFetchQuotes(accessToken, { page: 1, pageSize: 5 }),
        storeB2bFetchContracts(accessToken, { page: 1, pageSize: 5 }),
        storeB2bFetchOrders(accessToken, { page: 1, pageSize: 5 }),
      ])

      const quotesAwaitingCustomer =
        (quotesApprovedPaged.totalCount ?? 0) + (quotesCounterPaged.totalCount ?? 0)

      const contractsPendingConfirmation = contractsPendingPaged.totalCount ?? 0

      const orderItemsForCount = ordersPageForCount.items ?? []
      const openOrdersCount = orderItemsForCount.filter(
        (o) => o.orderStatus != null && !DONE_ORDER_STATUSES.has(String(o.orderStatus))
      ).length

      const openOrdersIncomplete = (ordersPageForCount.totalCount ?? 0) > 50

      const quoteItemsRecent = quotesRecentPaged.items ?? []
      const contractItemsRecent = contractsRecentPaged.items ?? []
      const orderItemsRecent = ordersRecentPaged.items ?? []

      const suggestedSalesName =
        quoteItemsRecent.map((q) => String(q.salesName || '').trim()).find(Boolean) || null

      const activityRows = []

      for (const q of quoteItemsRecent) {
        const code = q.quoteCode
        activityRows.push({
          key: `q-${code}-${q.createdAt}`,
          kind: 'quote',
          code,
          subtitle: '',
          sortAt: Date.parse(q.createdAt) || 0,
          displayDate: q.createdAt,
          statusRaw: q.status,
          statusLabel: quoteStatusLabel(q.status),
          href: `/partner/quotation/${encodeURIComponent(code)}`,
        })
      }

      for (const c of contractItemsRecent) {
        const num = c.contractNumber
        activityRows.push({
          key: `c-${num}-${c.createdAt}`,
          kind: 'contract',
          code: num,
          subtitle: '',
          sortAt: Date.parse(c.createdAt) || 0,
          displayDate: c.createdAt,
          statusRaw: c.status,
          statusLabel: null,
          href: `/partner/contracts/${encodeURIComponent(num)}`,
        })
      }

      for (const o of orderItemsRecent) {
        activityRows.push({
          key: `o-${o.orderCode}-${o.createdAt}`,
          kind: 'order',
          code: o.orderCode,
          subtitle: '',
          sortAt: Date.parse(o.createdAt) || 0,
          displayDate: o.createdAt,
          statusRaw: o.orderStatus,
          statusLabel: null,
          href: `/partner/orders/${encodeURIComponent(o.orderCode)}`,
        })
      }

      activityRows.sort((a, b) => b.sortAt - a.sortAt)
      activityRows.splice(10)

      setData({
        quotesAwaitingCustomer,
        contractsPendingConfirmation,
        debtSummary,
        openOrdersCount,
        openOrdersIncomplete,
        activityRows,
        suggestedSalesName,
      })
    } catch (err) {
      setError(getApiErrorMessage(err))
      setData(null)
    } finally {
      setLoading(false)
    }
  }, [accessToken])

  useEffect(() => {
    void load()
  }, [load])

  return { loading, error, data, reload: load }
}
