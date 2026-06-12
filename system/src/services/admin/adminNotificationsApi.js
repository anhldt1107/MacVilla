import { apiUrl } from "@/config/api.config";
import { bearerHeaders } from "@/services/api/http";
import { parseApiEnvelope } from "@/services/api/apiEnvelope";

/**
 * @param {unknown} data
 */
export function normalizeAdminNotificationList(data) {
  if (!data || typeof data !== "object") {
    return { items: [], totalCount: 0, page: 1, pageSize: 20 };
  }
  const d = /** @type {Record<string, unknown>} */ (data);
  const items = /** @type {object[]} */ (d.items ?? d.Items ?? []);
  const totalCount = Number(d.totalCount ?? d.TotalCount ?? 0) || 0;
  const page = Number(d.page ?? d.Page ?? 1) || 1;
  const pageSize = Number(d.pageSize ?? d.PageSize ?? 20) || 20;
  return { items, totalCount, page, pageSize };
}

/**
 * @param {unknown} row
 */
export function mapAdminNotificationItem(row) {
  const o = row && typeof row === "object" ? /** @type {Record<string, unknown>} */ (row) : {};
  return {
    id: Number(o.id ?? o.Id ?? 0),
    eventType: String(o.eventType ?? o.EventType ?? ""),
    title: String(o.title ?? o.Title ?? ""),
    body: o.body ?? o.Body ?? null,
    entityType: o.entityType ?? o.EntityType ?? null,
    entityId: o.entityId ?? o.EntityId ?? null,
    deepLinkPath: String(o.deepLinkPath ?? o.DeepLinkPath ?? ""),
    priority: String(o.priority ?? o.Priority ?? "Normal"),
    createdAt: o.createdAt ?? o.CreatedAt ?? null,
    readAt: o.readAt ?? o.ReadAt ?? null,
    isRead: Boolean(o.isRead ?? o.IsRead ?? o.readAt ?? o.ReadAt),
  };
}

/**
 * @param {string} accessToken
 * @param {{ page?: number; pageSize?: number; unreadOnly?: boolean }} [query]
 */
export async function fetchAdminNotifications(accessToken, query = {}) {
  if (!accessToken) throw new Error("Chưa có access token.");
  const q = new URLSearchParams();
  if (query.page) q.set("page", String(query.page));
  if (query.pageSize) q.set("pageSize", String(query.pageSize));
  if (query.unreadOnly) q.set("unreadOnly", "true");
  const qs = q.toString();
  const res = await fetch(apiUrl(`/api/admin/notifications${qs ? `?${qs}` : ""}`), {
    method: "GET",
    headers: { Accept: "*/*", ...bearerHeaders(accessToken) },
  });
  const data = await parseApiEnvelope(res);
  const norm = normalizeAdminNotificationList(data);
  return {
    ...norm,
    items: norm.items.map(mapAdminNotificationItem),
  };
}

/**
 * @param {string} accessToken
 */
export async function fetchAdminNotificationUnreadCount(accessToken) {
  if (!accessToken) throw new Error("Chưa có access token.");
  const res = await fetch(apiUrl("/api/admin/notifications/unread-count"), {
    method: "GET",
    headers: { Accept: "*/*", ...bearerHeaders(accessToken) },
  });
  const data = await parseApiEnvelope(res);
  const d = data && typeof data === "object" ? /** @type {Record<string, unknown>} */ (data) : {};
  return Number(d.unreadCount ?? d.UnreadCount ?? 0) || 0;
}

/**
 * @param {string} accessToken
 * @param {number} id
 */
export async function markAdminNotificationRead(accessToken, id) {
  if (!accessToken) throw new Error("Chưa có access token.");
  const res = await fetch(apiUrl(`/api/admin/notifications/${encodeURIComponent(String(id))}/read`), {
    method: "POST",
    headers: { Accept: "*/*", ...bearerHeaders(accessToken) },
  });
  await parseApiEnvelope(res);
}

/**
 * @param {string} accessToken
 */
export async function markAllAdminNotificationsRead(accessToken) {
  if (!accessToken) throw new Error("Chưa có access token.");
  const res = await fetch(apiUrl("/api/admin/notifications/read-all"), {
    method: "POST",
    headers: { Accept: "*/*", ...bearerHeaders(accessToken) },
  });
  await parseApiEnvelope(res);
}
