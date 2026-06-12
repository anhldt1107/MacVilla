import { Link } from "react-router-dom";
import styles from "./OrderDetailHeader.module.css";

export function OrderDetailHeader({
  orderId = "ORD-2024-001",
  title = "Chi tiết đơn hàng khách lẻ",
  listHref = "/saler/orders",
  variant = "retail",
  printLabel,
  onPrint,
  onExport,
  onCancel,
  onConfirm,
}) {
  const isB2B = variant === "b2b";
  const printText = printLabel ?? (isB2B ? "In hóa đơn VAT" : "In hóa đơn");

  return (
    <header className={styles.header}>
      <div className={styles.row}>
        <div>
          <nav className={styles.breadcrumb} aria-label="Breadcrumb">
            <Link to={listHref}>Đơn hàng</Link>
            <span className={styles.breadcrumbSep}>/</span>
            <span className={styles.breadcrumbCurrent}>#{orderId}</span>
          </nav>
          <h2 className={styles.title}>{title}</h2>
        </div>
        <div className={styles.actions}>
          <button type="button" className={`${styles.btn} ${styles.btnOutline}`} onClick={onPrint}>
            <span className="material-symbols-outlined">print</span>
            {printText}
          </button>
          {isB2B && onExport && (
            <button type="button" className={`${styles.btn} ${styles.btnOutline}`} onClick={onExport}>
              <span className="material-symbols-outlined">outgoing_mail</span>
              Xuất phiếu kho
            </button>
          )}
          <button type="button" className={`${styles.btn} ${styles.btnDanger}`} onClick={onCancel}>
            <span className="material-symbols-outlined">cancel</span>
            {isB2B ? "Hủy đơn hàng" : "Hủy đơn"}
          </button>
          <button type="button" className={`${styles.btn} ${styles.btnPrimary}`} onClick={onConfirm}>
            <span className="material-symbols-outlined">check_circle</span>
            Xác nhận đơn hàng
          </button>
        </div>
      </div>
    </header>
  );
}
