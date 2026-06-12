import { Navigate, useLocation } from "react-router-dom";
import { useAuth } from "@/context/AuthContext";
import { canRoleAccessPath, getPostLoginPathForRole } from "@/config/roleRoutes.config";
import { isTokenExpired } from "@/services/auth/authStorage";

/**
 * Bảo vệ route: bắt buộc đăng nhập + kiểm tra prefix theo role (cấu hình tại roleRoutes.config.js).
 */
export function RequireAuth({ children }) {
  const { isReady, isAuthenticated, user, accessToken, expiresAtUtc, logout } = useAuth();
  const location = useLocation();

  if (!isReady) {
    return (
      <div
        style={{
          minHeight: "40vh",
          display: "flex",
          alignItems: "center",
          justifyContent: "center",
          color: "var(--color-text-muted, #64748b)",
          fontSize: "0.875rem",
        }}
      >
        Đang xác thực phiên với máy chủ…
      </div>
    );
  }

  if (!isAuthenticated || !accessToken || !user) {
    return <Navigate to="/" replace state={{ from: location.pathname }} />;
  }

  if (isTokenExpired(expiresAtUtc)) {
    logout();
    return <Navigate to="/" replace state={{ from: location.pathname, expired: true }} />;
  }

  const path = location.pathname;
  if (!canRoleAccessPath(user.roleName, path)) {
    const fallback = getPostLoginPathForRole(user.roleName);
    return <Navigate to={fallback} replace />;
  }

  return children;
}
