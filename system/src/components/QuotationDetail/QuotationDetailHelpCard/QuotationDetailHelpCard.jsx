import styles from "./QuotationDetailHelpCard.module.css";

export function QuotationDetailHelpCard({
  title = "Hướng dẫn nhân viên Sales",
  text = "Sau khi điều chỉnh chiết khấu dự án, vui lòng nhấn \"Duyệt báo giá\" để gửi lên cấp trên hoặc \"Gửi lại khách hàng\" nếu đã được duyệt trước đó.",
}) {
  return (
    <section className={styles.card}>
      <span className="material-symbols-outlined" aria-hidden>info</span>
      <div className={styles.content}>
        <p className={styles.title}>{title}</p>
        <p className={styles.text}>{text}</p>
      </div>
    </section>
  );
}
