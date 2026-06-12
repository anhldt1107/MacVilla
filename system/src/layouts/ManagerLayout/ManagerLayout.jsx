import { BRAND_MANAGER_SUB } from "@/config/brand";
import { MANAGER_NAV_ITEMS } from "@/config/actorNav.config";
import { ActorShellLayout } from "../ActorShellLayout/ActorShellLayout";

export function ManagerLayout() {
  return <ActorShellLayout navItems={MANAGER_NAV_ITEMS} brandSub={BRAND_MANAGER_SUB} aiRole="manager" />;
}
