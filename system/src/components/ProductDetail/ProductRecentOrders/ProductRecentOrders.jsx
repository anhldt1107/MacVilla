import styles from "./ProductRecentOrders.module.css";

const MOCK_ORDERS = [
  { id: "ORD-7231", customer: "Công ty XD Hòa Bình", date: "12/05/2024", price: "11.850.000", status: "completed" },
  { id: "ORD-6944", customer: "VinGroup Property", date: "28/04/2024", price: "10.900.000", status: "processing" },
];

const STATUS_MAP = {
  completed: { label: "Hoàn thành", className: styles.badgeSuccess },
  processing: { label: "Đang xử lý", className: styles.badgeInfo },
};

export function ProductRecentOrders({ orders = MOCK_ORDERS }) {
  return (
    <div className={styles.card}>
      <div className={styles.sectionHeader}>
        <h3 className={styles.sectionTitle}>
          <span className={`material-symbols-outlined icon`}>history</span>
          Đơn hàng gần đây
        </h3>
      </div>
      <div className={styles.tableWrap}>
        <table className={styles.table}>
          <thead>
            <tr>
              <th className={styles.th}>Mã đơn</th>
              <th className={styles.th}>Khách hàng</th>
              <th className={styles.th}>Ngày</th>
              <th className={`${styles.th} ${styles.thRight}`}>Giá bán</th>
              <th className={styles.th}>Trạng thái</th>
            </tr>
          </thead>
          <tbody>
            {orders.map((row) => {
              const status = STATUS_MAP[row.status] ?? STATUS_MAP.processing;
              return (
                <tr key={row.id} className={styles.tr}>
                  <td className={styles.td}>
                    <span className={styles.orderCode}>{row.id}</span>
                  </td>
                  <td className={styles.td}>{row.customer}</td>
                  <td className={styles.td}>
                    <span style={{ fontSize: "0.75rem", color: "var(--color-text-muted)" }}>
                      {row.date}
                    </span>
                  </td>
                  <td className={`${styles.td} ${styles.tdRight}`}>
                    <span className={styles.orderCode}>{row.price}</span>
                  </td>
                  <td className={styles.td}>
                    <span className={`${styles.badge} ${status.className}`}>{status.label}</span>
                  </td>
                </tr>
              );
            })}
          </tbody>
        </table>
      </div>
    </div>
  );
}
