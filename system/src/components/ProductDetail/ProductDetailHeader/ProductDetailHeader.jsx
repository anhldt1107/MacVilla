import { Link } from "react-router-dom";
import { useState } from "react";
import styles from "./ProductDetailHeader.module.css";

export function ProductDetailHeader({
  productName = "Vòi sen nhiệt độ Bosch Serie 6",
  productCode = "BOS-TH-006",
  sku = "88201293",
  listHref = "/saler/products",
  onEdit,
  onCreateQuote,
}) {
  const [search, setSearch] = useState("");

  return (
    <header className={styles.header}>
      <div className={styles.topRow}>
        <nav className={styles.breadcrumb} aria-label="Breadcrumb">
          <Link to={listHref}>Sản phẩm</Link>
          <span className={`material-symbols-outlined ${styles.chevron}`}>chevron_right</span>
          <Link to={listHref}>{productName}</Link>
          <span className={`material-symbols-outlined ${styles.chevron}`}>chevron_right</span>
          <span className={styles.breadcrumbCurrent}>Chi tiết</span>
        </nav>
        <div className={styles.headerActions}>
          <div className={styles.searchWrap}>
            <span className={`material-symbols-outlined ${styles.searchIcon}`}>search</span>
            <input
              type="text"
              className={styles.searchInput}
              placeholder="Tìm kiếm sản phẩm..."
              value={search}
              onChange={(e) => setSearch(e.target.value)}
              aria-label="Tìm kiếm"
            />
          </div>
          <button type="button" className={styles.notifBtn} aria-label="Thông báo">
            <span className="material-symbols-outlined">notifications</span>
          </button>
        </div>
      </div>
      <div className={styles.titleRow}>
        <div>
          <h2 className={styles.title}>{productName}</h2>
          <p className={styles.subtitle}>
            Mã sản phẩm: <code>{productCode}</code> • SKU: {sku}
          </p>
        </div>
        <div className={styles.btnRow}>
          <button type="button" className={styles.btnEdit} onClick={onEdit}>
            <span className="material-symbols-outlined">edit</span>
            Sửa sản phẩm
          </button>
          <button type="button" className={styles.btnQuote} onClick={onCreateQuote}>
            <span className="material-symbols-outlined">add_shopping_cart</span>
            Tạo báo giá nhanh
          </button>
        </div>
      </div>
    </header>
  );
}
