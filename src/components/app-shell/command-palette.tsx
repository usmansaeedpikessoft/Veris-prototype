"use client";

import { useEffect, useState } from "react";
import { useRouter } from "next/navigation";
import {
  CommandDialog,
  CommandEmpty,
  CommandGroup,
  CommandInput,
  CommandItem,
  CommandList,
} from "@/components/ui/command";
import { Button } from "@/components/ui/button";
import { Search } from "lucide-react";
import { useVeris } from "@/lib/store";
import { userMap, clinicians, clinicianName } from "@/lib/mock-data";
import { navFor } from "@/lib/rbac";
import { NAV_ITEMS } from "./nav-config";

export function CommandPalette() {
  const [open, setOpen] = useState(false);
  const router = useRouter();
  const currentUserId = useVeris((s) => s.currentUserId);
  const role = userMap[currentUserId].role;
  const navItems = navFor(role).map((k) => NAV_ITEMS[k]);
  const canSeeRegister = role !== "clinician" && role !== "exec" ? true : role === "exec";

  useEffect(() => {
    const down = (e: KeyboardEvent) => {
      if (e.key === "k" && (e.metaKey || e.ctrlKey)) {
        e.preventDefault();
        setOpen((o) => !o);
      }
    };
    document.addEventListener("keydown", down);
    return () => document.removeEventListener("keydown", down);
  }, []);

  function go(href: string) {
    setOpen(false);
    router.push(href);
  }

  return (
    <>
      <Button
        variant="outline"
        className="h-9 w-full max-w-xs justify-start gap-2 bg-card text-muted-foreground font-normal"
        onClick={() => setOpen(true)}
      >
        <Search className="size-4" />
        <span className="text-sm">Search clinicians, pages…</span>
        <kbd className="ml-auto hidden rounded border bg-muted px-1.5 py-0.5 text-[10px] sm:inline">
          ⌘K
        </kbd>
      </Button>
      <CommandDialog open={open} onOpenChange={setOpen}>
        <CommandInput placeholder="Search clinicians, pages…" />
        <CommandList>
          <CommandEmpty>No results found.</CommandEmpty>
          <CommandGroup heading="Pages">
            {navItems.map((item) => (
              <CommandItem
                key={item.key}
                value={`page ${item.label}`}
                onSelect={() => go(item.href)}
              >
                <item.icon className="size-4" />
                {item.label}
              </CommandItem>
            ))}
          </CommandGroup>
          {canSeeRegister && (
            <CommandGroup heading="Clinicians">
              {clinicians.slice(0, 40).map((c) => (
                <CommandItem
                  key={c.id}
                  value={`clinician ${clinicianName(c)} ${c.specialty}`}
                  onSelect={() => go(`/register/${c.id}`)}
                >
                  <span>{clinicianName(c)}</span>
                  <span className="ml-auto text-xs text-muted-foreground">
                    {c.specialty}
                  </span>
                </CommandItem>
              ))}
            </CommandGroup>
          )}
        </CommandList>
      </CommandDialog>
    </>
  );
}
