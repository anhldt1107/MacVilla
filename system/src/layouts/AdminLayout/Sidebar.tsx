import { useMemo, useState } from "react";
import { NavLink, useLocation } from "react-router-dom";
import { ChevronDown, PanelLeftClose, PanelLeft } from "lucide-react";
import { adminMenuConfig, type AdminNavGroup, type AdminNavLeaf } from "@/config/admin-menu.config";
import {
  BRAND_ADMIN_SHORT,
  BRAND_ADMIN_SUB,
  BRAND_LOGO_SRC,
  BRAND_NAME,
} from "@/config/brand";
import { cn } from "@/lib/utils";
import { Button } from "@/components/ui/button";
import { Collapsible, CollapsibleContent, CollapsibleTrigger } from "@/components/ui/collapsible";
import {
  DropdownMenu,
  DropdownMenuContent,
  DropdownMenuItem,
  DropdownMenuLabel,
  DropdownMenuTrigger,
} from "@/components/ui/dropdown-menu";
import { ScrollArea } from "@/components/ui/scroll-area";
import { Tooltip, TooltipContent, TooltipProvider, TooltipTrigger } from "@/components/ui/tooltip";

const STORAGE_KEY = "admin-sidebar-collapsed";

function isLeafActive(to: string, pathname: string) {
  if (to === "/admin") return pathname === "/admin" || pathname === "/admin/";
  return pathname === to || pathname.startsWith(to + "/");
}

function adminNavLeafMatches(item: AdminNavLeaf, pathname: string) {
  if (typeof item.isActive === "function") return item.isActive(pathname);
  return isLeafActive(item.to, pathname);
}

function isGroupActive(group: AdminNavGroup, pathname: string) {
  return group.items.some((item) => adminNavLeafMatches(item, pathname));
}

function SidebarLink({
  item,
  collapsed,
}: {
  item: AdminNavLeaf;
  collapsed: boolean;
}) {
  const Icon = item.icon;
  const location = useLocation();

  const linkClass = ({ isActive: navIsActive }: { isActive: boolean }) => {
    const resolved = typeof item.isActive === "function" ? item.isActive(location.pathname) : navIsActive;
    return cn(
      "flex items-center gap-3 rounded-lg px-3 py-2 text-sm font-medium transition-colors",
      "text-sidebar-foreground/80 hover:bg-sidebar-accent hover:text-sidebar-accent-foreground",
      resolved && "bg-sidebar-accent text-sidebar-accent-foreground shadow-sm ring-1 ring-white/10"
    );
  };

  const inner = (
    <NavLink to={item.to} end={item.to === "/admin"} className={linkClass}>
      <Icon className="size-[18px] shrink-0 opacity-90" strokeWidth={2} />
      {!collapsed && <span className="truncate">{item.label}</span>}
    </NavLink>
  );

  if (!collapsed) return inner;

  return (
    <Tooltip delayDuration={0}>
      <TooltipTrigger asChild>{inner}</TooltipTrigger>
      <TooltipContent side="right" className="font-medium">
        {item.label}
      </TooltipContent>
    </Tooltip>
  );
}

function SidebarGroup({ group, collapsed }: { group: AdminNavGroup; collapsed: boolean }) {
  const location = useLocation();
  const childActive = isGroupActive(group, location.pathname);
  const Icon = group.icon;
  const [open, setOpen] = useState(childActive);

  const triggerClass = cn(
    "flex w-full items-center gap-3 rounded-lg px-3 py-2 text-sm font-medium transition-colors",
    "text-sidebar-foreground/80 hover:bg-sidebar-accent hover:text-sidebar-accent-foreground",
    childActive && "bg-sidebar-accent/60 text-sidebar-accent-foreground"
  );

  if (collapsed) {
    return (
      <DropdownMenu>
        <DropdownMenuTrigger asChild>
          <button
            type="button"
            className={cn(
              "flex w-full items-center justify-center rounded-lg p-2 transition-colors",
              "text-sidebar-foreground/80 hover:bg-sidebar-accent hover:text-sidebar-accent-foreground",
              childActive && "bg-sidebar-accent text-sidebar-accent-foreground ring-1 ring-white/10"
            )}
            aria-label={group.label}
            title={group.label}
          >
            <Icon className="size-[18px] shrink-0" strokeWidth={2} />
          </button>
        </DropdownMenuTrigger>
        <DropdownMenuContent side="right" align="start" className="w-52">
          <DropdownMenuLabel className="text-xs font-semibold uppercase tracking-wide text-muted-foreground">
            {group.label}
          </DropdownMenuLabel>
          {group.items.map((item) => {
            const ItemIcon = item.icon;
            const active = adminNavLeafMatches(item, location.pathname);
            return (
              <DropdownMenuItem key={item.to} asChild className={cn(active && "bg-accent")}>
                <NavLink to={item.to} className="flex cursor-pointer items-center gap-2">
                  <ItemIcon className="size-4" />
                  {item.label}
                </NavLink>
              </DropdownMenuItem>
            );
          })}
        </DropdownMenuContent>
      </DropdownMenu>
    );
  }

  return (
    <Collapsible open={open} onOpenChange={setOpen}>
      <CollapsibleTrigger className={triggerClass}>
        <Icon className="size-[18px] shrink-0 opacity-90" strokeWidth={2} />
        <span className="flex-1 truncate text-left">{group.label}</span>
        <ChevronDown
          className={cn("size-4 shrink-0 opacity-60 transition-transform duration-200", open && "rotate-180")}
        />
      </CollapsibleTrigger>
      <CollapsibleContent className="space-y-0.5 overflow-hidden pt-1 pl-2 data-[state=closed]:animate-collapsible-up data-[state=open]:animate-collapsible-down">
        {group.items.map((item) => (
          <div key={item.to} className="border-l border-sidebar-border pl-3">
            <SidebarLink item={item} collapsed={false} />
          </div>
        ))}
      </CollapsibleContent>
    </Collapsible>
  );
}

export function Sidebar() {
  const [collapsed, setCollapsed] = useState(() => {
    try {
      return localStorage.getItem(STORAGE_KEY) === "1";
    } catch {
      return false;
    }
  });

  const toggle = () => {
    setCollapsed((c) => {
      const next = !c;
      try {
        localStorage.setItem(STORAGE_KEY, next ? "1" : "0");
      } catch {
        /* ignore */
      }
      return next;
    });
  };

  const widthClass = useMemo(() => (collapsed ? "w-[72px]" : "w-[260px]"), [collapsed]);

  return (
    <TooltipProvider delayDuration={0}>
      <aside
        className={cn(
          "relative flex h-full shrink-0 flex-col border-r border-sidebar-border bg-sidebar text-sidebar-foreground transition-[width] duration-200 ease-out",
          widthClass
        )}
      >
        <div
          className={cn(
            "flex h-14 items-center border-b border-sidebar-border px-3",
            collapsed ? "justify-center" : "gap-2 px-4"
          )}
        >
          <div className="flex size-9 shrink-0 items-center justify-center overflow-hidden rounded-lg bg-white shadow ring-1 ring-sidebar-border">
            <img src={BRAND_LOGO_SRC} alt={BRAND_NAME} className="h-full w-full object-contain p-0.5" />
          </div>
          {!collapsed && (
            <div className="min-w-0 flex-1">
              <p className="truncate text-sm font-bold tracking-tight">{BRAND_ADMIN_SHORT}</p>
              <p className="truncate text-[11px] text-sidebar-foreground/60">{BRAND_ADMIN_SUB}</p>
            </div>
          )}
        </div>

        <ScrollArea className="flex-1 px-2 py-3">
          <nav className="flex flex-col gap-1" aria-label="Admin menu">
            {adminMenuConfig.map((entry) => {
              if (entry.type === "item") {
                return <SidebarLink key={entry.to} item={entry} collapsed={collapsed} />;
              }
              return <SidebarGroup key={entry.label} group={entry} collapsed={collapsed} />;
            })}
          </nav>
        </ScrollArea>

        <div className="border-t border-sidebar-border p-2">
          <Button
            type="button"
            variant="ghost"
            size="sm"
            onClick={toggle}
            className={cn(
              "w-full justify-center text-sidebar-foreground/80 hover:bg-sidebar-accent hover:text-sidebar-accent-foreground",
              !collapsed && "justify-start gap-2"
            )}
            aria-expanded={!collapsed}
            aria-label={collapsed ? "Mở sidebar" : "Thu gọn sidebar"}
          >
            {collapsed ? <PanelLeft className="size-4" /> : <PanelLeftClose className="size-4" />}
            {!collapsed && <span className="text-xs font-medium">Thu gọn</span>}
          </Button>
        </div>

        {/* Trang trí góc — gợi SaaS */}
        <div
          className="pointer-events-none absolute inset-x-0 bottom-0 h-24 bg-gradient-to-t from-black/20 to-transparent"
          aria-hidden
        />
      </aside>
    </TooltipProvider>
  );
}
