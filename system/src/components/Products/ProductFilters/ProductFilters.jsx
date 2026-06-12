import styles from "./ProductFilters.module.css";

const DEFAULT_FILTERS = [
  { key: "category", label: "Danh mục" },
  { key: "brand", label: "Thương hiệu" },
  { key: "stock", label: "Trạng thái tồn kho" },
  { key: "price", label: "Khoảng giá" },
];

export function ProductFilters({ filters = DEFAULT_FILTERS, onFilter, onReset }) {
  return (
    <div className={styles.wrap}>
      {filters.map((f) => (
        <button
          key={f.key}
          type="button"
          className={styles.pill}
          onClick={() => onFilter?.(f.key)}
        >
          <span>{f.label}</span>
          <span className="material-symbols-outlined">expand_more</span>
        </button>
      ))}
      <button type="button" className={styles.resetBtn} onClick={onReset}>
        Đặt lại bộ lọc
      </button>
    </div>
  );
}
