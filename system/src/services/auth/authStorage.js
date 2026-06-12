const PREFIX = "hdg_auth_";

export const AUTH_STORAGE_KEYS = {
  token: `${PREFIX}access_token`,
  expiresAt: `${PREFIX}expires_at`,
  user: `${PREFIX}user`,
  remember: `${PREFIX}remember`,
};

function getStorage(persist) {
  return persist ? window.localStorage : window.sessionStorage;
}

export function readAuthSession() {
  if (typeof window === "undefined") return null;
  const tryRead = (storage) => {
    const token = storage.getItem(AUTH_STORAGE_KEYS.token);
    if (!token) return null;
    const expiresAt = storage.getItem(AUTH_STORAGE_KEYS.expiresAt);
    const userRaw = storage.getItem(AUTH_STORAGE_KEYS.user);
    if (!userRaw) return null;
    try {
      const user = JSON.parse(userRaw);
      return { token, expiresAt, user, persist: storage === window.localStorage };
    } catch {
      return null;
    }
  };
  return tryRead(window.localStorage) || tryRead(window.sessionStorage);
}

export function writeAuthSession({ token, expiresAtUtc, user, persist }) {
  const primary = getStorage(persist);
  const secondary = getStorage(!persist);
  /** Ghi một nơi, xóa nơi kia để tránh hai phiên */
  secondary.removeItem(AUTH_STORAGE_KEYS.token);
  secondary.removeItem(AUTH_STORAGE_KEYS.expiresAt);
  secondary.removeItem(AUTH_STORAGE_KEYS.user);
  secondary.removeItem(AUTH_STORAGE_KEYS.remember);

  primary.setItem(AUTH_STORAGE_KEYS.token, token);
  primary.setItem(AUTH_STORAGE_KEYS.expiresAt, expiresAtUtc || "");
  primary.setItem(AUTH_STORAGE_KEYS.user, JSON.stringify(user));
  primary.setItem(AUTH_STORAGE_KEYS.remember, persist ? "1" : "0");
}

export function clearAuthSession() {
  if (typeof window === "undefined") return;
  for (const s of [window.localStorage, window.sessionStorage]) {
    s.removeItem(AUTH_STORAGE_KEYS.token);
    s.removeItem(AUTH_STORAGE_KEYS.expiresAt);
    s.removeItem(AUTH_STORAGE_KEYS.user);
    s.removeItem(AUTH_STORAGE_KEYS.remember);
  }
}

/**
 * @param {string | null | undefined} expiresAtUtc ISO string từ API
 */
export function isTokenExpired(expiresAtUtc) {
  if (!expiresAtUtc) return false;
  const t = new Date(expiresAtUtc).getTime();
  if (Number.isNaN(t)) return false;
  return Date.now() >= t;
}
