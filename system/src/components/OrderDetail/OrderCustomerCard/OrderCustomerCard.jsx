import styles from "./OrderCustomerCard.module.css";

export function OrderCustomerCard({
  fullName = "Trần Thị Bích Ngọc",
  phone = "090 123 4567",
  email = "ngoc.tran@gmail.com",
}) {
  return (
    <div className={styles.card}>
      <div className={styles.header}>
        <span className={`material-symbols-outlined ${styles.icon}`}>person</span>
        <h3 className={styles.title}>Thông tin khách hàng</h3>
      </div>
      <div className={styles.list}>
        <div>
          <p className={styles.itemLabel}>Họ và tên</p>
          <p className={styles.itemValue}>{fullName}</p>
        </div>
        <div>
          <p className={styles.itemLabel}>Số điện thoại</p>
          <p className={`${styles.itemValue} ${styles.itemValueMedium}`}>{phone}</p>
        </div>
        <div>
          <p className={styles.itemLabel}>Email</p>
          <p className={`${styles.itemValue} ${styles.itemValueLink}`}>{email}</p>
        </div>
      </div>
    </div>
  );
}
