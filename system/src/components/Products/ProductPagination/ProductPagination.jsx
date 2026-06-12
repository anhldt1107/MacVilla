import styles from "./ProductPagination.module.css";

export function ProductPagination({
  from = 1,
  to = 10,
  total = 1250,
  currentPage = 1,
  totalPages = 125,
  onPageChange,
}) {
  const handlePrev = () => {
    if (currentPage > 1) onPageChange?.(currentPage - 1);
  };
  const handleNext = () => {
    if (currentPage < totalPages) onPageChange?.(currentPage + 1);
  };

  return (
    <div className={styles.wrap}>
      <p className={styles.info}>
        Hiển thị {from} - {to} trong tổng số {total.toLocaleString()} sản phẩm
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
        <button
          type="button"
          className={`${styles.pageBtn} ${currentPage === 1 ? styles.pageBtnActive : ""}`}
          onClick={() => onPageChange?.(1)}
        >
          1
        </button>
        <button
          type="button"
          className={styles.pageBtn}
          onClick={() => onPageChange?.(2)}
        >
          2
        </button>
        <button
          type="button"
          className={styles.pageBtn}
          onClick={() => onPageChange?.(3)}
        >
          3
        </button>
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
