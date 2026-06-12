import { Link } from "react-router-dom";
import { useState } from "react";
import styles from "./QuotationsPageHeader.module.css";

export function QuotationsPageHeader({
  title = "Quản lý báo giá",
  searchPlaceholder = "Tìm mã báo giá hoặc tên khách hàng...",
  onSearch,
  onCreateQuotation,
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
        <nav className={styles.breadcrumb} aria-label="Breadcrumb">
          <Link className={styles.breadcrumbLink} to="/saler">
            Trang chủ
          </Link>
          <span className="material-symbols-outlined" aria-hidden>chevron_right</span>
          <span className={styles.breadcrumbCurrent}>Yêu cầu báo giá</span>
        </nav>
        <h2 className={styles.title}>{title}</h2>
      </div>
      <div className={styles.actions}>
        <div className={styles.searchWrap}>
          <span className={"material-symbols-outlined " + styles.searchIcon}>search</span>
          <input
            type="text"
            className={styles.searchInput}
            placeholder={searchPlaceholder}
            value={query}
            onChange={handleChange}
            aria-label="Tìm kiếm báo giá"
          />
        </div>
        <button type="button" className={styles.createBtn} onClick={onCreateQuotation}>
          <span className="material-symbols-outlined">add</span>
          Tạo báo giá mới
        </button>
      </div>
    </header>
  );
}
