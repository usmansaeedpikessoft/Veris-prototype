import type { RejectionReason } from "../types";

// Authority rejection categories with proposed corrective actions (WF-C, FEAT-EXC-02/03).
export const rejectionReasons: RejectionReason[] = [
  {
    code: "DOC-EXPIRED",
    category: "Document validity",
    label: "Supporting document expired at time of filing",
    proposedAction:
      "Request a fresh copy from the clinician and re-validate against the freshness rule (BR-21).",
    requiredDocument: "Good Standing Certificate",
  },
  {
    code: "DOC-FORMAT",
    category: "Formatting",
    label: "Document naming / format does not meet authority template",
    proposedAction:
      "Re-export the file to the authority's required PDF template and naming convention, then re-validate.",
    requiredDocument: "Degree Certificate",
  },
  {
    code: "PSV-MISMATCH",
    category: "Primary-source verification",
    label: "Name on PSV report does not match license application",
    proposedAction:
      "Raise a PSV correction with DataFlow and align the application name field. No filing proceeds until verified (BR-61).",
  },
  {
    code: "CPD-SHORT",
    category: "Continuing professional development",
    label: "CPD hours below authority threshold",
    proposedAction:
      "Hold the case and request the clinician complete the remaining CPD hours before re-submission (BR-12).",
  },
  {
    code: "SCOPE-UNCLEAR",
    category: "Scope of practice",
    label: "Requested license scope not supported by evidence",
    proposedAction:
      "Attach the specialty logbook / experience letter clarifying scope, then re-validate the pack.",
    requiredDocument: "Experience Letter",
  },
  {
    code: "FEE-UNPAID",
    category: "Payment",
    label: "Authority fee not reconciled",
    proposedAction:
      "Reconcile the authority fee receipt and attach proof of payment to the filing.",
    requiredDocument: "Fee Receipt",
  },
];

export const rejectionMap: Record<string, RejectionReason> = Object.fromEntries(
  rejectionReasons.map((r) => [r.code, r]),
);
