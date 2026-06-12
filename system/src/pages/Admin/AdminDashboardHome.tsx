import { InternalDashboard } from "@/components/dashboard-internal";
import { useAuth } from "@/context/AuthContext";

export function AdminDashboardHome() {
  const { accessToken, isAuthenticated } = useAuth();

  if (!isAuthenticated || !accessToken) {
    return null;
  }

  return <InternalDashboard accessToken={accessToken} />;
}
