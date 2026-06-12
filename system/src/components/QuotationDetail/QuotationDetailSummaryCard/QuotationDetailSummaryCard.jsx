import styles from "./QuotationDetailSummaryCard.module.css";

export function QuotationDetailSummaryCard({
  subtotal = "95.500.000đ",
  discountLabel = "Tổng chiết khấu:",
  discountValue = "-6.450.000đ",
  vatLabel = "Thuế (VAT 10%):",
  vatValue = "8.905.000đ",
  total = "97.955.000đ",
  totalWords = "(Chín mươi bảy triệu chín trăm năm mươi lăm ngàn đồng)",
}) {
  return (
    <section className={styles.card}>
      <h3 className={styles.sectionLabel}>Tổng kết báo giá</h3>
      <div className={styles.rows}>
        <div className={styles.row}>
          <span className={styles.label}>Tạm tính:</span>
          <span className={styles.value}>{subtotal}</span>
        </div>
        <div className={styles.row}>
          <span className={styles.label}>{discountLabel}</span>
          <span className={styles.value}>{discountValue}</span>
        </div>
        <div className={styles.row}>
          <span className={styles.label}>{vatLabel}</span>
          <span className={styles.value}>{vatValue}</span>
        </div>
        <div className={styles.totalBlock}>
          <span className={styles.totalLabel}>TỔNG CỘNG:</span>
          <div className={styles.totalRight}>
            <p className={styles.totalValue}>{total}</p>
            <p className={styles.totalWords}>{totalWords}</p>
          </div>
        </div>
      </div>
    </section>
  );
}
