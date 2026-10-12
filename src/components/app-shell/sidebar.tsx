"use client";

import Link from "next/link";
import { usePathname } from "next/navigation";
import { useVeris } from "@/lib/store";
import { userMap } from "@/lib/mock-data";
import { navFor } from "@/lib/rbac";
import { NAV_ITEMS, GROUP_ORDER } from "./nav-config";
import { cn } from "@/lib/utils";
import { ShieldCheck } from "lucide-react";

export function Sidebar({ onNavigate }: { onNavigate?: () => void }) {
  const pathname = usePathname();
  const currentUserId = useVeris((s) => s.currentUserId);
  const user = userMap[currentUserId];
  const keys = navFor(user.role);

  const grouped = GROUP_ORDER.map((group) => ({
    group,
    items: keys.map((k) => NAV_ITEMS[k]).filter((i) => i && i.group === group),
  })).filter((g) => g.items.length > 0);

  return (
    <div className="flex h-full flex-col bg-sidebar text-sidebar-foreground">
      <div className="flex h-16 items-center gap-2.5 px-5">
        <div className="flex size-9 items-center justify-center rounded-lg bg-sidebar-primary text-sidebar-primary-foreground">
          <ShieldCheck className="size-5" />
        </div>
        <div className="leading-tight">
          <div className="text-[15px] font-semibold tracking-tight">Veris</div>
          <div className="text-[11px] text-sidebar-foreground/60">
            Credentialing Agent
          </div>
        </div>
      </div>

      <nav className="flex-1 space-y-5 overflow-y-auto px-3 py-4">
        {grouped.map(({ group, items }) => (
          <div key={group}>
            <div className="px-3 pb-1.5 text-[10px] font-semibold uppercase tracking-wider text-sidebar-foreground/40">
              {group}
            </div>
            <ul className="space-y-0.5">
              {items.map((item) => {
                const active =
                  pathname === item.href || pathname.startsWith(item.href + "/");
                const Icon = item.icon;
                return (
                  <li key={item.key}>
                    <Link
                      href={item.href}
                      onClick={onNavigate}
                      className={cn(
                        "group flex items-center gap-3 rounded-md px-3 py-2 text-sm transition-colors",
                        active
                          ? "bg-sidebar-accent text-sidebar-accent-foreground font-medium"
                          : "text-sidebar-foreground/70 hover:bg-sidebar-accent/60 hover:text-sidebar-foreground",
                      )}
                    >
                      <Icon className="size-4 shrink-0" />
                      <span className="truncate">{item.label}</span>
                      <span
                        className={cn(
                          "ml-auto text-[9px] font-mono text-sidebar-foreground/30",
                          active && "text-sidebar-foreground/50",
                        )}
                      >
                        {item.module}
                      </span>
                    </Link>
                  </li>
                );
              })}
            </ul>
          </div>
        ))}
      </nav>

      <div className="border-t border-sidebar-border px-4 py-3 text-[11px] text-sidebar-foreground/50">
        <p>Prototype · mock data</p>
        <p className="mt-0.5">Phase 1 · assisted submission</p>
      </div>
    </div>
  );
}
