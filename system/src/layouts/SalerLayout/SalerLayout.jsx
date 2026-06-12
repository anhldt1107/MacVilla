import { BRAND_SALER_SUB } from "@/config/brand";
import { SALER_NAV_ITEMS } from "@/config/actorNav.config";
import { ActorShellLayout } from "../ActorShellLayout/ActorShellLayout";

/**
 * Layout khu Sales (`/saler`) — sidebar theo `dev/Documents/UI/sales.md`.
 */
export function SalerLayout() {
  return <ActorShellLayout navItems={SALER_NAV_ITEMS} brandSub={BRAND_SALER_SUB} aiRole="sales" />;
}
