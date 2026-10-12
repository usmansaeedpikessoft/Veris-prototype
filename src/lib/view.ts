"use client";

import { useVeris, allClinicians, allCredentials, effectiveCredential } from "./store";
import {
  clinicianMap as seedClinicianMap,
  userMap,
} from "./mock-data";
import type { Clinician, Credential, CaseRecord } from "./types";
import { daysUntil } from "./dates";

export interface MergedData {
  clinicians: Clinician[];
  credentials: Credential[];
  cases: CaseRecord[];
  clinicianById: (id: string) => Clinician | undefined;
  credentialById: (id: string) => Credential | undefined;
  credentialsForClinician: (clinicianId: string) => Credential[];
  caseByCredential: (credentialId: string) => CaseRecord | undefined;
}

export function useMergedData(): MergedData {
  const state = useVeris();
  const clinicians = allClinicians(state);
  const credentials = allCredentials(state).map((c) => effectiveCredential(state, c));
  const cases = state.cases;

  const clinicianIndex = new Map(clinicians.map((c) => [c.id, c]));
  const credentialIndex = new Map(credentials.map((c) => [c.id, c]));

  return {
    clinicians,
    credentials,
    cases,
    clinicianById: (id) => clinicianIndex.get(id) ?? seedClinicianMap[id],
    credentialById: (id) => credentialIndex.get(id),
    credentialsForClinician: (clinicianId) =>
      credentials.filter((c) => c.clinicianId === clinicianId),
    caseByCredential: (credentialId) =>
      cases.find((c) => c.credentialId === credentialId),
  };
}

export function useCurrentUser() {
  const id = useVeris((s) => s.currentUserId);
  return userMap[id];
}

// At-risk detection (WF-D): credentials within 90 days whose live case is
// absent, Open, or Escalated — i.e. not actively progressing.
export interface AtRiskItem {
  credential: Credential;
  clinician?: Clinician;
  days: number;
  reason: "no-case" | "escalated" | "stalled" | "expired";
  caseId?: string;
}

export function computeAtRisk(data: MergedData): AtRiskItem[] {
  const items: AtRiskItem[] = [];
  for (const cred of data.credentials) {
    const days = daysUntil(cred.expiryDate);
    if (days > 90) continue;
    const kase = data.caseByCredential(cred.id);
    const clinician = data.clinicianById(cred.clinicianId);
    if (!kase) {
      items.push({ credential: cred, clinician, days, reason: days < 0 ? "expired" : "no-case" });
    } else if (kase.state === "Escalated") {
      items.push({ credential: cred, clinician, days, reason: "escalated", caseId: kase.id });
    } else if (kase.state === "Completed") {
      continue;
    } else if (days < 0) {
      items.push({ credential: cred, clinician, days, reason: "expired", caseId: kase.id });
    }
  }
  return items.sort((a, b) => a.days - b.days);
}
