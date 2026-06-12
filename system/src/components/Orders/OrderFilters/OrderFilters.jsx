import { useState } from "react";
import styles from "./OrderFilters.module.css";

const STATUS_OPTIONS = [
  "Tất cả trạng thái",
  "Chờ xử lý",
  "Đã xác nhận",
  "Đang giao hàng",
  "Đã hoàn thành",
  "Đã hủy",
];

const TYPE_OPTIONS = ["Tất cả loại đơn", "Bán lẻ", "Dự án"];

export function OrderFilters({ onApply, onRefresh }) {
  const [status, setStatus] = useState(STATUS_OPTIONS[0]);
  const [type, setType] = useState(TYPE_OPTIONS[0]);
  const [dateRange, setDateRange] = useState("");

  const handleApply = () => {
    onApply?.({ status, type, dateRange });
  };

  return (
    <section className={styles.section}>
      <div className={styles.row}>
        <div className={styles.field} style={{ minWidth: "160px" }}>
          <label className={styles.label}>Trạng thái</label>
          <select
            className={styles.select}
            value={status}
            onChange={(e) => setStatus(e.target.value)}
            aria-label="Trạng thái đơn hàng"
          >
            {STATUS_OPTIONS.map((opt) => (
              <option key={opt} value={opt}>
                {opt}
              </option>
            ))}
          </select>
        </div>
        <div className={styles.field} style={{ minWidth: "160px" }}>
          <label className={styles.label}>Loại đơn</label>
          <select
            className={styles.select}
            value={type}
            onChange={(e) => setType(e.target.value)}
            aria-label="Loại đơn hàng"
          >
            {TYPE_OPTIONS.map((opt) => (
              <option key={opt} value={opt}>
                {opt}
              </option>
            ))}
          </select>
        </div>
        <div className={styles.field} style={{ minWidth: "200px" }}>
          <label className={styles.label}>Khoảng thời gian</label>
          <div className={styles.dateWrap}>
            <input
              type="text"
              className={styles.dateInput}
              placeholder="01/01/2024 - 31/01/2024"
              value={dateRange}
              onChange={(e) => setDateRange(e.target.value)}
              aria-label="Khoảng thời gian"
            />
            <span className={`material-symbols-outlined ${styles.dateIcon}`}>calendar_today</span>
          </div>
        </div>
        <button type="button" className={styles.applyBtn} onClick={handleApply}>
          <span className="material-symbols-outlined">filter_alt</span>
          Áp dụng lọc
        </button>
        <button type="button" className={styles.refreshBtn} onClick={onRefresh}>
          Làm mới
        </button>
      </div>
    </section>
  );
}
