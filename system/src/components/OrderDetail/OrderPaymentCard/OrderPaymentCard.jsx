import styles from "./OrderPaymentCard.module.css";

export function OrderPaymentCard({
  paymentStatus = "Đã thanh toán (Chuyển khoản)",
  transactionId = "VCB-992102344",
  subtotal = "11.400.000đ",
  shipping = "200.000đ",
  discountLabel = "Giảm giá (Voucher KH mới):",
  discountValue = "-500.000đ",
  total = "11.100.000đ",
}) {
  return (
    <div className={styles.card}>
      <h3 className={styles.title}>Thông tin thanh toán</h3>
      <div className={styles.grid}>
        <div className={styles.statusBox}>
          <div className={styles.statusRow}>
            <span className={`material-symbols-outlined ${styles.statusIcon}`}>payments</span>
            <span className={styles.statusLabel}>Trạng thái thanh toán</span>
          </div>
          <p className={styles.statusValue}>{paymentStatus}</p>
          {transactionId && <p className={styles.statusMeta}>Mã giao dịch: {transactionId}</p>}
        </div>
        <div className={styles.breakdown}>
          <div className={styles.row}>
            <span className={styles.rowLabel}>Tổng tiền hàng:</span>
            <span className={styles.rowValue}>{subtotal}</span>
          </div>
          <div className={styles.row}>
            <span className={styles.rowLabel}>Phí vận chuyển:</span>
            <span className={styles.rowValue}>{shipping}</span>
          </div>
          <div className={`${styles.row} ${styles.rowDiscount}`}>
            <span>{discountLabel}</span>
            <span>{discountValue}</span>
          </div>
          <div className={styles.totalRow}>
            <span className={styles.totalLabel}>Tổng cộng:</span>
            <span className={styles.totalValue}>{total}</span>
          </div>
        </div>
      </div>
    </div>
  );
}
