import { useState } from "react";
import styles from "./QuotationDetailProductTable.module.css";

const MOCK_ITEMS = [
  { id: 1, sku: "MV-C6-01", name: "Cáp mạng Cat6 UTP Macvilla", qty: "50 Cuộn", unitPrice: "1.500.000đ", discount: 5, total: "71.250.000đ" },
  { id: 2, sku: "MV-RJ45-B", name: "Hạt mạng RJ45 bọc kim", qty: "20 Hộp", unitPrice: "350.000đ", discount: 0, total: "7.000.000đ" },
  { id: 3, sku: "MV-W215", name: "Dây điện đôi 2x1.5 VCm", qty: "1000 m", unitPrice: "12.000đ", discount: 10, total: "10.800.000đ" },
];

export function QuotationDetailProductTable({ items = MOCK_ITEMS, onDiscountChange }) {
  const [discounts, setDiscounts] = useState(
    Object.fromEntries(items.map((i) => [i.id, i.discount]))
  );

  const handleDiscountChange = (id, value) => {
    const num = Math.max(0, Math.min(100, Number(value) || 0));
    setDiscounts((prev) => ({ ...prev, [id]: num }));
    onDiscountChange?.(id, num);
  };

  return (
    <section className={styles.card}>
      <div className={styles.header}>
        <h3 className={styles.title}>
          <span className="material-symbols-outlined">list_alt</span>
          Danh sách sản phẩm yêu cầu
        </h3>
        <span className={styles.badge}>{items.length} mặt hàng</span>
      </div>
      <div className={styles.tableWrap}>
        <table className={styles.table}>
          <thead>
            <tr>
              <th className={styles.th} style={{ width: "4rem" }}>Ảnh</th>
              <th className={styles.th}>SKU / Tên sản phẩm</th>
              <th className={styles.th}>Số lượng</th>
              <th className={styles.th}>Đơn giá</th>
              <th className={styles.th} style={{ width: "8rem" }}>C.khấu (%)</th>
              <th className={styles.th + " " + styles.thRight}>Thành tiền</th>
            </tr>
          </thead>
          <tbody>
            {items.map((row) => (
              <tr key={row.id} className={styles.tr}>
                <td className={styles.td}>
                  <div className={styles.imgBox} aria-hidden>
                    <span className="material-symbols-outlined">image</span>
                  </div>
                </td>
                <td className={styles.td}>
                  <p className={styles.sku}>{row.sku}</p>
                  <p className={styles.name}>{row.name}</p>
                </td>
                <td className={styles.td}><span className={styles.qty}>{row.qty}</span></td>
                <td className={styles.td}><span className={styles.unitPrice}>{row.unitPrice}</span></td>
                <td className={styles.td}>
                  <input
                    type="number"
                    className={styles.discountInput}
                    min={0}
                    max={100}
                    value={discounts[row.id] ?? row.discount}
                    onChange={(e) => handleDiscountChange(row.id, e.target.value)}
                    aria-label={"Chiết khấu % cho " + row.sku}
                  />
                </td>
                <td className={styles.td + " " + styles.tdRight}>
                  <span className={styles.total}>{row.total}</span>
                </td>
              </tr>
            ))}
          </tbody>
        </table>
      </div>
    </section>
  );
}
