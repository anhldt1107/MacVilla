import styles from "./RevenueSummaryCard.module.css";

/**
 * Thẻ tóm tắt: label, value, % thay đổi (up/down).
 */
export function RevenueSummaryCard({ label, value, changePercent, trend = "up" }) {
  const isUp = trend === "up";
  return (
    <div className={styles.card}>
      <p className={styles.label}>{label}</p>
      <div className={styles.row}>
        <h3 className={styles.value}>{value}</h3>
        {changePercent != null && (
          <span className={`${styles.change} ${isUp ? styles.changeUp : styles.changeDown}`}>
            <span className={`material-symbols-outlined ${styles.changeIcon}`}>
              {isUp ? "trending_up" : "trending_down"}
            </span>
            {changePercent}
          </span>
        )}
      </div>
    </div>
  );
}
