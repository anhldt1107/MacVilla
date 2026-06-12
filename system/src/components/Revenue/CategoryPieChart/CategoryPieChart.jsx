import styles from "./CategoryPieChart.module.css";

const DEFAULT_ITEMS = [
  { name: "Thiết bị nhà bếp", value: "45%", color: "primary" },
  { name: "Thiết bị vệ sinh", value: "35%", color: "sky" },
  { name: "Vật tư xây dựng", value: "20%", color: "slate" },
];

const DOT_CLASS = {
  primary: styles.legendDotPrimary,
  sky: styles.legendDotSky,
  slate: styles.legendDotSlate,
};

export function CategoryPieChart({
  title = "Phân bổ theo danh mục",
  items = DEFAULT_ITEMS,
  centerLabel = "Tổng cộng",
}) {
  return (
    <div className={styles.card}>
      <h4 className={styles.title}>{title}</h4>
      <div className={styles.donutWrap}>
        <div className={styles.donut}>
          <div className={`${styles.donutSegment} ${styles.segmentPrimary}`} aria-hidden />
          <div className={`${styles.donutSegment} ${styles.segmentSky}`} aria-hidden />
          <div className={`${styles.donutSegment} ${styles.segmentSlate}`} aria-hidden />
          <div className={styles.center}>
            <p className={styles.centerValue}>100%</p>
            <p className={styles.centerLabel}>{centerLabel}</p>
          </div>
        </div>
      </div>
      <div className={styles.legendList}>
        {items.map((item) => (
          <div key={item.name} className={styles.legendItem}>
            <div className={styles.legendLeft}>
              <span className={`${styles.legendDot} ${DOT_CLASS[item.color] ?? styles.legendDotPrimary}`} />
              <span className={styles.legendName}>{item.name}</span>
            </div>
            <span className={styles.legendValue}>{item.value}</span>
          </div>
        ))}
      </div>
    </div>
  );
}
