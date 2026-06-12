import styles from "./OrderBusinessInfoCard.module.css";

export function OrderBusinessInfoCard({
  companyName = "CÔNG TY CỔ PHẦN ĐẦU TƯ XÂY DỰNG VINHOMES",
  taxCode = "0106001234",
  representative = "Trần Văn Quân (Project Manager)",
  phone = "090 123 4567",
  email = "quan.tv@vin.com",
}) {
  return (
    <div className={styles.card}>
      <div className={styles.header}>
        <span className={`material-symbols-outlined ${styles.icon}`}>business</span>
        <h3 className={styles.title}>Thông tin doanh nghiệp</h3>
      </div>
      <div className={styles.list}>
        <div>
          <p className={styles.itemLabel}>Tên công ty</p>
          <p className={styles.itemValue}>{companyName}</p>
        </div>
        <div>
          <p className={styles.itemLabel}>Mã số thuế</p>
          <p className={`${styles.itemValue} ${styles.itemValueMono}`}>{taxCode}</p>
        </div>
        <div>
          <p className={styles.itemLabel}>Người đại diện</p>
          <p className={styles.itemValue}>{representative}</p>
        </div>
        <div className={styles.contactRow}>
          <div className={styles.contactBox}>
            <span className={`material-symbols-outlined ${styles.icon}`}>call</span>
            <span>{phone}</span>
          </div>
          <div className={styles.contactBox}>
            <span className={`material-symbols-outlined ${styles.icon}`}>mail</span>
            <span className="truncate">{email}</span>
          </div>
        </div>
      </div>
    </div>
  );
}
