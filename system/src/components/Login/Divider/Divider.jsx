import styles from "./Divider.module.css";

export function Divider({ label = "Alternative options" }) {
  return (
    <div className={styles.wrap} role="separator" aria-hidden>
      <div className={styles.line} />
      <div className={styles.labelWrap}>
        <span className={styles.label}>{label}</span>
      </div>
    </div>
  );
}
