"use client";

import { useRef, useState } from "react";
import { toast } from "sonner";
import { PageHeader } from "@/components/page-header";
import { Card, CardContent, CardHeader, CardTitle, CardDescription } from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { Separator } from "@/components/ui/separator";
import { PsvBadge, TonePill } from "@/components/status/badges";
import {
  Select,
  SelectContent,
  SelectItem,
  SelectTrigger,
  SelectValue,
} from "@/components/ui/select";
import { authorities } from "@/lib/mock-data";
import type { Tone } from "@/lib/status";
import type { PsvStatus } from "@/lib/types";
import { cn } from "@/lib/utils";
import {
  Check,
  UserPlus,
  ShieldCheck,
  FileStack,
  Send,
  CircleCheck,
  Lock,
  Upload,
  Bot,
  AlertTriangle,
  BellRing,
} from "lucide-react";

// Who performs each step. PSV itself is done by the provider, never by Veris (BR-61).
type Owner = "Officer" | "Agent" | "Agent + Officer" | "DataFlow";
const ownerTone: Record<Owner, Tone> = {
  Officer: "muted",
  Agent: "info",
  "Agent + Officer": "info",
  DataFlow: "escalate",
};

const STEPS: { key: string; label: string; icon: typeof Check; desc: string; owner: Owner }[] = [
  { key: "create", label: "Create record", icon: UserPlus, owner: "Officer", desc: "Officer or HR import creates the clinician master record (BR-01)." },
  { key: "psv-init", label: "Initiate PSV", icon: ShieldCheck, owner: "Agent + Officer", desc: "The agent assembles the PSV pack and chases missing documents; the officer initiates PSV once the pack is validated. PSV is never bypassed (BR-61)." },
  { key: "psv-verify", label: "PSV verified", icon: Check, owner: "DataFlow", desc: "DataFlow / TrueProfile verifies with the issuing bodies (6–12 weeks). Veris only reads the result." },
  { key: "assemble", label: "License pack", icon: FileStack, owner: "Agent", desc: "The agent assembles and validates the authority license application pack (BR-20..22)." },
  { key: "submit", label: "Assisted submit", icon: Send, owner: "Officer", desc: "Named approval, then the officer performs the assisted submit (BR-30/32)." },
  { key: "issued", label: "Licensed", icon: CircleCheck, owner: "Agent", desc: "License issued and recorded; payer paneling opens (Phase 2)." },
];

const PSV_SLOTS = ["Passport", "Degree Certificate", "Specialty Board Certificate", "Experience Letters"];
const LICENSE_SLOTS = ["Passport", "Emirates ID", "Degree Certificate", "Good Standing Certificate", "DataFlow PSV Report", "CPD Certificate"];
// Slots the agent already holds in the vault when the license pack is assembled.
const REUSED_SLOTS = ["Passport", "Degree Certificate"];
const NEW_LICENSE_SLOTS = ["Emirates ID", "Good Standing Certificate", "CPD Certificate"];

// Demo: the first upload of this document fails agent validation (BR-20/21), so the re-chase path is visible.
const FAIL_FIRST: Record<string, string> = {
  "Experience Letters": "Letter is unsigned and not on employer letterhead",
};

const DISCREPANCY = {
  slot: "Degree Certificate",
  detail: "The issuing university could not confirm the award date on the Degree Certificate.",
};

type DocStatus = "missing" | "requested" | "invalid" | "valid";
interface DocEntry {
  status: DocStatus;
  source?: string;
  reason?: string;
  attempts: number;
}
type Docs = Record<string, DocEntry>;

type Actor = "Agent" | "Officer" | "Clinician" | "DataFlow" | "Compliance Head";
const actorTone: Record<Actor, Tone> = {
  Agent: "info",
  Officer: "muted",
  Clinician: "warning",
  DataFlow: "escalate",
  "Compliance Head": "success",
};
interface LogEntry {
  id: number;
  at: string;
  actor: Actor;
  text: string;
}

const docMeta: Record<DocStatus, { label: string; tone: Tone }> = {
  missing: { label: "Not received", tone: "muted" },
  requested: { label: "Requested", tone: "info" },
  invalid: { label: "Failed validation", tone: "danger" },
  valid: { label: "Validated", tone: "success" },
};

const now = () => new Date().toLocaleTimeString([], { hour: "2-digit", minute: "2-digit" });
const list = (xs: string[]) => xs.join(", ");

export default function OnboardingPage() {
  const [step, setStep] = useState(0);
  const [name, setName] = useState("");
  const [authority, setAuthority] = useState("DHA");
  const [licenseType, setLicenseType] = useState("Specialist");
  const [docs, setDocs] = useState<Docs>({});
  const [psv, setPsv] = useState<PsvStatus>("not-started");
  const [psvRef, setPsvRef] = useState("");
  const [psvSince, setPsvSince] = useState("");
  const [log, setLog] = useState<LogEntry[]>([]);

  const fileRef = useRef<HTMLInputElement>(null);
  const pendingSlot = useRef("");
  const logId = useRef(0);

  const canStart = name.trim().length > 2;
  const who = name.trim() || "the clinician";
  const countValid = (slots: string[]) => slots.filter((s) => docs[s]?.status === "valid").length;
  const psvPackReady = countValid(PSV_SLOTS) === PSV_SLOTS.length;
  const licensePackReady = countValid(LICENSE_SLOTS) === LICENSE_SLOTS.length;

  function addLog(entries: { actor: Actor; text: string }[]) {
    const at = now();
    const stamped = entries.map((e) => ({ ...e, at, id: ++logId.current }));
    setLog((l) => [...stamped.reverse(), ...l]);
  }

  /** Agent chases the clinician by email + WhatsApp for every slot that is not yet validated. */
  function chase(slots: string[], current: Docs = docs) {
    const targets = slots.filter((s) => current[s]?.status !== "valid");
    if (targets.length === 0) return current;
    const next = { ...current };
    for (const s of targets) next[s] = { ...(next[s] ?? { attempts: 0 }), status: "requested" };
    setDocs(next);
    addLog([{ actor: "Agent", text: `Chased ${who} by email + WhatsApp for: ${list(targets)}` }]);
    return next;
  }

  /** A document arrives in the vault; the agent validates it (BR-20/21). */
  function receive(slots: string[], by: "Clinician" | "Officer", fileName?: string) {
    const next = { ...docs };
    const entries: { actor: Actor; text: string }[] = [];
    for (const s of slots) {
      const attempts = (next[s]?.attempts ?? 0) + 1;
      const fail = FAIL_FIRST[s];
      const source = `${by === "Officer" ? "Uploaded by officer" : "Uploaded by clinician"}${fileName ? ` · ${fileName}` : ""}`;
      entries.push({ actor: by, text: `${by === "Officer" ? "Uploaded on behalf:" : "Uploaded:"} ${s}${fileName ? ` (${fileName})` : ""}` });
      if (fail && attempts === 1) {
        next[s] = { status: "invalid", reason: fail, attempts, source };
        entries.push({ actor: "Agent", text: `Validation failed for ${s} — ${fail}. Re-chased ${who} with the reason.` });
      } else {
        next[s] = { status: "valid", attempts, source };
        entries.push({ actor: "Agent", text: `Validated ${s} and stored it in the vault` });
      }
    }
    setDocs(next);
    addLog(entries);
  }

  function pickFile(slot: string) {
    pendingSlot.current = slot;
    fileRef.current?.click();
  }

  function onFilePicked(e: React.ChangeEvent<HTMLInputElement>) {
    const file = e.target.files?.[0];
    e.target.value = "";
    if (file && pendingSlot.current) receive([pendingSlot.current], "Officer", file.name);
  }

  function createRecord() {
    const slots = PSV_SLOTS;
    const seeded: Docs = Object.fromEntries(slots.map((s) => [s, { status: "requested" as DocStatus, attempts: 0 }]));
    setDocs(seeded);
    setLog([]);
    addLog([
      { actor: "Officer", text: `Created clinician record for ${who} (${authority} ${licenseType})` },
      { actor: "Agent", text: `Assembled PSV initiation pack: ${slots.length} documents required, 0 on file` },
      { actor: "Agent", text: `Requested all ${slots.length} from ${who} by email + WhatsApp` },
    ]);
    setStep(1);
    toast.success("Record created — agent requested the PSV pack");
  }

  function initiatePsv() {
    const ref = `DF-${Math.floor(100000 + Math.random() * 900000)}`;
    setPsvRef(ref);
    setPsvSince(now());
    setPsv("in-progress");
    addLog([
      { actor: "Officer", text: `Initiated PSV with DataFlow (ref ${ref})` },
      { actor: "Agent", text: "Now monitoring DataFlow status; the license pack starts automatically once it returns Verified" },
    ]);
    setStep(2);
    toast.success("PSV initiated with DataFlow");
  }

  function providerVerified() {
    setPsv("verified");
    const next: Docs = { ...docs };
    for (const s of REUSED_SLOTS) next[s] = { ...next[s], status: "valid", source: "Reused from vault", attempts: next[s]?.attempts ?? 1 };
    next["DataFlow PSV Report"] = { status: "valid", source: "Auto-attached from DataFlow", attempts: 1 };
    for (const s of NEW_LICENSE_SLOTS) next[s] = { status: "requested", attempts: 0 };
    setDocs(next);
    addLog([
      { actor: "DataFlow", text: `Returned status: Verified (ref ${psvRef})` },
      { actor: "Agent", text: `Assembled ${authority} ${licenseType} license pack: ${REUSED_SLOTS.length} reused from vault, PSV report auto-attached` },
      { actor: "Agent", text: `Chased ${who} for: ${list(NEW_LICENSE_SLOTS)}` },
    ]);
    setStep(3);
    toast.success("PSV verified — agent assembling license pack");
  }

  function providerDiscrepancy() {
    setPsv("discrepancy");
    addLog([
      { actor: "DataFlow", text: `Returned status: Discrepancy — ${DISCREPANCY.detail}` },
      { actor: "Agent", text: "Raised a verification exception and routed it to the Compliance Head. No filing can proceed (BR-61)." },
    ]);
    toast.error("PSV discrepancy — routed to Compliance Head");
  }

  function returnForCorrection() {
    setDocs((d) => ({
      ...d,
      [DISCREPANCY.slot]: { status: "requested", attempts: d[DISCREPANCY.slot]?.attempts ?? 1, reason: DISCREPANCY.detail },
    }));
    setPsv("not-started");
    addLog([
      { actor: "Compliance Head", text: `Reviewed the exception and returned ${DISCREPANCY.slot} for a corrected copy` },
      { actor: "Agent", text: `Chased ${who} for a corrected ${DISCREPANCY.slot}. PSV must be re-initiated once it is validated.` },
    ]);
    setStep(1);
    toast.success("Returned to document collection");
  }

  function approvePack() {
    addLog([
      { actor: "Agent", text: "License pack validated (BR-20..22) — ready for approval" },
      { actor: "Compliance Head", text: "Recorded named approval for filing (BR-30)" },
    ]);
    setStep(4);
    toast.success("Pack validated and approved");
  }

  function submitFiling() {
    addLog([
      { actor: "Officer", text: `Performed assisted submit on the ${authority} portal (BR-32)` },
      { actor: "Agent", text: "Tracking the authority outcome and recording the license and expiry on issue" },
    ]);
    setStep(5);
    toast.success("License issued");
  }

  function reset() {
    setStep(0);
    setName("");
    setDocs({});
    setPsv("not-started");
    setPsvRef("");
    setPsvSince("");
    setLog([]);
  }

  return (
    <div>
      <PageHeader
        title="New-hire Onboarding"
        module="WF-B"
        description="Take a new hire from zero to licensed and panel-ready. PSV is mandatory and never short-circuited (BR-61)."
      />

      <input ref={fileRef} type="file" className="hidden" onChange={onFilePicked} />

      <div className="grid grid-cols-1 gap-5 lg:grid-cols-3">
        {/* Stepper rail */}
        <Card className="lg:col-span-1 lg:self-start">
          <CardHeader><CardTitle className="text-base">Progress</CardTitle></CardHeader>
          <CardContent>
            <ol className="space-y-1">
              {STEPS.map((s, i) => {
                const done = i < step;
                const active = i === step;
                const Icon = s.icon;
                return (
                  <li key={s.key} className={cn("flex items-start gap-3 rounded-lg p-2.5", active && "bg-muted")}>
                    <span className={cn(
                      "flex size-7 shrink-0 items-center justify-center rounded-full border",
                      done && "border-success bg-success/15 text-success",
                      active && "border-primary bg-primary text-primary-foreground",
                      !done && !active && "border-border text-muted-foreground",
                    )}>
                      {done ? <Check className="size-4" /> : <Icon className="size-4" />}
                    </span>
                    <div className="min-w-0 space-y-1">
                      <div className="flex flex-wrap items-center gap-2">
                        <span className={cn("text-sm font-medium", !active && !done && "text-muted-foreground")}>{s.label}</span>
                        <TonePill tone={ownerTone[s.owner]}>{s.owner}</TonePill>
                      </div>
                      <div className="text-xs text-muted-foreground">{s.desc}</div>
                    </div>
                  </li>
                );
              })}
            </ol>
          </CardContent>
        </Card>

        <div className="space-y-5 lg:col-span-2">
          {/* Active step */}
          <Card>
            <CardHeader>
              <CardTitle className="text-base">{STEPS[step].label}</CardTitle>
              <CardDescription>{STEPS[step].desc}</CardDescription>
            </CardHeader>
            <CardContent>
              {step === 0 && (
                <div className="space-y-4">
                  <div className="grid grid-cols-1 gap-4 sm:grid-cols-2">
                    <div className="space-y-1.5 sm:col-span-2">
                      <Label htmlFor="name">Clinician full name</Label>
                      <Input id="name" placeholder="Dr. New Hire" value={name} onChange={(e) => setName(e.target.value)} />
                    </div>
                    <div className="space-y-1.5">
                      <Label>Target authority</Label>
                      <Select value={authority} onValueChange={setAuthority}>
                        <SelectTrigger><SelectValue /></SelectTrigger>
                        <SelectContent>
                          {authorities.map((a) => (
                            <SelectItem key={a.code} value={a.code}>{a.code} — {a.name}</SelectItem>
                          ))}
                        </SelectContent>
                      </Select>
                    </div>
                    <div className="space-y-1.5">
                      <Label>License type</Label>
                      <Select value={licenseType} onValueChange={setLicenseType}>
                        <SelectTrigger><SelectValue /></SelectTrigger>
                        <SelectContent>
                          <SelectItem value="Specialist">Specialist</SelectItem>
                          <SelectItem value="General Practitioner">General Practitioner</SelectItem>
                          <SelectItem value="Registered Nurse">Registered Nurse</SelectItem>
                        </SelectContent>
                      </Select>
                    </div>
                  </div>
                  <Guard icon={<Bot className="mt-0.5 size-3.5 shrink-0" />}>
                    On creation the agent assembles the PSV pack and requests every document from the clinician by email and WhatsApp.
                  </Guard>
                  <Button disabled={!canStart} onClick={createRecord}>Create record</Button>
                </div>
              )}

              {step === 1 && (
                <StepBody
                  onNext={initiatePsv}
                  cta="Initiate PSV with DataFlow"
                  disabled={!psvPackReady}
                  hint={psvPackReady ? "Officer action — pack validated, ready to submit to the provider." : `Locked until all ${PSV_SLOTS.length} documents are validated.`}
                >
                  <DocChecklist
                    title="PSV initiation pack"
                    slots={PSV_SLOTS}
                    docs={docs}
                    onChase={() => chase(PSV_SLOTS)}
                    onSimulate={(slots) => receive(slots, "Clinician")}
                    onUpload={pickFile}
                  />
                  <Guard>PSV is mandatory. Veris tracks status but never bypasses verification (BR-61).</Guard>
                </StepBody>
              )}

              {step === 2 && (
                <div className="space-y-4">
                  <div className="space-y-3 rounded-lg border p-4">
                    <div className="flex flex-wrap items-center gap-2">
                      <PsvBadge status={psv} />
                      <span className="text-sm text-muted-foreground">DataFlow · ref {psvRef} · initiated {psvSince}</span>
                    </div>
                    {psv === "in-progress" && (
                      <p className="text-sm text-muted-foreground">
                        DataFlow is verifying each credential with its issuing body (typical lead 6–12 weeks). This status is read-only — Veris cannot mark it verified. The agent polls the feed and starts the license pack the moment it returns Verified.
                      </p>
                    )}
                    {psv === "verified" && (
                      <p className="text-sm text-muted-foreground">DataFlow returned Verified. The license pack has been assembled.</p>
                    )}
                    {psv === "discrepancy" && (
                      <div className="space-y-3">
                        <div className="flex items-start gap-3 rounded-lg border border-danger/30 bg-danger/5 p-3">
                          <AlertTriangle className="mt-0.5 size-4 shrink-0 text-danger" />
                          <div className="text-sm">
                            <div className="font-medium">Verification exception</div>
                            <p className="text-muted-foreground">{DISCREPANCY.detail}</p>
                            <p className="mt-1 text-muted-foreground">Routed to the Compliance Head. No filing proceeds until PSV returns Verified (BR-61).</p>
                          </div>
                        </div>
                        <Button variant="outline" onClick={returnForCorrection}>Compliance Head: return for corrected document</Button>
                      </div>
                    )}
                  </div>

                  {psv === "in-progress" && (
                    <div className="space-y-2 rounded-lg border border-dashed p-3">
                      <div className="text-xs font-medium text-muted-foreground">Demo only — simulate the provider&apos;s response</div>
                      <div className="flex flex-wrap gap-2">
                        <Button size="sm" variant="outline" onClick={providerVerified}>Provider returns Verified</Button>
                        <Button size="sm" variant="outline" onClick={providerDiscrepancy}>Provider returns Discrepancy</Button>
                      </div>
                    </div>
                  )}

                  {psv === "verified" && <Button onClick={() => setStep(3)}>Continue to license pack</Button>}
                  {psv !== "verified" && (
                    <Guard icon={<Lock className="mt-0.5 size-3.5 shrink-0" />}>
                      License pack is locked until DataFlow returns Verified (BR-61).
                    </Guard>
                  )}
                </div>
              )}

              {step === 3 && (
                <StepBody
                  onNext={approvePack}
                  cta="Record named approval"
                  disabled={!licensePackReady}
                  hint={licensePackReady ? "Pack complete and validated — a named approver can sign off (BR-30)." : "Locked until every document in the pack is validated (BR-22)."}
                >
                  <DocChecklist
                    title={`${authority} ${licenseType} application`}
                    slots={LICENSE_SLOTS}
                    docs={docs}
                    onChase={() => chase(LICENSE_SLOTS)}
                    onSimulate={(slots) => receive(slots, "Clinician")}
                    onUpload={pickFile}
                  />
                </StepBody>
              )}

              {step === 4 && (
                <StepBody onNext={submitFiling} cta="I have submitted the filing">
                  <Guard>Named approval recorded. Officer performs the final assisted submit on the {authority} portal (BR-32).</Guard>
                </StepBody>
              )}

              {step === 5 && (
                <div className="space-y-4">
                  <div className="flex items-center gap-3 rounded-lg border border-success/40 bg-success/5 p-4">
                    <CircleCheck className="size-6 text-success" />
                    <div>
                      <div className="font-medium">{name || "New hire"} is licensed</div>
                      <p className="text-sm text-muted-foreground">
                        {authority} {licenseType} license recorded in the register. Payer paneling sub-process opens (Phase 2).
                      </p>
                    </div>
                  </div>
                  <Button variant="outline" onClick={reset}>Onboard another clinician</Button>
                </div>
              )}

              {step === 3 && (
                <>
                  <Separator className="my-4" />
                  <Button variant="ghost" size="sm" onClick={() => setStep(2)}>Back a step</Button>
                </>
              )}
              {step === 4 && (
                <>
                  <Separator className="my-4" />
                  <Button variant="ghost" size="sm" onClick={() => setStep(3)}>Back a step</Button>
                </>
              )}
            </CardContent>
          </Card>

          {/* Activity log */}
          <Card>
            <CardHeader>
              <CardTitle className="text-base">Activity</CardTitle>
              <CardDescription>Who did what — agent, officer, clinician and provider. Every action is logged (BR-31).</CardDescription>
            </CardHeader>
            <CardContent>
              {log.length === 0 ? (
                <p className="text-sm text-muted-foreground">Nothing yet. Create the record to start.</p>
              ) : (
                <ul className="space-y-3">
                  {log.map((e) => (
                    <li key={e.id} className="flex items-start gap-3 text-sm">
                      <span className="w-12 shrink-0 pt-0.5 text-xs tabular-nums text-muted-foreground">{e.at}</span>
                      <TonePill tone={actorTone[e.actor]} className="shrink-0">{e.actor}</TonePill>
                      <span className="min-w-0">{e.text}</span>
                    </li>
                  ))}
                </ul>
              )}
            </CardContent>
          </Card>
        </div>
      </div>
    </div>
  );
}

function StepBody({
  children,
  onNext,
  cta,
  disabled,
  hint,
}: {
  children: React.ReactNode;
  onNext: () => void;
  cta: string;
  disabled?: boolean;
  hint?: string;
}) {
  return (
    <div className="space-y-4">
      {children}
      <div className="flex flex-wrap items-center gap-3">
        <Button disabled={disabled} onClick={onNext}>{cta}</Button>
        {hint && <span className="text-xs text-muted-foreground">{hint}</span>}
      </div>
    </div>
  );
}

function DocChecklist({
  title,
  slots,
  docs,
  onChase,
  onSimulate,
  onUpload,
}: {
  title: string;
  slots: string[];
  docs: Docs;
  onChase: () => void;
  onSimulate: (slots: string[]) => void;
  onUpload: (slot: string) => void;
}) {
  const outstanding = slots.filter((s) => docs[s]?.status !== "valid");
  const valid = slots.length - outstanding.length;
  // Items the agent can still receive from the clinician (everything except provider-sourced).
  const receivable = outstanding.filter((s) => s !== "DataFlow PSV Report");

  return (
    <div className="rounded-lg border">
      <div className="flex flex-wrap items-center justify-between gap-2 border-b bg-muted/30 px-4 py-2">
        <div className="text-sm font-medium">{title}</div>
        <span className="text-xs text-muted-foreground">{valid} of {slots.length} validated</span>
      </div>
      <ul className="divide-y">
        {slots.map((s) => {
          const d: DocEntry = docs[s] ?? { status: "missing", attempts: 0 };
          const m = docMeta[d.status];
          const open = d.status !== "valid" && s !== "DataFlow PSV Report";
          return (
            <li key={s} className="flex flex-wrap items-center justify-between gap-2 px-4 py-2.5 text-sm">
              <div className="min-w-0">
                <div className="flex items-center gap-2">
                  {d.status === "valid" && <Check className="size-3.5 text-success" />}
                  <span>{s}</span>
                </div>
                {d.status === "invalid" && d.reason && <div className="text-xs text-danger">{d.reason}</div>}
                {d.status === "requested" && d.reason && <div className="text-xs text-muted-foreground">{d.reason}</div>}
                {d.status === "valid" && d.source && <div className="text-xs text-muted-foreground">{d.source}</div>}
              </div>
              <div className="flex items-center gap-2">
                <TonePill tone={m.tone}>{m.label}</TonePill>
                {open && (
                  <>
                    <Button size="xs" variant="outline" onClick={() => onSimulate([s])}>Simulate clinician upload</Button>
                    <Button size="xs" variant="ghost" className="gap-1" onClick={() => onUpload(s)}>
                      <Upload className="size-3" /> Upload on behalf
                    </Button>
                  </>
                )}
              </div>
            </li>
          );
        })}
      </ul>
      {outstanding.length > 0 && (
        <div className="flex flex-wrap items-center gap-2 border-t bg-muted/20 px-4 py-2">
          <Button size="xs" variant="outline" className="gap-1" onClick={onChase}>
            <BellRing className="size-3" /> Chase clinician now
          </Button>
          {receivable.length > 1 && (
            <Button size="xs" variant="ghost" onClick={() => onSimulate(receivable)}>Simulate all clinician uploads</Button>
          )}
          <span className="text-xs text-muted-foreground">
            The agent also chases automatically. Uploads are demo-simulated; &ldquo;Upload on behalf&rdquo; reads a file name only, nothing is stored.
          </span>
        </div>
      )}
    </div>
  );
}

function Guard({ children, icon }: { children: React.ReactNode; icon?: React.ReactNode }) {
  return (
    <div className="flex items-start gap-2 rounded-lg border bg-muted/40 p-3 text-xs text-muted-foreground">
      {icon ?? <Lock className="mt-0.5 size-3.5 shrink-0" />}
      <span>{children}</span>
    </div>
  );
}
