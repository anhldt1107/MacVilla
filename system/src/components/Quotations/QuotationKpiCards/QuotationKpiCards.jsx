import styles from "./QuotationKpiCards.module.css";

const ICON_VARIANTS = {
  blue: styles.iconWrapBlue,
  amber: styles.iconWrapAmber,
  rose: styles.iconWrapRose,
  green: styles.iconWrapGreen,
};

const CHANGE_VARIANTS = {
  up: styles.changeUp,
  down: styles.changeDown,
  neutral: styles.changeNeutral,
};

const DEFAULT_ITEMS = [
  { label: "Tổng yêu cầu hôm nay", value: "24", icon: "analytics", iconVariant: "blue", change: "10%", trend: "up" },
  { label: "Chờ phê duyệt", value: "8", icon: "pending_actions", iconVariant: "amber" },
  { label: "Sắp hết hạn", value: "5", icon: "alarm", iconVariant: "rose" },
  { label: "Tỷ lệ chuyển đổi", value: "65%", icon: "task_alt", iconVariant: "green" },
];

export function QuotationKpiCards({ items = DEFAULT_ITEMS }) {
  return (
    <div className={styles.grid}>
      {items.map((item, i) => (
        <div key={i} className={styles.card}>
          <div className={styles.top}>
            <span className={styles.label}>{item.label}</span>
            <span className={`${styles.iconWrap} ${ICON_VARIANTS[item.iconVariant] ?? styles.iconWrapBlue}`}>
              <span className="material-symbols-outlined">{item.icon}</span>
            </span>
          </div>
          <div className={styles.row}>
            <span className={styles.value}>{item.value}</span>
            {item.change != null && (
              <span className={`${styles.change} ${CHANGE_VARIANTS[item.trend] ?? styles.changeNeutral}`}>
                <span className="material-symbols-outlined" style={{ fontSize: "0.875rem" }}>trending_up</span>
                {item.change}
              </span>
            )}
          </div>
        </div>
      ))}
    </div>
  );
}
