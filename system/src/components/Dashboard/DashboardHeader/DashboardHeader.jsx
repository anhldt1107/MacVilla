import { useState } from "react";
import { BRAND_NAME } from "@/config/brand";
import styles from "./DashboardHeader.module.css";

const DEFAULT_PLACEHOLDER = "Tìm kiếm đơn hàng, sản phẩm...";

export function DashboardHeader({
  title = `${BRAND_NAME} · Tổng quan`,
  searchPlaceholder = DEFAULT_PLACEHOLDER,
  showSearch = true,
}) {
  const [search, setSearch] = useState("");

  return (
    <header className={styles.header}>
      <h2 className={styles.title}>{title}</h2>
      <div className={styles.actions}>
        {showSearch && (
          <div className={styles.searchWrap}>
            <span className={styles.searchIcon}>
              <span className="material-symbols-outlined">search</span>
            </span>
            <input
              type="text"
              className={styles.searchInput}
              placeholder={searchPlaceholder}
              value={search}
              onChange={(e) => setSearch(e.target.value)}
              aria-label="Search"
            />
          </div>
        )}
        <button type="button" className={`${styles.iconBtn} ${styles.notifBtn}`} aria-label="Notifications">
          <span className="material-symbols-outlined">notifications</span>
          <span className={styles.notifDot} aria-hidden />
        </button>
        <button type="button" className={styles.iconBtn} aria-label="Settings">
          <span className="material-symbols-outlined">settings</span>
        </button>
      </div>
    </header>
  );
}
