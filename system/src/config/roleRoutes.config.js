/**
 * Phân quyền theo route — chỉnh ở đây khi thêm role / khu vực mới.
 *
 * Quy ước:
 * - Mỗi role (key = tên role API, khuyến nghị lowercase): danh sách prefix path.
 * - `pathname` được phép nếu bằng prefix hoặc bắt đầu bằng `prefix + "/"`.
 * - `ROLE_ALIASES`: map tên role từ API sang bucket cấu hình (vd. "SaleManager" -> "saler").
 * - Role không khớp bucket nào → dùng `DEFAULT_ROLE_BUCKET` ("staff").
 *
 * Ví dụ mở rộng sau này:
 *   manager: ["/saler", "/admin/sales"],
 *   accountant: ["/admin/accounting"],
 */

/** @type {Record<string, string[]>} */
export const ROLE_ROUTE_PREFIXES = {
  admin: ["/admin"],
  saler: ["/saler"],
  manager: ["/manager"],
  stockmanager: ["/stock-manager"],
  worker: ["/worker"],
  /** Bucket mặc định khi role API chưa map — có thể đổi prefix thành [] để từ chối toàn bộ route */
  staff: ["/saler"],
};

/**
 * Map `roleName` từ API (bất kỳ hình thức) -> key trong ROLE_ROUTE_PREFIXES.
 * Thêm alias khi backend thêm role mới mà chưa muốn đổi tên bucket.
 */
export const ROLE_ALIASES = {
  admin: "admin",
  administrator: "admin",
  saler: "saler",
  sale: "saler",
  sales: "saler",
  staff: "staff",
  manager: "manager",
  /** API trả đúng chữ: `Manager` (AppRoles.Manager) */
  Manager: "manager",
  stockmanager: "stockmanager",
  /** API có thể trả đúng chữ: `Stock Manager` */
  "stock manager": "stockmanager",
  stock_manager: "stockmanager",
  worker: "worker",
};

export const DEFAULT_ROLE_BUCKET = "staff";

/** Đường dẫn mặc định sau đăng nhập / khi bị từ chối truy cập khu vực */
export const ROLE_DEFAULT_PATH = {
  admin: "/admin",
  saler: "/saler",
  staff: "/saler",
  manager: "/manager",
  stockmanager: "/stock-manager",
  worker: "/worker",
};

/**
 * @param {string | undefined | null} roleName
 * @returns {string} bucket key
 */
export function resolveRoleBucket(roleName) {
  const raw = (roleName || "").trim();
  if (!raw) return DEFAULT_ROLE_BUCKET;
  const lower = raw.toLowerCase();
  if (ROLE_ROUTE_PREFIXES[lower]) return lower;
  /** VD. `Stock Manager` → `stockmanager` */
  const compact = lower.replace(/\s+/g, "");
  if (ROLE_ROUTE_PREFIXES[compact]) return compact;
  const aliasCompact = ROLE_ALIASES[compact];
  if (aliasCompact && ROLE_ROUTE_PREFIXES[aliasCompact]) return aliasCompact;
  const alias = ROLE_ALIASES[lower];
  if (alias && ROLE_ROUTE_PREFIXES[alias]) return alias;
  /** Khớp không phân biệt hoa thường cho key trong ALIASES */
  const aliasKey = Object.keys(ROLE_ALIASES).find((k) => k.toLowerCase() === lower);
  if (aliasKey) {
    const bucket = ROLE_ALIASES[aliasKey];
    if (bucket && ROLE_ROUTE_PREFIXES[bucket]) return bucket;
  }
  return DEFAULT_ROLE_BUCKET;
}

/**
 * @param {string | undefined | null} roleName
 * @param {string} pathname
 */
export function canRoleAccessPath(roleName, pathname) {
  const bucket = resolveRoleBucket(roleName);
  const prefixes = ROLE_ROUTE_PREFIXES[bucket];
  if (!prefixes?.length) return false;
  const path = pathname.split("?")[0] || "/";
  return prefixes.some(
    (prefix) => path === prefix || path === `${prefix}/` || path.startsWith(`${prefix}/`)
  );
}

/**
 * Trang chủ sau login theo role.
 * @param {string | undefined | null} roleName
 */
export function getPostLoginPathForRole(roleName) {
  const bucket = resolveRoleBucket(roleName);
  return ROLE_DEFAULT_PATH[bucket] ?? ROLE_DEFAULT_PATH[DEFAULT_ROLE_BUCKET] ?? "/saler";
}
