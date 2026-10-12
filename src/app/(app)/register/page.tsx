"use client";

import { useMemo, useState, Suspense } from "react";
import Link from "next/link";
import { useSearchParams } from "next/navigation";
import { PageHeader } from "@/components/page-header";
import { Card } from "@/components/ui/card";
import { Input } from "@/components/ui/input";
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
import { CaseStatePill, ExpiryBadge, PsvBadge } from "@/components/status/badges";
import { useMergedData } from "@/lib/view";
import { authorities, authorityName, clinicianName } from "@/lib/mock-data";
import { daysUntil } from "@/lib/dates";
import { Search } from "lucide-react";

function RegisterInner() {
  const data = useMergedData();
  const params = useSearchParams();
  const bucketParam = params.get("bucket");
  const [q, setQ] = useState("");
  const [authority, setAuthority] = useState<string>("all");
  const [bucket, setBucket] = useState<string>(bucketParam ?? "all");

  const rows = useMemo(() => {
    return data.credentials
      .map((cred) => {
        const clinician = data.clinicianById(cred.clinicianId);
        const kase = data.caseByCredential(cred.id);
        return { cred, clinician, kase, days: daysUntil(cred.expiryDate) };
      })
      .filter((r) => {
        if (!r.clinician) return false;
        if (authority !== "all" && r.cred.authority !== authority) return false;
        if (bucket !== "all") {
          const d = r.days;
          if (bucket === "expired" && d >= 0) return false;
          if (bucket === "30" && !(d >= 0 && d <= 30)) return false;
          if (bucket === "60" && !(d > 30 && d <= 60)) return false;
          if (bucket === "90" && !(d > 60 && d <= 90)) return false;
        }
        if (q) {
          const hay = `${clinicianName(r.clinician)} ${r.clinician.specialty} ${r.cred.licenseType} ${r.cred.licenseNumber}`.toLowerCase();
          if (!hay.includes(q.toLowerCase())) return false;
        }
        return true;
      })
      .sort((a, b) => a.days - b.days);
  }, [data, q, authority, bucket]);

  return (
    <div>
      <PageHeader
        title="Credential Register"
        module="REG"
        description="One master record per clinician; each credential tracked with its own authority, expiry and lifecycle state (BR-01/02/03)."
      />

      <Card className="mb-4 flex flex-col gap-3 p-3 sm:flex-row sm:items-center">
        <div className="relative flex-1">
          <Search className="pointer-events-none absolute left-3 top-1/2 size-4 -translate-y-1/2 text-muted-foreground" />
          <Input
            placeholder="Search clinician, specialty, license number…"
            value={q}
            onChange={(e) => setQ(e.target.value)}
            className="pl-9"
          />
        </div>
        <Select value={authority} onValueChange={setAuthority}>
          <SelectTrigger className="w-full sm:w-48">
            <SelectValue placeholder="Authority" />
          </SelectTrigger>
          <SelectContent>
            <SelectItem value="all">All authorities</SelectItem>
            {authorities.map((a) => (
              <SelectItem key={a.code} value={a.code}>
                {a.code} — {a.name}
              </SelectItem>
            ))}
          </SelectContent>
        </Select>
        <Select value={bucket} onValueChange={setBucket}>
          <SelectTrigger className="w-full sm:w-40">
            <SelectValue placeholder="Expiry" />
          </SelectTrigger>
          <SelectContent>
            <SelectItem value="all">All expiries</SelectItem>
            <SelectItem value="expired">Expired</SelectItem>
            <SelectItem value="30">≤ 30 days</SelectItem>
            <SelectItem value="60">31–60 days</SelectItem>
            <SelectItem value="90">61–90 days</SelectItem>
          </SelectContent>
        </Select>
      </Card>

      <Card className="overflow-hidden p-0">
        <Table>
          <TableHeader>
            <TableRow>
              <TableHead>Clinician</TableHead>
              <TableHead className="hidden md:table-cell">Authority</TableHead>
              <TableHead className="hidden lg:table-cell">License type</TableHead>
              <TableHead className="hidden xl:table-cell">PSV</TableHead>
              <TableHead>Expiry</TableHead>
              <TableHead>Case state</TableHead>
            </TableRow>
          </TableHeader>
          <TableBody>
            {rows.map(({ cred, clinician, kase }) => (
              <TableRow key={cred.id} className="cursor-default">
                <TableCell>
                  <Link
                    href={`/register/${cred.clinicianId}`}
                    className="flex items-center gap-3 hover:underline"
                  >
                    <UserAvatar name={clinicianName(clinician!)} seed={clinician!.photoSeed} />
                    <div className="min-w-0">
                      <div className="truncate text-sm font-medium">
                        {clinicianName(clinician!)}
                      </div>
                      <div className="truncate text-xs text-muted-foreground">
                        {clinician!.specialty} · {clinician!.site}
                      </div>
                    </div>
                  </Link>
                </TableCell>
                <TableCell className="hidden md:table-cell">
                  <span className="text-sm">{cred.authority}</span>
                  <div className="text-xs text-muted-foreground">
                    {authorityName(cred.authority).split(" ").slice(0, 2).join(" ")}
                  </div>
                </TableCell>
                <TableCell className="hidden lg:table-cell text-sm">
                  {cred.licenseType}
                </TableCell>
                <TableCell className="hidden xl:table-cell">
                  <PsvBadge status={cred.psvStatus} />
                </TableCell>
                <TableCell>
                  <ExpiryBadge expiry={cred.expiryDate} />
                </TableCell>
                <TableCell>
                  {kase ? (
                    <Link href={`/cases/${kase.id}`}>
                      <CaseStatePill state={cred.state} />
                    </Link>
                  ) : (
                    <CaseStatePill state={cred.state} />
                  )}
                </TableCell>
              </TableRow>
            ))}
            {rows.length === 0 && (
              <TableRow>
                <TableCell colSpan={6} className="h-24 text-center text-muted-foreground">
                  No credentials match these filters.
                </TableCell>
              </TableRow>
            )}
          </TableBody>
        </Table>
      </Card>
      <p className="mt-3 text-xs text-muted-foreground">
        {rows.length} credential{rows.length === 1 ? "" : "s"} shown.
      </p>
    </div>
  );
}

export default function RegisterPage() {
  return (
    <Suspense fallback={null}>
      <RegisterInner />
    </Suspense>
  );
}
