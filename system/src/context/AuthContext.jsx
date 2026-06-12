import { createContext, useCallback, useContext, useEffect, useMemo, useState } from "react";
import { loginRequest, AuthApiError } from "@/services/auth/loginApi";
import { fetchStaffMe, mapStaffMeToUser } from "@/services/auth/meApi";
import {
  clearAuthSession,
  isTokenExpired,
  readAuthSession,
  writeAuthSession,
} from "@/services/auth/authStorage";

const AuthContext = createContext(null);

/**
 * Phiên hợp lệ chỉ sau `GET /api/me` thành công (`dev/req.md`).
 * @param {string} token
 * @param {AbortSignal} [signal]
 */
async function verifySessionWithMe(token, signal) {
  const me = await fetchStaffMe(token, signal);
  if (me.principalKind && String(me.principalKind).toLowerCase() !== "staff") {
    throw new AuthApiError("Tài khoản không phải nhân sự nội bộ.", "INVALID_PRINCIPAL", me, 403);
  }
  if (!me.roleName) {
    throw new AuthApiError("Thiếu vai trò từ máy chủ.", "MISSING_ROLE", me, 422);
  }
  return mapStaffMeToUser(me);
}

export function AuthProvider({ children }) {
  const [user, setUser] = useState(null);
  const [accessToken, setAccessToken] = useState(/** @type {string | null} */ (null));
  const [expiresAtUtc, setExpiresAtUtc] = useState(/** @type {string | null} */ (null));
  const [ready, setReady] = useState(false);

  const applyVerifiedSession = useCallback(async (session, signal) => {
    const nextUser = await verifySessionWithMe(session.token, signal);
    writeAuthSession({
      token: session.token,
      expiresAtUtc: session.expiresAt,
      user: nextUser,
      persist: session.persist,
    });
    setAccessToken(session.token);
    setExpiresAtUtc(session.expiresAt || null);
    setUser(nextUser);
  }, []);

  const clearClientSession = useCallback(() => {
    clearAuthSession();
    setUser(null);
    setAccessToken(null);
    setExpiresAtUtc(null);
  }, []);

  useEffect(() => {
    const ac = new AbortController();
    let cancelled = false;

    async function init() {
      setReady(false);
      const session = readAuthSession();
      if (!session) {
        setUser(null);
        setAccessToken(null);
        setExpiresAtUtc(null);
        if (!cancelled) setReady(true);
        return;
      }
      if (isTokenExpired(session.expiresAt)) {
        clearAuthSession();
        setUser(null);
        setAccessToken(null);
        setExpiresAtUtc(null);
        if (!cancelled) setReady(true);
        return;
      }
      try {
        await applyVerifiedSession(session, ac.signal);
      } catch (err) {
        if (cancelled || err?.name === "AbortError") return;
        clearClientSession();
      } finally {
        if (!cancelled) setReady(true);
      }
    }

    init();
    return () => {
      cancelled = true;
      ac.abort();
    };
  }, [applyVerifiedSession, clearClientSession]);

  const logout = useCallback(() => {
    clearClientSession();
  }, [clearClientSession]);

  /**
   * Gọi lại `/api/me` (sau khi BE đổi quyền / role).
   */
  const refreshSession = useCallback(async () => {
    const session = readAuthSession();
    if (!session?.token || isTokenExpired(session.expiresAt)) {
      logout();
      return;
    }
    try {
      await applyVerifiedSession(session, undefined);
    } catch {
      logout();
    }
  }, [applyVerifiedSession, logout]);

  /**
   * @param {{ username: string; password: string; remember?: boolean }} input
   */
  const login = useCallback(
    async (input) => {
      const data = await loginRequest({
        username: input.username.trim(),
        password: input.password,
      });
      const nextUser = await verifySessionWithMe(data.accessToken, undefined);
      const persist = Boolean(input.remember);
      writeAuthSession({
        token: data.accessToken,
        expiresAtUtc: data.expiresAtUtc,
        user: nextUser,
        persist,
      });
      setAccessToken(data.accessToken);
      setExpiresAtUtc(data.expiresAtUtc || null);
      setUser(nextUser);
      return { ...data, user: nextUser };
    },
    []
  );

  const getAccessToken = useCallback(() => accessToken, [accessToken]);

  const value = useMemo(() => {
    const authenticated = Boolean(accessToken && user && !isTokenExpired(expiresAtUtc));
    return {
      user,
      accessToken,
      expiresAtUtc,
      isReady: ready,
      isAuthenticated: authenticated,
      login,
      logout,
      getAccessToken,
      /** Đồng bộ lại user/role từ `GET /api/me` */
      refreshSession,
      /** @deprecated Dùng `refreshSession` */
      rehydrate: refreshSession,
    };
  }, [user, accessToken, expiresAtUtc, ready, login, logout, getAccessToken, refreshSession]);

  return <AuthContext.Provider value={value}>{children}</AuthContext.Provider>;
}

export function useAuth() {
  const ctx = useContext(AuthContext);
  if (!ctx) {
    throw new Error("useAuth must be used within AuthProvider");
  }
  return ctx;
}
