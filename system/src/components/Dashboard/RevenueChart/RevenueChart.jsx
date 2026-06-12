import { useState } from "react";
import styles from "./RevenueChart.module.css";

const MONTHS = ["Jan", "Feb", "Mar", "Apr", "May", "Jun", "Jul"];
const OPTIONS = ["2023 Performance", "2024 Forecast"];

/**
 * Chart doanh thu tháng (SVG placeholder giống template).
 */
export function RevenueChart({
  title = "Monthly Revenue Trend",
  subtitle = "Revenue performance over the last 7 months",
}) {
  const [selected, setSelected] = useState(OPTIONS[0]);

  return (
    <div className={styles.card}>
      <div className={styles.header}>
        <div>
          <h3 className={styles.title}>{title}</h3>
          <p className={styles.subtitle}>{subtitle}</p>
        </div>
        <div className={styles.legendRow} style={{ gap: "1rem" }}>
          <div className={styles.legendRow}>
            <span className={styles.legendDot} />
            <span className={styles.legendLabel}>Target</span>
          </div>
          <select
            className={styles.select}
            value={selected}
            onChange={(e) => setSelected(e.target.value)}
            aria-label="Chart period"
          >
            {OPTIONS.map((opt) => (
              <option key={opt} value={opt}>
                {opt}
              </option>
            ))}
          </select>
        </div>
      </div>
      <div className={styles.chartWrap}>
        <svg className={styles.chartSvg} viewBox="0 0 1000 200" preserveAspectRatio="none">
          <defs>
            <linearGradient id="chartGradient" x1="0" x2="0" y1="0" y2="1">
              <stop offset="0%" stopColor="#004a99" stopOpacity={0.2} />
              <stop offset="100%" stopColor="#004a99" stopOpacity={0} />
            </linearGradient>
          </defs>
          <path
            d="M0,150 Q150,140 300,100 T600,80 T1000,40 L1000,200 L0,200 Z"
            fill="url(#chartGradient)"
          />
          <path
            d="M0,150 Q150,140 300,100 T600,80 T1000,40"
            fill="none"
            stroke="#004a99"
            strokeLinecap="round"
            strokeWidth="4"
          />
          <circle cx="0" cy="150" fill="#004a99" r="6" />
          <circle cx="300" cy="100" fill="#004a99" r="6" />
          <circle cx="600" cy="80" fill="#004a99" r="6" />
          <circle cx="1000" cy="40" fill="#004a99" r="6" />
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
