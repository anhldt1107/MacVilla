import styles from "./OrderPaymentDebtCard.module.css";

export function OrderPaymentDebtCard({
  subtotal = "1,960,000,000đ",
  discountLabel = "Tổng chiết khấu dự án (-15%):",
  discountValue = "-294,000,000đ",
  vatLabel = "Thuế VAT (10%):",
  vatValue = "166,600,000đ",
  total = "1,832,600,000đ",
  paidLabel = "Đã thanh toán (Tạm ứng):",
  paidValue = "500,000,000đ",
  debtLabel = "Công nợ còn lại:",
  debtValue = "1,332,600,000đ",
  progressPercent = 27,
}) {
  return (
    <div className={styles.card}>
      <h3 className={styles.title}>Thông tin thanh toán & Công nợ</h3>
      <div className={styles.grid}>
        <div className={styles.breakdown}>
          <div className={styles.row}>
            <span className={styles.rowLabel}>Tổng tiền hàng (gốc):</span>
            <span className={styles.rowValue}>{subtotal}</span>
          </div>
          <div className={styles.row}>
            <span className={styles.rowLabel}>{discountLabel}</span>
            <span className={styles.rowDiscount}>{discountValue}</span>
          </div>
          <div className={styles.row}>
            <span className={styles.rowLabel}>{vatLabel}</span>
            <span className={styles.rowValue}>{vatValue}</span>
          </div>
          <div className={styles.totalRow}>
            <span className={styles.totalLabel}>Tổng thanh toán:</span>
            <span className={styles.totalValue}>{total}</span>
          </div>
        </div>
        <div className={styles.debtBox}>
          <div className={styles.debtRow}>
            <span className={styles.debtLabel}>{paidLabel}</span>
            <span className={styles.debtPaid}>{paidValue}</span>
          </div>
          <div className={`${styles.debtRow} ${styles.debtRowLast}`}>
            <span className={styles.debtLabel}>{debtLabel}</span>
            <span className={styles.debtRemain}>{debtValue}</span>
          </div>
          <div className={styles.progressTrack}>
            <div
              className={styles.progressFill}
              style={{ width: `${progressPercent}%` }}
              aria-hidden
            />
          </div>
          <p className={styles.progressLabel}>Tiến độ thanh toán: {progressPercent}%</p>
        </div>
      </div>
    </div>
  );
}
