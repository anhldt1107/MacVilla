import { useState } from "react";
import styles from "./OrdersPageHeader.module.css";

export function OrdersPageHeader({
  title = "Quản lý Đơn hàng",
  subtitle = "Chào mừng quay trở lại, đây là danh sách đơn hàng của bạn.",
  searchPlaceholder = "Tìm Mã đơn hàng, Tên khách hàng...",
  onSearch,
  onCreateOrder,
}) {
  const [query, setQuery] = useState("");

  const handleChange = (e) => {
    const v = e.target.value;
    setQuery(v);
    onSearch?.(v);
  };

  return (
    <header className={styles.header}>
      <div className={styles.titleBlock}>
        <h2>{title}</h2>
        <p className={styles.subtitle}>{subtitle}</p>
      </div>
      <div className={styles.actions}>
        <div className={styles.searchWrap}>
          <span className={`material-symbols-outlined ${styles.searchIcon}`}>search</span>
          <input
            type="text"
            className={styles.searchInput}
            placeholder={searchPlaceholder}
            value={query}
            onChange={handleChange}
            aria-label="Tìm kiếm đơn hàng"
          />
        </div>
        <button type="button" className={styles.createBtn} onClick={onCreateOrder}>
          <span className="material-symbols-outlined">add</span>
          Tạo đơn mới
        </button>
      </div>
    </header>
  );
}
