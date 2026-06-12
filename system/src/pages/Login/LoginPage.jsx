import { useState } from "react";
import { Navigate, useNavigate, useLocation } from "react-router-dom";
import {
  LoginLayout,
  LoginBranding,
  LoginFormPanel,
  LoginHeader,
  LoginForm,
  LoginFooter,
} from "../../components/Login";
import { useAuth } from "../../context/AuthContext";
import { canRoleAccessPath, getPostLoginPathForRole } from "../../config/roleRoutes.config";
import { AuthApiError } from "../../services/auth/loginApi";
import styles from "./LoginPage.module.css";

export function LoginPage() {
  const navigate = useNavigate();
  const location = useLocation();
  const { isReady, isAuthenticated, user, login } = useAuth();
  const [error, setError] = useState("");
  const [submitting, setSubmitting] = useState(false);

  const from = location.state?.from;
  const sessionExpired = location.state?.expired === true;

  const handleSubmit = async (values) => {
    setError("");
    setSubmitting(true);
    try {
      const data = await login({
        username: values.username,
        password: values.password,
        remember: values.remember,
      });
      const role = data.user.roleName;
      let target = getPostLoginPathForRole(role);
      if (
        typeof from === "string" &&
        from.startsWith("/") &&
        from !== "/" &&
        canRoleAccessPath(role, from)
      ) {
        target = from;
      }
      navigate(target, { replace: true });
    } catch (err) {
      const message =
        err instanceof AuthApiError
          ? err.message
          : err instanceof Error
            ? err.message
            : "Đăng nhập thất bại.";
      setError(message);
    } finally {
      setSubmitting(false);
    }
  };

  if (isReady && isAuthenticated && user) {
    return <Navigate to={getPostLoginPathForRole(user.roleName)} replace />;
  }

  return (
    <div className={styles.page}>
      <LoginLayout>
        <LoginBranding />
        <LoginFormPanel>
          <LoginHeader />
          {(sessionExpired || error) && (
            <div className={styles.alerts} role="status">
              {sessionExpired && (
                <p className={styles.errorBanner}>
                  Phiên đăng nhập đã hết hạn. Vui lòng đăng nhập lại.
                </p>
              )}
              {error ? (
                <p className={styles.errorBanner} role="alert">
                  {error}
                </p>
              ) : null}
            </div>
          )}
          <LoginForm onSubmit={handleSubmit} submitting={submitting} />
          <LoginFooter />
        </LoginFormPanel>
      </LoginLayout>
    </div>
  );
}
