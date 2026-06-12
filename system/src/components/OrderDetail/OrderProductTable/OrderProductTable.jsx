import styles from "./OrderProductTable.module.css";

const MOCK_ITEMS = [
  {
    id: 1,
    name: "Vòi sen tăng áp INAX cao cấp",
    variant: "Màu Chrome sáng bóng",
    sku: "INX-VS-2024",
    imageUrl:
      "https://lh3.googleusercontent.com/aida-public/AB6AXuCHu3ZN2oGHeKARkjrPIxzstX_jXl4xHFyuBzxmH_sGZdXVVohGuqEf2-yrbfOpMN70Xs6O6cpDDONmn3I28LmlQs00-giaLmquOAfPbj8MLAHDG1kkhmMoJnrv8KlDXjGV7B-u-j-4COhVEEDcZxR91zExWhkQyNiWjVGGzst96J7lE8SOUunOcd-FJUUxgK4899YeX15h9-9D8dQ0o1FIDlB11JxgvXkfw2ZWMX_JLeCQvfKm85xghbHzBjTDqYdFf1Ju_LwbzPl0",
    unitPrice: "1.250.000đ",
    qty: 2,
    total: "2.500.000đ",
  },
  {
    id: 2,
    name: "Bồn cầu 1 khối TOTO Pearl",
    variant: "Men sứ chống bám bẩn",
    sku: "TTO-BC-091",
    imageUrl:
      "https://lh3.googleusercontent.com/aida-public/AB6AXuCmqqhBgL4xO4R3GQ1gxQ1u2n5XhaL8c12-VBkA1B2g0X7YwzTqOwl60-AcxLKX_yD724Rv2XA72fABWE8OLYthEhOwwGhaGDkMZVALVpeFuXzkXFHEJkFsDcPYOahnp7Q48CR9VLm-sW8xtTo0itWGpsQ4bvSqJg2cfSfjTU7-orJeOR7VGNwxUJOrUbChUOQ9G4Di4FNdrvonoVq-304amUEHoJKAmb8_VnsJHiHHa-Y-huyd9I0VGX9m3mYpJZPXjbA_sLnrwmis",
    unitPrice: "8.900.000đ",
    qty: 1,
    total: "8.900.000đ",
  },
];

export function OrderProductTable({ items = MOCK_ITEMS }) {
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
              <th className={`${styles.th} ${styles.thCenter}`}>Số lượng</th>
              <th className={`${styles.th} ${styles.thRight}`}>Thành tiền</th>
            </tr>
          </thead>
          <tbody>
            {items.map((row) => (
              <tr key={row.id}>
                <td className={styles.td}>
                  <div className={styles.productCell}>
                    <div className={styles.productImg}>
                      <img src={row.imageUrl} alt="" />
                    </div>
                    <div>
                      <p className={styles.productName}>{row.name}</p>
                      {row.variant && <p className={styles.productVariant}>{row.variant}</p>}
                    </div>
                  </div>
                </td>
                <td className={styles.td}>
                  <span className={styles.sku}>{row.sku}</span>
                </td>
                <td className={`${styles.td} ${styles.tdRight}`}>{row.unitPrice}</td>
                <td className={`${styles.td} ${styles.tdCenter}`}>{row.qty}</td>
                <td className={`${styles.td} ${styles.tdRight} ${styles.totalCell}`}>{row.total}</td>
              </tr>
            ))}
          </tbody>
        </table>
      </div>
    </div>
  );
}
