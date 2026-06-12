import { useState } from "react";
import styles from "./QuotationDetailInternalNotesCard.module.css";

export function QuotationDetailInternalNotesCard({
  placeholder = "Nhập ghi chú cho quản lý hoặc bộ phận kho...",
  onSave,
}) {
  const [note, setNote] = useState("");

  const handleSave = () => {
    onSave?.(note);
    setNote("");
  };

  return (
    <section className={styles.card}>
      <h3 className={styles.sectionLabel}>Ghi chú nội bộ (Sale)</h3>
      <textarea
        className={styles.textarea}
        placeholder={placeholder}
        rows={4}
        value={note}
        onChange={(e) => setNote(e.target.value)}
        aria-label="Ghi chú nội bộ"
      />
      <button type="button" className={styles.saveBtn} onClick={handleSave}>
        Lưu ghi chú
      </button>
    </section>
  );
}
