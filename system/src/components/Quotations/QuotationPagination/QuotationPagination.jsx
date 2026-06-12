import styles from "./QuotationPagination.module.css";

export function QuotationPagination({
  from = 1,
  to = 5,
  total = 24,
  currentPage = 1,
  totalPages = 5,
  onPageChange,
}) {
  const handlePrev = () => currentPage > 1 && onPageChange?.(currentPage - 1);
  const handleNext = () => currentPage < totalPages && onPageChange?.(currentPage + 1);

  return (
    <div className={styles.wrap}>
      <p className={styles.info}>
        Hiển thị {from} - {to} trên {total} kết quả
      </p>
      <div className={styles.nav}>
        <button
          type="button"
          className={styles.iconBtn}
          disabled={currentPage <= 1}
          onClick={handlePrev}
          aria-label="Trang trước"
        >
          <span className="material-symbols-outlined">chevron_left</span>
        </button>
        {[1, 2, 3].map((p) => (
          <button
            key={p}
            type="button"
            className={`${styles.pageBtn} ${currentPage === p ? styles.pageBtnActive : ""}`}
            onClick={() => onPageChange?.(p)}
          >
            {p}
          </button>
        ))}
        <span className={styles.ellipsis}>...</span>
        <button
          type="button"
          className={styles.pageBtn}
          onClick={() => onPageChange?.(totalPages)}
        >
          {totalPages}
        </button>
        <button
          type="button"
          className={styles.iconBtn}
          disabled={currentPage >= totalPages}
          onClick={handleNext}
          aria-label="Trang sau"
        >
          <span className="material-symbols-outlined">chevron_right</span>
        </button>
      </div>
    </div>
  );
}
