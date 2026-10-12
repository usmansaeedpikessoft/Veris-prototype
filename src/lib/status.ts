import type { CaseState, DocValidation, PsvStatus } from "./types";

export type Tone = "success" | "warning" | "danger" | "info" | "escalate" | "muted";

export const toneClasses: Record<Tone, string> = {
  success: "bg-success/12 text-success border-success/25",
  warning: "bg-warning/15 text-warning border-warning/30",
  danger: "bg-danger/12 text-danger border-danger/25",
  info: "bg-info/12 text-info border-info/25",
  escalate: "bg-escalate/12 text-escalate border-escalate/25",
  muted: "bg-muted text-muted-foreground border-border",
};

export const toneDot: Record<Tone, string> = {
  success: "bg-success",
  warning: "bg-warning",
  danger: "bg-danger",
  info: "bg-info",
  escalate: "bg-escalate",
  muted: "bg-muted-foreground",
};

// Case state → label + tone (docs 02 state model)
export const caseStateMeta: Record<CaseState, { label: string; tone: Tone }> = {
  Open: { label: "Open", tone: "muted" },
  CollectingDocs: { label: "Collecting Docs", tone: "info" },
  Validating: { label: "Validating", tone: "info" },
  ReadyForApproval: { label: "Ready for Approval", tone: "warning" },
  ApprovedForFiling: { label: "Approved for Filing", tone: "info" },
  Submitted: { label: "Submitted", tone: "info" },
  Tracking: { label: "Tracking", tone: "info" },
  Rejected: { label: "Rejected", tone: "danger" },
  Remediating: { label: "Remediating", tone: "warning" },
  Completed: { label: "Completed", tone: "success" },
  Escalated: { label: "Escalated", tone: "escalate" },
};

// Ordered pipeline for the case stepper (happy path)
export const caseFlow: CaseState[] = [
  "Open",
  "CollectingDocs",
  "Validating",
  "ReadyForApproval",
  "ApprovedForFiling",
  "Submitted",
  "Tracking",
  "Completed",
];

export const docValidationMeta: Record<
  DocValidation,
  { label: string; tone: Tone }
> = {
  valid: { label: "Valid", tone: "success" },
  stale: { label: "Stale", tone: "warning" },
  invalid: { label: "Invalid", tone: "danger" },
  missing: { label: "Missing", tone: "muted" },
  pending: { label: "Pending", tone: "info" },
};

export const psvMeta: Record<PsvStatus, { label: string; tone: Tone }> = {
  "not-started": { label: "PSV Not Started", tone: "muted" },
  "in-progress": { label: "PSV In Progress", tone: "info" },
  verified: { label: "PSV Verified", tone: "success" },
  discrepancy: { label: "PSV Discrepancy", tone: "danger" },
};

// Expiry urgency bucket from days-to-expiry
export function expiryBucket(days: number): {
  label: string;
  tone: Tone;
  bucket: "expired" | "30" | "60" | "90" | "ok";
} {
  if (days < 0) return { label: "Expired", tone: "danger", bucket: "expired" };
  if (days <= 30) return { label: `${days}d left`, tone: "danger", bucket: "30" };
  if (days <= 60) return { label: `${days}d left`, tone: "warning", bucket: "60" };
  if (days <= 90) return { label: `${days}d left`, tone: "warning", bucket: "90" };
  return { label: `${days}d left`, tone: "success", bucket: "ok" };
}
