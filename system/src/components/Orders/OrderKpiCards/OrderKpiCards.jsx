import styles from "./OrderKpiCards.module.css";

const ICON_VARIANTS = {
  blue: styles.iconWrapBlue,
  amber: styles.iconWrapAmber,
  indigo: styles.iconWrapIndigo,
  rose: styles.iconWrapRose,
};

const CHANGE_VARIANTS = {
  up: styles.changeUp,
  down: styles.changeDown,
  neutral: styles.changeNeutral,
};

const DEFAULT_ITEMS = [
  { label: "Đơn hàng hôm nay", value: "42", icon: "receipt_long", iconVariant: "blue", change: "+5%", trend: "up" },
  { label: "Đang xử lý", value: "12", icon: "pending_actions", iconVariant: "amber", change: "+2%", trend: "up" },
  { label: "Đang giao hàng", value: "18", icon: "local_shipping", iconVariant: "indigo", change: "-1%", trend: "down" },
  { label: "Đã hủy", value: "03", icon: "cancel", iconVariant: "rose", change: "0%", trend: "neutral" },
];

export function OrderKpiCards({ items = DEFAULT_ITEMS }) {
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
                {item.trend === "up" && <span className="material-symbols-outlined" style={{ fontSize: "0.875rem" }}>trending_up</span>}
                {item.trend === "down" && <span className="material-symbols-outlined" style={{ fontSize: "0.875rem" }}>trending_down</span>}
                {item.change}
              </span>
            )}
          </div>
        </div>
      ))}
    </div>
  );
}
