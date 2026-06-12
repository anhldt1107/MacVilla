import { useNavigate } from "react-router-dom";
import styles from "./QuotationTable.module.css";

const STATUS_MAP = {
  pending: { label: "Chờ xử lý", className: styles.statusPending },
  sent: { label: "Đã gửi khách", className: styles.statusSent },
  approved: { label: "Đã duyệt", className: styles.statusApproved },
  expired: { label: "Hết hạn", className: styles.statusExpired },
};

const MOCK_QUOTATIONS = [
  { id: "QT-2024-001", customer: "Cty Xây dựng Minh Anh", type: "Dự án", project: "Vinhomes Ocean Park", date: "12/05/2024", value: "450,000,000", status: "pending" },
  { id: "QT-2024-002", customer: "Tập đoàn Hòa Bình", type: "Dự án", project: "Empire City Thu Thiem", date: "10/05/2024", value: "1,280,000,000", status: "sent" },
  { id: "QT-2024-003", customer: "Nhà thầu Newtecons", type: "Dự án", project: "Grand Marina Saigon", date: "08/05/2024", value: "890,500,000", status: "approved" },
  { id: "QT-2024-004", customer: "Nguyễn Văn An", type: "Bán lẻ", project: null, date: "01/05/2024", value: "15,400,000", status: "expired" },
  { id: "QT-2024-005", customer: "Cty CP Đầu tư LDG", type: "Dự án", project: "LDG Sky", date: "28/04/2024", value: "320,000,000", status: "sent" },
];

export function QuotationTable({
  quotations = MOCK_QUOTATIONS,
  onView,
  onEdit,
  onDownload,
}) {
  const navigate = useNavigate();

  const handleView = (row) => {
    if (onView) onView(row);
    else navigate("/saler/quotations/" + row.id);
  };

  return (
    <div className={styles.card}>
      <div className={styles.tableWrap}>
        <table className={styles.table}>
          <thead>
            <tr>
              <th className={styles.th}>Mã báo giá</th>
              <th className={styles.th}>Khách hàng</th>
              <th className={styles.th}>Tên dự án</th>
              <th className={styles.th}>Ngày tạo</th>
              <th className={[styles.th, styles.thRight].join(" ")}>Giá trị (VND)</th>
              <th className={styles.th}>Trạng thái</th>
              <th className={[styles.th, styles.thCenter].join(" ")}>Thao tác</th>
            </tr>
          </thead>
          <tbody>
            {quotations.map((row) => {
              const status = STATUS_MAP[row.status] ?? STATUS_MAP.pending;
              return (
                <tr key={row.id} className={styles.tr}>
                  <td className={styles.td}>
                    <span className={styles.quoteCode}>{row.id}</span>
                  </td>
                  <td className={styles.td}>
                    <div className={styles.customerCell}>
                      <span className={styles.customerName}>{row.customer}</span>
                      <span className={styles.customerType}>{row.type}</span>
                    </div>
                  </td>
                  <td className={styles.td}>
                    <span className={row.project ? styles.projectName : styles.projectEmpty}>
                      {row.project ?? "—"}
                    </span>
                  </td>
                  <td className={styles.td}>
                    <span className={styles.dateText}>{row.date}</span>
                  </td>
                  <td className={[styles.td, styles.tdRight].join(" ")}>
                    <span className={styles.valueText}>{row.value}</span>
                  </td>
                  <td className={styles.td}>
                    <span className={[styles.statusBadge, status.className].join(" ")}>
                      {status.label}
                    </span>
                  </td>
                  <td className={[styles.td, styles.tdCenter].join(" ")}>
                    <div className={styles.actions}>
                      <button
                        type="button"
                        className={styles.actionBtn}
                        title="Xem"
                        onClick={() => handleView(row)}
                      >
                        <span className="material-symbols-outlined">visibility</span>
                      </button>
                      <button
                        type="button"
                        className={styles.actionBtn}
                        title="Chỉnh sửa"
                        onClick={() => onEdit?.(row)}
                      >
                        <span className="material-symbols-outlined">edit</span>
                      </button>
                      <button
                        type="button"
                        className={styles.actionBtn}
                        title="Tải xuống"
                        onClick={() => onDownload?.(row)}
                      >
                        <span className="material-symbols-outlined">download</span>
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
