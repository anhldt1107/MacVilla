import { Outlet, useNavigate } from "react-router-dom";
import { DashboardSidebar } from "@/components/Dashboard/DashboardSidebar/DashboardSidebar";
import { useAuth } from "@/context/AuthContext";
import { AssistantFab } from "@/components/ai";
import { ShellTopBar } from "@/components/notifications/ShellTopBar";
import styles from "../SalerLayout/SalerLayout.module.css";

function avatarUrlForName(name) {
  const q = encodeURIComponent(name || "User");
  return `https://ui-avatars.com/api/?size=128&background=004a99&color=fff&bold=true&name=${q}`;
}

/**
 * @param {{
 *   navItems: import("@/config/actorNav.config").ActorNavEntry[];
 *   brandSub: string;
 *   aiRole?: "admin" | "manager" | "sales";
 * }} props
 */
export function ActorShellLayout({ navItems, brandSub, aiRole }) {
  const navigate = useNavigate();
  const { user: authUser, logout } = useAuth();

  const displayName = authUser?.fullName?.trim() || authUser?.username || "Người dùng";
  const sidebarUser = {
    name: displayName,
    role: authUser?.roleName || "—",
    avatarUrl: avatarUrlForName(displayName),
  };

  const handleLogout = () => {
    logout();
    navigate("/", { replace: true });
  };

  return (
    <div className={styles.layout}>
      <DashboardSidebar navItems={navItems} brandSub={brandSub} user={sidebarUser} onLogout={handleLogout} />
      <main className={styles.main}>
        <ShellTopBar userName={displayName} />
        <div className={styles.content}>
          <Outlet />
        </div>
      </main>
      {aiRole ? <AssistantFab role={aiRole} /> : null}
    </div>
  );
}
