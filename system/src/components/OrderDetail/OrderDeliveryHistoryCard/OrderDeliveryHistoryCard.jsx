import styles from "./OrderDeliveryHistoryCard.module.css";

const DEFAULT_BATCHES = [
  { id: 1, title: "Đợt 1", desc: "Đã giao 50 bộ", status: "delivered", icon: "local_shipping" },
  { id: 2, title: "Đợt 2", desc: "Chờ xử lý", status: "pending", icon: "schedule" },
];

const STATUS_CLASS = {
  delivered: styles.badgeDelivered,
  pending: styles.badgePending,
};

const ICON_WRAP_CLASS = {
  delivered: styles.iconWrapGreen,
  pending: styles.iconWrapBlue,
};

export function OrderDeliveryHistoryCard({ batches = DEFAULT_BATCHES }) {
  return (
    <div className={styles.card}>
      <div className={styles.header}>
        <h3 className={styles.title}>Lịch sử giao hàng</h3>
      </div>
      <div className={styles.body}>
        {batches.map((batch) => (
          <div key={batch.id} className={styles.item}>
            <div className={styles.itemLeft}>
              <div className={`${styles.iconWrap} ${ICON_WRAP_CLASS[batch.status] ?? styles.iconWrapBlue}`}>
                <span className="material-symbols-outlined" style={{ fontSize: "1.25rem" }}>
                  {batch.icon}
                </span>
              </div>
              <div>
                <p className={styles.itemTitle}>{batch.title}</p>
                <p className={styles.itemDesc}>{batch.desc}</p>
              </div>
            </div>
            <span className={`${styles.badge} ${STATUS_CLASS[batch.status] ?? styles.badgePending}`}>
              {batch.status === "delivered" ? "Đã giao" : "Chờ xử lý"}
            </span>
          </div>
        ))}
      </div>
    </div>
  );
}
