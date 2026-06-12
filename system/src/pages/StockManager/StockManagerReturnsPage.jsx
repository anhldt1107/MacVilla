import { ManagerReturnsPage } from "@/pages/Manager/ManagerReturnsPage";

/** Stock — danh sách phiếu đổi/trả (mặc định đã duyệt, chờ kho). */
export function StockManagerReturnsPage() {
  return (
    <ManagerReturnsPage
      defaultStatusLocked="Approved"
      returnsListBase="/stock-manager/returns"
    />
  );
}
