import type { LucideIcon } from "lucide-react";
import {
  ArrowLeftRight,
  Boxes,
  Building2,
  Calculator,
  ClipboardList,
  CreditCard,
  FileSignature,
  FileSpreadsheet,
  FolderTree,
  LayoutDashboard,
  Megaphone,
  Package,
  PackageSearch,
  Receipt,
  RefreshCw,
  Layers,
  ShieldCheck,
  ShoppingBag,
  Target,
  Ticket,
  UserCog,
  Users,
  Warehouse,
  Headphones,
  Landmark,
} from "lucide-react";

/** Một mục đích tuyến (leaf). */
export type AdminNavLeaf = {
  type: "item";
  label: string;
  to: string;
  icon: LucideIcon;
  /** Ghi đè NavLink active (tránh prefix trùng như `/warranty` vs `/warranty/claims-queue`). */
  isActive?: (pathname: string) => boolean;
};

function adminWarrantyTicketsNavActive(pathname: string) {
  if (pathname === "/admin/after-sales/warranty" || pathname === "/admin/after-sales/warranty/") return true;
  return /^\/admin\/after-sales\/warranty\/\d+$/.test(pathname);
}

function adminWarrantyClaimsQueueNavActive(pathname: string) {
  return pathname === "/admin/after-sales/warranty/claims-queue" || pathname === "/admin/after-sales/warranty/claims-queue/";
}

/** Nhóm menu có submenu. */
export type AdminNavGroup = {
  type: "group";
  label: string;
  icon: LucideIcon;
  items: AdminNavLeaf[];
};

export type AdminNavEntry = AdminNavLeaf | AdminNavGroup;

/**
 * Cấu hình menu Admin — tách riêng để dễ mở rộng / i18n / phân quyền sau.
 */
export const adminMenuConfig: AdminNavEntry[] = [
  {
    type: "item",
    label: "Dashboard",
    to: "/admin",
    icon: LayoutDashboard,
  },
  {
    type: "group",
    label: "Bán hàng",
    icon: ShoppingBag,
    items: [
      { type: "item", label: "Đơn hàng", to: "/admin/sales/orders", icon: ClipboardList },
      { type: "item", label: "Khách hàng", to: "/admin/sales/customers", icon: Users },
      { type: "item", label: "Báo giá (B2B)", to: "/admin/sales/quotations-b2b", icon: FileSpreadsheet },
      { type: "item", label: "Hợp đồng", to: "/admin/sales/contracts", icon: FileSignature },
    ],
  },
  {
    type: "group",
    label: "Sản phẩm",
    icon: Boxes,
    items: [
      { type: "item", label: "Sản phẩm", to: "/admin/products", icon: Package },
      { type: "item", label: "Danh mục", to: "/admin/product-categories", icon: FolderTree },
      { type: "item", label: "Danh sách biến thể", to: "/admin/variants", icon: Layers },
    ],
  },
  {
    type: "group",
    label: "Kho vận",
    icon: Warehouse,
    items: [
      { type: "item", label: "Tồn kho", to: "/admin/logistics/inventory", icon: PackageSearch },
      { type: "item", label: "Xuất nhập kho", to: "/admin/logistics/stock-movements", icon: ArrowLeftRight },
      { type: "item", label: "Phiếu công việc", to: "/admin/logistics/fulfillments", icon: Package },
    ],
  },
  {
    type: "group",
    label: "Kế toán",
    icon: Calculator,
    items: [
      { type: "item", label: "Hóa đơn", to: "/admin/accounting/invoices", icon: Receipt },
      { type: "item", label: "Thanh toán", to: "/admin/accounting/payments", icon: CreditCard },
      { type: "item", label: "Thông báo CK", to: "/admin/accounting/transfer-notifications", icon: Landmark },
    ],
  },
  {
    type: "group",
    label: "Marketing",
    icon: Megaphone,
    items: [
      { type: "item", label: "Chiến dịch", to: "/admin/marketing/campaigns", icon: Target },
      { type: "item", label: "Voucher", to: "/admin/marketing/vouchers", icon: Ticket },
    ],
  },
  {
    type: "group",
    label: "Hậu mãi",
    icon: Headphones,
    items: [
      {
        type: "item",
        label: "Bảo hành",
        to: "/admin/after-sales/warranty",
        icon: ShieldCheck,
        isActive: adminWarrantyTicketsNavActive,
      },
      {
        type: "item",
        label: "Claim đang xử lý",
        to: "/admin/after-sales/warranty/claims-queue",
        icon: ClipboardList,
        isActive: adminWarrantyClaimsQueueNavActive,
      },
      { type: "item", label: "Đổi trả", to: "/admin/after-sales/returns", icon: RefreshCw },
    ],
  },
  {
    type: "group",
    label: "Nhân sự & hệ thống",
    icon: Building2,
    items: [
      { type: "item", label: "Nhân sự", to: "/admin/hr/employees", icon: UserCog },
    ],
  },
];
