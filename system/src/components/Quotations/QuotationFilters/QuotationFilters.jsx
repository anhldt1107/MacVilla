import { useState } from "react";
import styles from "./QuotationFilters.module.css";

const STATUS_OPTIONS = [
  "Tất cả Trạng thái",
  "Chờ xử lý",
  "Đã gửi khách",
  "Đã duyệt",
  "Hết hạn",
];

const CUSTOMER_TYPE_OPTIONS = [
  "Loại khách hàng",
  "Dự án (Project)",
  "Bán lẻ (Retail)",
];

export function QuotationFilters({ onApply, onReset }) {
  const [status, setStatus] = useState(STATUS_OPTIONS[0]);
  const [customerType, setCustomerType] = useState(CUSTOMER_TYPE_OPTIONS[0]);
  const [dateRange, setDateRange] = useState("01/01/2024 - 31/01/2024");

  const handleApply = () => {
    onApply?.({ status, customerType, dateRange });
  };

  const handleReset = () => {
    setStatus(STATUS_OPTIONS[0]);
    setCustomerType(CUSTOMER_TYPE_OPTIONS[0]);
    setDateRange("01/01/2024 - 31/01/2024");
    onReset?.();
  };

  return (
    <section className={styles.section}>
      <div className={styles.row}>
        <div className={styles.filterLabel}>
          <span className="material-symbols-outlined">filter_list</span>
          <span>Bộ lọc:</span>
        </div>
        <select
          className={styles.select}
          value={status}
          onChange={(e) => setStatus(e.target.value)}
          aria-label="Trạng thái báo giá"
        >
          {STATUS_OPTIONS.map((opt) => (
            <option key={opt} value={opt}>
              {opt}
            </option>
          ))}
        </select>
        <div className={styles.dateWrap}>
          <span className="material-symbols-outlined">calendar_today</span>
          <span className={styles.dateText}>{dateRange}</span>
        </div>
        <select
          className={styles.select}
          value={customerType}
          onChange={(e) => setCustomerType(e.target.value)}
          aria-label="Loại khách hàng"
        >
          {CUSTOMER_TYPE_OPTIONS.map((opt) => (
            <option key={opt} value={opt}>
              {opt}
            </option>
          ))}
        </select>
        <button type="button" className={styles.resetBtn} onClick={handleReset}>
          Đặt lại
        </button>
      </div>
    </section>
  );
}
