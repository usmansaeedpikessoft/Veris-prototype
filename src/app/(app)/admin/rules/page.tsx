"use client";

import { PageHeader } from "@/components/page-header";
import { Card, CardContent, CardHeader, CardTitle, CardDescription } from "@/components/ui/card";
import { Badge } from "@/components/ui/badge";
import { Button } from "@/components/ui/button";
import { TonePill } from "@/components/status/badges";
import {
  Dialog,
  DialogContent,
  DialogDescription,
  DialogHeader,
  DialogTitle,
  DialogTrigger,
} from "@/components/ui/dialog";
import { ruleSets, authorityName } from "@/lib/mock-data";
import { fmtDate } from "@/lib/dates";
import type { Tone } from "@/lib/status";
import { BookMarked, FileCheck2, History } from "lucide-react";

const STATUS_TONE: Record<string, Tone> = {
  active: "success",
  draft: "warning",
  archived: "muted",
};

export default function RulesPage() {
  return (
    <div>
      <PageHeader
        title="Authority Rule Sets"
        module="ADM"
        description="Authority specifics are data, not code — versioned and reviewed by a Compliance Specialist before activation (FEAT-ADM-01 / NFR-MAINT-02)."
      />

      <div className="grid grid-cols-1 gap-4 md:grid-cols-2 xl:grid-cols-3">
        {ruleSets.map((rs) => (
          <Card key={rs.id} className="flex flex-col">
            <CardHeader>
              <div className="flex items-start justify-between gap-2">
                <div>
                  <CardTitle className="flex items-center gap-2 text-base">
                    <BookMarked className="size-4 text-primary" />
                    {rs.authority}
                  </CardTitle>
                  <CardDescription>{rs.licenseType}</CardDescription>
                </div>
                <div className="flex flex-col items-end gap-1">
                  <Badge variant="outline" className="font-mono text-[10px]">{rs.version}</Badge>
                  <TonePill tone={STATUS_TONE[rs.status]}>{rs.status}</TonePill>
                </div>
              </div>
            </CardHeader>
            <CardContent className="flex-1 space-y-3">
              <div className="grid grid-cols-2 gap-3 text-sm">
                <Field label="Renewal window" value={`${rs.renewalWindowDays} days`} />
                <Field label="Validity" value={`${rs.validityYears} yr`} />
                <Field label="CPD threshold" value={`${rs.cpdThreshold} h`} />
                <Field label="Fee" value={`$${rs.feeUsd}`} />
              </div>
              <div>
                <div className="mb-1 text-xs font-medium text-muted-foreground">Required documents ({rs.requiredDocuments.length})</div>
                <div className="flex flex-wrap gap-1">
                  {rs.requiredDocuments.slice(0, 4).map((d) => (
                    <Badge key={d} variant="secondary" className="text-[10px]">{d}</Badge>
                  ))}
                  {rs.requiredDocuments.length > 4 && (
                    <Badge variant="outline" className="text-[10px]">+{rs.requiredDocuments.length - 4}</Badge>
                  )}
                </div>
              </div>
            </CardContent>
            <CardContent className="flex items-center justify-between border-t pt-3">
              <span className="text-xs text-muted-foreground">
                {rs.updatedBy} · {fmtDate(rs.updatedAt)}
              </span>
              <Dialog>
                <DialogTrigger asChild>
                  <Button variant="outline" size="sm">View</Button>
                </DialogTrigger>
                <DialogContent className="max-h-[85vh] overflow-y-auto">
                  <DialogHeader>
                    <DialogTitle className="flex items-center gap-2">
                      {authorityName(rs.authority)} — {rs.licenseType}
                      <Badge variant="outline" className="font-mono text-[10px]">{rs.version}</Badge>
                    </DialogTitle>
                    <DialogDescription>Active rule set governing checklist generation and validation.</DialogDescription>
                  </DialogHeader>
                  <div className="space-y-4">
                    <div className="grid grid-cols-2 gap-3 sm:grid-cols-4">
                      <Field label="Renewal window" value={`${rs.renewalWindowDays} days`} />
                      <Field label="Validity" value={`${rs.validityYears} years`} />
                      <Field label="CPD threshold" value={`${rs.cpdThreshold} hours`} />
                      <Field label="Fee" value={`$${rs.feeUsd}`} />
                    </div>
                    <div>
                      <div className="mb-2 flex items-center gap-1.5 text-sm font-medium"><FileCheck2 className="size-4" /> Required documents</div>
                      <ul className="grid grid-cols-1 gap-1 sm:grid-cols-2">
                        {rs.requiredDocuments.map((d) => (
                          <li key={d} className="rounded border bg-muted/30 px-2.5 py-1.5 text-sm">{d}</li>
                        ))}
                      </ul>
                    </div>
                    <div>
                      <div className="mb-2 text-sm font-medium">Rejection categories</div>
                      <div className="flex flex-wrap gap-1.5">
                        {rs.rejectionCategories.map((c) => (
                          <Badge key={c} variant="outline" className="font-mono text-[10px]">{c}</Badge>
                        ))}
                      </div>
                    </div>
                    <div className="flex items-center gap-1.5 rounded-lg border bg-muted/30 p-3 text-xs text-muted-foreground">
                      <History className="size-3.5" /> Last change: {rs.version} by {rs.updatedBy} on {fmtDate(rs.updatedAt)}. Prior versions retained and auditable.
                    </div>
                  </div>
                </DialogContent>
              </Dialog>
            </CardContent>
          </Card>
        ))}
      </div>
    </div>
  );
}

function Field({ label, value }: { label: string; value: string }) {
  return (
    <div>
      <div className="text-xs text-muted-foreground">{label}</div>
      <div className="font-medium">{value}</div>
    </div>
  );
}
