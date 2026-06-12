import styles from "./ProductPriceCard.module.css";

export function ProductPriceCard({
  listPrice = "13.500.000",
  listLabel = "Giá niêm yết (VAT)",
  vipPrice = "11.475.000",
  vipLabel = "Giá Dự án / VIP",
  discountLevel = "Hạng Senior (Level 3)",
  discountLabel = "Chiết khấu tối đa (Sale)",
  discountPercent = "15%",
}) {
  return (
    <div className={styles.card}>
      <div className={styles.header}>
        <h3 className={styles.sectionTitle}>
          <span className="material-symbols-outlined">payments</span>
          Giá & Chiết khấu
        </h3>
      </div>
      <div className={styles.body}>
        <div>
          <p className={styles.priceLabel}>{listLabel}</p>
          <p className={styles.priceValue}>
            {listPrice}
            <span className={styles.priceUnit}>đ</span>
          </p>
        </div>
        <div className={styles.vipBox}>
          <p className={styles.vipLabel}>{vipLabel}</p>
          <p className={styles.vipValue}>
            {vipPrice}
            <span className={styles.priceUnit}>đ</span>
          </p>
        </div>
        <div className={styles.discountRow}>
          <div>
            <p className={styles.discountLabel}>{discountLabel}</p>
            <p className={styles.discountLevel}>{discountLevel}</p>
          </div>
          <span className={styles.discountPercent}>{discountPercent}</span>
        </div>
      </div>
    </div>
  );
}
