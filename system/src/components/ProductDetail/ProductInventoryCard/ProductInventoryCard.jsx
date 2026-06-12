import styles from "./ProductInventoryCard.module.css";

const DEFAULT_WAREHOUSES = [
  { name: "Kho Hà Nội", qty: 42 },
  { name: "Kho Đà Nẵng", qty: 12 },
  { name: "Kho TP.HCM", qty: 102 },
];

export function ProductInventoryCard({
  total = 156,
  warehouses = DEFAULT_WAREHOUSES,
  incomingLabel = "Đang về (ETA 20/06)",
  incomingQty = 30,
}) {
  return (
    <div className={styles.card}>
      <div className={styles.sectionHeader}>
        <h3 className={styles.sectionTitle}>
          <span className={`material-symbols-outlined icon`}>inventory</span>
          Tồn kho chi tiết
        </h3>
        <span className={styles.totalBadge}>Tổng: {total}</span>
      </div>
      <div className={styles.body}>
        {warehouses.map((w) => (
          <div key={w.name} className={styles.row}>
            <div style={{ display: "flex", alignItems: "center" }}>
              <span className={`material-symbols-outlined ${styles.rowIcon}`}>location_on</span>
              <span className={styles.rowLabel}>{w.name}</span>
            </div>
            <span className={styles.rowValue}>{w.qty}</span>
          </div>
        ))}
        <div className={`${styles.row} ${styles.incomingRow}`}>
          <div style={{ display: "flex", alignItems: "center" }}>
            <span className={`material-symbols-outlined ${styles.rowIcon}`}>local_shipping</span>
            <span className={styles.rowLabel}>{incomingLabel}</span>
          </div>
          <span className={styles.rowValue}>{incomingQty}</span>
        </div>
      </div>
    </div>
  );
}
