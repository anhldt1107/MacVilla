import { useState } from "react";
import styles from "./RevenuePageHeader.module.css";

const PERIODS = [
  { key: "today", label: "Hôm nay" },
  { key: "week", label: "Tuần này" },
  { key: "month", label: "Tháng này" },
  { key: "custom", label: "Tùy chỉnh", icon: "calendar_today" },
];

export function RevenuePageHeader({
  title = "Báo cáo Doanh thu",
  onPeriodChange,
  onExport,
}) {
  const [active, setActive] = useState("month");

  const handleTab = (key) => {
    setActive(key);
    onPeriodChange?.(key);
  };

  return (
    <header className={styles.header}>
      <div className={styles.inner}>
        <div className={styles.titleRow}>
          <div className={styles.iconWrap}>
            <span className="material-symbols-outlined">bar_chart</span>
          </div>
          <h2 className={styles.title}>{title}</h2>
        </div>
        <div className={styles.actionsRow}>
          <div className={styles.tabs}>
            {PERIODS.map((p) => (
              <button
                key={p.key}
                type="button"
                className={`${styles.tab} ${active === p.key ? styles.tabActive : ""}`}
                onClick={() => handleTab(p.key)}
              >
                {p.label}
                {p.icon && (
                  <span className={`material-symbols-outlined ${styles.tabIcon}`}>{p.icon}</span>
                )}
              </button>
            ))}
          </div>
          <button type="button" className={styles.exportBtn} onClick={onExport}>
            <span className="material-symbols-outlined">file_download</span>
            Xuất báo cáo
          </button>
        </div>
      </div>
    </header>
  );
}
