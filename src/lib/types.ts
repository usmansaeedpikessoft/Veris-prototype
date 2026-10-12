// Veris domain types — grounded in docs/05-SRS.md §6.1 entities,
// docs/02 case state model, docs/04 roles.

// ---------- Authorities & PSV (docs 01 §5, 05 §1.2) ----------
export type AuthorityCode =
  | "DHA" // Dubai Health Authority (portal: Sheryan) — Phase 1 primary
  | "DOH" // Department of Health, Abu Dhabi (ex-HAAD)
  | "MOHAP" // Ministry of Health and Prevention, UAE
  | "SCFHS" // Saudi Commission for Health Specialties (portal: Mumaris+, Nafath 2FA)
  | "QCHP" // Qatar Council for Healthcare Practitioners
  | "NHRA" // National Health Regulatory Authority, Bahrain
  | "OMSB"; // Oman Medical Specialty Board

export interface Authority {
  code: AuthorityCode;
  name: string;
  portal: string;
  country: string;
  region: "UAE" | "KSA" | "Qatar" | "Bahrain" | "Oman";
  twoFactor?: string;
  phase1: boolean;
}

export type PsvProvider = "DataFlow" | "TrueProfile";
export type PsvStatus =
  | "not-started"
  | "in-progress"
  | "verified"
  | "discrepancy";

// ---------- Case lifecycle (docs 02 §2) ----------
export type CaseState =
  | "Open"
  | "CollectingDocs"
  | "Validating"
  | "ReadyForApproval"
  | "ApprovedForFiling"
  | "Submitted"
  | "Tracking"
  | "Rejected"
  | "Remediating"
  | "Completed"
  | "Escalated";

export type CaseType = "renewal" | "onboarding" | "exception";

// ---------- Documents (docs 05, SP-VAL) ----------
export type DocValidation = "valid" | "stale" | "invalid" | "missing" | "pending";

export interface VaultDocument {
  id: string;
  clinicianId: string;
  type: string; // e.g. "Passport", "Degree Certificate", "Good Standing"
  fileName: string;
  uploadedAt: string | null;
  expiresAt: string | null; // document freshness (BR-21)
  validation: DocValidation;
  failureReason?: string; // actionable reason (FEAT-PACK-04)
  sizeKb?: number;
}

// ---------- CPD (BR-12, FEAT-REG-04) ----------
export interface CpdEntry {
  id: string;
  title: string;
  provider: string;
  hours: number;
  date: string;
}

// ---------- Credential (BR-02/03) ----------
export interface Credential {
  id: string;
  clinicianId: string;
  authority: AuthorityCode;
  licenseType: string;
  licenseNumber: string;
  issueDate: string;
  expiryDate: string;
  state: CaseState; // current lifecycle state (BR-04) — mirrors open case
  psvProvider: PsvProvider;
  psvStatus: PsvStatus;
  cpdRequired: number;
  cpdLedger: CpdEntry[];
  renewalCycleYears: number;
}

// ---------- Clinician (BR-01) ----------
export interface Clinician {
  id: string;
  firstName: string;
  lastName: string;
  title: string; // Dr. / Nurse etc
  specialty: string;
  nationalId: string; // unique key part (BR-01)
  passportNo: string;
  email: string;
  phone: string;
  site: string; // employment site
  photoSeed: string;
  credentialIds: string[];
}

// ---------- Checklist & pack (PACK module) ----------
export interface ChecklistItem {
  id: string;
  slot: string; // required document slot
  required: boolean;
  documentId?: string; // linked vault doc
  validation: DocValidation;
  note?: string;
}

// ---------- Approval (SP-APP, BR-30) ----------
export interface Approval {
  id: string;
  caseId: string;
  approverName: string;
  approverRole: string;
  decision: "approved" | "rejected";
  note?: string;
  timestamp: string;
}

// ---------- Escalation (BR-40, WF-D) ----------
export type EscalationTier = "Officer" | "Compliance Head" | "Medical Director";

export interface Escalation {
  id: string;
  caseId: string;
  currentTier: EscalationTier;
  reason: string;
  raisedAt: string;
  history: { tier: EscalationTier; at: string }[];
}

// ---------- Rejection / exception (WF-C) ----------
export interface RejectionReason {
  code: string;
  category: string;
  label: string;
  proposedAction: string;
  requiredDocument?: string;
}

// ---------- Case (docs 05 §6.1) ----------
export interface CaseRecord {
  id: string;
  type: CaseType;
  credentialId: string;
  clinicianId: string;
  authority: AuthorityCode;
  licenseType: string;
  state: CaseState;
  openedAt: string;
  dueDate: string; // filing deadline / expiry anchor
  slaDueAt: string; // step-level SLA (FEAT-REN-06)
  assignee: string;
  checklist: ChecklistItem[];
  approvals: Approval[];
  rejection?: {
    reasonCode: string;
    rawText: string;
    classifiedAt: string;
    resolved: boolean;
  };
  escalation?: Escalation;
  cpdOk: boolean;
  psvOk: boolean;
  timeline: CaseTimelineEntry[];
}

export interface CaseTimelineEntry {
  id: string;
  at: string;
  actor: string;
  action: string;
  fromState?: CaseState;
  toState?: CaseState;
  note?: string;
}

// ---------- Authority rule set (FEAT-ADM-01, data-not-code) ----------
export interface AuthorityRuleSet {
  id: string;
  authority: AuthorityCode;
  licenseType: string;
  version: string;
  status: "active" | "draft" | "archived";
  renewalWindowDays: number; // N days before expiry (BR-10)
  validityYears: number;
  cpdThreshold: number;
  feeUsd: number;
  requiredDocuments: string[];
  rejectionCategories: string[];
  updatedBy: string;
  updatedAt: string;
}

// ---------- Audit (BR-31, FEAT-AUD-01) ----------
export interface AuditEntry {
  id: string;
  at: string;
  actor: string;
  actorRole: string;
  action: string;
  objectType: string;
  objectId: string;
  before?: string;
  after?: string;
}

// ---------- Notifications (SP-NOT) ----------
export type NotifChannel = "email" | "whatsapp";
export interface Notification {
  id: string;
  channel: NotifChannel;
  recipient: string;
  recipientName: string;
  template: string;
  subject: string;
  sentAt: string;
  status: "delivered" | "read" | "sent" | "failed";
  caseId?: string;
}

// ---------- Users & roles (docs 04) ----------
export type RoleCode =
  | "officer"
  | "compliance-head"
  | "medical-director"
  | "clinician"
  | "admin"
  | "rule-author"
  | "exec"
  | "implementation"
  | "auditor";

export interface AppUser {
  id: string;
  name: string;
  role: RoleCode;
  roleLabel: string;
  email: string;
  site: string;
  status: "active" | "inactive";
  clinicianId?: string; // for clinician self-scope
  avatarSeed: string;
}
