"use client";

import { useRouter } from "next/navigation";
import { useVeris } from "@/lib/store";
import { userMap, switcherUserIds, users } from "@/lib/mock-data";
import {
  DropdownMenu,
  DropdownMenuContent,
  DropdownMenuItem,
  DropdownMenuLabel,
  DropdownMenuSeparator,
  DropdownMenuTrigger,
} from "@/components/ui/dropdown-menu";
import { Button } from "@/components/ui/button";
import { UserAvatar } from "@/components/user-avatar";
import { ChevronsUpDown, Check } from "lucide-react";
import { cn } from "@/lib/utils";

export function RoleSwitcher() {
  const router = useRouter();
  const currentUserId = useVeris((s) => s.currentUserId);
  const setUser = useVeris((s) => s.setUser);
  const current = userMap[currentUserId];

  const personas = switcherUserIds.map((id) => userMap[id]);
  const others = users.filter(
    (u) => !switcherUserIds.includes(u.id) && u.status === "active",
  );

  function pick(id: string) {
    setUser(id);
    const u = userMap[id];
    router.push(u.role === "clinician" ? "/me" : "/dashboard");
  }

  return (
    <DropdownMenu>
      <DropdownMenuTrigger asChild>
        <Button
          variant="outline"
          className="h-11 gap-2.5 pl-2 pr-2.5 bg-card"
        >
          <UserAvatar name={current.name} seed={current.avatarSeed} className="size-7" />
          <span className="hidden text-left leading-tight sm:block">
            <span className="block text-sm font-medium">{current.name}</span>
            <span className="block text-[11px] text-muted-foreground">
              {current.roleLabel}
            </span>
          </span>
          <ChevronsUpDown className="size-3.5 text-muted-foreground" />
        </Button>
      </DropdownMenuTrigger>
      <DropdownMenuContent align="end" className="w-72">
        <DropdownMenuLabel className="text-xs text-muted-foreground">
          Demo personas — switch lens to re-scope the app (RBAC)
        </DropdownMenuLabel>
        {personas.map((u) => (
          <DropdownMenuItem
            key={u.id}
            className="gap-2.5 py-2"
            onClick={() => pick(u.id)}
          >
            <UserAvatar name={u.name} seed={u.avatarSeed} className="size-8" />
            <div className="min-w-0 flex-1 leading-tight">
              <div className="truncate text-sm font-medium">{u.name}</div>
              <div className="truncate text-[11px] text-muted-foreground">
                {u.roleLabel}
              </div>
            </div>
            {u.id === currentUserId && <Check className="size-4 text-primary" />}
          </DropdownMenuItem>
        ))}
        <DropdownMenuSeparator />
        <DropdownMenuLabel className="text-xs text-muted-foreground">
          Other roles
        </DropdownMenuLabel>
        {others.map((u) => (
          <DropdownMenuItem
            key={u.id}
            className={cn("gap-2.5 py-1.5")}
            onClick={() => pick(u.id)}
          >
            <UserAvatar name={u.name} seed={u.avatarSeed} className="size-6" />
            <div className="min-w-0 flex-1 leading-tight">
              <div className="truncate text-[13px]">{u.name}</div>
              <div className="truncate text-[11px] text-muted-foreground">
                {u.roleLabel}
              </div>
            </div>
            {u.id === currentUserId && <Check className="size-4 text-primary" />}
          </DropdownMenuItem>
        ))}
      </DropdownMenuContent>
    </DropdownMenu>
  );
}
