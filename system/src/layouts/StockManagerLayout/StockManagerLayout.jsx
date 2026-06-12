import { BRAND_STOCK_MANAGER_SUB } from "@/config/brand";
import { STOCK_MANAGER_NAV_ITEMS } from "@/config/actorNav.config";
import { ActorShellLayout } from "../ActorShellLayout/ActorShellLayout";

export function StockManagerLayout() {
  return <ActorShellLayout navItems={STOCK_MANAGER_NAV_ITEMS} brandSub={BRAND_STOCK_MANAGER_SUB} />;
}
