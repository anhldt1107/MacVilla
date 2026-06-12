import styles from "./ProductBrandCard.module.css";

export function ProductBrandCard({
  brandShort = "BOSCH",
  brandName = "Bosch Germany",
  brandLabel = "Hãng sản xuất",
  origin = "Đức",
  originFlag = "🇩🇪",
  warranty = "36 tháng",
  onSupport,
}) {
  return (
    <div className={styles.card}>
      <div className={styles.body}>
        <div className={styles.brandRow}>
          <div className={styles.brandLogo}>{brandShort}</div>
          <div>
            <p className={styles.brandLabel}>{brandLabel}</p>
            <p className={styles.brandName}>{brandName}</p>
          </div>
        </div>
        <div className={styles.grid}>
          <div className={styles.miniCard}>
            <p className={styles.miniLabel}>Xuất xứ</p>
            <div className={styles.miniValue}>
              <span>{originFlag}</span>
              <span>{origin}</span>
            </div>
          </div>
          <div className={styles.miniCard}>
            <p className={styles.miniLabel}>Bảo hành</p>
            <div className={styles.miniValue}>
              <span className="material-symbols-outlined" style={{ color: "var(--color-primary)" }}>
                verified
              </span>
              <span>{warranty}</span>
            </div>
          </div>
        </div>
        <button type="button" className={styles.supportBtn} onClick={onSupport}>
          <span className="material-symbols-outlined">contact_support</span>
          Liên hệ Support kỹ thuật
        </button>
      </div>
    </div>
  );
}
