import { cn } from "@/lib/utils";
import {
  caseStateMeta,
  docValidationMeta,
  psvMeta,
  expiryBucket,
  toneClasses,
  toneDot,
  type Tone,
} from "@/lib/status";
import type { CaseState, DocValidation, PsvStatus } from "@/lib/types";
import { daysUntil } from "@/lib/dates";

function Pill({
  tone,
  children,
  dot = true,
  className,
}: {
  tone: Tone;
  children: React.ReactNode;
  dot?: boolean;
  className?: string;
}) {
  return (
    <span
      className={cn(
        "inline-flex items-center gap-1.5 rounded-full border px-2 py-0.5 text-xs font-medium whitespace-nowrap",
        toneClasses[tone],
        className,
      )}
    >
      {dot && <span className={cn("size-1.5 rounded-full", toneDot[tone])} />}
      {children}
    </span>
  );
}

export function CaseStatePill({ state, className }: { state: CaseState; className?: string }) {
  const m = caseStateMeta[state];
  return (
    <Pill tone={m.tone} className={className}>
      {m.label}
    </Pill>
  );
}

export function DocValidationBadge({ v, className }: { v: DocValidation; className?: string }) {
  const m = docValidationMeta[v];
  return (
    <Pill tone={m.tone} className={className}>
      {m.label}
    </Pill>
  );
}

export function PsvBadge({ status, className }: { status: PsvStatus; className?: string }) {
  const m = psvMeta[status];
  return (
    <Pill tone={m.tone} className={className}>
      {m.label}
    </Pill>
  );
}

export function ExpiryBadge({ expiry, className }: { expiry: string; className?: string }) {
  const days = daysUntil(expiry);
  const b = expiryBucket(days);
  return (
    <Pill tone={b.tone} className={className}>
      {b.label}
    </Pill>
  );
}

export function TonePill({
  tone,
  children,
  className,
}: {
  tone: Tone;
  children: React.ReactNode;
  className?: string;
}) {
  return (
    <Pill tone={tone} className={className}>
      {children}
    </Pill>
  );
}
