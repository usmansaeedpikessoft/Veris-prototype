"use client";

import { toast } from "sonner";
import { PageHeader } from "@/components/page-header";
import { Card, CardContent, CardHeader, CardTitle, CardDescription } from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import { Progress } from "@/components/ui/progress";
import { Separator } from "@/components/ui/separator";
import { UserAvatar } from "@/components/user-avatar";
import { CaseStatePill, ExpiryBadge, DocValidationBadge, PsvBadge } from "@/components/status/badges";
import { useMergedData, useCurrentUser } from "@/lib/view";
import { useVeris } from "@/lib/store";
import { clinicianName, authorityName } from "@/lib/mock-data";
import { fmtDate } from "@/lib/dates";
import { Upload, FileText, CircleCheck, Lock, GraduationCap } from "lucide-react";

export default function MePage() {
  const user = useCurrentUser();
  const data = useMergedData();
  const simulateUpload = useVeris((s) => s.simulateUpload);

  if (!user.clinicianId) {
    return (
      <Card className="mx-auto mt-10 max-w-md">
        <CardContent className="py-10 text-center">
          <Lock className="mx-auto mb-3 size-6 text-muted-foreground" />
          <p className="text-sm text-muted-foreground">
            The self-service portal is scoped to clinician accounts. Switch to the clinician persona (Dr. Sara Haddad) to view it.
          </p>
        </CardContent>
      </Card>
    );
  }

  const clinician = data.clinicianById(user.clinicianId);
  const credentials = clinician ? data.credentialsForClinician(clinician.id) : [];

  // Open requests addressed to this clinician (missing/stale docs).
  const requests = credentials
    .map((cred) => ({ cred, kase: data.caseByCredential(cred.id) }))
    .filter(({ kase }) => kase && kase.checklist.some((i) => i.validation === "missing" || i.validation === "stale"));

  return (
    <div>
      <div className="mb-6 flex items-center gap-4">
        <UserAvatar name={user.name} seed={user.avatarSeed} className="size-14 text-lg" />
        <div>
          <h1 className="text-2xl font-semibold tracking-tight">Welcome, {clinician ? clinician.firstName : user.name}</h1>
          <p className="text-sm text-muted-foreground">Your credentials, documents and renewal status — in one place.</p>
        </div>
      </div>

      {/* Action needed */}
      {requests.length > 0 ? (
        <Card className="mb-5 border-warning/40">
          <CardHeader>
            <CardTitle className="text-base">Action needed</CardTitle>
            <CardDescription>Veris has requested the following documents for your renewal. Upload to keep your license on track.</CardDescription>
          </CardHeader>
          <CardContent className="space-y-4">
            {requests.map(({ cred, kase }) => {
              const outstanding = kase!.checklist.filter((i) => i.validation === "missing" || i.validation === "stale");
              return (
                <div key={cred.id} className="rounded-lg border p-4">
                  <div className="mb-3 flex items-center justify-between">
                    <div className="text-sm font-medium">{authorityName(cred.authority)} · {cred.licenseType}</div>
                    <ExpiryBadge expiry={cred.expiryDate} />
                  </div>
                  <ul className="mb-3 space-y-2">
                    {outstanding.map((i) => (
                      <li key={i.id} className="flex items-start gap-2 text-sm">
                        <FileText className="mt-0.5 size-4 shrink-0 text-muted-foreground" />
                        <div className="min-w-0">
                          <div>{i.slot}</div>
                          {i.note && <div className="text-xs text-danger">{i.note}</div>}
                        </div>
                        <DocValidationBadge v={i.validation} className="ml-auto" />
                      </li>
                    ))}
                  </ul>
                  <Button
                    size="sm"
                    className="gap-1.5"
                    onClick={() => {
                      simulateUpload(kase!.id);
                      toast.success("Documents uploaded", { description: "Your credentialing officer has been notified." });
                    }}
                  >
                    <Upload className="size-4" /> Upload documents
                  </Button>
                </div>
              );
            })}
          </CardContent>
        </Card>
      ) : (
        <Card className="mb-5 border-success/40 bg-success/5">
          <CardContent className="flex items-center gap-3 py-5">
            <CircleCheck className="size-6 text-success" />
            <div>
              <div className="font-medium">You&apos;re all caught up</div>
              <p className="text-sm text-muted-foreground">No documents are currently requested from you.</p>
            </div>
          </CardContent>
        </Card>
      )}

      {/* Credentials */}
      <h2 className="mb-3 text-lg font-semibold">My credentials</h2>
      <div className="grid grid-cols-1 gap-4 md:grid-cols-2">
        {credentials.map((cred) => {
          const cpdTotal = cred.cpdLedger.reduce((a, c) => a + c.hours, 0);
          const cpdPct = Math.min(100, Math.round((cpdTotal / cred.cpdRequired) * 100));
          return (
            <Card key={cred.id}>
              <CardHeader>
                <div className="flex items-start justify-between">
                  <div>
                    <CardTitle className="text-base">{authorityName(cred.authority)}</CardTitle>
                    <CardDescription>{cred.licenseType} · No. {cred.licenseNumber}</CardDescription>
                  </div>
                  <CaseStatePill state={cred.state} />
                </div>
              </CardHeader>
              <CardContent className="space-y-3">
                <div className="flex flex-wrap items-center gap-2">
                  <ExpiryBadge expiry={cred.expiryDate} />
                  <PsvBadge status={cred.psvStatus} />
                  <span className="text-xs text-muted-foreground">Expires {fmtDate(cred.expiryDate)}</span>
                </div>
                <Separator />
                <div>
                  <div className="mb-1 flex items-center justify-between text-xs">
                    <span className="flex items-center gap-1 text-muted-foreground"><GraduationCap className="size-3.5" /> CPD</span>
                    <span>{cpdTotal} / {cred.cpdRequired} h</span>
                  </div>
                  <Progress value={cpdPct} className="h-2" />
                </div>
              </CardContent>
            </Card>
          );
        })}
      </div>

      <p className="mt-5 flex items-center gap-1.5 text-xs text-muted-foreground">
        <Lock className="size-3" /> You can only see your own record, documents and status (self-scoped access, FR-SEC-02).
      </p>
    </div>
  );
}
