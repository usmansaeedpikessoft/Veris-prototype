"use client";

import { create } from "zustand";
import type {
  CaseRecord,
  AuditEntry,
  Notification,
  CaseState,
  Clinician,
  Credential,
  EscalationTier,
} from "./types";
import {
  cases as seedCases,
  auditEntries as seedAudit,
  notifications as seedNotifs,
  clinicians as seedClinicians,
  credentials as seedCredentials,
  userMap,
  clinicianMap,
  credentialMap,
  ruleSetFor,
} from "./mock-data";
import { nowIso, addDays } from "./dates";

function clone<T>(v: T): T {
  return JSON.parse(JSON.stringify(v)) as T;
}

const ESCALATION_ORDER: EscalationTier[] = [
  "Officer",
  "Compliance Head",
  "Medical Director",
];

interface VerisState {
  currentUserId: string;
  cases: CaseRecord[];
  audit: AuditEntry[];
  notifications: Notification[];
  extraClinicians: Clinician[];
  extraCredentials: Credential[];
  credentialStateOverride: Record<string, CaseState>;
  credentialExpiryOverride: Record<string, string>;
  seq: number;

  setUser: (id: string) => void;

  // workflow actions
  requestDocuments: (caseId: string) => void;
  simulateUpload: (caseId: string) => void;
  runValidation: (caseId: string) => void;
  approveFiling: (caseId: string, note?: string) => void;
  submitFiling: (caseId: string) => void;
  recordOutcome: (caseId: string, outcome: "issued" | "rejected") => void;
  classifyAndRemediate: (caseId: string) => void;
  resubmitCorrected: (caseId: string) => void;
  escalateNext: (caseId: string) => void;
  openCaseForGap: (credentialId: string) => string | null;
  importClinicians: (rows: { clinician: Clinician; credential: Credential }[]) => void;
}

export const useVeris = create<VerisState>((set, get) => {
  function actor(): { name: string; role: string } {
    const u = userMap[get().currentUserId];
    return { name: u?.name ?? "System", role: u?.roleLabel ?? "System" };
  }

  function audit(
    action: string,
    objectType: string,
    objectId: string,
    before?: CaseState | string,
    after?: CaseState | string,
  ): AuditEntry {
    const a = actor();
    const s = get().seq + 1;
    set({ seq: s });
    return {
      id: `aud-live-${s}`,
      at: nowIso(),
      actor: a.name,
      actorRole: a.role,
      action,
      objectType,
      objectId,
      before: before as string | undefined,
      after: after as string | undefined,
    };
  }

  function patchCase(caseId: string, fn: (c: CaseRecord) => CaseRecord, auditEntry?: AuditEntry) {
    set((state) => ({
      cases: state.cases.map((c) => (c.id === caseId ? fn(c) : c)),
      audit: auditEntry ? [auditEntry, ...state.audit] : state.audit,
    }));
  }

  function transition(
    caseId: string,
    toState: CaseState,
    action: string,
    note?: string,
  ) {
    const c = get().cases.find((x) => x.id === caseId);
    if (!c) return;
    const from = c.state;
    const a = actor();
    const s = get().seq + 1;
    set({ seq: s });
    const tl = {
      id: `tl-live-${s}`,
      at: nowIso(),
      actor: a.name,
      action,
      fromState: from,
      toState,
      note,
    };
    patchCase(
      caseId,
      (cc) => ({
        ...cc,
        state: toState,
        timeline: [...cc.timeline, tl],
      }),
      audit(action, "Case", caseId, from, toState),
    );
    // mirror to credential
    set((state) => ({
      credentialStateOverride: {
        ...state.credentialStateOverride,
        [c.credentialId]: toState,
      },
    }));
  }

  return {
    currentUserId: "u-mariam",
    cases: clone(seedCases),
    audit: clone(seedAudit),
    notifications: clone(seedNotifs),
    extraClinicians: [],
    extraCredentials: [],
    credentialStateOverride: {},
    credentialExpiryOverride: {},
    seq: 0,

    setUser: (id) => set({ currentUserId: id }),

    requestDocuments: (caseId) =>
      transition(
        caseId,
        "CollectingDocs",
        "Generated authority checklist and requested documents from clinician",
      ),

    simulateUpload: (caseId) => {
      const c = get().cases.find((x) => x.id === caseId);
      if (!c) return;
      patchCase(
        caseId,
        (cc) => ({
          ...cc,
          checklist: cc.checklist.map((i) =>
            i.validation === "missing" || i.validation === "stale" || i.validation === "pending"
              ? { ...i, validation: "valid" as const, note: undefined, documentId: i.documentId ?? `${cc.credentialId}-doc-new` }
              : i,
          ),
          timeline: [
            ...cc.timeline,
            {
              id: `tl-live-${get().seq + 1}`,
              at: nowIso(),
              actor: "Dr. (clinician)",
              action: "Clinician uploaded the requested documents to the vault",
            },
          ],
        }),
        audit("Clinician uploaded requested documents", "Case", caseId),
      );
      set({ seq: get().seq + 1 });
    },

    runValidation: (caseId) => {
      const c = get().cases.find((x) => x.id === caseId);
      if (!c) return;
      const allValid = c.checklist.every((i) => i.validation === "valid");
      if (!allValid) {
        transition(
          caseId,
          "Validating",
          "Ran document validation — some items still require attention (SP-VAL)",
        );
        return;
      }
      transition(
        caseId,
        "ReadyForApproval",
        "Pack complete; CPD and PSV readiness confirmed — ready for approval",
      );
    },

    approveFiling: (caseId, note) => {
      const c = get().cases.find((x) => x.id === caseId);
      if (!c) return;
      const a = actor();
      const s = get().seq + 1;
      set({ seq: s });
      patchCase(
        caseId,
        (cc) => ({
          ...cc,
          approvals: [
            ...cc.approvals,
            {
              id: `appr-live-${s}`,
              caseId,
              approverName: a.name,
              approverRole: a.role,
              decision: "approved" as const,
              note,
              timestamp: nowIso(),
            },
          ],
        }),
      );
      transition(
        caseId,
        "ApprovedForFiling",
        `Named approval recorded by ${a.name} (SP-APP, BR-30)`,
        note,
      );
    },

    submitFiling: (caseId) => {
      const c = get().cases.find((x) => x.id === caseId);
      if (!c) return;
      transition(
        caseId,
        "Submitted",
        `Officer prepared and submitted the filing to ${c.authority} (assisted, BR-32)`,
      );
      setTimeout(() => transition(caseId, "Tracking", "Awaiting authority outcome"), 400);
    },

    recordOutcome: (caseId, outcome) => {
      const c = get().cases.find((x) => x.id === caseId);
      if (!c) return;
      if (outcome === "issued") {
        const cred = credentialMap[c.credentialId];
        const rs = ruleSetFor(c.authority, c.licenseType);
        const years = rs?.validityYears ?? cred?.renewalCycleYears ?? 1;
        const newExpiry = addDays(nowIso(), years * 365);
        set((state) => ({
          credentialExpiryOverride: {
            ...state.credentialExpiryOverride,
            [c.credentialId]: newExpiry,
          },
        }));
        transition(
          caseId,
          "Completed",
          "License issued — new expiry written back to the register",
        );
      } else {
        transition(caseId, "Rejected", "Authority returned a rejection/query");
      }
    },

    classifyAndRemediate: (caseId) => {
      const c = get().cases.find((x) => x.id === caseId);
      if (!c) return;
      patchCase(caseId, (cc) => ({
        ...cc,
        rejection: cc.rejection ? { ...cc.rejection, resolved: true } : cc.rejection,
      }));
      transition(
        caseId,
        "Remediating",
        "Classified rejection reason; corrective action routed to owner (WF-C)",
      );
    },

    resubmitCorrected: (caseId) =>
      transition(
        caseId,
        "ReadyForApproval",
        "Corrective pack re-validated — ready for re-approval",
      ),

    escalateNext: (caseId) => {
      const c = get().cases.find((x) => x.id === caseId);
      if (!c?.escalation) {
        transition(caseId, "Escalated", "Escalated — no progress within SLA window (WF-D)");
        return;
      }
      const idx = ESCALATION_ORDER.indexOf(c.escalation.currentTier);
      const next = ESCALATION_ORDER[Math.min(idx + 1, ESCALATION_ORDER.length - 1)];
      const s = get().seq + 1;
      set({ seq: s });
      patchCase(
        caseId,
        (cc) => ({
          ...cc,
          escalation: cc.escalation
            ? {
                ...cc.escalation,
                currentTier: next,
                history: [...cc.escalation.history, { tier: next, at: nowIso() }],
              }
            : cc.escalation,
          timeline: [
            ...cc.timeline,
            {
              id: `tl-live-${s}`,
              at: nowIso(),
              actor: "Veris (system)",
              action: `Escalated to ${next} per ladder (BR-40)`,
            },
          ],
        }),
        audit(`Escalated to ${next}`, "Case", caseId),
      );
    },

    openCaseForGap: (credentialId) => {
      const cred = credentialMap[credentialId] ?? get().extraCredentials.find((c) => c.id === credentialId);
      if (!cred) return null;
      const existing = get().cases.find((c) => c.credentialId === credentialId);
      if (existing) return existing.id;
      const s = get().seq + 1;
      set({ seq: s });
      const clinician = clinicianMap[cred.clinicianId];
      const label = clinician ? `${clinician.title} ${clinician.firstName} ${clinician.lastName}` : cred.clinicianId;
      const rs = ruleSetFor(cred.authority, cred.licenseType);
      const newCase: CaseRecord = {
        id: `case-${credentialId}`,
        type: "renewal",
        credentialId,
        clinicianId: cred.clinicianId,
        authority: cred.authority,
        licenseType: cred.licenseType,
        state: "CollectingDocs",
        openedAt: nowIso(),
        dueDate: cred.expiryDate,
        slaDueAt: addDays(nowIso(), 5),
        assignee: actor().name,
        checklist: (rs?.requiredDocuments ?? []).map((slot, i) => ({
          id: `${credentialId}-chk-${i}`,
          slot,
          required: true,
          validation: i < 4 ? "valid" : "missing",
        })),
        approvals: [],
        cpdOk: true,
        psvOk: cred.psvStatus === "verified",
        timeline: [
          {
            id: `tl-live-${s}`,
            at: nowIso(),
            actor: actor().name,
            action: "Opened renewal case for at-risk credential (WF-D)",
            toState: "Open",
          },
          {
            id: `tl-live-${s}-b`,
            at: nowIso(),
            actor: "Veris (system)",
            action: "Generated checklist; requesting documents",
            fromState: "Open",
            toState: "CollectingDocs",
          },
        ],
      };
      set((state) => ({
        cases: [newCase, ...state.cases],
        credentialStateOverride: { ...state.credentialStateOverride, [credentialId]: "CollectingDocs" },
        audit: [audit("Opened renewal case for at-risk credential", "Case", newCase.id, undefined, "CollectingDocs"), ...state.audit],
      }));
      return newCase.id;
    },

    importClinicians: (rows) => {
      const s = get().seq + 1;
      set((state) => ({
        seq: s,
        extraClinicians: [...state.extraClinicians, ...rows.map((r) => r.clinician)],
        extraCredentials: [...state.extraCredentials, ...rows.map((r) => r.credential)],
        audit: [
          audit(`Imported ${rows.length} clinician(s) via CSV`, "Import", `imp-${s}`),
          ...state.audit,
        ],
      }));
    },
  };
});

// ---- selectors / helpers that merge store overrides with seed data ----
export function allClinicians(state: VerisState): Clinician[] {
  return [...seedClinicians, ...state.extraClinicians];
}
export function allCredentials(state: VerisState): Credential[] {
  return [...seedCredentials, ...state.extraCredentials];
}
export function effectiveCredential(state: VerisState, cred: Credential): Credential {
  return {
    ...cred,
    state: state.credentialStateOverride[cred.id] ?? cred.state,
    expiryDate: state.credentialExpiryOverride[cred.id] ?? cred.expiryDate,
  };
}
