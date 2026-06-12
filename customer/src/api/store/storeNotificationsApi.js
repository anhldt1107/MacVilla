import { apiJson } from '../httpClient'

/**
 * @param {unknown} row
 */
function mapItem(row) {
  const o = row && typeof row === 'object' ? row : {}
  return {
    id: Number(o.id ?? o.Id ?? 0),
    eventType: String(o.eventType ?? o.EventType ?? ''),
    title: String(o.title ?? o.Title ?? ''),
    body: o.body ?? o.Body ?? null,
    deepLinkPath: String(o.deepLinkPath ?? o.DeepLinkPath ?? ''),
    createdAt: o.createdAt ?? o.CreatedAt ?? null,
    isRead: Boolean(o.isRead ?? o.IsRead ?? o.readAt ?? o.ReadAt),
  }
}

/**
 * @param {string} token
 * @param {{ page?: number; pageSize?: number; unreadOnly?: boolean }} [params]
 */
export async function storeFetchNotifications(token, params = {}) {
  const q = new URLSearchParams()
  q.set('page', String(params.page ?? 1))
  q.set('pageSize', String(params.pageSize ?? 20))
  if (params.unreadOnly) q.set('unreadOnly', 'true')
  const data = await apiJson(`/api/store/notifications?${q.toString()}`, {
    method: 'GET',
    token,
  }).then((r) => r.data)
  const d = data && typeof data === 'object' ? data : {}
  const items = Array.isArray(d.items ?? d.Items) ? d.items ?? d.Items : []
  return {
    items: items.map(mapItem),
    totalCount: Number(d.totalCount ?? d.TotalCount ?? 0) || 0,
  }
}

/**
 * @param {string} token
 */
export async function storeFetchNotificationUnreadCount(token) {
  const data = await apiJson('/api/store/notifications/unread-count', {
    method: 'GET',
    token,
  }).then((r) => r.data)
  const d = data && typeof data === 'object' ? data : {}
  return Number(d.unreadCount ?? d.UnreadCount ?? 0) || 0
}

/**
 * @param {string} token
 * @param {number} id
 */
export async function storeMarkNotificationRead(token, id) {
  await apiJson(`/api/store/notifications/${encodeURIComponent(String(id))}/read`, {
    method: 'POST',
    token,
  })
}
