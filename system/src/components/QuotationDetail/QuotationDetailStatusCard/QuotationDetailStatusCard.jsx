import styles from "./QuotationDetailStatusCard.module.css";

export function QuotationDetailStatusCard({
  statusLabel = "Chờ xử lý (Pending)",
  statusVariant = "pending",
  createdBy = "Hệ thống (Web Form)",
  createdAt = "10:30 - 15/10/2024",
}) {
  return (
    <section className={styles.card}>
      <h3 className={styles.sectionLabel}>Trạng thái báo giá</h3>
      <div className={styles.statusRow}>
        <span className={styles.dot} aria-hidden />
        <span className={styles.statusText}>{statusLabel}</span>
      </div>
      <div className={styles.meta}>
        <div className={styles.metaRow}>
          <span className={styles.metaLabel}>Người tạo:</span>
          <span className={styles.metaValue}>{createdBy}</span>
        </div>
        <div className={styles.metaRow}>
          <span className={styles.metaLabel}>Thời gian:</span>
          <span className={styles.metaValue}>{createdAt}</span>
        </div>
      </div>
    </section>
  );
}
