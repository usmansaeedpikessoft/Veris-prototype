import type { RoleCode } from "./types";

// Navigation surface each role can reach, derived from the RBAC matrix in
// docs/04-Users-Roles-and-Personas.md §3.
export type NavKey =
  | "dashboard"
  | "register"
  | "cases"
  | "exceptions"
  | "onboarding"
  | "notifications"
  | "audit"
  | "admin-rules"
  | "admin-escalation"
  | "admin-users"
  | "admin-integrations"
  | "me";

export type Capability =
  | "view-register"
  | "edit-clinician"
  | "upload-documents"
  | "progress-case"
  | "validate-pack"
  | "approve-filing"
  | "submit-filing"
  | "handle-exceptions"
  | "view-dashboard"
  | "author-rules"
  | "config-escalation"
  | "manage-users"
  | "view-audit"
  | "export-audit";

// F = full, A = approve, V = view, S = self-scope
type Grant = "F" | "A" | "V" | "S" | null;

export const RBAC: Record<RoleCode, Partial<Record<Capability, Grant>>> = {
  officer: {
    "view-register": "F",
    "edit-clinician": "F",
    "upload-documents": "F",
    "progress-case": "F",
    "validate-pack": "F",
    "approve-filing": "A",
    "submit-filing": "F",
    "handle-exceptions": "F",
    "view-dashboard": "F",
    "view-audit": "V",
  },
  "compliance-head": {
    "view-register": "F",
    "edit-clinician": "F",
    "upload-documents": "F",
    "progress-case": "F",
    "validate-pack": "F",
    "approve-filing": "A",
    "submit-filing": "F",
    "handle-exceptions": "F",
    "view-dashboard": "F",
    "author-rules": "A",
    "config-escalation": "F",
    "view-audit": "F",
    "export-audit": "F",
  },
  "medical-director": {
    "view-register": "V",
    "approve-filing": "A",
    "view-dashboard": "F",
    "view-audit": "V",
    "export-audit": "V",
  },
  clinician: {
    "view-register": "S",
    "upload-documents": "S",
    "view-dashboard": "S",
  },
  admin: {
    "view-register": "V",
    "edit-clinician": "F",
    "upload-documents": "F",
    "view-dashboard": "V",
    "config-escalation": "F",
    "manage-users": "F",
    "view-audit": "V",
    "export-audit": "V",
  },
  "rule-author": {
    "view-register": "V",
    "author-rules": "F",
  },
  exec: {
    "view-register": "V",
    "view-dashboard": "V",
    "view-audit": "V",
  },
  implementation: {
    "view-register": "F",
    "edit-clinician": "F",
    "upload-documents": "F",
    "progress-case": "F",
    "view-dashboard": "V",
  },
  auditor: {
    "view-register": "V",
    "view-dashboard": "V",
    "view-audit": "F",
    "export-audit": "F",
  },
};

export function can(role: RoleCode, cap: Capability): Grant {
  return RBAC[role]?.[cap] ?? null;
}

// Which nav items each role sees.
export function navFor(role: RoleCode): NavKey[] {
  if (role === "clinician") return ["me"];
  const base: NavKey[] = [];
  if (can(role, "view-dashboard")) base.push("dashboard");
  if (can(role, "view-register")) base.push("register");
  if (can(role, "progress-case")) base.push("cases", "exceptions", "onboarding");
  if (role === "officer" || role === "compliance-head")
    base.push("notifications");
  if (can(role, "view-audit")) base.push("audit");
  if (can(role, "author-rules")) base.push("admin-rules");
  if (can(role, "config-escalation")) base.push("admin-escalation");
  if (can(role, "manage-users")) base.push("admin-users");
  if (role === "implementation" || role === "admin")
    base.push("admin-integrations");
  return base;
}
