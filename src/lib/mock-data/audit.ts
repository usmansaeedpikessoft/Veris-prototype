import type { AuditEntry } from "../types";
import { cases } from "./cases";
import { clinicianMap, clinicianName } from "./clinicians";

// Immutable audit trail (BR-31). Seeded from case timelines so the log always
// reconciles with the cases a user can open.
const entries: AuditEntry[] = [];
let n = 0;

function actorRole(actor: string): string {
  if (actor.includes("system")) return "System";
  if (actor.includes("portal")) return "Authority";
  if (actor === "Fatima Khan") return "Compliance Head";
  return "Credentialing Officer";
}

for (const c of cases) {
  const clinician = clinicianMap[c.clinicianId];
  const label = clinician ? clinicianName(clinician) : c.clinicianId;
  for (const t of c.timeline) {
    entries.push({
      id: `aud-${n++}`,
      at: t.at,
      actor: t.actor,
      actorRole: actorRole(t.actor),
      action: t.action,
      objectType: "Case",
      objectId: c.id,
      before: t.fromState,
      after: t.toState,
    });
  }
  for (const a of c.approvals) {
    entries.push({
      id: `aud-${n++}`,
      at: a.timestamp,
      actor: a.approverName,
      actorRole: a.approverRole,
      action: `Approval ${a.decision} for ${label} — ${c.authority} ${c.licenseType}`,
      objectType: "Approval",
      objectId: a.id,
    });
  }
}

// A few administrative audit events
entries.push(
  {
    id: `aud-${n++}`,
    at: "2026-08-02T10:00:00Z",
    actor: "Leila Mansour",
    actorRole: "Compliance Specialist",
    action: "Activated rule set DHA / Specialist v3.2",
    objectType: "AuthorityRuleSet",
    objectId: "rs-dha-specialist",
    before: "v3.1",
    after: "v3.2",
  },
  {
    id: `aud-${n++}`,
    at: "2026-09-28T13:12:00Z",
    actor: "Omar Farouk",
    actorRole: "System Administrator",
    action: "Deactivated user account — Rania Youssef",
    objectType: "User",
    objectId: "u-rania",
    before: "active",
    after: "inactive",
  },
  {
    id: `aud-${n++}`,
    at: "2026-09-15T08:40:00Z",
    actor: "Fatima Khan",
    actorRole: "Compliance Head",
    action: "Exported audit evidence pack for Q3 internal review",
    objectType: "AuditExport",
    objectId: "exp-2026-q3",
  },
);

entries.sort((a, b) => new Date(b.at).getTime() - new Date(a.at).getTime());

export const auditEntries: AuditEntry[] = entries;
