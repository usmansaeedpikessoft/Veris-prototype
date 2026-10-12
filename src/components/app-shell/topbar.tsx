"use client";

import Link from "next/link";
import { Button } from "@/components/ui/button";
import { Sheet, SheetContent, SheetTrigger, SheetTitle } from "@/components/ui/sheet";
import { Sidebar } from "./sidebar";
import { RoleSwitcher } from "./role-switcher";
import { ThemeToggle } from "./theme-toggle";
import { CommandPalette } from "./command-palette";
import { Menu, Bell, MapPin } from "lucide-react";
import { useVeris } from "@/lib/store";
import { Tooltip, TooltipContent, TooltipTrigger } from "@/components/ui/tooltip";

export function Topbar() {
  const notifications = useVeris((s) => s.notifications);
  const unread = notifications.filter((n) => n.status !== "read").length;

  return (
    <header className="sticky top-0 z-30 flex h-16 items-center gap-3 border-b bg-background/80 px-4 backdrop-blur-sm">
      {/* Mobile nav */}
      <Sheet>
        <SheetTrigger asChild>
          <Button variant="ghost" size="icon" className="lg:hidden">
            <Menu className="size-5" />
          </Button>
        </SheetTrigger>
        <SheetContent side="left" className="w-72 p-0">
          <SheetTitle className="sr-only">Navigation</SheetTitle>
          <Sidebar />
        </SheetContent>
      </Sheet>

      <div className="hidden flex-1 lg:block">
        <CommandPalette />
      </div>
      <div className="flex-1 lg:hidden" />

      <Tooltip>
        <TooltipTrigger asChild>
          <div className="hidden items-center gap-1.5 rounded-full border bg-success/10 px-3 py-1.5 text-xs font-medium text-success md:flex">
            <MapPin className="size-3.5" />
            In-region · UAE
          </div>
        </TooltipTrigger>
        <TooltipContent>
          Data hosted in-region for PDPL compliance (BR-50 / NFR-PRIV-01)
        </TooltipContent>
      </Tooltip>

      <Button asChild variant="ghost" size="icon" className="relative size-9">
        <Link href="/notifications" aria-label="Notifications">
          <Bell className="size-4" />
          {unread > 0 && (
            <span className="absolute -right-0.5 -top-0.5 flex size-4 items-center justify-center rounded-full bg-danger text-[9px] font-semibold text-danger-foreground">
              {unread > 9 ? "9+" : unread}
            </span>
          )}
        </Link>
      </Button>

      <ThemeToggle />
      <RoleSwitcher />
    </header>
  );
}
