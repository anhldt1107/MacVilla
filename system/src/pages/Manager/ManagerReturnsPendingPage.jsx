import { ManagerReturnsPage } from "./ManagerReturnsPage";

/**
 * Manager — Đổi trả chờ duyệt.
 * Cố định lọc `status=Requested`; xem toàn bộ tại `/manager/after-sales/returns`.
 */
export function ManagerReturnsPendingPage() {
  return <ManagerReturnsPage defaultStatusLocked="Requested" />;
}
