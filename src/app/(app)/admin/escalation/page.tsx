"use client";

import { useState } from "react";
import { toast } from "sonner";
import { PageHeader } from "@/components/page-header";
import { Card, CardContent, CardHeader, CardTitle, CardDescription } from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { UserAvatar } from "@/components/user-avatar";
import { userMap } from "@/lib/mock-data";
import { ArrowDown, Save } from "lucide-react";

const LADDER = [
  { tier: "1st", userId: "u-mariam", intervalDefault: 3, role: "Credentialing Officer" },
  { tier: "2nd", userId: "u-fatima", intervalDefault: 2, role: "Compliance Head" },
  { tier: "3rd", userId: "u-khalid", intervalDefault: 2, role: "Medical Director" },
];

export default function EscalationPage() {
  const [intervals, setIntervals] = useState(LADDER.map((l) => l.intervalDefault));

  return (
    <div>
      <PageHeader
        title="Escalation Ladder"
        module="ADM"
        description="Configure the escalation tiers and the interval before a stalled case escalates to the next tier (BR-40 / FEAT-ADM-02)."
      >
        <Button className="gap-1.5" onClick={() => toast.success("Escalation ladder saved")}>
          <Save className="size-4" /> Save
        </Button>
      </PageHeader>

      <Card className="mx-auto max-w-2xl">
        <CardHeader>
          <CardTitle className="text-base">Three-tier ladder</CardTitle>
          <CardDescription>
            Any credential in-window with no open case is auto-escalated (BR-41). Lapse-prevention guarantee: at least one escalation fires before any expiry (NFR-REL-01).
          </CardDescription>
        </CardHeader>
        <CardContent>
          {LADDER.map((l, i) => {
            const u = userMap[l.userId];
            return (
              <div key={l.tier}>
                <div className="flex flex-col gap-3 rounded-lg border p-4 sm:flex-row sm:items-center">
                  <div className="flex size-9 shrink-0 items-center justify-center rounded-full bg-primary/10 font-semibold text-primary">
                    {l.tier}
                  </div>
                  <UserAvatar name={u.name} seed={u.avatarSeed} className="size-9" />
                  <div className="min-w-0 flex-1">
                    <div className="text-sm font-medium">{u.name}</div>
                    <div className="text-xs text-muted-foreground">{l.role}</div>
                  </div>
                  <div className="flex items-center gap-2">
                    <Label htmlFor={`int-${i}`} className="whitespace-nowrap text-xs text-muted-foreground">
                      Escalate after
                    </Label>
                    <Input
                      id={`int-${i}`}
                      type="number"
                      min={1}
                      className="w-16"
                      value={intervals[i]}
                      onChange={(e) =>
                        setIntervals((arr) => arr.map((v, idx) => (idx === i ? Number(e.target.value) : v)))
                      }
                    />
                    <span className="text-xs text-muted-foreground">days</span>
                  </div>
                </div>
                {i < LADDER.length - 1 && (
                  <div className="flex justify-center py-1 text-muted-foreground">
                    <ArrowDown className="size-4" />
                  </div>
                )}
              </div>
            );
          })}
        </CardContent>
      </Card>
    </div>
  );
}
