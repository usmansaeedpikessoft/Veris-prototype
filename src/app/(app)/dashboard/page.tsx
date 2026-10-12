"use client";

import { useEffect, useMemo } from "react";
import Link from "next/link";
import { useRouter } from "next/navigation";
import { toast } from "sonner";
import { PageHeader } from "@/components/page-header";
import { StatTile } from "@/components/stat-tile";
import { Card, CardContent, CardHeader, CardTitle, CardDescription } from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import { Separator } from "@/components/ui/separator";
import { AuthorityBarChart, ExpiryDonut } from "@/components/charts";
import { CaseStatePill, ExpiryBadge, TonePill } from "@/components/status/badges";
import { UserAvatar } from "@/components/user-avatar";
import { useMergedData, useCurrentUser, computeAtRisk } from "@/lib/view";
import { useVeris } from "@/lib/store";
import { clinicianName, authorityName } from "@/lib/mock-data";
import { daysUntil, fmtDate } from "@/lib/dates";
import {
  Users,
  FolderKanban,
  TriangleAlert,
  CircleCheck,
  ShieldCheck,
  DollarSign,
  ArrowRight,
  Plus,
} from "lucide-react";

export default function DashboardPage() {
  const router = useRouter();
  const user = useCurrentUser();
  const data = useMergedData();
  const openCaseForGap = useVeris((s) => s.openCaseForGap);
  const audit = useVeris((s) => s.audit);

  useEffect(() => {
    if (user.role === "clinician") router.replace("/me");
  }, [user.role, router]);

  const isExec = user.role === "exec";

  const stats = useMemo(() => {
    const creds = data.credentials;
    const buckets = { e30: 0, e60: 0, e90: 0, expired: 0 };
    for (const c of creds) {
      const d = daysUntil(c.expiryDate);
      if (d < 0) buckets.expired++;
      else if (d <= 30) buckets.e30++;
      else if (d <= 60) buckets.e60++;
      else if (d <= 90) buckets.e90++;
    }
    const activeCases = data.cases.filter(
      (c) => c.state !== "Completed",
    ).length;
    const completed = data.cases.filter((c) => c.state === "Completed").length;
    const escalations = data.cases.filter((c) => c.state === "Escalated");
    const atRisk = computeAtRisk(data);

    const byAuthority = new Map<string, number>();
    for (const c of data.cases) {
      if (c.state === "Completed") continue;
      byAuthority.set(c.authority, (byAuthority.get(c.authority) ?? 0) + 1);
    }
    const authorityData = [...byAuthority.entries()]
      .map(([authority, open]) => ({ authority, open }))
      .sort((a, b) => b.open - a.open);

    return { buckets, activeCases, completed, escalations, atRisk, authorityData };
  }, [data]);

  const donutData = [
    { name: "Expired", value: stats.buckets.expired },
    { name: "≤30 days", value: stats.buckets.e30 },
    { name: "31–60 days", value: stats.buckets.e60 },
    { name: "61–90 days", value: stats.buckets.e90 },
  ];

  // Illustrative value protected (docs §10 ROI model, all assumptions).
  const clinicianCount = data.clinicians.length;
  const valueProtected = Math.round(
    clinicianCount * 8 * 0.5 * 20 + stats.buckets.expired * 10 * 400,
  );

  function handleOpenGap(credId: string) {
    const caseId = openCaseForGap(credId);
    if (caseId) {
      toast.success("Renewal case opened", {
        description: "Checklist generated and documents requested (WF-D).",
      });
      router.push(`/cases/${caseId}`);
    }
  }

  return (
    <div>
      <PageHeader
        title="Compliance Dashboard"
        module="DASH"
        description={
          isExec
            ? "Executive view — compliance risk, lapse exposure and illustrative value protected."
            : "Real-time credential risk across the group. Answer “who is at risk in 90 days?” in seconds (OBJ-3)."
        }
      />

      {/* KPI row */}
      <div className="grid grid-cols-2 gap-4 lg:grid-cols-4">
        <StatTile
          label="Clinicians managed"
          value={clinicianCount}
          sub={`${data.credentials.length} credentials tracked`}
          icon={Users}
          tone="info"
        />
        <StatTile
          label="Active cases"
          value={stats.activeCases}
          sub={`${stats.completed} completed`}
          icon={FolderKanban}
          tone="info"
        />
        <StatTile
          label="At risk (≤90 days)"
          value={stats.atRisk.length}
          sub={`${stats.escalations.length} escalated`}
          icon={TriangleAlert}
          tone={stats.atRisk.length ? "danger" : "success"}
        />
        {isExec ? (
          <StatTile
            label="Value protected / yr"
            value={`$${(valueProtected / 1000).toFixed(0)}k`}
            sub="Illustrative (docs §10)"
            icon={DollarSign}
            tone="success"
          />
        ) : (
          <StatTile
            label="Lapse-free guarantee"
            value="100%"
            sub="≥1 escalation before any expiry (NFR-REL-01)"
            icon={ShieldCheck}
            tone="success"
          />
        )}
      </div>

      {/* Expiry buckets + donut */}
      <div className="mt-5 grid grid-cols-1 gap-4 lg:grid-cols-3">
        <Card className="lg:col-span-2">
          <CardHeader>
            <CardTitle className="text-base">Expiries by 30 / 60 / 90 days</CardTitle>
            <CardDescription>Drill into any bucket to see the clinicians (FEAT-DASH-01).</CardDescription>
          </CardHeader>
          <CardContent>
            <div className="grid grid-cols-2 gap-3 sm:grid-cols-4">
              {[
                { label: "Expired", n: stats.buckets.expired, tone: "escalate" as const, q: "expired" },
                { label: "≤ 30 days", n: stats.buckets.e30, tone: "danger" as const, q: "30" },
                { label: "31–60 days", n: stats.buckets.e60, tone: "warning" as const, q: "60" },
                { label: "61–90 days", n: stats.buckets.e90, tone: "warning" as const, q: "90" },
              ].map((b) => (
                <Link
                  key={b.label}
                  href={`/register?bucket=${b.q}`}
                  className="group rounded-lg border p-4 transition-colors hover:bg-muted/50"
                >
                  <div className="text-3xl font-semibold tabular-nums">{b.n}</div>
                  <div className="mt-1 flex items-center justify-between">
                    <TonePill tone={b.tone}>{b.label}</TonePill>
                    <ArrowRight className="size-3.5 text-muted-foreground opacity-0 transition-opacity group-hover:opacity-100" />
                  </div>
                </Link>
              ))}
            </div>
          </CardContent>
        </Card>
        <Card>
          <CardHeader>
            <CardTitle className="text-base">Risk distribution</CardTitle>
            <CardDescription>Credentials within 90 days.</CardDescription>
          </CardHeader>
          <CardContent>
            <ExpiryDonut data={donutData} />
          </CardContent>
        </Card>
      </div>

      {/* At-risk + bottlenecks */}
      <div className="mt-5 grid grid-cols-1 gap-4 lg:grid-cols-3">
        <Card className="lg:col-span-2">
          <CardHeader className="flex-row items-center justify-between space-y-0">
            <div>
              <CardTitle className="text-base">At-risk clinicians</CardTitle>
              <CardDescription>
                No open case, escalated or stalled — the lapse-prevention watch (WF-D / FEAT-DASH-02).
              </CardDescription>
            </div>
          </CardHeader>
          <CardContent className="px-0">
            <div className="divide-y">
              {stats.atRisk.slice(0, 8).map((item) => (
                <div
                  key={item.credential.id}
                  className="flex items-center gap-3 px-6 py-3"
                >
                  <UserAvatar
                    name={item.clinician ? clinicianName(item.clinician) : "?"}
                    seed={item.clinician?.photoSeed}
                    className="size-8"
                  />
                  <div className="min-w-0 flex-1">
                    <Link
                      href={`/register/${item.credential.clinicianId}`}
                      className="truncate text-sm font-medium hover:underline"
                    >
                      {item.clinician ? clinicianName(item.clinician) : item.credential.clinicianId}
                    </Link>
                    <div className="truncate text-xs text-muted-foreground">
                      {authorityName(item.credential.authority)} · {item.credential.licenseType} · expires {fmtDate(item.credential.expiryDate)}
                    </div>
                  </div>
                  <ExpiryBadge expiry={item.credential.expiryDate} />
                  {item.reason === "no-case" ? (
                    <Button size="sm" className="h-8 gap-1" onClick={() => handleOpenGap(item.credential.id)}>
                      <Plus className="size-3.5" /> Open case
                    </Button>
                  ) : item.caseId ? (
                    <Button asChild size="sm" variant="outline" className="h-8">
                      <Link href={`/cases/${item.caseId}`}>View</Link>
                    </Button>
                  ) : (
                    <Button size="sm" className="h-8 gap-1" onClick={() => handleOpenGap(item.credential.id)}>
                      <Plus className="size-3.5" /> Open case
                    </Button>
                  )}
                </div>
              ))}
              {stats.atRisk.length === 0 && (
                <div className="px-6 py-10 text-center text-sm text-muted-foreground">
                  No at-risk credentials. Every expiry inside 90 days has an active case.
                </div>
              )}
            </div>
          </CardContent>
        </Card>

        <Card>
          <CardHeader>
            <CardTitle className="text-base">Bottlenecks by authority</CardTitle>
            <CardDescription>Open case volume (FEAT-DASH-03).</CardDescription>
          </CardHeader>
          <CardContent>
            <AuthorityBarChart data={stats.authorityData} />
          </CardContent>
        </Card>
      </div>

      {/* Escalations + audit feed */}
      <div className="mt-5 grid grid-cols-1 gap-4 lg:grid-cols-3">
        <Card className="lg:col-span-2">
          <CardHeader>
            <CardTitle className="text-base">Active escalations</CardTitle>
            <CardDescription>Officer → Compliance Head → Medical Director (BR-40 / FEAT-DASH-05).</CardDescription>
          </CardHeader>
          <CardContent className="space-y-2">
            {stats.escalations.length === 0 && (
              <p className="py-4 text-sm text-muted-foreground">No active escalations.</p>
            )}
            {stats.escalations.map((c) => {
              const clinician = data.clinicianById(c.clinicianId);
              return (
                <Link
                  key={c.id}
                  href={`/cases/${c.id}`}
                  className="flex items-center gap-3 rounded-lg border p-3 transition-colors hover:bg-muted/50"
                >
                  <TonePill tone="escalate">{c.escalation?.currentTier ?? "Officer"}</TonePill>
                  <div className="min-w-0 flex-1">
                    <div className="truncate text-sm font-medium">
                      {clinician ? clinicianName(clinician) : c.clinicianId}
                    </div>
                    <div className="truncate text-xs text-muted-foreground">
                      {authorityName(c.authority)} · {c.licenseType}
                    </div>
                  </div>
                  <ExpiryBadge expiry={c.dueDate} />
                </Link>
              );
            })}
          </CardContent>
        </Card>

        <Card>
          <CardHeader className="flex-row items-center justify-between space-y-0">
            <CardTitle className="text-base">Recent audit</CardTitle>
            <Button asChild variant="ghost" size="sm" className="h-7 gap-1 text-xs">
              <Link href="/audit">
                View all <ArrowRight className="size-3" />
              </Link>
            </Button>
          </CardHeader>
          <CardContent className="space-y-3">
            {audit.slice(0, 6).map((e) => (
              <div key={e.id} className="flex gap-2.5 text-xs">
                <div className="mt-1 size-1.5 shrink-0 rounded-full bg-primary" />
                <div className="min-w-0">
                  <p className="truncate text-foreground">{e.action}</p>
                  <p className="text-muted-foreground">{e.actor}</p>
                </div>
              </div>
            ))}
          </CardContent>
        </Card>
      </div>

      {isExec && (
        <Card className="mt-5">
          <CardHeader>
            <CardTitle className="text-base">Illustrative ROI model</CardTitle>
            <CardDescription>
              Every input is assumed and shown only to illustrate structure (docs §10). Replace with discovery data.
            </CardDescription>
          </CardHeader>
          <CardContent>
            <div className="grid grid-cols-2 gap-4 sm:grid-cols-4">
              <div>
                <div className="text-xs text-muted-foreground">Staff time saved</div>
                <div className="text-xl font-semibold">${(clinicianCount * 8 * 0.5 * 20 / 1000).toFixed(0)}k/yr</div>
              </div>
              <div>
                <div className="text-xs text-muted-foreground">Lapse losses avoided</div>
                <div className="text-xl font-semibold">${(stats.buckets.expired * 10 * 400 / 1000).toFixed(0)}k/yr</div>
              </div>
              <div>
                <div className="text-xs text-muted-foreground">Hosting</div>
                <div className="text-xl font-semibold">In-region</div>
              </div>
              <div>
                <div className="text-xs text-muted-foreground">Audit reconstruction</div>
                <div className="text-xl font-semibold">Seconds</div>
              </div>
            </div>
            <Separator className="my-4" />
            <p className="text-xs text-muted-foreground">
              Do not present these as established figures. Baselines must be captured from the lighthouse group during Stage 0.
            </p>
          </CardContent>
        </Card>
      )}
    </div>
  );
}
