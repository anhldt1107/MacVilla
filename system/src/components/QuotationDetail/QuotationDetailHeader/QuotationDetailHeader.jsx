import { Link } from "react-router-dom";
import styles from "./QuotationDetailHeader.module.css";

export function QuotationDetailHeader({
  quotationId = "QT-2024-001",
  listHref = "/saler/quotations",
  onPrint,
  onSendToCustomer,
  onReject,
  onApprove,
}) {
  return (
    <header className={styles.header}>
      <div className={styles.left}>
        <Link to={listHref} className={styles.backLink} aria-label="Quay lại danh sách">
          <span className="material-symbols-outlined">arrow_back</span>
        </Link>
        <h2 className={styles.title}>Chi tiết yêu cầu báo giá #{quotationId}</h2>
      </div>
      <div className={styles.actions}>
        <button type="button" className={styles.btnOutline} onClick={onPrint}>
          <span className="material-symbols-outlined">print</span>
          In báo giá
        </button>
        <button type="button" className={styles.btnOutline} onClick={onSendToCustomer}>
          <span className="material-symbols-outlined">send</span>
          Gửi lại khách
        </button>
        <button type="button" className={styles.btnDanger} onClick={onReject}>
          <span className="material-symbols-outlined">cancel</span>
          Từ chối
        </button>
        <button type="button" className={styles.btnPrimary} onClick={onApprove}>
          <span className="material-symbols-outlined">check_circle</span>
          Duyệt báo giá
        </button>
      </div>
    </header>
  );
}
