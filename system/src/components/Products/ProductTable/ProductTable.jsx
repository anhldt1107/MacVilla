import styles from "./ProductTable.module.css";

const STATUS_MAP = {
  in_stock: { label: "Còn hàng", className: styles.statusInStock },
  low: { label: "Sắp hết", className: styles.statusLow },
  disabled: { label: "Ngừng KD", className: styles.statusDisabled },
};

const STOCK_BAR_MAP = {
  in_stock: styles.stockBarPrimary,
  low: styles.stockBarOrange,
  disabled: styles.stockBarSlate,
};

const MOCK_PRODUCTS = [
  {
    id: 1,
    imageUrl:
      "https://lh3.googleusercontent.com/aida-public/AB6AXuATcUP49SbFwPT3c4ZSljYcZB8PsNMeSv8gQRQD7psct3k8Ikm3RwR1yfUY7IbLn2xtkyIMpd1ZkZAmXUXkNx4zk7oeQmA5ybM-DGn1CXoGs7MbV6qz49aZM7ne8Yz7AxBRyYiBNdrNK6sU0YtSUI9d5yHUrG74tsHg3SKFB0RifkYHHDIZJdhCCXdWqbc2FJ8CBMcSyLjWlmoxm8XJa_Eth6IznkutrwvFQ0U0oE-aTXcnWL5nZKwWFDQYcTKH9B-QKm4j93jS8LIy",
    name: "Vòi sen nhiệt độ Bosch",
    sku: "B-123",
    category: "Nhà bếp",
    brand: "Bosch",
    priceList: "5.500.000đ",
    priceSale: "4.800.000đ",
    stock: 85,
    stockPercent: 85,
    status: "in_stock",
  },
  {
    id: 2,
    imageUrl:
      "https://lh3.googleusercontent.com/aida-public/AB6AXuCHJookdWtLPbsPfSWettQcKhxP9Hjh0duHhNnSpgnPc1vUU9y1to0_vRh0FLvXg3I9DoizHgN_zQIUR4IfkiiyR7h-MLAmaZY23FlMOx8Ub3e4kW2KYJ_B0Lqx2DUKm4gbIN6416Cw96azmTBF8P5jijfRvR3-6HIDxq_XgJUb5H-fz0i3iKawgbWbb7qFb7oJCKN-votDkLnBR_t6U_qmC9DF-XhlvZisEMq7DOAXn6s7rLw1zNM6_6TnhxOS7QQWQf61tTm2Aeis",
    name: "Chậu đặt bàn TOTO",
    sku: "T-456",
    category: "Thiết bị vệ sinh",
    brand: "TOTO",
    priceList: "3.200.000đ",
    priceSale: "2.900.000đ",
    stock: 12,
    stockPercent: 20,
    status: "low",
  },
  {
    id: 3,
    imageUrl:
      "https://lh3.googleusercontent.com/aida-public/AB6AXuCKXdaPl0G7ZNBV1GYv3LDGAOsY3LZ9VNClS7pawGsRc9V_4CFefvJYtnA6TiXOHVOoUDc0zCY1HMZXhK5rhZRBUWTMOqSS5b58yBhqTAu9MHHNAcvNHrhBqlKnyEuhODY2mChAzvssw0_kFRyCi9l5NM087loZ9PMkusWp6vIbbGj9_49-jB7LFGe-v0uV5EBRGMCCqZBVLUAr2PSRucfM--7HMjGcJAQE90Q2vT24ZePGcbr_0aRLlqRqPbZwL_xj1s7TGpS-J0Xx",
    name: "Bồn cầu 1 khối Kohler",
    sku: "K-789",
    category: "Thiết bị vệ sinh",
    brand: "Kohler",
    priceList: "12.000.000đ",
    priceSale: "10.500.000đ",
    stock: 0,
    stockPercent: 0,
    status: "disabled",
  },
];

export function ProductTable({
  products = MOCK_PRODUCTS,
  onEdit,
  onView,
  onUpdateStock,
}) {
  return (
    <div className={styles.card}>
      <div className={styles.tableWrap}>
        <table className={styles.table}>
          <thead>
            <tr>
              <th className={styles.th}>Hình ảnh</th>
              <th className={styles.th}>Sản phẩm / SKU</th>
              <th className={styles.th}>Danh mục</th>
              <th className={styles.th}>Thương hiệu</th>
              <th className={styles.th}>Giá niêm yết</th>
              <th className={styles.th}>Giá Sale/Dự án</th>
              <th className={`${styles.th} ${styles.thCenter}`}>Tồn kho</th>
              <th className={styles.th}>Trạng thái</th>
              <th className={`${styles.th} ${styles.thRight}`}>Thao tác</th>
            </tr>
          </thead>
          <tbody>
            {products.map((row) => {
              const status = STATUS_MAP[row.status] ?? STATUS_MAP.in_stock;
              const barClass = STOCK_BAR_MAP[row.status] ?? styles.stockBarPrimary;
              return (
                <tr key={row.id} className={styles.tr}>
                  <td className={styles.td}>
                    <div className={styles.imgWrap}>
                      <img src={row.imageUrl} alt="" />
                    </div>
                  </td>
                  <td className={styles.td}>
                    <p className={styles.productName}>{row.name}</p>
                    <p className={styles.productSku}>SKU: {row.sku}</p>
                  </td>
                  <td className={styles.td}>
                    <span className={styles.categoryTag}>{row.category}</span>
                  </td>
                  <td className={styles.td}>{row.brand}</td>
                  <td className={styles.td}>
                    <span className={styles.priceList}>{row.priceList}</span>
                  </td>
                  <td className={styles.td}>
                    <span className={styles.priceSale}>{row.priceSale}</span>
                  </td>
                  <td className={`${styles.td} ${styles.tdCenter}`}>
                    <div className={styles.stockCell}>
                      <span className={styles.productName}>{row.stock}</span>
                      <div className={styles.stockBar}>
                        <div
                          className={`${styles.stockBarFill} ${barClass}`}
                          style={{ width: `${row.stockPercent}%` }}
                        />
                      </div>
                    </div>
                  </td>
                  <td className={styles.td}>
                    <span className={`${styles.statusBadge} ${status.className}`}>
                      <span className={styles.statusDot} />
                      {status.label}
                    </span>
                  </td>
                  <td className={`${styles.td} ${styles.tdRight}`}>
                    <div className={styles.actions}>
                      <button
                        type="button"
                        className={styles.actionBtn}
                        title="Sửa"
                        onClick={() => onEdit?.(row)}
                      >
                        <span className="material-symbols-outlined">edit</span>
                      </button>
                      <button
                        type="button"
                        className={styles.actionBtn}
                        title="Chi tiết"
                        onClick={() => onView?.(row)}
                      >
                        <span className="material-symbols-outlined">visibility</span>
                      </button>
                      <button
                        type="button"
                        className={styles.actionBtn}
                        title="Cập nhật tồn"
                        onClick={() => onUpdateStock?.(row)}
                      >
                        <span className="material-symbols-outlined">update</span>
                      </button>
                    </div>
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
