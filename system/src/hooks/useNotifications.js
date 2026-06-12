import { useCallback, useEffect, useState } from "react";
import {
  fetchAdminNotificationUnreadCount,
  fetchAdminNotifications,
  markAdminNotificationRead,
  markAllAdminNotificationsRead,
} from "@/services/admin/adminNotificationsApi";

const POLL_MS = 60_000;

/**
 * @param {{ accessToken?: string | null; isAuthenticated?: boolean }} options
 */
export function useNotifications({ accessToken, isAuthenticated }) {
  const [unreadCount, setUnreadCount] = useState(0);
  const [items, setItems] = useState([]);
  const [listLoading, setListLoading] = useState(false);
  const [open, setOpen] = useState(false);

  const refreshUnread = useCallback(async () => {
    if (!isAuthenticated || !accessToken) {
      setUnreadCount(0);
      return;
    }
    try {
      const count = await fetchAdminNotificationUnreadCount(accessToken);
      setUnreadCount(count);
    } catch {
      /* giữ badge cũ */
    }
  }, [accessToken, isAuthenticated]);

  const loadList = useCallback(async () => {
    if (!isAuthenticated || !accessToken) {
      setItems([]);
      return;
    }
    setListLoading(true);
    try {
      const { items: rows } = await fetchAdminNotifications(accessToken, { page: 1, pageSize: 20 });
      setItems(rows);
    } catch {
      setItems([]);
    } finally {
      setListLoading(false);
    }
  }, [accessToken, isAuthenticated]);

  useEffect(() => {
    if (!isAuthenticated || !accessToken) {
      setUnreadCount(0);
      setItems([]);
      return;
    }
    void refreshUnread();
    const t = setInterval(() => void refreshUnread(), POLL_MS);
    return () => clearInterval(t);
  }, [accessToken, isAuthenticated, refreshUnread]);

  useEffect(() => {
    if (open && isAuthenticated && accessToken) void loadList();
  }, [open, accessToken, isAuthenticated, loadList]);

  const markRead = useCallback(
    async (id) => {
      if (!accessToken) return;
      try {
        await markAdminNotificationRead(accessToken, id);
        setItems((prev) =>
          prev.map((n) => (n.id === id ? { ...n, isRead: true, readAt: new Date().toISOString() } : n))
        );
        setUnreadCount((c) => Math.max(0, c - 1));
      } catch {
        /* ignore */
      }
    },
    [accessToken]
  );

  const markAllRead = useCallback(async () => {
    if (!accessToken) return;
    try {
      await markAllAdminNotificationsRead(accessToken);
      setItems((prev) => prev.map((n) => ({ ...n, isRead: true })));
      setUnreadCount(0);
    } catch {
      /* ignore */
    }
  }, [accessToken]);

  return {
    unreadCount,
    items,
    listLoading,
    open,
    setOpen,
    refreshUnread,
    loadList,
    markRead,
    markAllRead,
  };
}
