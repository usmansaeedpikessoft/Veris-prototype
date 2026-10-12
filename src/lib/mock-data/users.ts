import type { AppUser, RoleCode } from "../types";

// The five personas surfaced in the demo role-switcher (docs 04 §4) plus the
// supporting roles that appear in user management.
export const users: AppUser[] = [
  {
    id: "u-mariam",
    name: "Mariam Al Nuaimi",
    role: "officer",
    roleLabel: "Credentialing Officer",
    email: "mariam.alnuaimi@group.ae",
    site: "Group Medical Staff Office — Dubai",
    status: "active",
    avatarSeed: "Mariam",
  },
  {
    id: "u-fatima",
    name: "Fatima Khan",
    role: "compliance-head",
    roleLabel: "Compliance Head",
    email: "fatima.khan@group.ae",
    site: "Group Compliance — Dubai",
    status: "active",
    avatarSeed: "Fatima",
  },
  {
    id: "u-khalid",
    name: "Dr. Khalid Rahman",
    role: "medical-director",
    roleLabel: "Medical Director",
    email: "khalid.rahman@group.ae",
    site: "Group Executive — Dubai",
    status: "active",
    avatarSeed: "Khalid",
  },
  {
    id: "u-sara",
    name: "Dr. Sara Haddad",
    role: "clinician",
    roleLabel: "Clinician",
    email: "sara.haddad@group.ae",
    site: "Jumeirah Specialty Clinic",
    status: "active",
    clinicianId: "c-sara-haddad",
    avatarSeed: "Sara",
  },
  {
    id: "u-ahmed",
    name: "Ahmed Siddiqui",
    role: "exec",
    roleLabel: "CFO / COO",
    email: "ahmed.siddiqui@group.ae",
    site: "Group Finance — Dubai",
    status: "active",
    avatarSeed: "Ahmed",
  },
  // Supporting roles (appear in Admin › Users, not all in the switcher)
  {
    id: "u-omar",
    name: "Omar Farouk",
    role: "admin",
    roleLabel: "System Administrator",
    email: "omar.farouk@group.ae",
    site: "Group IT — Dubai",
    status: "active",
    avatarSeed: "Omar",
  },
  {
    id: "u-leila",
    name: "Leila Mansour",
    role: "rule-author",
    roleLabel: "Compliance Specialist (Rule Author)",
    email: "leila.mansour@group.ae",
    site: "Group Compliance — Dubai",
    status: "active",
    avatarSeed: "Leila",
  },
  {
    id: "u-bilal",
    name: "Bilal Ahmed",
    role: "implementation",
    roleLabel: "Implementation Specialist (Pikessoft)",
    email: "bilal.ahmed@pikessoft.com",
    site: "Pikessoft — Lahore",
    status: "active",
    avatarSeed: "Bilal",
  },
  {
    id: "u-john",
    name: "John Mathew",
    role: "auditor",
    roleLabel: "External Auditor",
    email: "j.mathew@audit-partner.com",
    site: "External — read only",
    status: "active",
    avatarSeed: "John",
  },
  {
    id: "u-rania",
    name: "Rania Youssef",
    role: "officer",
    roleLabel: "Credentialing Officer",
    email: "rania.youssef@group.ae",
    site: "Group Medical Staff Office — Abu Dhabi",
    status: "inactive",
    avatarSeed: "Rania",
  },
];

// Role-switcher demo personas (the five lenses stakeholders want to experience)
export const switcherUserIds = [
  "u-mariam",
  "u-fatima",
  "u-khalid",
  "u-sara",
  "u-ahmed",
];

export const userMap: Record<string, AppUser> = Object.fromEntries(
  users.map((u) => [u.id, u]),
);

export const roleLabel: Record<RoleCode, string> = {
  officer: "Credentialing Officer",
  "compliance-head": "Compliance Head",
  "medical-director": "Medical Director",
  clinician: "Clinician",
  admin: "System Administrator",
  "rule-author": "Compliance Specialist",
  exec: "CFO / COO",
  implementation: "Implementation Specialist",
  auditor: "Auditor",
};
