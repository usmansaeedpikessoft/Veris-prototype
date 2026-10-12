import type { Authority, AuthorityCode } from "../types";

export const authorities: Authority[] = [
  {
    code: "DHA",
    name: "Dubai Health Authority",
    portal: "Sheryan",
    country: "United Arab Emirates",
    region: "UAE",
    phase1: true,
  },
  {
    code: "DOH",
    name: "Department of Health — Abu Dhabi",
    portal: "Tamm / DOH eLicensing",
    country: "United Arab Emirates",
    region: "UAE",
    phase1: false,
  },
  {
    code: "MOHAP",
    name: "Ministry of Health and Prevention",
    portal: "MOHAP eServices",
    country: "United Arab Emirates",
    region: "UAE",
    phase1: false,
  },
  {
    code: "SCFHS",
    name: "Saudi Commission for Health Specialties",
    portal: "Mumaris+",
    country: "Saudi Arabia",
    region: "KSA",
    twoFactor: "Nafath 2FA",
    phase1: false,
  },
  {
    code: "QCHP",
    name: "Qatar Council for Healthcare Practitioners",
    portal: "QCHP Portal",
    country: "Qatar",
    region: "Qatar",
    phase1: false,
  },
  {
    code: "NHRA",
    name: "National Health Regulatory Authority",
    portal: "NHRA eServices",
    country: "Bahrain",
    region: "Bahrain",
    phase1: false,
  },
  {
    code: "OMSB",
    name: "Oman Medical Specialty Board",
    portal: "OMSB Portal",
    country: "Oman",
    region: "Oman",
    phase1: false,
  },
];

export const authorityMap: Record<AuthorityCode, Authority> = Object.fromEntries(
  authorities.map((a) => [a.code, a]),
) as Record<AuthorityCode, Authority>;

export function authorityName(code: AuthorityCode): string {
  return authorityMap[code]?.name ?? code;
}
