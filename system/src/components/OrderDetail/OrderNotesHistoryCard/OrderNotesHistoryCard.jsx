import styles from "./OrderNotesHistoryCard.module.css";

const DEFAULT_NOTE =
  '"Vui lòng giao hàng vào khung giờ hành chính. Sản phẩm bồn cầu cần được bọc xốp kỹ vì chuyển đi xa."';

const DEFAULT_HISTORY = [
  { title: "Đã xác nhận thanh toán", meta: "Hôm nay, 10:30 AM • Bởi Hệ thống", active: true },
  { title: "Chờ xác nhận đơn hàng", meta: "Hôm nay, 09:15 AM • Bởi Khách hàng", active: false },
  { title: "Khởi tạo đơn hàng", meta: "Hôm nay, 09:10 AM • Bởi Website", active: false },
];

export function OrderNotesHistoryCard({
  customerNote = DEFAULT_NOTE,
  history = DEFAULT_HISTORY,
}) {
  return (
    <div className={styles.card}>
      <div className={styles.header}>
        <span className={`material-symbols-outlined ${styles.icon}`}>history</span>
        <h3 className={styles.title}>Ghi chú & Lịch sử</h3>
      </div>
      <div className={styles.content}>
        <p className={styles.sectionLabel}>Ghi chú khách hàng</p>
        <div className={styles.noteBox}>{customerNote}</div>
        <p className={styles.sectionLabel}>Lịch sử đơn hàng</p>
        <div className={styles.timeline}>
          {history.map((event, i) => (
            <div key={i} className={styles.timelineItem}>
              <div className={styles.line}>
                <span
                  className={`${styles.dot} ${event.active ? "" : styles.dotMuted}`}
                  aria-hidden
                />
              </div>
              <div className={styles.body}>
                <p className={styles.eventTitle}>{event.title}</p>
                <p className={styles.eventMeta}>{event.meta}</p>
              </div>
            </div>
          ))}
        </div>
      </div>
    </div>
  );
}
