import type {
  Clinician,
  Credential,
  VaultDocument,
  CpdEntry,
  AuthorityCode,
  CaseState,
  PsvStatus,
  DocValidation,
} from "../types";
import { TODAY, addDays } from "../dates";
import { ruleSetFor } from "./rulesets";

interface Seed {
  id: string;
  title: string;
  first: string;
  last: string;
  specialty: string;
  site: string;
  authority: AuthorityCode;
  licenseType: string;
  expiryInDays: number; // days from TODAY (negative = already expired)
  state: CaseState;
  psv: PsvStatus;
  cpdDone: number; // CPD hours logged
  // optional second credential
  gap?: boolean; // in-window credential with NO open case (WF-D / BR-41)
  second?: {
    authority: AuthorityCode;
    licenseType: string;
    expiryInDays: number;
    state: CaseState;
    psv: PsvStatus;
    cpdDone: number;
  };
}

// Credential ids that are in the renewal window but have no open case — these
// drive the "at-risk, no case" lapse-prevention flow (WF-D).
export const GAP_CREDENTIAL_IDS: string[] = [];

const SITES_UAE = [
  "Al Barsha Medical Center",
  "Jumeirah Specialty Clinic",
  "Deira Family Hospital",
  "Dubai Marina Clinic",
];
const SITES_AUH = ["Khalifa City Hospital", "Corniche Specialty Center"];

// 26 clinicians spread across authorities, license types, states and expiry buckets.
const seeds: Seed[] = [
  { id: "c-sara-haddad", title: "Dr.", first: "Sara", last: "Haddad", specialty: "Dermatology", site: SITES_UAE[1], authority: "DHA", licenseType: "Specialist", expiryInDays: 44, state: "CollectingDocs", psv: "verified", cpdDone: 52 },
  { id: "c-002", title: "Dr.", first: "Omar", last: "Al Farsi", specialty: "Cardiology", site: SITES_UAE[0], authority: "DHA", licenseType: "Specialist", expiryInDays: 18, state: "ReadyForApproval", psv: "verified", cpdDone: 55, second: { authority: "DOH", licenseType: "Specialist", expiryInDays: 410, state: "Completed", psv: "verified", cpdDone: 160 } },
  { id: "c-003", title: "Dr.", first: "Aisha", last: "Rahman", specialty: "Pediatrics", site: SITES_UAE[2], authority: "DHA", licenseType: "General Practitioner", expiryInDays: 7, state: "Escalated", psv: "verified", cpdDone: 41 },
  { id: "c-004", title: "Nurse", first: "Grace", last: "Mensah", specialty: "Critical Care Nursing", site: SITES_UAE[0], authority: "DHA", licenseType: "Registered Nurse", expiryInDays: 63, state: "Validating", psv: "verified", cpdDone: 31 },
  { id: "c-005", title: "Dr.", first: "Yusuf", last: "Khan", specialty: "Orthopedics", site: SITES_UAE[3], authority: "DHA", licenseType: "Specialist", expiryInDays: 85, state: "Tracking", psv: "verified", cpdDone: 58 },
  { id: "c-006", title: "Dr.", first: "Layla", last: "Nasser", specialty: "Obstetrics & Gynecology", site: SITES_AUH[0], authority: "DOH", licenseType: "Specialist", expiryInDays: 120, state: "Submitted", psv: "verified", cpdDone: 158 },
  { id: "c-007", title: "Dr.", first: "Hassan", last: "Ali", specialty: "Radiology", site: SITES_UAE[1], authority: "DHA", licenseType: "Specialist", expiryInDays: 29, state: "Rejected", psv: "verified", cpdDone: 53 },
  { id: "c-008", title: "Dr.", first: "Noura", last: "Saeed", specialty: "Endocrinology", site: SITES_AUH[1], authority: "SCFHS", licenseType: "Specialist", expiryInDays: 140, state: "CollectingDocs", psv: "in-progress", cpdDone: 48 },
  { id: "c-009", title: "Dr.", first: "Imran", last: "Qureshi", specialty: "General Medicine", site: SITES_UAE[2], authority: "DHA", licenseType: "General Practitioner", expiryInDays: -5, state: "Escalated", psv: "verified", cpdDone: 44 },
  { id: "c-010", title: "Nurse", first: "Maria", last: "Santos", specialty: "Pediatric Nursing", site: SITES_UAE[0], authority: "DHA", licenseType: "Registered Nurse", expiryInDays: 51, state: "Remediating", psv: "verified", cpdDone: 33 },
  { id: "c-011", title: "Dr.", first: "Khalid", last: "Mahmoud", specialty: "Neurology", site: SITES_UAE[3], authority: "DHA", licenseType: "Specialist", expiryInDays: 210, state: "Completed", psv: "verified", cpdDone: 60 },
  { id: "c-012", title: "Dr.", first: "Fatima", last: "Zahra", specialty: "Family Medicine", site: SITES_AUH[0], authority: "DOH", licenseType: "General Practitioner", expiryInDays: 95, state: "ApprovedForFiling", psv: "verified", cpdDone: 155 },
  { id: "c-013", title: "Dr.", first: "Ahmed", last: "Tariq", specialty: "Gastroenterology", site: SITES_UAE[1], authority: "DHA", licenseType: "Specialist", expiryInDays: 26, state: "Validating", psv: "verified", cpdDone: 49 },
  { id: "c-014", title: "Dr.", first: "Zainab", last: "Hussain", specialty: "Ophthalmology", site: SITES_UAE[2], authority: "DHA", licenseType: "Specialist", expiryInDays: 310, state: "Completed", psv: "verified", cpdDone: 57 },
  { id: "c-015", title: "Dr.", first: "Bilal", last: "Chaudhry", specialty: "Pulmonology", site: SITES_UAE[0], authority: "DHA", licenseType: "Specialist", expiryInDays: 58, state: "CollectingDocs", psv: "verified", cpdDone: 50 },
  { id: "c-016", title: "Nurse", first: "Priya", last: "Nair", specialty: "Emergency Nursing", site: SITES_UAE[3], authority: "DHA", licenseType: "Registered Nurse", expiryInDays: 12, state: "ReadyForApproval", psv: "verified", cpdDone: 30 },
  { id: "c-017", title: "Dr.", first: "Mohammed", last: "Iqbal", specialty: "Urology", site: SITES_AUH[1], authority: "SCFHS", licenseType: "Specialist", expiryInDays: 175, state: "Open", psv: "not-started", cpdDone: 61 },
  { id: "c-018", title: "Dr.", first: "Hana", last: "Yusuf", specialty: "Psychiatry", site: SITES_UAE[1], authority: "DHA", licenseType: "Specialist", expiryInDays: 40, state: "Tracking", psv: "verified", cpdDone: 54 },
  { id: "c-019", title: "Dr.", first: "Tariq", last: "Aziz", specialty: "Anesthesiology", site: SITES_UAE[2], authority: "DHA", licenseType: "Specialist", expiryInDays: 72, state: "CollectingDocs", psv: "verified", cpdDone: 47 },
  { id: "c-020", title: "Dr.", first: "Salma", last: "Idris", specialty: "Nephrology", site: SITES_AUH[0], authority: "DOH", licenseType: "Specialist", expiryInDays: 500, state: "Completed", psv: "verified", cpdDone: 162 },
  { id: "c-021", title: "Dr.", first: "Faisal", last: "Noor", specialty: "ENT", site: SITES_UAE[0], authority: "DHA", licenseType: "Specialist", expiryInDays: 22, state: "Submitted", psv: "verified", cpdDone: 56 },
  { id: "c-022", title: "Nurse", first: "Rosa", last: "Fernandez", specialty: "Operating Room Nursing", site: SITES_UAE[3], authority: "DHA", licenseType: "Registered Nurse", expiryInDays: 88, state: "Open", psv: "verified", cpdDone: 34 },
  { id: "c-023", title: "Dr.", first: "Adnan", last: "Shah", specialty: "Oncology", site: SITES_UAE[1], authority: "DHA", licenseType: "Specialist", expiryInDays: -14, state: "Escalated", psv: "verified", cpdDone: 59 },
  { id: "c-024", title: "Dr.", first: "Mariam", last: "Jaber", specialty: "Rheumatology", site: SITES_AUH[1], authority: "SCFHS", licenseType: "Specialist", expiryInDays: 133, state: "Validating", psv: "discrepancy", cpdDone: 46 },
  { id: "c-025", title: "Dr.", first: "Samir", last: "Hamdan", specialty: "Vascular Surgery", site: SITES_UAE[2], authority: "DHA", licenseType: "Specialist", expiryInDays: 160, state: "Completed", psv: "verified", cpdDone: 60 },
  { id: "c-026", title: "Dr.", first: "Dana", last: "Othman", specialty: "Dermatology", site: SITES_UAE[0], authority: "DHA", licenseType: "General Practitioner", expiryInDays: 34, state: "CollectingDocs", psv: "verified", cpdDone: 38 },
  // At-risk gap cases (in window, no open case — WF-D / BR-41)
  { id: "c-027", title: "Dr.", first: "Nadia", last: "Belhaj", specialty: "Hematology", site: SITES_UAE[2], authority: "DHA", licenseType: "Specialist", expiryInDays: 27, state: "Open", psv: "verified", cpdDone: 55, gap: true },
  { id: "c-028", title: "Nurse", first: "Joy", last: "Okeke", specialty: "Dialysis Nursing", site: SITES_UAE[3], authority: "DHA", licenseType: "Registered Nurse", expiryInDays: 61, state: "Open", psv: "verified", cpdDone: 32, gap: true },
];

const cpdTopics = [
  ["Advanced Cardiac Life Support", "Emirates Cardiac Society"],
  ["Infection Prevention & Control", "DHA Academy"],
  ["Patient Safety & Quality", "Hamdan Medical College"],
  ["Clinical Ethics Update", "MOHAP CPD"],
  ["Specialty Grand Rounds", "Group Medical Education"],
  ["Pharmacovigilance Essentials", "Gulf Medical University"],
];

function buildCpd(total: number, credId: string): CpdEntry[] {
  const entries: CpdEntry[] = [];
  let remaining = total;
  let i = 0;
  while (remaining > 0 && i < cpdTopics.length) {
    const hours = Math.min(remaining, i === 0 ? 16 : 10);
    const [title, provider] = cpdTopics[i];
    entries.push({
      id: `${credId}-cpd-${i}`,
      title,
      provider,
      hours,
      date: addDays(TODAY.toISOString(), -30 * (i + 1)),
    });
    remaining -= hours;
    i++;
  }
  return entries;
}

// Documents whose own validity expires (freshness-tracked per BR-21).
const FRESHNESS_DOCS = new Set(["Passport", "Emirates ID", "Good Standing Certificate", "Iqama / National ID"]);

function buildDocuments(
  clinicianId: string,
  credId: string,
  authority: AuthorityCode,
  licenseType: string,
  state: CaseState,
): VaultDocument[] {
  const rs = ruleSetFor(authority, licenseType);
  const required = rs?.requiredDocuments ?? ["Passport", "Degree Certificate"];
  // For in-collection states, leave a couple of docs missing/invalid to drive the pack UI.
  const collecting = state === "CollectingDocs" || state === "Validating" || state === "Open";
  return required.map((type, idx) => {
    let validation: DocValidation = "valid";
    let failureReason: string | undefined;
    let uploadedAt: string | null = addDays(TODAY.toISOString(), -40 - idx * 3);
    let expiresAt: string | null = FRESHNESS_DOCS.has(type)
      ? addDays(TODAY.toISOString(), 365 + idx * 10)
      : null;

    if (collecting && type === "Good Standing Certificate") {
      // Freshness failure — actionable reason (FEAT-PACK-04)
      validation = "stale";
      failureReason =
        "Good Standing Certificate is dated 94 days ago; this authority accepts a maximum age of 90 days (BR-21). Request a fresh copy.";
      expiresAt = addDays(TODAY.toISOString(), -4);
    } else if (collecting && type === "CPD Certificate" && idx % 2 === 0) {
      validation = "missing";
      uploadedAt = null;
      expiresAt = null;
      failureReason = "Not yet uploaded by the clinician.";
    } else if (state === "Validating" && type === "DataFlow PSV Report") {
      validation = "pending";
      failureReason = "Awaiting PSV status refresh from DataFlow.";
    }

    return {
      id: `${credId}-doc-${idx}`,
      clinicianId,
      type,
      fileName: `${type.replace(/[^a-z0-9]+/gi, "_").toLowerCase()}_${clinicianId}.pdf`,
      uploadedAt,
      expiresAt,
      validation,
      failureReason,
      sizeKb: 120 + idx * 37,
    };
  });
}

// ---- Build exported collections ----
const clinicians: Clinician[] = [];
const credentials: Credential[] = [];
const documents: VaultDocument[] = [];

let nid = 1000;
function buildCredential(
  clinicianId: string,
  authority: AuthorityCode,
  licenseType: string,
  expiryInDays: number,
  state: CaseState,
  psv: PsvStatus,
  cpdDone: number,
  index: number,
): Credential {
  const rs = ruleSetFor(authority, licenseType);
  const validity = rs?.validityYears ?? 1;
  const credId = `${clinicianId}-cred-${index}`;
  const expiryDate = addDays(TODAY.toISOString(), expiryInDays);
  const issueDate = addDays(expiryDate, -validity * 365);
  const docs = buildDocuments(clinicianId, credId, authority, licenseType, state);
  documents.push(...docs);
  return {
    id: credId,
    clinicianId,
    authority,
    licenseType,
    licenseNumber: `${authority}-${String(20000 + index + nid).slice(0, 5)}-${new Date(issueDate).getFullYear()}`,
    issueDate,
    expiryDate,
    state,
    psvProvider: authority === "SCFHS" ? "TrueProfile" : "DataFlow",
    psvStatus: psv,
    cpdRequired: rs?.cpdThreshold ?? 40,
    cpdLedger: buildCpd(cpdDone, credId),
    renewalCycleYears: validity,
  };
}

for (const s of seeds) {
  nid += 7;
  const credIds: string[] = [];
  const cred = buildCredential(s.id, s.authority, s.licenseType, s.expiryInDays, s.state, s.psv, s.cpdDone, 0);
  credentials.push(cred);
  credIds.push(cred.id);
  if (s.gap) GAP_CREDENTIAL_IDS.push(cred.id);
  if (s.second) {
    const cred2 = buildCredential(s.id, s.second.authority, s.second.licenseType, s.second.expiryInDays, s.second.state, s.second.psv, s.second.cpdDone, 1);
    credentials.push(cred2);
    credIds.push(cred2.id);
  }
  clinicians.push({
    id: s.id,
    firstName: s.first,
    lastName: s.last,
    title: s.title,
    specialty: s.specialty,
    nationalId: `784-${1985 + (nid % 15)}-${String(1000000 + nid * 131).slice(0, 7)}-${nid % 10}`,
    passportNo: `P${String(nid * 977).slice(0, 7)}`,
    email: `${s.first}.${s.last}`.toLowerCase().replace(/[^a-z.]/g, "") + "@group.ae",
    phone: `+971 5${nid % 9} ${String(1000000 + nid * 311).slice(0, 7)}`,
    site: s.site,
    photoSeed: `${s.first}${s.last}`,
    credentialIds: credIds,
  });
}

export { clinicians, credentials, documents };

export const clinicianMap: Record<string, Clinician> = Object.fromEntries(
  clinicians.map((c) => [c.id, c]),
);
export const credentialMap: Record<string, Credential> = Object.fromEntries(
  credentials.map((c) => [c.id, c]),
);

export function clinicianName(c: Clinician): string {
  return `${c.title} ${c.firstName} ${c.lastName}`;
}
export function docsForCredential(credId: string): VaultDocument[] {
  const cred = credentialMap[credId];
  if (!cred) return [];
  return documents.filter((d) => d.id.startsWith(`${credId}-doc-`));
}
export function docsForClinician(clinicianId: string): VaultDocument[] {
  return documents.filter((d) => d.clinicianId === clinicianId);
}
