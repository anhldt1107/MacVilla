import { useNavigate } from "react-router-dom";
import styles from "./OrderTable.module.css";

const TYPE_MAP = {
  retail: { label: "Bán lẻ", className: styles.typeRetail },
  project: { label: "Dự án", className: styles.typeProject },
};

const STATUS_MAP = {
  delivered: { label: "Đã giao hàng", className: styles.statusDelivered },
  processing: { label: "Đang xử lý", className: styles.statusProcessing },
  shipping: { label: "Đang giao", className: styles.statusShipping },
  cancelled: { label: "Đã hủy", className: styles.statusCancelled },
  confirmed: { label: "Đã xác nhận", className: styles.statusConfirmed },
};

const MOCK_ORDERS = [
  { id: "ORD-2024-001", customer: "Nguyễn Văn An", products: "Bồn cầu TOTO (2), Vòi sen Inax (1)", date: "12/05/2024", type: "retail", total: "15,450,000", status: "delivered" },
  { id: "ORD-2024-B2B-001", customer: "Cty CP Đầu tư XD Vinhomes", products: "Bồn cầu TOTO (100), Vòi sen Bosch (50)", date: "18/03/2024", type: "project", total: "1,832,600,000", status: "confirmed" },
  { id: "ORD-2024-002", customer: "Cty XD An Bình", products: "Bếp từ Bosch (10), Vòi sen Inax (25)", date: "14/05/2024", type: "project", total: "248,000,000", status: "processing" },
  { id: "ORD-2024-003", customer: "Trần Thị Hoa", products: "Bếp từ Bosch (1)", date: "15/05/2024", type: "retail", total: "18,200,000", status: "shipping" },
  { id: "ORD-2024-004", customer: "Lê Minh Tuấn", products: "Vòi sen Inax (4)", date: "15/05/2024", type: "retail", total: "4,800,000", status: "cancelled", canEdit: false },
  { id: "ORD-2024-005", customer: "Hoàng Anh Dũng", products: "Bồn cầu TOTO (1), Bếp từ Bosch (1)", date: "16/05/2024", type: "retail", total: "26,500,000", status: "confirmed" },
];

export function OrderTable({
  orders = MOCK_ORDERS,
  onView,
  onEdit,
  onPrint,
}) {
  const navigate = useNavigate();

  const handleView = (row) => {
    if (onView) {
      onView(row);
    } else {
      navigate(`/saler/orders/${row.id}`);
    }
  };

  return (
    <div className={styles.card}>
      <div className={styles.tableWrap}>
        <table className={styles.table}>
          <thead>
            <tr>
              <th className={styles.th}>Mã đơn hàng</th>
              <th className={styles.th}>Khách hàng / Sản phẩm</th>
              <th className={styles.th}>Ngày tạo</th>
              <th className={styles.th}>Loại</th>
              <th className={`${styles.th} ${styles.thRight}`}>Tổng tiền (VND)</th>
              <th className={`${styles.th} ${styles.thCenter}`}>Trạng thái</th>
              <th className={`${styles.th} ${styles.thRight}`}>Thao tác</th>
            </tr>
          </thead>
          <tbody>
            {orders.map((row) => {
              const type = TYPE_MAP[row.type] ?? TYPE_MAP.retail;
              const status = STATUS_MAP[row.status] ?? STATUS_MAP.processing;
              const canEdit = row.canEdit !== false;
              return (
                <tr key={row.id} className={styles.tr}>
                  <td className={styles.td}>
                    <span className={styles.orderCode}>{row.id}</span>
                  </td>
                  <td className={styles.td}>
                    <div className={styles.customerCell}>
                      <span className={styles.customerName}>{row.customer}</span>
                      <span className={styles.productSummary}>{row.products}</span>
                    </div>
                  </td>
                  <td className={styles.td}>
                    <span style={{ color: "var(--color-text-muted)" }}>{row.date}</span>
                  </td>
                  <td className={styles.td}>
                    <span className={`${styles.typeBadge} ${type.className}`}>{type.label}</span>
                  </td>
                  <td className={`${styles.td} ${styles.tdRight}`}>
                    <span className={styles.customerName}>{row.total}</span>
                  </td>
                  <td className={`${styles.td} ${styles.tdCenter}`}>
                    <span className={`${styles.statusBadge} ${status.className}`}>{status.label}</span>
                  </td>
                  <td className={`${styles.td} ${styles.tdRight}`}>
                    <div className={styles.actions}>
                      <button
                        type="button"
                        className={styles.actionBtn}
                        title="Xem chi tiết"
                        onClick={() => handleView(row)}
                      >
                        <span className="material-symbols-outlined">visibility</span>
                      </button>
                      <button
                        type="button"
                        className={`${styles.actionBtn} ${styles.actionBtnEdit} ${!canEdit ? styles.actionBtnDisabled : ""}`}
                        title="Chỉnh sửa"
                        onClick={() => canEdit && onEdit?.(row)}
                        disabled={!canEdit}
                      >
                        <span className="material-symbols-outlined">edit_note</span>
                      </button>
                      <button
                        type="button"
                        className={`${styles.actionBtn} ${styles.actionBtnPrint}`}
                        title="In hóa đơn"
                        onClick={() => onPrint?.(row)}
                      >
                        <span className="material-symbols-outlined">print</span>
                      </button>
                    </div>
                  </td>
                </tr>
              );
            })}
          </tbody>
        </table>
      </div>
    </div>
  );
}
