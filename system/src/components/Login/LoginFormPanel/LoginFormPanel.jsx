import styles from "./LoginFormPanel.module.css";

/**
 * Right-side panel: contains header, form, divider, secondary actions, footer.
 */
export function LoginFormPanel({ children }) {
  return (
    <div className={styles.panel}>
      <div className={styles.inner}>{children}</div>
    </div>
  );
}
