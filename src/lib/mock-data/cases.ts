import type {
  CaseRecord,
  CaseType,
  ChecklistItem,
  Approval,
  CaseTimelineEntry,
  Escalation,
  CaseState,
} from "../types";
import { credentials, docsForCredential, clinicianMap, clinicianName, GAP_CREDENTIAL_IDS } from "./clinicians";
import { TODAY, addDays } from "../dates";
import { caseFlow } from "../status";

function caseTypeFor(state: CaseState, psv: string): CaseType {
  if (state === "Rejected" || state === "Remediating") return "exception";
  if (psv === "not-started" || psv === "in-progress") return "onboarding";
  return "renewal";
}

function buildChecklist(credId: string): ChecklistItem[] {
  const docs = docsForCredential(credId);
  return docs.map((d, i) => ({
    id: `${credId}-chk-${i}`,
    slot: d.type,
    required: true,
    documentId: d.validation === "missing" ? undefined : d.id,
    validation: d.validation,
    note: d.failureReason,
  }));
}

function stateIndex(state: CaseState): number {
  const i = caseFlow.indexOf(state);
  return i === -1 ? 0 : i;
}

function buildTimeline(
  credId: string,
  state: CaseState,
  authority: string,
  clinicianLabel: string,
): CaseTimelineEntry[] {
  const entries: CaseTimelineEntry[] = [];
  const openedAt = addDays(TODAY.toISOString(), -22);
  let step = 0;
  const push = (daysAgo: number, actor: string, action: string, from?: CaseState, to?: CaseState, note?: string) => {
    entries.push({
      id: `${credId}-tl-${step++}`,
      at: addDays(TODAY.toISOString(), -daysAgo),
      actor,
      action,
      fromState: from,
      toState: to,
      note,
    });
  };

  push(22, "Veris (system)", `Renewal trigger fired — opened case for ${clinicianLabel}`, undefined, "Open");
  const idx = stateIndex(state);
  if (idx >= 1) push(20, "Veris (system)", `Generated ${authority} checklist from active rule set`, "Open", "CollectingDocs");
  if (idx >= 1) push(18, "Veris (system)", "Requested missing documents from clinician (email + WhatsApp)");
  if (idx >= 2) push(14, "Veris (system)", "Documents received — running validation (SP-VAL)", "CollectingDocs", "Validating");
  if (idx >= 3) push(10, "Veris (system)", "Pack complete; CPD and PSV readiness confirmed", "Validating", "ReadyForApproval");
  if (idx >= 4) push(8, "Mariam Al Nuaimi", "Named approval recorded for filing (SP-APP)", "ReadyForApproval", "ApprovedForFiling");
  if (idx >= 5) push(6, "Mariam Al Nuaimi", `Prepared and submitted filing to ${authority} (assisted)`, "ApprovedForFiling", "Submitted");
  if (idx >= 6) push(5, "Veris (system)", "Awaiting authority outcome", "Submitted", "Tracking");
  if (state === "Completed") push(1, "Veris (system)", "License issued — new expiry written back to register", "Tracking", "Completed");
  if (state === "Rejected") push(3, `${authority} portal`, "Authority returned a rejection", "Tracking", "Rejected");
  if (state === "Remediating") {
    push(3, `${authority} portal`, "Authority returned a rejection", "Tracking", "Rejected");
    push(2, "Veris (system)", "Classified rejection reason; proposed corrective action", "Rejected", "Remediating");
  }
  if (state === "Escalated") push(2, "Veris (system)", "No progress within SLA window — escalated (WF-D)", "Open", "Escalated");
  return entries;
}

function buildApprovals(credId: string, state: CaseState): Approval[] {
  if (stateIndex(state) < 4 && state !== "Submitted" && state !== "Tracking" && state !== "Completed")
    return [];
  return [
    {
      id: `${credId}-appr-0`,
      caseId: credId,
      approverName: "Mariam Al Nuaimi",
      approverRole: "Credentialing Officer",
      decision: "approved",
      note: "Pack reviewed; all required documents valid and complete.",
      timestamp: addDays(TODAY.toISOString(), -8),
    },
  ];
}

function buildEscalation(credId: string, clinicianLabel: string): Escalation {
  return {
    id: `${credId}-esc`,
    caseId: credId,
    currentTier: "Compliance Head",
    reason: `Credential approaching expiry with no forward progress for ${clinicianLabel}`,
    raisedAt: addDays(TODAY.toISOString(), -4),
    history: [
      { tier: "Officer", at: addDays(TODAY.toISOString(), -4) },
      { tier: "Compliance Head", at: addDays(TODAY.toISOString(), -2) },
    ],
  };
}

const REJECTION_BY_CRED: Record<string, string> = {
  "c-007-cred-0": "DOC-FORMAT",
  "c-010-cred-0": "DOC-EXPIRED",
  "c-024-cred-0": "PSV-MISMATCH",
};

export const cases: CaseRecord[] = [];

for (const cred of credentials) {
  // Gap credentials are intentionally caseless (WF-D "no open case").
  if (GAP_CREDENTIAL_IDS.includes(cred.id)) continue;
  // Keep a few Completed credentials as closed-case history; everything else is live.
  const clinician = clinicianMap[cred.clinicianId];
  const label = clinician ? clinicianName(clinician) : cred.clinicianId;
  const isHistory = cred.state === "Completed";
  const type = caseTypeFor(cred.state, cred.psvStatus);

  const rejectionCode = REJECTION_BY_CRED[cred.id];
  const cpdOk = cred.cpdLedger.reduce((a, c) => a + c.hours, 0) >= cred.cpdRequired;
  const psvOk = cred.psvStatus === "verified";

  const record: CaseRecord = {
    id: `case-${cred.id}`,
    type,
    credentialId: cred.id,
    clinicianId: cred.clinicianId,
    authority: cred.authority,
    licenseType: cred.licenseType,
    state: cred.state,
    openedAt: addDays(TODAY.toISOString(), -22),
    dueDate: cred.expiryDate,
    slaDueAt: addDays(TODAY.toISOString(), cred.state === "Escalated" ? -1 : 5),
    assignee: "Mariam Al Nuaimi",
    checklist: buildChecklist(cred.id),
    approvals: buildApprovals(cred.id, cred.state),
    cpdOk,
    psvOk,
    timeline: buildTimeline(cred.id, cred.state, cred.authority, label),
    escalation: cred.state === "Escalated" ? buildEscalation(cred.id, label) : undefined,
    rejection:
      rejectionCode && (cred.state === "Rejected" || cred.state === "Remediating")
        ? {
            reasonCode: rejectionCode,
            rawText:
              cred.authority +
              " portal returned: application requires correction before re-submission.",
            classifiedAt: addDays(TODAY.toISOString(), -2),
            resolved: cred.state === "Remediating",
          }
        : undefined,
  };

  // Only keep the most recent Completed ones as explicit cases (history), but all live cases.
  if (!isHistory || ["c-011-cred-0", "c-014-cred-0", "c-020-cred-0"].includes(cred.id)) {
    cases.push(record);
  }
}

export const caseMap: Record<string, CaseRecord> = Object.fromEntries(
  cases.map((c) => [c.id, c]),
);

export function openCases(): CaseRecord[] {
  return cases.filter((c) => c.state !== "Completed");
}
