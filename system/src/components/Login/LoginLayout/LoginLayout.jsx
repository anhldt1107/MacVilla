import styles from "./LoginLayout.module.css";

/**
 * Two-column layout: branding (left) + form panel (right).
 * Stacks vertically on mobile.
 */
export function LoginLayout({ children }) {
  return <div className={styles.layout}>{children}</div>;
}
