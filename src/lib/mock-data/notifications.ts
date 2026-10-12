import type { Notification } from "../types";
import { openCases } from "./cases";
import { clinicianMap, clinicianName } from "./clinicians";
import { TODAY, addDays } from "../dates";

// Chase / notification log (SP-NOT) — email + WhatsApp, escalating cadence.
const notifications: Notification[] = [];
let n = 0;

const templates = [
  { key: "doc-request", subject: "Action needed: documents for your license renewal" },
  { key: "doc-reminder", subject: "Reminder: outstanding documents for renewal" },
  { key: "cpd-reminder", subject: "CPD hours required before your renewal can proceed" },
  { key: "approval-ready", subject: "A filing is ready for your approval" },
  { key: "escalation", subject: "Escalation: credential at risk of lapse" },
];

for (const c of openCases().slice(0, 14)) {
  const clinician = clinicianMap[c.clinicianId];
  if (!clinician) continue;
  const label = clinicianName(clinician);
  const needsDocs = c.checklist.some((i) => i.validation === "missing" || i.validation === "stale");
  const tpl = c.state === "Escalated" ? templates[4] : needsDocs ? templates[0] : templates[3];

  notifications.push({
    id: `ntf-${n++}`,
    channel: "email",
    recipient: clinician.email,
    recipientName: label,
    template: tpl.key,
    subject: tpl.subject,
    sentAt: addDays(TODAY.toISOString(), -(n % 9) - 1),
    status: n % 4 === 0 ? "sent" : n % 3 === 0 ? "read" : "delivered",
    caseId: c.id,
  });

  if (needsDocs) {
    notifications.push({
      id: `ntf-${n++}`,
      channel: "whatsapp",
      recipient: clinician.phone,
      recipientName: label,
      template: "doc-reminder",
      subject: templates[1].subject,
      sentAt: addDays(TODAY.toISOString(), -(n % 5)),
      status: n % 5 === 0 ? "failed" : "read",
      caseId: c.id,
    });
  }
}

notifications.sort((a, b) => new Date(b.sentAt).getTime() - new Date(a.sentAt).getTime());

export { notifications };

export const notificationTemplates = [
  {
    key: "doc-request",
    name: "Document request",
    channel: "email + whatsapp",
    body:
      "Dear {{clinician}}, your {{authority}} {{licenseType}} license renews on {{expiry}}. Please upload: {{documents}}. Upload here: {{link}}",
    cadence: "On case open, then day 7, day 14, day 21",
  },
  {
    key: "doc-reminder",
    name: "Document reminder (escalating)",
    channel: "email + whatsapp",
    body:
      "Reminder: {{count}} document(s) still outstanding for your {{authority}} renewal. Deadline in {{daysLeft}} days.",
    cadence: "Daily within 14 days of deadline",
  },
  {
    key: "cpd-reminder",
    name: "CPD shortfall",
    channel: "email",
    body:
      "Your CPD total ({{cpdDone}}h) is below the {{cpdRequired}}h required by {{authority}}. Renewal cannot proceed until complete.",
    cadence: "On readiness gate failure, then weekly",
  },
  {
    key: "approval-ready",
    name: "Approval ready",
    channel: "email",
    body: "A filing for {{clinician}} ({{authority}} {{licenseType}}) is ready for your named approval.",
    cadence: "On pack completion",
  },
  {
    key: "escalation",
    name: "Escalation notice",
    channel: "email + whatsapp",
    body:
      "ESCALATION ({{tier}}): {{clinician}}'s {{authority}} credential is at risk of lapse in {{daysLeft}} days with no forward progress.",
    cadence: "On SLA breach, per escalation ladder",
  },
];
