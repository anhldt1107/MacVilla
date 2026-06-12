import { SalerInternalDashboard } from "@/components/dashboard-internal";
import { DashboardHeader } from "../../components/Dashboard";
import styles from "./SalerDashboardPage.module.css";

export function SalerDashboardPage() {
  return (
    <div className={styles.wrap}>
      <DashboardHeader />
      <div className={styles.scrollArea}>
        <SalerInternalDashboard />
      </div>
    </div>
  );
}
