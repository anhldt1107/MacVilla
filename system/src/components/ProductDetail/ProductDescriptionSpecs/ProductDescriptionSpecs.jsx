import styles from "./ProductDescriptionSpecs.module.css";

const DEFAULT_SPECS = [
  { label: "Chất liệu", value: "Đồng thau mạ Chrome" },
  { label: "Áp lực nước", value: "0.05MPa ~ 0.75MPa" },
  { label: "Kiểu dáng", value: "Gắn tường" },
  { label: "Kích thước", value: "280 x 150 mm" },
];

const DEFAULT_PDFS = [
  { name: "Catalog_Bosch_Serie6.pdf", meta: "2.4 MB • Updated May 2024" },
  { name: "Installation_Guide_TH006.pdf", meta: "1.8 MB • Manual" },
];

export function ProductDescriptionSpecs({
  description = "Vòi sen nhiệt độ Bosch Serie 6 sở hữu công nghệ cảm biến nhiệt độ tiên tiến, đảm bảo nhiệt độ nước ổn định và an toàn tuyệt đối cho người sử dụng. Thiết kế hiện đại với bề mặt Chrome chống bám bẩn, dễ dàng vệ sinh và phù hợp với mọi không gian phòng tắm sang trọng.",
  specs = DEFAULT_SPECS,
  pdfs = DEFAULT_PDFS,
  onViewAll,
  onPdfClick,
}) {
  return (
    <div className={styles.card}>
      <div className={styles.sectionHeader}>
        <h3 className={styles.sectionTitle}>
          <span className={`material-symbols-outlined icon`}>description</span>
          Thông tin mô tả & Kỹ thuật
        </h3>
        <button type="button" className={styles.viewAll} onClick={onViewAll}>
          Xem tất cả
        </button>
      </div>
      <div className={styles.body}>
        <p className={styles.description}>{description}</p>
        <div className={styles.specGrid}>
          {specs.map((s) => (
            <div key={s.label} className={styles.specRow}>
              <span className={styles.specLabel}>{s.label}</span>
              <span className={styles.specValue}>{s.value}</span>
            </div>
          ))}
        </div>
        <p className={styles.pdfTitle}>Tài liệu kỹ thuật (PDF)</p>
        <div className={styles.pdfGrid}>
          {pdfs.map((pdf) => (
            <div
              key={pdf.name}
              className={styles.pdfCard}
              onClick={() => onPdfClick?.(pdf)}
              role="button"
              tabIndex={0}
            >
              <div className={styles.pdfIconWrap}>
                <span className="material-symbols-outlined">picture_as_pdf</span>
              </div>
              <div className={styles.pdfBody}>
                <p className={styles.pdfName}>{pdf.name}</p>
                <p className={styles.pdfMeta}>{pdf.meta}</p>
              </div>
              <span className={`material-symbols-outlined ${styles.pdfIcon}`}>download</span>
            </div>
          ))}
        </div>
      </div>
    </div>
  );
}
