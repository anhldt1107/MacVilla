import { BRAND_WORKER_SUB } from "@/config/brand";
import { WORKER_NAV_ITEMS } from "@/config/actorNav.config";
import { ActorShellLayout } from "../ActorShellLayout/ActorShellLayout";

export function WorkerLayout() {
  return <ActorShellLayout navItems={WORKER_NAV_ITEMS} brandSub={BRAND_WORKER_SUB} />;
}
