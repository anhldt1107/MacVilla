import styles from "./OrderDeliveryCard.module.css";

export function OrderDeliveryCard({
  address = "Số 45, Ngõ 12, Đường Lê Lợi, Phường Bến Thành, Quận 1, TP. Hồ Chí Minh",
  showMapPlaceholder = true,
}) {
  return (
    <div className={styles.card}>
      <div className={styles.header}>
        <span className={`material-symbols-outlined ${styles.icon}`}>location_on</span>
        <h3 className={styles.title}>Địa chỉ giao hàng</h3>
      </div>
      <div className={styles.addressBox}>
        <p className={styles.addressText}>{address}</p>
      </div>
      {showMapPlaceholder && (
        <div className={styles.mapPlaceholder} aria-hidden>
          <span className="material-symbols-outlined">map</span>
        </div>
      )}
    </div>
  );
}
