import styles from "./ProductStatsCards.module.css";

const ICON_VARIANTS = {
  primary: styles.iconWrapPrimary,
  orange: styles.iconWrapOrange,
  green: styles.iconWrapGreen,
};

export function ProductStatsCards({ items }) {
  const defaultItems = [
    { icon: "category", iconVariant: "primary", label: "Tổng số SKU", value: "1,250" },
    {
      icon: "warning",
      iconVariant: "orange",
      label: "Sản phẩm sắp hết hàng",
      value: "14",
      valueOrange: true,
    },
    {
      icon: "trending_up",
      iconVariant: "green",
      label: "Bán chạy nhất",
      value: "Bồn cầu TOTO MS885",
      valueTruncate: true,
    },
  ];
  const list = items ?? defaultItems;

  return (
    <div className={styles.grid}>
      {list.map((item, i) => (
        <div key={i} className={styles.card}>
          <div className={`${styles.iconWrap} ${ICON_VARIANTS[item.iconVariant] ?? styles.iconWrapPrimary}`}>
            <span className="material-symbols-outlined">{item.icon}</span>
          </div>
          <div className={styles.cardBody}>
            <p className={styles.label}>{item.label}</p>
            <p
              className={`${styles.value} ${item.valueOrange ? styles.valueOrange : ""} ${
                item.valueTruncate ? styles.valueTruncate : ""
              }`}
            >
              {item.value}
            </p>
          </div>
        </div>
      ))}
    </div>
  );
}
