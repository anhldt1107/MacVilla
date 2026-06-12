import { DashboardHeader } from "../../components/Dashboard";
import styles from "./SalerPlaceholderPage.module.css";

const TITLES = {
  revenue: "Doanh Thu",
  products: "Sản phẩm",
  orders: "Đơn hàng",
  quotations: "Yêu cầu báo giá",
  warehouse: "Quản lý kho",
};

/**
 * @param {{ pageKey?: string; title?: string }} props
 */
export function SalerPlaceholderPage({ pageKey = "revenue", title: titleProp }) {
  const title = titleProp ?? TITLES[pageKey] ?? "Trang";
  return (
    <div className={styles.wrap}>
      <DashboardHeader title={title} />
      <div className={styles.scrollArea}>
        <p className={styles.text}>Nội dung trang “{title}” sẽ được phát triển sau.</p>
      </div>
    </div>
  );
}
