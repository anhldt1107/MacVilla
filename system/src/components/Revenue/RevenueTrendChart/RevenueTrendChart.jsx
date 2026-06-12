import styles from "./RevenueTrendChart.module.css";

const MONTHS = ["Tháng 1", "Tháng 2", "Tháng 3", "Tháng 4", "Tháng 5", "Tháng 6"];

export function RevenueTrendChart({
  title = "Xu hướng doanh thu (6 tháng qua)",
  legendLabel = "Thực tế",
}) {
  return (
    <div className={styles.card}>
      <div className={styles.header}>
        <h4 className={styles.title}>{title}</h4>
        <span className={styles.legend}>
          <span className={styles.legendDot} />
          {legendLabel}
        </span>
      </div>
      <div className={styles.chartWrap}>
        <svg viewBox="0 0 1000 300" preserveAspectRatio="none">
          <defs>
            <linearGradient id="revenueChartGradient" x1="0" x2="0" y1="0" y2="1">
              <stop offset="0%" stopColor="#004a99" stopOpacity={0.2} />
              <stop offset="100%" stopColor="#004a99" stopOpacity={0} />
            </linearGradient>
          </defs>
          <path
            d="M0,250 Q100,230 200,180 T400,120 T600,160 T800,80 T1000,60"
            fill="none"
            stroke="#004a99"
            strokeLinecap="round"
            strokeWidth="3"
          />
          <path
            d="M0,250 Q100,230 200,180 T400,120 T600,160 T800,80 T1000,60 L1000,300 L0,300 Z"
            fill="url(#revenueChartGradient)"
          />
        </svg>
      </div>
      <div className={styles.months}>
        {MONTHS.map((m) => (
          <span key={m}>{m}</span>
        ))}
      </div>
    </div>
  );
}
