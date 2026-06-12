import styles from "./QuotationDetailCustomerNoteCard.module.css";

export function QuotationDetailCustomerNoteCard({
  note = '"Cần giao hàng gấp trước ngày 20/10 để kịp tiến độ nghiệm thu giai đoạn 1 của dự án. Vui lòng kiểm tra lại tồn kho mã cáp Cat6."',
}) {
  return (
    <section className={styles.card}>
      <div className={styles.header}>
        <h3 className={styles.title}>
          <span className="material-symbols-outlined">comment</span>
          Ghi chú từ khách hàng
        </h3>
      </div>
      <div className={styles.body}>
        <p className={styles.note}>{note}</p>
      </div>
    </section>
  );
}
