"use client";

import { useMemo, useState } from "react";
import Link from "next/link";
import { PageHeader } from "@/components/page-header";
import { Card } from "@/components/ui/card";
import { Input } from "@/components/ui/input";
import { Button } from "@/components/ui/button";
import {
  Select,
  SelectContent,
  SelectItem,
  SelectTrigger,
  SelectValue,
} from "@/components/ui/select";
import {
  Table,
  TableBody,
  TableCell,
  TableHead,
  TableHeader,
  TableRow,
} from "@/components/ui/table";
import { UserAvatar } from "@/components/user-avatar";
import { CaseStatePill, ExpiryBadge, TonePill } from "@/components/status/badges";
import { useMergedData } from "@/lib/view";
import { clinicianName } from "@/lib/mock-data";
import { caseStateMeta } from "@/lib/status";
import { daysUntil, relativeTime } from "@/lib/dates";
import type { CaseState } from "@/lib/types";
import { Search } from "lucide-react";

const TYPE_LABEL: Record<string, string> = {
  renewal: "Renewal",
  onboarding: "Onboarding",
  exception: "Exception",
};

export default function CasesPage() {
  const data = useMergedData();
  const [q, setQ] = useState("");
  const [state, setState] = useState("open");
  const [type, setType] = useState("all");

  const rows = useMemo(() => {
    return data.cases
      .map((c) => ({ c, clinician: data.clinicianById(c.clinicianId), days: daysUntil(c.dueDate) }))
      .filter(({ c, clinician }) => {
        if (!clinician) return false;
        if (state === "open" && c.state === "Completed") return false;
        if (state !== "open" && state !== "all" && c.state !== state) return false;
        if (type !== "all" && c.type !== type) return false;
        if (q) {
          const hay = `${clinicianName(clinician)} ${c.authority} ${c.licenseType}`.toLowerCase();
          if (!hay.includes(q.toLowerCase())) return false;
        }
        return true;
      })
      .sort((a, b) => a.days - b.days);
  }, [data, q, state, type]);

  const states = Object.keys(caseStateMeta) as CaseState[];

  return (
    <div>
      <PageHeader
        title="Case Queue"
        module="REN / EXC"
        description="One queue for every credential action. Complete a renewal without leaving it except for the final portal submit (NFR-USE-01)."
      />

      <Card className="mb-4 flex flex-col gap-3 p-3 sm:flex-row sm:items-center">
        <div className="relative flex-1">
          <Search className="pointer-events-none absolute left-3 top-1/2 size-4 -translate-y-1/2 text-muted-foreground" />
          <Input placeholder="Search cases…" value={q} onChange={(e) => setQ(e.target.value)} className="pl-9" />
        </div>
        <Select value={type} onValueChange={setType}>
          <SelectTrigger className="w-full sm:w-40"><SelectValue /></SelectTrigger>
          <SelectContent>
            <SelectItem value="all">All types</SelectItem>
            <SelectItem value="renewal">Renewal</SelectItem>
            <SelectItem value="onboarding">Onboarding</SelectItem>
            <SelectItem value="exception">Exception</SelectItem>
          </SelectContent>
        </Select>
        <Select value={state} onValueChange={setState}>
          <SelectTrigger className="w-full sm:w-48"><SelectValue /></SelectTrigger>
          <SelectContent>
            <SelectItem value="open">All open</SelectItem>
            <SelectItem value="all">All (incl. completed)</SelectItem>
            {states.map((s) => (
              <SelectItem key={s} value={s}>{caseStateMeta[s].label}</SelectItem>
            ))}
          </SelectContent>
        </Select>
      </Card>

      <Card className="overflow-hidden p-0">
        <Table>
          <TableHeader>
            <TableRow>
              <TableHead>Clinician</TableHead>
              <TableHead className="hidden md:table-cell">Type</TableHead>
              <TableHead className="hidden lg:table-cell">Authority</TableHead>
              <TableHead>State</TableHead>
              <TableHead className="hidden sm:table-cell">SLA</TableHead>
              <TableHead>Expiry</TableHead>
              <TableHead className="text-right">Action</TableHead>
            </TableRow>
          </TableHeader>
          <TableBody>
            {rows.map(({ c, clinician }) => {
              const slaDays = daysUntil(c.slaDueAt);
              const breached = slaDays < 0 && c.state !== "Completed";
              return (
                <TableRow key={c.id}>
                  <TableCell>
                    <Link href={`/cases/${c.id}`} className="flex items-center gap-3 hover:underline">
                      <UserAvatar name={clinicianName(clinician!)} seed={clinician!.photoSeed} />
                      <div className="min-w-0">
                        <div className="truncate text-sm font-medium">{clinicianName(clinician!)}</div>
                        <div className="truncate text-xs text-muted-foreground">{c.licenseType}</div>
                      </div>
                    </Link>
                  </TableCell>
                  <TableCell className="hidden md:table-cell text-sm">{TYPE_LABEL[c.type]}</TableCell>
                  <TableCell className="hidden lg:table-cell text-sm">{c.authority}</TableCell>
                  <TableCell><CaseStatePill state={c.state} /></TableCell>
                  <TableCell className="hidden sm:table-cell">
                    {c.state === "Completed" ? (
                      <span className="text-xs text-muted-foreground">—</span>
                    ) : (
                      <TonePill tone={breached ? "danger" : "muted"}>
                        {breached ? "SLA breached" : relativeTime(c.slaDueAt)}
                      </TonePill>
                    )}
                  </TableCell>
                  <TableCell><ExpiryBadge expiry={c.dueDate} /></TableCell>
                  <TableCell className="text-right">
                    <Button asChild size="sm" variant="outline">
                      <Link href={`/cases/${c.id}`}>Open</Link>
                    </Button>
                  </TableCell>
                </TableRow>
              );
            })}
            {rows.length === 0 && (
              <TableRow>
                <TableCell colSpan={7} className="h-24 text-center text-muted-foreground">
                  No cases match these filters.
                </TableCell>
              </TableRow>
            )}
          </TableBody>
        </Table>
      </Card>
      <p className="mt-3 text-xs text-muted-foreground">{rows.length} case{rows.length === 1 ? "" : "s"} shown.</p>
    </div>
  );
}
