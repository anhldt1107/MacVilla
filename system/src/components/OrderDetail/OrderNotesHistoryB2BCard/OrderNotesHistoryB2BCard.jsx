import { useState } from "react";
import styles from "./OrderNotesHistoryB2BCard.module.css";

const DEFAULT_ACTIVITY = [
  { date: "HÔM NAY, 09:30 AM", text: "Sale đã yêu cầu xuất kho Đợt 2 cho Kho Đông Anh.", active: true },
  { date: "20/03/2024, 04:15 PM", text: "Giao hàng Đợt 1 thành công. Khách hàng đã ký nhận đủ 50 bộ.", active: false },
  { date: "18/03/2024, 10:00 AM", text: "Đơn hàng được khởi tạo bởi hệ thống B2B.", active: false },
];

export function OrderNotesHistoryB2BCard({
  activities = DEFAULT_ACTIVITY,
  notePlaceholder = "Nhập ghi chú cho kho hoặc kế toán...",
  onSendNote,
}) {
  const [note, setNote] = useState("");

  const handleSubmit = () => {
    onSendNote?.(note);
    setNote("");
  };

  return (
    <div className={styles.card}>
      <div className={styles.header}>
        <span className={`material-symbols-outlined ${styles.icon}`}>history</span>
        <h3 className={styles.title}>Ghi chú & Lịch sử</h3>
      </div>
      <div className={styles.timeline}>
        {activities.map((a, i) => (
          <div key={i} className={styles.item}>
            <span className={`${styles.dot} ${a.active ? "" : styles.dotMuted}`} aria-hidden />
            <p className={styles.itemDate}>{a.date}</p>
            <p className={styles.itemText}>{a.text}</p>
          </div>
        ))}
      </div>
      <div style={{ paddingTop: "1rem", borderTop: "1px solid var(--color-border)" }}>
        <label className={styles.sectionLabel}>Ghi chú nội bộ</label>
        <textarea
          className={styles.textarea}
          placeholder={notePlaceholder}
          rows={3}
          value={note}
          onChange={(e) => setNote(e.target.value)}
        />
        <button type="button" className={styles.submitBtn} onClick={handleSubmit}>
          Gửi ghi chú
        </button>
      </div>
    </div>
  );
}
