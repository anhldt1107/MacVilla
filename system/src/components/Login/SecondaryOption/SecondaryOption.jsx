import styles from "./SecondaryOption.module.css";

/**
 * Secondary action button (SSO, Contact IT, etc.)
 */
export function SecondaryOption({ icon, children, onClick, ...rest }) {
  return (
    <button
      type="button"
      className={styles.button}
      onClick={onClick}
      {...rest}
    >
      {icon && <span className={`material-symbols-outlined ${styles.icon}`}>{icon}</span>}
      {children}
    </button>
  );
}
