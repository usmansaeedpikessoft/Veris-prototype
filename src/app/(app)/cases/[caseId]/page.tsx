"use client";

import { useState } from "react";
import Link from "next/link";
import { useParams, useRouter } from "next/navigation";
import { toast } from "sonner";
import { PageHeader } from "@/components/page-header";
import { Card, CardContent, CardHeader, CardTitle, CardDescription } from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import { Badge } from "@/components/ui/badge";
import { Separator } from "@/components/ui/separator";
import { Textarea } from "@/components/ui/textarea";
import { Label } from "@/components/ui/label";
import {
  Dialog,
  DialogContent,
  DialogDescription,
  DialogFooter,
  DialogHeader,
  DialogTitle,
  DialogTrigger,
} from "@/components/ui/dialog";
import { UserAvatar } from "@/components/user-avatar";
import { CaseStatePill, ExpiryBadge, DocValidationBadge, TonePill } from "@/components/status/badges";
import { CaseStepper } from "@/components/case/case-stepper";
import { useMergedData, useCurrentUser } from "@/lib/view";
import { useVeris } from "@/lib/store";
import { can } from "@/lib/rbac";
import { clinicianName, authorityName, authorityMap, rejectionMap } from "@/lib/mock-data";
import { fmtDate, fmtDateTime, daysUntil } from "@/lib/dates";
import {
  ArrowLeft,
  CircleCheck,
  CircleAlert,
  FileText,
  Upload,
  ShieldCheck,
  Send,
  Gavel,
  Lock,
  RefreshCw,
  CircleX,
  TriangleAlert,
  ArrowUpCircle,
} from "lucide-react";

export default function CaseWorkspacePage() {
  const params = useParams<{ caseId: string }>();
  const router = useRouter();
  const data = useMergedData();
  const user = useCurrentUser();
  const store = useVeris();
  const kase = data.cases.find((c) => c.id === params.caseId);

  const [approveNote, setApproveNote] = useState("");
  const [approveOpen, setApproveOpen] = useState(false);

  if (!kase) {
    return (
      <div className="py-20 text-center">
        <p className="text-muted-foreground">Case not found.</p>
        <Button asChild variant="link"><Link href="/cases">Back to queue</Link></Button>
      </div>
    );
  }

  const clinician = data.clinicianById(kase.clinicianId);
  const credential = data.credentialById(kase.credentialId);
  const auth = authorityMap[kase.authority];
  const canAct = can(user.role, "progress-case") !== null;
  const canApprove = can(user.role, "approve-filing") !== null;

  const missing = kase.checklist.filter(
    (i) => i.validation === "missing" || i.validation === "stale" || i.validation === "invalid" || i.validation === "pending",
  );
  const packComplete = missing.length === 0;

  function act(fn: () => void, msg: string) {
    fn();
    toast.success(msg);
  }

  return (
    <div>
      <Button variant="ghost" size="sm" className="mb-3 gap-1.5 text-muted-foreground" onClick={() => router.back()}>
        <ArrowLeft className="size-4" /> Back
      </Button>

      <PageHeader
        title={clinician ? clinicianName(clinician) : kase.clinicianId}
        module="REN / PACK / SUB"
        description={`${authorityName(kase.authority)} · ${kase.licenseType} · ${kase.type} case`}
      >
        <CaseStatePill state={kase.state} className="text-sm" />
      </PageHeader>

      {/* Stepper */}
      <Card className="mb-5">
        <CardContent>
          <CaseStepper state={kase.state} />
        </CardContent>
      </Card>

      <div className="grid grid-cols-1 gap-5 lg:grid-cols-3">
        {/* Main column */}
        <div className="space-y-5 lg:col-span-2">
          {/* Action panel */}
          <ActionPanel />

          {/* Checklist / pack */}
          <Card>
            <CardHeader>
              <CardTitle className="text-base">Renewal pack checklist</CardTitle>
              <CardDescription>
                Generated from the active {kase.authority} rule set. Validation checks type, readability, freshness and format (SP-VAL).
              </CardDescription>
            </CardHeader>
            <CardContent className="px-0">
              <div className="divide-y border-y">
                {kase.checklist.map((item) => (
                  <div key={item.id} className="flex items-start gap-3 px-6 py-3">
                    <FileText className="mt-0.5 size-4 shrink-0 text-muted-foreground" />
                    <div className="min-w-0 flex-1">
                      <div className="text-sm font-medium">{item.slot}</div>
                      {item.note && <div className="mt-0.5 text-xs text-danger">{item.note}</div>}
                    </div>
                    <DocValidationBadge v={item.validation} />
                  </div>
                ))}
              </div>
            </CardContent>
          </Card>

          {/* Timeline */}
          <Card>
            <CardHeader>
              <CardTitle className="text-base">Case timeline</CardTitle>
              <CardDescription>Every transition is written to the immutable audit log (BR-31).</CardDescription>
            </CardHeader>
            <CardContent>
              <ol className="relative ml-2 border-l">
                {kase.timeline.slice().reverse().map((t) => (
                  <li key={t.id} className="mb-4 pl-5 last:mb-0">
                    <span className="absolute -left-[5px] mt-1 size-2.5 rounded-full bg-primary" />
                    <div className="text-sm">{t.action}</div>
                    {t.note && <div className="text-xs text-muted-foreground italic">“{t.note}”</div>}
                    <div className="text-xs text-muted-foreground">{t.actor} · {fmtDateTime(t.at)}</div>
                  </li>
                ))}
              </ol>
            </CardContent>
          </Card>
        </div>

        {/* Sidebar */}
        <div className="space-y-5">
          <Card>
            <CardHeader><CardTitle className="text-base">Readiness gate</CardTitle></CardHeader>
            <CardContent className="space-y-3">
              <Readiness ok={packComplete} label="Pack complete" detail={packComplete ? "All required documents valid" : `${missing.length} item(s) outstanding`} />
              <Readiness ok={kase.cpdOk} label="CPD threshold met" detail={credential ? `${credential.cpdLedger.reduce((a, c) => a + c.hours, 0)} / ${credential.cpdRequired} hours` : ""} />
              <Readiness ok={kase.psvOk} label="PSV verified" detail={credential?.psvStatus === "verified" ? "DataFlow report cleared" : "Verification pending"} />
              <Separator />
              <div className="flex items-center justify-between text-sm">
                <span className="text-muted-foreground">Filing deadline</span>
                <ExpiryBadge expiry={kase.dueDate} />
              </div>
            </CardContent>
          </Card>

          <Card>
            <CardHeader><CardTitle className="text-base">Approvals</CardTitle></CardHeader>
            <CardContent className="space-y-3">
              {kase.approvals.length === 0 && (
                <p className="text-sm text-muted-foreground">No approval recorded yet. A named approval is required before submission (BR-30 / BR-62).</p>
              )}
              {kase.approvals.map((a) => (
                <div key={a.id} className="rounded-lg border p-3">
                  <div className="flex items-center gap-2">
                    <Gavel className="size-4 text-success" />
                    <span className="text-sm font-medium">{a.approverName}</span>
                    <TonePill tone="success" className="ml-auto">{a.decision}</TonePill>
                  </div>
                  <div className="mt-1 text-xs text-muted-foreground">{a.approverRole} · {fmtDateTime(a.timestamp)}</div>
                  {a.note && <div className="mt-1 text-xs italic">“{a.note}”</div>}
                </div>
              ))}
            </CardContent>
          </Card>

          <Card>
            <CardHeader><CardTitle className="text-base">Assignee</CardTitle></CardHeader>
            <CardContent className="flex items-center gap-3">
              <UserAvatar name={kase.assignee} />
              <div>
                <div className="text-sm font-medium">{kase.assignee}</div>
                <div className="text-xs text-muted-foreground">Credentialing Officer</div>
              </div>
            </CardContent>
          </Card>
        </div>
      </div>
    </div>
  );

  // ---- contextual action panel ----
  function ActionPanel() {
    if (!canAct && !canApprove) {
      return (
        <Card className="border-dashed">
          <CardContent className="flex items-center gap-3 py-4 text-sm text-muted-foreground">
            <Lock className="size-4" /> You are viewing this case in a read-only role. Actions are limited to Credentialing Officers and Compliance Heads.
          </CardContent>
        </Card>
      );
    }

    const s = kase!.state;

    if (s === "Open") {
      return (
        <ActionCard
          tone="info"
          title="Open case — generate checklist"
          body="Generate the authority-specific checklist and request any missing or stale documents from the clinician via email + WhatsApp (SP-NOT)."
        >
          <Button onClick={() => act(() => store.requestDocuments(kase!.id), "Checklist generated and documents requested")}>
            Generate checklist &amp; request documents
          </Button>
        </ActionCard>
      );
    }

    if (s === "CollectingDocs") {
      return (
        <ActionCard
          tone="warning"
          title="Collecting documents"
          body={`${missing.length} item(s) outstanding. In a live system the clinician uploads to the vault; simulate that here, then run validation.`}
        >
          <Button variant="outline" className="gap-1.5" onClick={() => act(() => store.simulateUpload(kase!.id), "Clinician uploaded the requested documents")}>
            <Upload className="size-4" /> Simulate clinician upload
          </Button>
          <Button className="gap-1.5" onClick={() => act(() => store.runValidation(kase!.id), "Validation run")}>
            <RefreshCw className="size-4" /> Run validation
          </Button>
        </ActionCard>
      );
    }

    if (s === "Validating") {
      return (
        <ActionCard
          tone="info"
          title="Validating pack"
          body={packComplete ? "All documents valid. Run validation to confirm readiness and advance to approval." : `${missing.length} item(s) still fail validation. Upload corrected documents, then re-run.`}
        >
          {!packComplete && (
            <Button variant="outline" className="gap-1.5" onClick={() => act(() => store.simulateUpload(kase!.id), "Corrected documents uploaded")}>
              <Upload className="size-4" /> Simulate corrected upload
            </Button>
          )}
          <Button className="gap-1.5" onClick={() => act(() => store.runValidation(kase!.id), packComplete ? "Pack complete — ready for approval" : "Validation re-run")}>
            <RefreshCw className="size-4" /> Run validation
          </Button>
        </ActionCard>
      );
    }

    if (s === "ReadyForApproval") {
      return (
        <ActionCard
          tone="warning"
          title="Ready for approval"
          body="The pack is complete and readiness checks pass. A named human approval is required before any submission (SP-APP, BR-30)."
        >
          {canApprove ? (
            <Dialog open={approveOpen} onOpenChange={setApproveOpen}>
              <DialogTrigger asChild>
                <Button className="gap-1.5"><Gavel className="size-4" /> Approve for filing</Button>
              </DialogTrigger>
              <DialogContent>
                <DialogHeader>
                  <DialogTitle>Record named approval</DialogTitle>
                  <DialogDescription>
                    Your identity and timestamp will be written to the immutable audit log (BR-30 / BR-31). There is no auto-submit path.
                  </DialogDescription>
                </DialogHeader>
                <div className="space-y-3">
                  <div className="rounded-lg border bg-muted/40 p-3 text-sm">
                    <div className="flex items-center gap-2">
                      <UserAvatar name={user.name} seed={user.avatarSeed} className="size-7" />
                      <div>
                        <div className="font-medium">{user.name}</div>
                        <div className="text-xs text-muted-foreground">{user.roleLabel}</div>
                      </div>
                    </div>
                  </div>
                  <div className="space-y-1.5">
                    <Label htmlFor="note">Approval note (optional)</Label>
                    <Textarea id="note" placeholder="e.g. Pack reviewed; all documents valid." value={approveNote} onChange={(e) => setApproveNote(e.target.value)} />
                  </div>
                </div>
                <DialogFooter>
                  <Button variant="outline" onClick={() => setApproveOpen(false)}>Cancel</Button>
                  <Button
                    onClick={() => {
                      store.approveFiling(kase!.id, approveNote || undefined);
                      setApproveOpen(false);
                      setApproveNote("");
                      toast.success("Named approval recorded", { description: "Case moved to Approved for Filing." });
                    }}
                  >
                    Confirm approval
                  </Button>
                </DialogFooter>
              </DialogContent>
            </Dialog>
          ) : (
            <p className="text-sm text-muted-foreground">Awaiting approval from an Officer, Compliance Head or Medical Director.</p>
          )}
        </ActionCard>
      );
    }

    if (s === "ApprovedForFiling") {
      return (
        <ActionCard
          tone="info"
          title="Approved — assisted submission"
          body="Veris has prepared the complete filing. In Phase 1 a human officer performs the final portal login and submit (assisted mode, BR-32) — Veris never submits unattended."
        >
          <div className="w-full rounded-lg border bg-muted/40 p-3 text-xs text-muted-foreground">
            <div className="flex items-center gap-1.5 font-medium text-foreground"><Lock className="size-3.5" /> {auth?.portal} portal{auth?.twoFactor ? ` · ${auth.twoFactor}` : ""}</div>
            <p className="mt-1">Officer logs in, attaches the prepared pack, pays the fee, and submits.</p>
          </div>
          <Button className="gap-1.5" onClick={() => act(() => store.submitFiling(kase!.id), "Filing submitted (assisted) — now tracking")}>
            <Send className="size-4" /> I have submitted the filing
          </Button>
        </ActionCard>
      );
    }

    if (s === "Submitted" || s === "Tracking") {
      return (
        <ActionCard
          tone="info"
          title="Tracking authority outcome"
          body="Veris polls the authority / PSV status where permitted (SP-TRK). Record the outcome when the authority responds."
        >
          <Button className="gap-1.5" onClick={() => act(() => store.recordOutcome(kase!.id, "issued"), "License issued — new expiry written back")}>
            <CircleCheck className="size-4" /> License issued
          </Button>
          <Button variant="outline" className="gap-1.5" onClick={() => act(() => store.recordOutcome(kase!.id, "rejected"), "Rejection recorded — entering exception handling")}>
            <CircleX className="size-4" /> Authority rejected / queried
          </Button>
        </ActionCard>
      );
    }

    if (s === "Rejected") {
      const reason = kase!.rejection ? rejectionMap[kase!.rejection.reasonCode] : undefined;
      return (
        <ActionCard
          tone="danger"
          title="Rejected — exception handling (WF-C)"
          body={reason ? `${reason.category}: ${reason.label}` : "Classify the rejection reason and route a corrective action."}
        >
          {reason && (
            <div className="w-full rounded-lg border border-danger/30 bg-danger/5 p-3 text-sm">
              <div className="font-medium text-danger">Proposed corrective action</div>
              <p className="mt-1 text-muted-foreground">{reason.proposedAction}</p>
              {reason.requiredDocument && <p className="mt-1 text-xs">Required: {reason.requiredDocument}</p>}
            </div>
          )}
          <Button className="gap-1.5" onClick={() => act(() => store.classifyAndRemediate(kase!.id), "Corrective action routed — remediating")}>
            <TriangleAlert className="size-4" /> Start remediation
          </Button>
        </ActionCard>
      );
    }

    if (s === "Remediating") {
      return (
        <ActionCard
          tone="warning"
          title="Remediating"
          body="The corrective task is assigned. Once the corrected document is re-validated, the pack returns for re-approval (BR-22, BR-30)."
        >
          <Button className="gap-1.5" onClick={() => act(() => store.resubmitCorrected(kase!.id), "Corrected pack re-validated — ready for re-approval")}>
            <RefreshCw className="size-4" /> Mark corrected &amp; re-validate
          </Button>
        </ActionCard>
      );
    }

    if (s === "Escalated") {
      return (
        <ActionCard
          tone="escalate"
          title={`Escalated — ${kase!.escalation?.currentTier ?? "Officer"}`}
          body="No forward progress within the SLA window. Restore ownership to resume the renewal, or escalate to the next tier (BR-40)."
        >
          <Button className="gap-1.5" onClick={() => act(() => store.requestDocuments(kase!.id), "Ownership restored — renewal resumed")}>
            <RefreshCw className="size-4" /> Restore ownership &amp; resume
          </Button>
          <Button variant="outline" className="gap-1.5" onClick={() => act(() => store.escalateNext(kase!.id), "Escalated to next tier")}>
            <ArrowUpCircle className="size-4" /> Escalate to next tier
          </Button>
        </ActionCard>
      );
    }

    if (s === "Completed") {
      return (
        <Card className="border-success/40 bg-success/5">
          <CardContent className="flex items-center gap-3 py-5">
            <CircleCheck className="size-6 text-success" />
            <div>
              <div className="font-medium">Renewal completed</div>
              <p className="text-sm text-muted-foreground">
                License issued and the new expiry ({credential ? fmtDate(credential.expiryDate) : "—"}) written back to the register. Case closed.
              </p>
            </div>
          </CardContent>
        </Card>
      );
    }
    return null;
  }
}

function ActionCard({
  title,
  body,
  tone,
  children,
}: {
  title: string;
  body: string;
  tone: "info" | "warning" | "danger" | "escalate";
  children: React.ReactNode;
}) {
  const border = {
    info: "border-info/40",
    warning: "border-warning/40",
    danger: "border-danger/40",
    escalate: "border-escalate/40",
  }[tone];
  return (
    <Card className={border}>
      <CardHeader>
        <CardTitle className="text-base">{title}</CardTitle>
        <CardDescription>{body}</CardDescription>
      </CardHeader>
      <CardContent className="flex flex-wrap gap-2">{children}</CardContent>
    </Card>
  );
}

function Readiness({ ok, label, detail }: { ok: boolean; label: string; detail: string }) {
  return (
    <div className="flex items-start gap-2.5">
      {ok ? (
        <CircleCheck className="mt-0.5 size-4 shrink-0 text-success" />
      ) : (
        <CircleAlert className="mt-0.5 size-4 shrink-0 text-warning" />
      )}
      <div className="min-w-0">
        <div className="text-sm font-medium">{label}</div>
        <div className="text-xs text-muted-foreground">{detail}</div>
      </div>
    </div>
  );
}
