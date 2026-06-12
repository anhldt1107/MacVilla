import { useState } from "react";
import styles from "./ProductPriceHistory.module.css";

const HEIGHTS = [70, 75, 85, 80, 90, 95];
const LABELS = ["Tháng 1", "Tháng 2", "Tháng 3", "Tháng 4", "Tháng 5", "Hiện tại"];
const OPTIONS = ["6 tháng qua", "1 năm qua"];

export function ProductPriceHistory({
  periods = OPTIONS,
  barHeights = HEIGHTS,
  labels = LABELS,
  yAxisLabel = "15.000.000đ",
}) {
  const [selected, setSelected] = useState(periods[0]);

  return (
    <div className={styles.card}>
      <div className={styles.sectionHeader}>
        <h3 className={styles.sectionTitle}>
          <span className={`material-symbols-outlined icon`}>monitoring</span>
          Lịch sử biến động giá
        </h3>
        <select
          className={styles.select}
          value={selected}
          onChange={(e) => setSelected(e.target.value)}
          aria-label="Khoảng thời gian"
        >
          {periods.map((p) => (
            <option key={p} value={p}>
              {p}
            </option>
          ))}
        </select>
      </div>
      <div className={styles.body}>
        <div className={styles.chartWrap}>
          <span className={styles.yLabel}>{yAxisLabel}</span>
          <div className={styles.dashLine} aria-hidden />
          {barHeights.map((h, i) => (
            <div
              key={i}
              className={`${styles.bar} ${i === barHeights.length - 1 ? styles.barActive : ""}`}
              style={{ height: `${h}%` }}
              title={`${labels[i]}: ${h}%`}
            />
          ))}
        </div>
        <div className={styles.labels}>
          {labels.map((l) => (
            <span key={l}>{l}</span>
          ))}
        </div>
      </div>
    </div>
  );
}
