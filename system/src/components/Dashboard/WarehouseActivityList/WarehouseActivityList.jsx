import styles from "./WarehouseActivityList.module.css";

const MOCK_ACTIVITIES = [
  {
    id: 1,
    type: "export",
    title: "Export Slip: PX-2345",
    time: "10 mins ago",
    desc: "Order #OD-9920 shipped to Ha Noi Distribution",
    meta: "Items: 250 sqm Wood Floor",
  },
  {
    id: 2,
    type: "import",
    title: "Import Slip: PN-1102",
    time: "2 hours ago",
    desc: "Batch #B-882 received from Thai Source Factory",
    meta: "Items: 1200 liters Industrial Adhesive",
  },
  {
    id: 3,
    type: "export",
    title: "Export Slip: PX-2344",
    time: "Yesterday",
    desc: "Order #OD-9915 shipped to Retail Store B1",
    meta: null,
  },
];

export function WarehouseActivityList({
  title = "Warehouse Activities",
  activities = MOCK_ACTIVITIES,
  onFilter,
}) {
  return (
    <div className={styles.card}>
      <div className={styles.cardHeader}>
        <h3 className={styles.cardTitle}>{title}</h3>
        <button type="button" className={styles.filterBtn} onClick={onFilter}>
          <span className="material-symbols-outlined">filter_list</span>
          Filter
        </button>
      </div>
      <div className={styles.scroll}>
        {activities.map((act, index) => (
          <div key={act.id} className={styles.item}>
            <div className={styles.iconCol}>
              <div
                className={`${styles.iconWrap} ${
                  act.type === "export" ? styles.iconWrapExport : styles.iconWrapImport
                }`}
              >
                <span className="material-symbols-outlined">
                  {act.type === "export" ? "logout" : "login"}
                </span>
              </div>
              <div className={styles.line} aria-hidden />
            </div>
            <div className={`${styles.body} ${index === activities.length - 1 ? styles.bodyLast : ""}`}>
              <div className={styles.itemTitleRow}>
                <h4 className={styles.itemTitle}>{act.title}</h4>
                <span className={styles.itemTime}>{act.time}</span>
              </div>
              <p className={styles.itemDesc}>{act.desc}</p>
              {act.meta && <p className={styles.itemMeta}>{act.meta}</p>}
            </div>
          </div>
        ))}
      </div>
    </div>
  );
}
