import styles from "./QuotationTable.module.css";

const MOCK_ROWS = [
  { id: 1, customer: "Phuong Nam Construction", date: "2023-11-20", status: "pending" },
  { id: 2, customer: "Gia Bao Interior", date: "2023-11-19", status: "pending" },
  { id: 3, customer: "Binh Minh Logistics", date: "2023-11-19", status: "quoted" },
];

const STATUS_MAP = {
  pending: { label: "Pending", className: styles.badgePending },
  quoted: { label: "Quoted", className: styles.badgeQuoted },
};

export function QuotationTable({
  title = "Recent Quotation Requests",
  viewAllHref = "#",
  rows = MOCK_ROWS,
  onCreateQuote,
}) {
  return (
    <div className={styles.card}>
      <div className={styles.cardHeader}>
        <h3 className={styles.cardTitle}>{title}</h3>
        <a className={styles.viewAll} href={viewAllHref}>
          View All
        </a>
      </div>
      <div className={styles.tableWrap}>
        <table className={styles.table}>
          <thead>
            <tr>
              <th className={styles.th}>Customer</th>
              <th className={styles.th}>Request Date</th>
              <th className={styles.th}>Status</th>
              <th className={styles.th} style={{ textAlign: "right" }}>
                Action
              </th>
            </tr>
          </thead>
          <tbody>
            {rows.map((row) => {
              const status = STATUS_MAP[row.status] ?? STATUS_MAP.pending;
              return (
                <tr key={row.id} className={styles.tr}>
                  <td className={`${styles.td} ${styles.tdCustomer}`}>{row.customer}</td>
                  <td className={`${styles.td} ${styles.tdMuted}`}>{row.date}</td>
                  <td className={styles.td}>
                    <span className={`${styles.badge} ${status.className}`}>{status.label}</span>
                  </td>
                  <td className={`${styles.td} ${styles.tdRight}`}>
                    {row.status === "pending" ? (
                      <button
                        type="button"
                        className={styles.btnQuote}
                        onClick={() => onCreateQuote?.(row)}
                      >
                        Create Quote
                      </button>
                    ) : (
                      <span className={`material-symbols-outlined ${styles.checkIcon}`}>
                        check_circle
                      </span>
                    )}
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
