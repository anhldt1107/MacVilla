import styles from "./OrderProductTableB2B.module.css";

const MOCK_ITEMS = [
  {
    id: 1,
    name: "Bồn cầu thông minh TOTO",
    code: "MS889DRT8",
    sku: "TOT-WC-001",
    imageUrl:
      "https://lh3.googleusercontent.com/aida-public/AB6AXuCIqngwqZ8kqOaeuJjI2L2dRLmJFTS98ARFQUQs5Gn2uZH-rMwq_fyziqP-RGxlGOJoI1fpILLpDUpWBy4mDFsTo6OOF1JZ8lvkLtj3P1EaYDB57o1bLjSl4dePjFdtZuQ1NUHhZzlHmeqi5zluEYANgLZ-zrP_u_oTPzKvmZlCygDr_5KQXyJxr9ayWEJNWXriVI-CAWpLcokAM72XE0B7gXa033qxmxCCmmufNpkYH9lrqH4dFbmbCC-bS8_yPlYppR2AbxFIYqZw",
    unitPrice: "15,500,000đ",
    discount: "-15%",
    qty: 100,
    total: "1,317,500,000đ",
  },
  {
    id: 2,
    name: "Bộ vòi sen Bosch Luxury",
    code: "B-SHW-2023",
    sku: "BOS-SH-882",
    imageUrl:
      "https://lh3.googleusercontent.com/aida-public/AB6AXuDPe8SbfDwGLYcoc7Qanc6w01MqESsyCf9zxAS2t4yzE0Y6Yg5c_Q1D6puYcOxUm8odCtBavhxd-NJ4eOsvQw_nREnnq7l8VTpzM__uF5hchFop9zzwPQ12ljh3PPUNPvk9XvzV5IVjMKem9DuWSQaFgg1RjYjxMUKvCRr0impAvNEFqZTqjvEbXg2A76qv6sxsEiyn30Cak_CcI3uXVlPEKmkoNCVhNvyF-ZT2QAOVf65dFTHhKboqZbVxqCK6sNlGQS45KQ0ZS4VR",
    unitPrice: "8,200,000đ",
    discount: "-15%",
    qty: 50,
    total: "348,500,000đ",
  },
];

export function OrderProductTableB2B({ items = MOCK_ITEMS }) {
  return (
    <div className={styles.card}>
      <div className={styles.header}>
        <h3 className={styles.title}>Danh sách sản phẩm</h3>
      </div>
      <div className={styles.tableWrap}>
        <table className={styles.table}>
          <thead>
            <tr>
              <th className={styles.th}>Sản phẩm</th>
              <th className={styles.th}>SKU</th>
              <th className={`${styles.th} ${styles.thRight}`}>Đơn giá</th>
              <th className={`${styles.th} ${styles.thCenter}`}>Chiết khấu</th>
              <th className={`${styles.th} ${styles.thCenter}`}>SL</th>
              <th className={`${styles.th} ${styles.thRight}`}>Thành tiền</th>
            </tr>
          </thead>
          <tbody>
            {items.map((row) => (
              <tr key={row.id}>
                <td className={styles.td}>
                  <div className={styles.productCell}>
                    <div
                      className={styles.productImg}
                      style={{ backgroundImage: `url(${row.imageUrl})` }}
                    />
                    <div>
                      <p className={styles.productName}>{row.name}</p>
                      <p className={styles.productCode}>{row.code}</p>
                    </div>
                  </div>
                </td>
                <td className={styles.td}>
                  <span className={styles.sku}>{row.sku}</span>
                </td>
                <td className={`${styles.td} ${styles.tdRight}`}>{row.unitPrice}</td>
                <td className={`${styles.td} ${styles.tdCenter}`}>
                  <span className={styles.discountBadge}>{row.discount}</span>
                </td>
                <td className={`${styles.td} ${styles.tdCenter}`}>
                  <span className={styles.productName}>{row.qty}</span>
                </td>
                <td className={`${styles.td} ${styles.tdRight} ${styles.totalCell}`}>{row.total}</td>
              </tr>
            ))}
          </tbody>
        </table>
      </div>
    </div>
  );
}
