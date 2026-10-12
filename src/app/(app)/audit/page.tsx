"use client";

import { useMemo, useState } from "react";
import { toast } from "sonner";
import { PageHeader } from "@/components/page-header";
import { Card } from "@/components/ui/card";
import { Input } from "@/components/ui/input";
import { Button } from "@/components/ui/button";
import { Badge } from "@/components/ui/badge";
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
import { useVeris } from "@/lib/store";
import { useCurrentUser } from "@/lib/view";
import { can } from "@/lib/rbac";
import { fmtDateTime } from "@/lib/dates";
import { Search, Download, Lock, ArrowRight } from "lucide-react";

export default function AuditPage() {
  const audit = useVeris((s) => s.audit);
  const user = useCurrentUser();
  const [q, setQ] = useState("");
  const [objectType, setObjectType] = useState("all");

  const canExport = can(user.role, "export-audit") !== null;
  const objectTypes = useMemo(
    () => ["all", ...Array.from(new Set(audit.map((e) => e.objectType)))],
    [audit],
  );

  const rows = useMemo(
    () =>
      audit.filter((e) => {
        if (objectType !== "all" && e.objectType !== objectType) return false;
        if (q) {
          const hay = `${e.action} ${e.actor} ${e.objectId}`.toLowerCase();
          if (!hay.includes(q.toLowerCase())) return false;
        }
        return true;
      }),
    [audit, q, objectType],
  );

  return (
    <div>
      <PageHeader
        title="Audit Log"
        module="AUD"
        description="Immutable, tamper-evident record of every state change and approval — actor, timestamp, action, before/after (BR-31 / NFR-AUD-01)."
      >
        <Button
          variant="outline"
          className="gap-1.5"
          disabled={!canExport}
          onClick={() => toast.success("Audit evidence exported", { description: `${rows.length} entries exported to CSV (mock).` })}
        >
          <Download className="size-4" /> Export evidence
        </Button>
      </PageHeader>

      <Card className="mb-4 flex flex-col gap-3 p-3 sm:flex-row sm:items-center">
        <div className="relative flex-1">
          <Search className="pointer-events-none absolute left-3 top-1/2 size-4 -translate-y-1/2 text-muted-foreground" />
          <Input placeholder="Search actions, actors…" value={q} onChange={(e) => setQ(e.target.value)} className="pl-9" />
        </div>
        <Select value={objectType} onValueChange={setObjectType}>
          <SelectTrigger className="w-full sm:w-48"><SelectValue /></SelectTrigger>
          <SelectContent>
            {objectTypes.map((t) => (
              <SelectItem key={t} value={t}>{t === "all" ? "All object types" : t}</SelectItem>
            ))}
          </SelectContent>
        </Select>
      </Card>

      <Card className="overflow-hidden p-0">
        <Table>
          <TableHeader>
            <TableRow>
              <TableHead className="w-44">Timestamp</TableHead>
              <TableHead>Action</TableHead>
              <TableHead className="hidden md:table-cell">Actor</TableHead>
              <TableHead className="hidden lg:table-cell">Change</TableHead>
            </TableRow>
          </TableHeader>
          <TableBody>
            {rows.map((e) => (
              <TableRow key={e.id}>
                <TableCell className="whitespace-nowrap text-xs text-muted-foreground tabular-nums">{fmtDateTime(e.at)}</TableCell>
                <TableCell>
                  <div className="text-sm">{e.action}</div>
                  <Badge variant="outline" className="mt-0.5 font-mono text-[10px]">{e.objectType} · {e.objectId}</Badge>
                </TableCell>
                <TableCell className="hidden md:table-cell">
                  <div className="text-sm">{e.actor}</div>
                  <div className="text-xs text-muted-foreground">{e.actorRole}</div>
                </TableCell>
                <TableCell className="hidden lg:table-cell">
                  {e.before || e.after ? (
                    <div className="flex items-center gap-1.5 text-xs">
                      <span className="rounded bg-muted px-1.5 py-0.5">{e.before ?? "—"}</span>
                      <ArrowRight className="size-3 text-muted-foreground" />
                      <span className="rounded bg-muted px-1.5 py-0.5">{e.after ?? "—"}</span>
                    </div>
                  ) : (
                    <span className="text-xs text-muted-foreground">—</span>
                  )}
                </TableCell>
              </TableRow>
            ))}
          </TableBody>
        </Table>
      </Card>
      <p className="mt-3 flex items-center gap-1.5 text-xs text-muted-foreground">
        <Lock className="size-3" /> Entries are append-only and never mutated. {rows.length} shown.
      </p>
    </div>
  );
}
