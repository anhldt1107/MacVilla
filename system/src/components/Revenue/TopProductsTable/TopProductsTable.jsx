import styles from "./TopProductsTable.module.css";

const MOCK_PRODUCTS = [
  {
    id: 1,
    name: "Bếp từ Inverter Macvilla 2000 Plus",
    qty: 185,
    revenue: "540.000.000đ",
    sharePercent: 22,
    status: "in_stock",
  },
  {
    id: 2,
    name: "Sen tắm đứng nóng lạnh mạ Gold",
    qty: 142,
    revenue: "320.000.000đ",
    sharePercent: 13,
    status: "in_stock",
  },
  {
    id: 3,
    name: "Chậu rửa bát Nano Black Ceramic",
    qty: 98,
    revenue: "215.000.000đ",
    sharePercent: 9,
    status: "low",
  },
];

const STATUS_MAP = {
  in_stock: { label: "Còn hàng", className: styles.badgeInStock },
  low: { label: "Sắp hết", className: styles.badgeLow },
};

export function TopProductsTable({
  title = "Top Sản phẩm bán chạy nhất",
  products = MOCK_PRODUCTS,
  onViewAll,
}) {
  return (
    <div className={styles.card}>
      <div className={styles.cardHeader}>
        <h4 className={styles.title}>{title}</h4>
        <button type="button" className={styles.viewAll} onClick={onViewAll}>
          Xem tất cả
        </button>
      </div>
      <div className={styles.tableWrap}>
        <table className={styles.table}>
          <thead>
            <tr>
              <th className={styles.th}>Tên sản phẩm</th>
              <th className={styles.th} style={{ textAlign: "center" }}>
                Số lượng bán
              </th>
              <th className={styles.th} style={{ textAlign: "right" }}>
                Doanh thu
              </th>
              <th className={styles.th} style={{ textAlign: "center" }}>
                Tỷ trọng %
              </th>
              <th className={styles.th} style={{ textAlign: "right" }}>
                Trạng thái
              </th>
            </tr>
          </thead>
          <tbody>
            {products.map((row) => {
              const status = STATUS_MAP[row.status] ?? STATUS_MAP.in_stock;
              return (
                <tr key={row.id} className={styles.tr}>
                  <td className={styles.td}>
                    <div className={styles.productCell}>
                      <div className={styles.productIcon}>
                        <span className="material-symbols-outlined">image</span>
                      </div>
                      <span className={styles.productName}>{row.name}</span>
                    </div>
                  </td>
                  <td className={`${styles.td} ${styles.tdCenter}`}>{row.qty}</td>
                  <td className={`${styles.td} ${styles.tdRight}`}>{row.revenue}</td>
                  <td className={styles.td}>
                    <div className={styles.shareBar}>
                      <div className={styles.barTrack}>
                        <div
                          className={styles.barFill}
                          style={{ width: `${row.sharePercent}%` }}
                        />
                      </div>
                      <span className={styles.shareValue}>{row.sharePercent}%</span>
                    </div>
                  </td>
                  <td className={`${styles.td} ${styles.tdRight}`}>
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
