import styles from "./QuotationDetailCustomerCard.module.css";

export function QuotationDetailCustomerCard({
  customerName = "Nguyễn Văn A - Công ty Xây dựng HUD",
  phone = "0901234567",
  email = "a.nguyen@hud.vn",
  address = "123 Giải Phóng, Quận Hai Bà Trưng, Hà Nội",
  onEdit,
}) {
  return (
    <section className={styles.card}>
      <div className={styles.header}>
        <h3 className={styles.title}>
          <span className="material-symbols-outlined">person</span>
          Thông tin khách hàng
        </h3>
        <button type="button" className={styles.editBtn} onClick={onEdit}>
          Chỉnh sửa
        </button>
      </div>
      <div className={styles.grid}>
        <div className={styles.field}>
          <label className={styles.label}>Khách hàng / Công ty</label>
          <p className={styles.value}>{customerName}</p>
        </div>
        <div className={styles.field}>
          <label className={styles.label}>Số điện thoại</label>
          <p className={styles.value}>{phone}</p>
        </div>
        <div className={styles.field}>
          <label className={styles.label}>Email</label>
          <p className={styles.value}>{email}</p>
        </div>
        <div className={styles.field}>
          <label className={styles.label}>Địa chỉ</label>
          <p className={styles.value}>{address}</p>
        </div>
      </div>
    </section>
  );
}
