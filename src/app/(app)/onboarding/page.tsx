"use client";

import { useState } from "react";
import { toast } from "sonner";
import { PageHeader } from "@/components/page-header";
import { Card, CardContent, CardHeader, CardTitle, CardDescription } from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { Separator } from "@/components/ui/separator";
import { TonePill } from "@/components/status/badges";
import {
  Select,
  SelectContent,
  SelectItem,
  SelectTrigger,
  SelectValue,
} from "@/components/ui/select";
import { authorities } from "@/lib/mock-data";
import { cn } from "@/lib/utils";
import { Check, UserPlus, ShieldCheck, FileStack, Send, CircleCheck, Lock } from "lucide-react";

const STEPS = [
  { key: "create", label: "Create record", icon: UserPlus, desc: "Officer or HR import creates the clinician master record (BR-01)." },
  { key: "psv-init", label: "Initiate PSV", icon: ShieldCheck, desc: "Assemble the PSV initiation pack and start primary-source verification. PSV is never bypassed (BR-61)." },
  { key: "psv-verify", label: "PSV verified", icon: Check, desc: "DataFlow / TrueProfile returns a verified result (6–12 week lead time)." },
  { key: "assemble", label: "License pack", icon: FileStack, desc: "Assemble and validate the authority license application pack (BR-20..22)." },
  { key: "submit", label: "Assisted submit", icon: Send, desc: "Named approval, then officer performs the assisted submit (BR-30/32)." },
  { key: "issued", label: "Licensed", icon: CircleCheck, desc: "License issued and recorded; payer paneling opens (Phase 2)." },
];

export default function OnboardingPage() {
  const [step, setStep] = useState(0);
  const [name, setName] = useState("");
  const [authority, setAuthority] = useState("DHA");
  const [licenseType, setLicenseType] = useState("Specialist");

  const canStart = name.trim().length > 2;

  function next(msg: string) {
    setStep((s) => Math.min(s + 1, STEPS.length - 1));
    toast.success(msg);
  }

  function reset() {
    setStep(0);
    setName("");
  }

  return (
    <div>
      <PageHeader
        title="New-hire Onboarding"
        module="WF-B"
        description="Take a new hire from zero to licensed and panel-ready. PSV is mandatory and never short-circuited (BR-61)."
      />

      <div className="grid grid-cols-1 gap-5 lg:grid-cols-3">
        {/* Stepper rail */}
        <Card className="lg:col-span-1">
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
                    <div className="min-w-0">
                      <div className={cn("text-sm font-medium", !active && !done && "text-muted-foreground")}>{s.label}</div>
                      <div className="text-xs text-muted-foreground">{s.desc}</div>
                    </div>
                  </li>
                );
              })}
            </ol>
          </CardContent>
        </Card>

        {/* Active step */}
        <Card className="lg:col-span-2">
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
                <Button disabled={!canStart} onClick={() => next("Clinician record created")}>Create record</Button>
              </div>
            )}

            {step === 1 && (
              <StepBody onNext={() => next("PSV initiated with DataFlow")} cta="Initiate PSV">
                <Pack title="PSV initiation pack" items={["Passport", "Degree Certificate", "Specialty Board Certificate", "Experience Letters"]} />
                <Guard>PSV is mandatory. Veris tracks status but never bypasses verification (BR-61).</Guard>
              </StepBody>
            )}

            {step === 2 && (
              <StepBody onNext={() => next("PSV verified — assembling license pack")} cta="Mark PSV verified">
                <div className="flex items-center gap-2"><TonePill tone="info">PSV In Progress</TonePill><span className="text-sm text-muted-foreground">DataFlow · typical lead 6–12 weeks</span></div>
                <p className="text-sm text-muted-foreground">On a discrepancy, the case routes to a verification exception reviewed by the Compliance Head — no filing proceeds.</p>
              </StepBody>
            )}

            {step === 3 && (
              <StepBody onNext={() => next("Pack validated and approved")} cta="Validate & approve pack">
                <Pack title={`${authority} ${licenseType} application`} items={["Passport", "Emirates ID", "Degree Certificate", "Good Standing Certificate", "DataFlow PSV Report", "CPD Certificate"]} />
              </StepBody>
            )}

            {step === 4 && (
              <StepBody onNext={() => next("License issued")} cta="I have submitted the filing">
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

            {step > 0 && step < 5 && (
              <>
                <Separator className="my-4" />
                <Button variant="ghost" size="sm" onClick={() => setStep((s) => Math.max(0, s - 1))}>Back a step</Button>
              </>
            )}
          </CardContent>
        </Card>
      </div>
    </div>
  );
}

function StepBody({ children, onNext, cta }: { children: React.ReactNode; onNext: () => void; cta: string }) {
  return (
    <div className="space-y-4">
      {children}
      <Button onClick={onNext}>{cta}</Button>
    </div>
  );
}

function Pack({ title, items }: { title: string; items: string[] }) {
  return (
    <div className="rounded-lg border">
      <div className="border-b bg-muted/30 px-4 py-2 text-sm font-medium">{title}</div>
      <ul className="divide-y">
        {items.map((it) => (
          <li key={it} className="flex items-center gap-2 px-4 py-2 text-sm">
            <Check className="size-3.5 text-success" /> {it}
          </li>
        ))}
      </ul>
    </div>
  );
}

function Guard({ children }: { children: React.ReactNode }) {
  return (
    <div className="flex items-start gap-2 rounded-lg border bg-muted/40 p-3 text-xs text-muted-foreground">
      <Lock className="mt-0.5 size-3.5 shrink-0" />
      <span>{children}</span>
    </div>
  );
}
