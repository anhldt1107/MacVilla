import { useState } from "react";
import styles from "./ProductsPageHeader.module.css";

export function ProductsPageHeader({
  title = "Quản lý Sản phẩm",
  searchPlaceholder = "Tìm kiếm theo tên hoặc SKU...",
  onSearch,
  onAddProduct,
}) {
  const [query, setQuery] = useState("");

  const handleSearchChange = (e) => {
    const v = e.target.value;
    setQuery(v);
    onSearch?.(v);
  };

  return (
    <header className={styles.header}>
      <div className={styles.left}>
        <h2 className={styles.title}>{title}</h2>
        <div className={styles.searchWrap}>
          <span className={`material-symbols-outlined ${styles.searchIcon}`}>search</span>
          <input
            type="text"
            className={styles.searchInput}
            placeholder={searchPlaceholder}
            value={query}
            onChange={handleSearchChange}
            aria-label="Tìm kiếm sản phẩm"
          />
        </div>
      </div>
      <div className={styles.right}>
        <button type="button" className={styles.addBtn} onClick={onAddProduct}>
          <span className="material-symbols-outlined">add</span>
          Thêm sản phẩm mới
        </button>
        <button type="button" className={styles.notifBtn} aria-label="Thông báo">
          <span className="material-symbols-outlined">notifications</span>
          <span className={styles.notifDot} aria-hidden />
        </button>
      </div>
    </header>
  );
}
