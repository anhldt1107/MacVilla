/**
 * Header Authorization cho các request sau đăng nhập.
 * @param {string | null | undefined} accessToken
 */
export function bearerHeaders(accessToken) {
  if (!accessToken) return {};
  return { Authorization: `Bearer ${accessToken}` };
}
