import { NotificationBell } from "@/components/notifications/NotificationBell";
import styles from "./ShellTopBar.module.css";

/**
 * Thanh trên cùng actor shell — bell + tên user.
 * @param {{ userName?: string }} props
 */
export function ShellTopBar({ userName }) {
  return (
    <header className={styles.bar}>
      <div className={styles.spacer} />
      <div className={styles.actions}>
        <NotificationBell />
        {userName ? (
          <span className={styles.userName} title={userName}>
            {userName}
          </span>
        ) : null}
      </div>
    </header>
  );
}
