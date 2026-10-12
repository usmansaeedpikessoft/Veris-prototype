"use client";

import Link from "next/link";
import { PageHeader } from "@/components/page-header";
import { Card, CardContent, CardHeader, CardTitle, CardDescription } from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import { Tabs, TabsContent, TabsList, TabsTrigger } from "@/components/ui/tabs";
import { UserAvatar } from "@/components/user-avatar";
import { CaseStatePill, ExpiryBadge, TonePill } from "@/components/status/badges";
import { useMergedData } from "@/lib/view";
import { clinicianName, authorityName, rejectionMap } from "@/lib/mock-data";
import { ArrowRight, TriangleAlert, Clock } from "lucide-react";

export default function ExceptionsPage() {
  const data = useMergedData();

  const exceptions = data.cases.filter(
    (c) => c.state === "Rejected" || c.state === "Remediating",
  );
  const chases = data.cases.filter(
    (c) =>
      (c.state === "CollectingDocs" || c.state === "Validating") &&
      c.checklist.some((i) => i.validation === "missing" || i.validation === "stale"),
  );

  return (
    <div>
      <PageHeader
        title="Chase & Exceptions"
        module="EXC"
        description="Outstanding document chases and authority rejections with classified reasons and proposed corrective actions (WF-C)."
      />

      <Tabs defaultValue="exceptions">
        <TabsList>
          <TabsTrigger value="exceptions" className="gap-1.5">
            <TriangleAlert className="size-4" /> Exceptions ({exceptions.length})
          </TabsTrigger>
          <TabsTrigger value="chases" className="gap-1.5">
            <Clock className="size-4" /> Open chases ({chases.length})
          </TabsTrigger>
        </TabsList>

        <TabsContent value="exceptions" className="mt-4 space-y-3">
          {exceptions.map((c) => {
            const clinician = data.clinicianById(c.clinicianId);
            const reason = c.rejection ? rejectionMap[c.rejection.reasonCode] : undefined;
            return (
              <Card key={c.id}>
                <CardContent className="flex flex-col gap-4 py-4 sm:flex-row sm:items-center">
                  <div className="flex min-w-0 flex-1 items-center gap-3">
                    <UserAvatar name={clinician ? clinicianName(clinician) : "?"} seed={clinician?.photoSeed} />
                    <div className="min-w-0">
                      <Link href={`/register/${c.clinicianId}`} className="text-sm font-medium hover:underline">
                        {clinician ? clinicianName(clinician) : c.clinicianId}
                      </Link>
                      <div className="text-xs text-muted-foreground">{authorityName(c.authority)} · {c.licenseType}</div>
                    </div>
                  </div>
                  <div className="min-w-0 flex-1">
                    {reason ? (
                      <>
                        <div className="flex items-center gap-2">
                          <TonePill tone="danger">{reason.category}</TonePill>
                          <span className="text-xs text-muted-foreground">{reason.code}</span>
                        </div>
                        <p className="mt-1 text-sm">{reason.label}</p>
                        <p className="mt-0.5 text-xs text-muted-foreground">→ {reason.proposedAction}</p>
                      </>
                    ) : (
                      <p className="text-sm text-muted-foreground">Rejection pending classification.</p>
                    )}
                  </div>
                  <div className="flex shrink-0 items-center gap-2">
                    <CaseStatePill state={c.state} />
                    <Button asChild size="sm" variant="outline" className="gap-1">
                      <Link href={`/cases/${c.id}`}>Resolve <ArrowRight className="size-3.5" /></Link>
                    </Button>
                  </div>
                </CardContent>
              </Card>
            );
          })}
          {exceptions.length === 0 && (
            <Card><CardContent className="py-10 text-center text-sm text-muted-foreground">No open exceptions. All rejections resolved.</CardContent></Card>
          )}
        </TabsContent>

        <TabsContent value="chases" className="mt-4 space-y-3">
          {chases.map((c) => {
            const clinician = data.clinicianById(c.clinicianId);
            const outstanding = c.checklist.filter((i) => i.validation === "missing" || i.validation === "stale");
            return (
              <Card key={c.id}>
                <CardContent className="flex flex-col gap-4 py-4 sm:flex-row sm:items-center">
                  <div className="flex min-w-0 flex-1 items-center gap-3">
                    <UserAvatar name={clinician ? clinicianName(clinician) : "?"} seed={clinician?.photoSeed} />
                    <div className="min-w-0">
                      <Link href={`/register/${c.clinicianId}`} className="text-sm font-medium hover:underline">
                        {clinician ? clinicianName(clinician) : c.clinicianId}
                      </Link>
                      <div className="text-xs text-muted-foreground">{authorityName(c.authority)} · {c.licenseType}</div>
                    </div>
                  </div>
                  <div className="min-w-0 flex-1 text-sm">
                    <span className="text-muted-foreground">Outstanding: </span>
                    {outstanding.map((o) => o.slot).join(", ")}
                  </div>
                  <div className="flex shrink-0 items-center gap-2">
                    <ExpiryBadge expiry={c.dueDate} />
                    <Button asChild size="sm" variant="outline" className="gap-1">
                      <Link href={`/cases/${c.id}`}>Chase <ArrowRight className="size-3.5" /></Link>
                    </Button>
                  </div>
                </CardContent>
              </Card>
            );
          })}
          {chases.length === 0 && (
            <Card><CardContent className="py-10 text-center text-sm text-muted-foreground">No open chases. Every pack is complete.</CardContent></Card>
          )}
        </TabsContent>
      </Tabs>
    </div>
  );
}
