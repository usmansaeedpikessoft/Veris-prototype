"use client";

import Link from "next/link";
import { useParams, useRouter } from "next/navigation";
import { PageHeader } from "@/components/page-header";
import { Card, CardContent, CardHeader, CardTitle, CardDescription } from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import { Badge } from "@/components/ui/badge";
import { Progress } from "@/components/ui/progress";
import { Separator } from "@/components/ui/separator";
import { Tabs, TabsContent, TabsList, TabsTrigger } from "@/components/ui/tabs";
import { UserAvatar } from "@/components/user-avatar";
import { CaseStatePill, ExpiryBadge, PsvBadge, DocValidationBadge, TonePill } from "@/components/status/badges";
import { useMergedData } from "@/lib/view";
import { docsForCredential, clinicianName, authorityName, authorityMap } from "@/lib/mock-data";
import { fmtDate } from "@/lib/dates";
import {
  ArrowLeft,
  Mail,
  Phone,
  MapPin,
  IdCard,
  FileText,
  GraduationCap,
  ShieldAlert,
  ArrowRight,
  Lock,
} from "lucide-react";

export default function ClinicianDetailPage() {
  const params = useParams<{ clinicianId: string }>();
  const router = useRouter();
  const data = useMergedData();
  const clinician = data.clinicianById(params.clinicianId);

  if (!clinician) {
    return (
      <div className="py-20 text-center">
        <p className="text-muted-foreground">Clinician not found.</p>
        <Button asChild variant="link">
          <Link href="/register">Back to register</Link>
        </Button>
      </div>
    );
  }

  const credentials = data.credentialsForClinician(clinician.id);

  return (
    <div>
      <Button
        variant="ghost"
        size="sm"
        className="mb-3 gap-1.5 text-muted-foreground"
        onClick={() => router.back()}
      >
        <ArrowLeft className="size-4" /> Back
      </Button>

      {/* Master record header */}
      <Card className="mb-5">
        <CardContent className="flex flex-col gap-4 sm:flex-row sm:items-center">
          <UserAvatar name={clinicianName(clinician)} seed={clinician.photoSeed} className="size-16 text-lg" />
          <div className="min-w-0 flex-1">
            <h1 className="text-xl font-semibold">{clinicianName(clinician)}</h1>
            <p className="text-sm text-muted-foreground">{clinician.specialty}</p>
            <div className="mt-2 flex flex-wrap gap-x-4 gap-y-1 text-xs text-muted-foreground">
              <span className="flex items-center gap-1"><Mail className="size-3" />{clinician.email}</span>
              <span className="flex items-center gap-1"><Phone className="size-3" />{clinician.phone}</span>
              <span className="flex items-center gap-1"><MapPin className="size-3" />{clinician.site}</span>
            </div>
          </div>
          <div className="shrink-0 rounded-lg border bg-muted/40 p-3 text-xs">
            <div className="flex items-center gap-1.5 font-medium"><IdCard className="size-3.5" />Unique key (BR-01)</div>
            <div className="mt-1 font-mono text-muted-foreground">{clinician.nationalId}</div>
            <div className="font-mono text-muted-foreground">Passport {clinician.passportNo}</div>
          </div>
        </CardContent>
      </Card>

      <PageHeader title="Credentials" module="REG" description={`${credentials.length} credential record${credentials.length === 1 ? "" : "s"} — each with its own authority, expiry and lifecycle (BR-02).`} />

      <div className="space-y-5">
        {credentials.map((cred) => {
          const docs = docsForCredential(cred.id);
          const kase = data.caseByCredential(cred.id);
          const cpdTotal = cred.cpdLedger.reduce((a, c) => a + c.hours, 0);
          const cpdPct = Math.min(100, Math.round((cpdTotal / cred.cpdRequired) * 100));
          const auth = authorityMap[cred.authority];
          return (
            <Card key={cred.id} className="overflow-hidden">
              <CardHeader className="flex-col gap-3 border-b bg-muted/30 sm:flex-row sm:items-center sm:justify-between">
                <div>
                  <CardTitle className="flex items-center gap-2 text-base">
                    {authorityName(cred.authority)}
                    <Badge variant="outline" className="font-mono text-[10px]">{cred.authority}</Badge>
                  </CardTitle>
                  <CardDescription>
                    {cred.licenseType} · No. {cred.licenseNumber} · Portal: {auth?.portal}
                  </CardDescription>
                </div>
                <div className="flex flex-wrap items-center gap-2">
                  <PsvBadge status={cred.psvStatus} />
                  <ExpiryBadge expiry={cred.expiryDate} />
                  <CaseStatePill state={cred.state} />
                </div>
              </CardHeader>
              <CardContent className="pt-5">
                <div className="mb-4 grid grid-cols-2 gap-4 sm:grid-cols-4">
                  <Meta label="Issued" value={fmtDate(cred.issueDate)} />
                  <Meta label="Expires" value={fmtDate(cred.expiryDate)} />
                  <Meta label="Renewal cycle" value={`${cred.renewalCycleYears} year${cred.renewalCycleYears > 1 ? "s" : ""}`} />
                  <Meta label="PSV provider" value={cred.psvProvider} />
                </div>

                <Tabs defaultValue="documents">
                  <TabsList>
                    <TabsTrigger value="documents">Document Vault</TabsTrigger>
                    <TabsTrigger value="cpd">CPD Ledger</TabsTrigger>
                    <TabsTrigger value="paneling">Paneling &amp; Privileges</TabsTrigger>
                    <TabsTrigger value="history">Case History</TabsTrigger>
                  </TabsList>

                  <TabsContent value="documents" className="mt-4">
                    <div className="rounded-lg border divide-y">
                      {docs.map((d) => (
                        <div key={d.id} className="flex items-center gap-3 px-4 py-2.5">
                          <FileText className="size-4 shrink-0 text-muted-foreground" />
                          <div className="min-w-0 flex-1">
                            <div className="truncate text-sm font-medium">{d.type}</div>
                            <div className="truncate text-xs text-muted-foreground">
                              {d.uploadedAt ? `Uploaded ${fmtDate(d.uploadedAt)}` : "Not uploaded"}
                              {d.expiresAt ? ` · valid to ${fmtDate(d.expiresAt)}` : ""}
                            </div>
                            {d.failureReason && (
                              <div className="mt-0.5 text-xs text-danger">{d.failureReason}</div>
                            )}
                          </div>
                          <DocValidationBadge v={d.validation} />
                        </div>
                      ))}
                    </div>
                    <p className="mt-2 flex items-center gap-1.5 text-xs text-muted-foreground">
                      <Lock className="size-3" /> Identity documents encrypted at rest; access logged (BR-51 / FEAT-SEC-02).
                    </p>
                  </TabsContent>

                  <TabsContent value="cpd" className="mt-4">
                    <div className="mb-3 flex items-center justify-between">
                      <div>
                        <div className="text-sm font-medium">
                          {cpdTotal} / {cred.cpdRequired} CPD hours
                        </div>
                        <div className="text-xs text-muted-foreground">
                          Required by {cred.authority} before renewal readiness (BR-12).
                        </div>
                      </div>
                      <TonePill tone={cpdTotal >= cred.cpdRequired ? "success" : "warning"}>
                        {cpdTotal >= cred.cpdRequired ? "Met" : "Shortfall"}
                      </TonePill>
                    </div>
                    <Progress value={cpdPct} className="mb-4 h-2" />
                    <div className="rounded-lg border divide-y">
                      {cred.cpdLedger.map((e) => (
                        <div key={e.id} className="flex items-center gap-3 px-4 py-2 text-sm">
                          <GraduationCap className="size-4 text-muted-foreground" />
                          <div className="min-w-0 flex-1">
                            <div className="truncate font-medium">{e.title}</div>
                            <div className="truncate text-xs text-muted-foreground">{e.provider} · {fmtDate(e.date)}</div>
                          </div>
                          <span className="font-medium tabular-nums">{e.hours}h</span>
                        </div>
                      ))}
                    </div>
                  </TabsContent>

                  <TabsContent value="paneling" className="mt-4 space-y-4">
                    <div className="rounded-lg border p-4">
                      <div className="flex items-center justify-between">
                        <div className="text-sm font-medium">Payer paneling</div>
                        <Badge variant="outline" className="text-[10px]">Phase 2</Badge>
                      </div>
                      <div className="mt-3 space-y-2">
                        {["Daman — National Health Insurance", "AXA Gulf", "Bupa Arabia"].map((p, i) => (
                          <div key={p} className="flex items-center justify-between text-sm">
                            <span>{p}</span>
                            <TonePill tone={i === 2 ? "warning" : "success"}>
                              {i === 2 ? "Renewal due" : "Enrolled"}
                            </TonePill>
                          </div>
                        ))}
                      </div>
                    </div>
                    <div className="rounded-lg border p-4">
                      <div className="flex items-center justify-between">
                        <div className="text-sm font-medium">Clinical privileges</div>
                        <Badge variant="outline" className="text-[10px]">Tracking only</Badge>
                      </div>
                      <div className="mt-3 flex flex-wrap gap-2">
                        {["Inpatient admission", "Minor procedures", "On-call cover", `${clinician.specialty} clinic`].map((pr) => (
                          <Badge key={pr} variant="secondary">{pr}</Badge>
                        ))}
                      </div>
                      <p className="mt-3 flex items-center gap-1.5 text-xs text-muted-foreground">
                        <ShieldAlert className="size-3" /> Veris records and displays privileges; it never makes a privileging decision (BR-63).
                      </p>
                    </div>
                  </TabsContent>

                  <TabsContent value="history" className="mt-4">
                    {kase ? (
                      <div className="space-y-3">
                        <div className="flex items-center justify-between rounded-lg border bg-muted/30 px-4 py-2.5">
                          <div className="text-sm">
                            Active case <span className="font-mono text-xs text-muted-foreground">{kase.id}</span>
                          </div>
                          <Button asChild size="sm" variant="outline" className="gap-1">
                            <Link href={`/cases/${kase.id}`}>Open case <ArrowRight className="size-3.5" /></Link>
                          </Button>
                        </div>
                        <ol className="relative ml-2 border-l pl-5">
                          {kase.timeline.slice().reverse().map((t) => (
                            <li key={t.id} className="mb-3">
                              <span className="absolute -left-[5px] mt-1 size-2.5 rounded-full bg-primary" />
                              <div className="text-sm">{t.action}</div>
                              <div className="text-xs text-muted-foreground">
                                {t.actor} · {fmtDate(t.at)}
                              </div>
                            </li>
                          ))}
                        </ol>
                      </div>
                    ) : (
                      <p className="py-6 text-center text-sm text-muted-foreground">
                        No case history — this credential is current with no open action.
                      </p>
                    )}
                  </TabsContent>
                </Tabs>
              </CardContent>
            </Card>
          );
        })}
      </div>
    </div>
  );
}

function Meta({ label, value }: { label: string; value: string }) {
  return (
    <div>
      <div className="text-xs text-muted-foreground">{label}</div>
      <div className="text-sm font-medium">{value}</div>
    </div>
  );
}
