/**
 * Sidebar theo tài liệu `dev/Documents/UI/*.md` (không gồm customer B2C/B2B).
 * Icon: Material SymbolsOutlined (chuỗi tên icon).
 */
export type ActorNavItem = {
  to: string;
  /** NavLink `end` — chỉ khớp đúng path */
  end?: boolean;
  icon: string;
  label: string;
  /** Ghi đè trạng thái active (tránh prefix trùng như /orders vs /orders/create) */
  isActive?: (pathname: string) => boolean;
};

/** Nhóm mục trong sidebar (ví dụ Manager). */
export type ActorNavGroup = {
  type: "group";
  title: string;
  items: ActorNavItem[];
};

export type ActorNavEntry = ActorNavItem | ActorNavGroup;

export function isActorNavGroup(entry: ActorNavEntry): entry is ActorNavGroup {
  return (entry as ActorNavGroup).type === "group";
}

/** List, chi tiết và các chế độ báo giá (queue / mine / all / create). */
function salerQuotationsNavActive(pathname: string) {
  return pathname === "/saler/quotations" || pathname.startsWith("/saler/quotations/");
}

function salerOrdersListActive(pathname: string) {
  const parts = pathname.split("/").filter(Boolean);
  if (parts[0] !== "saler" || parts[1] !== "orders") return false;
  if (parts[2] === "create") return false;
  if (parts.length === 2) return true;
  return parts.length === 3;
}

/** List + chi tiết hợp đồng dưới `/saler/contracts`. */
function salerContractsNavActive(pathname: string) {
  return pathname === "/saler/contracts" || pathname.startsWith("/saler/contracts/");
}

function managerWarrantyTicketsNavActive(pathname: string) {
  if (pathname.includes("/claims")) return false;
  if (pathname === "/manager/after-sales/warranty/pending") return false;
  if (pathname === "/manager/after-sales/warranty" || pathname === "/manager/after-sales/warranty/") return true;
  return /^\/manager\/after-sales\/warranty\/\d+$/.test(pathname);
}

function managerWarrantyClaimsQueueNavActive(pathname: string) {
  if (pathname === "/manager/after-sales/warranty/claims-queue" || pathname.endsWith("/claims-queue/")) return true;
  return /^\/manager\/after-sales\/warranty\/claims\/[^/]+$/.test(pathname);
}

function managerQuotationsAllActive(pathname: string) {
  const parts = pathname.split("/").filter(Boolean);
  if (parts[0] !== "manager" || parts[1] !== "sales" || parts[2] !== "quotations") return false;
  if (parts.length === 3) return true;
  if (parts.length === 4 && parts[3] === "pending") return false;
  if (parts.length === 4) return true;
  return false;
}

function stockFulfillmentsHubActive(pathname: string) {
  if (!pathname.startsWith("/stock-manager/fulfillments")) return false;
  if (pathname.startsWith("/stock-manager/fulfillments/create")) return false;
  return true;
}

/**
 * Sales — sidebar theo nghiệp vụ: bán hàng → công nợ (xem) → hậu mãi → KPI cá nhân.
 * Tra cứu sản phẩm/tồn kho: link trên Dashboard, không nằm sidebar.
 * Route thực tế khớp `App.jsx` `/saler/*`.
 */
export const SALER_NAV_ITEMS: ActorNavEntry[] = [
  { to: "/saler", end: true, icon: "dashboard", label: "Dashboard" },
  {
    type: "group",
    title: "Bán hàng",
    items: [
      {
        to: "/saler/quotations/mine",
        end: false,
        icon: "description",
        label: "Báo giá",
        isActive: salerQuotationsNavActive,
      },
      {
        to: "/saler/contracts",
        end: false,
        icon: "article",
        label: "Hợp đồng",
        isActive: salerContractsNavActive,
      },
      {
        to: "/saler/orders",
        end: false,
        icon: "shopping_cart",
        label: "Đơn hàng",
        isActive: salerOrdersListActive,
      },
      { to: "/saler/customers", end: false, icon: "groups", label: "Khách hàng" },
    ],
  },
  {
    type: "group",
    title: "Công nợ",
    items: [
      { to: "/saler/invoices", end: false, icon: "receipt_long", label: "Hóa đơn" },
      { to: "/saler/payments", end: false, icon: "payments", label: "Thanh toán" },
      { to: "/saler/transfer-notifications", end: false, icon: "account_balance", label: "CK B2B" },
    ],
  },
  {
    type: "group",
    title: "Hậu mãi",
    items: [
      { to: "/saler/warranty", end: false, icon: "verified_user", label: "Bảo hành" },
      { to: "/saler/returns", end: false, icon: "assignment_return", label: "Đổi / trả" },
    ],
  },
  {
    type: "group",
    title: "Cá nhân",
    items: [{ to: "/saler/revenue", end: false, icon: "trending_up", label: "Doanh thu" }],
  },
];

/**
 * Manager — sidebar đồng bộ nhãn / nhóm với Admin (`admin-menu.config.tsx`);
 * thêm «Chờ duyệt báo giá» cho workflow duyệt. Hàng đợi BH/đổi trả: filter trên trang hoặc Dashboard.
 */
export const MANAGER_NAV_ITEMS: ActorNavEntry[] = [
  { to: "/manager", end: true, icon: "dashboard", label: "Dashboard" },
  {
    type: "group",
    title: "Bán hàng",
    items: [
      { to: "/manager/sales/quotations/pending", end: false, icon: "rule", label: "Chờ duyệt báo giá" },
      {
        to: "/manager/sales/quotations",
        end: false,
        icon: "description",
        label: "Báo giá",
        isActive: managerQuotationsAllActive,
      },
      { to: "/manager/sales/contracts", end: false, icon: "article", label: "Hợp đồng" },
      { to: "/manager/sales/orders", end: false, icon: "shopping_cart", label: "Đơn hàng" },
      { to: "/manager/sales/customers", end: false, icon: "groups", label: "Khách hàng" },
    ],
  },
  {
    type: "group",
    title: "Kho vận",
    items: [
      { to: "/manager/logistics/inventory", end: false, icon: "inventory", label: "Tồn kho" },
      { to: "/manager/logistics/stock-movements", end: false, icon: "swap_horiz", label: "Xuất nhập kho" },
      { to: "/manager/logistics/fulfillments", end: false, icon: "inventory_2", label: "Phiếu công việc" },
    ],
  },
  {
    type: "group",
    title: "Kế toán",
    items: [
      { to: "/manager/accounting/invoices", end: false, icon: "receipt_long", label: "Hóa đơn" },
      { to: "/manager/accounting/payments", end: false, icon: "payments", label: "Thanh toán" },
      { to: "/manager/accounting/transfer-notifications", end: false, icon: "account_balance", label: "Thông báo CK" },
    ],
  },
  {
    type: "group",
    title: "Hậu mãi",
    items: [
      {
        to: "/manager/after-sales/warranty",
        end: false,
        icon: "verified_user",
        label: "Bảo hành",
        isActive: managerWarrantyTicketsNavActive,
      },
      {
        to: "/manager/after-sales/warranty/claims-queue",
        end: false,
        icon: "list_alt",
        label: "Claim đang xử lý",
        isActive: managerWarrantyClaimsQueueNavActive,
      },
      { to: "/manager/after-sales/returns", end: false, icon: "assignment_return", label: "Đổi trả" },
    ],
  },
];

/**
 * Stock Manager — sidebar gọn theo nhóm: xuất kho → tồn & giao dịch → đơn/hậu mãi.
 * (URL `/inventory/adjustments`, `/inventory/warehouse`, `/inventory/sku-lookup` chuyển về `/stock-manager/inventory`; không lặp trong menu.)
 */
export const STOCK_MANAGER_NAV_ITEMS: ActorNavEntry[] = [
  { to: "/stock-manager", end: true, icon: "home", label: "Trang chủ kho" },
  {
    type: "group",
    title: "Xuất kho",
    items: [
      {
        to: "/stock-manager/fulfillments",
        end: false,
        icon: "local_shipping",
        label: "Danh sách phiếu",
        isActive: stockFulfillmentsHubActive,
      },
      { to: "/stock-manager/fulfillments/create", end: false, icon: "add_box", label: "Tạo phiếu" },
    ],
  },
  {
    type: "group",
    title: "Tồn kho",
    items: [
      { to: "/stock-manager/inventory", end: true, icon: "inventory_2", label: "Tồn kho & cảnh báo" },
      { to: "/stock-manager/inventory/transactions", end: false, icon: "swap_horiz", label: "Giao dịch kho" },
    ],
  },
  {
    type: "group",
    title: "Đơn & đổi trả",
    items: [
      { to: "/stock-manager/orders", end: false, icon: "shopping_cart", label: "Đơn hàng" },
      { to: "/stock-manager/returns", end: false, icon: "assignment_return", label: "Đổi / trả" },
    ],
  },
];

/** Worker — theo `dev/Documents/UI/worker.md` */
export const WORKER_NAV_ITEMS: ActorNavItem[] = [
  { to: "/worker", end: true, icon: "task_alt", label: "Việc của tôi" },
  { to: "/worker/fulfillments", end: false, icon: "local_shipping", label: "Phiếu được giao" },
  { to: "/worker/inventory/sku-lookup", end: false, icon: "search", label: "Tra SKU" },
];
