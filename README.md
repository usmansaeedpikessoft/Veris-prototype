# Veris — Interactive Frontend Prototype

**Veris** is an institutional clinician **credentialing and license-renewal agent** for GCC healthcare provider groups (Pikessoft discovery concept). This is a **frontend-only, fully interactive prototype with mock data** — no backend, Vercel-deployable — built to let stakeholders click through the whole concept before any MVP build.

Everything maps directly to the source discovery docs (`../docs/00`–`05`): modules (REG, REN, PACK, SUB, EXC, DASH, INT, ADM, AUD), workflows (WF-A..D), the 11-state case model, roles/personas, and the business rules (BR-xx).

## Tech stack

- **Next.js 16** (App Router) + **TypeScript**
- **Tailwind CSS v4** + **shadcn/ui** (Radix)
- **Recharts** (dashboard), **lucide-react**, **next-themes** (light/dark)
- **Zustand** in-memory session store — workflow transitions mutate state live (dashboard, audit log and register update in real time). State resets on full page refresh (by design, mock data).

## Run locally

```bash
npm install
npm run dev
```

Open http://localhost:3000 (redirects to `/dashboard`).

```bash
npm run build && npm start   # production build
```

## Deploy to Vercel

This app lives in the `veris/` subdirectory of the repo. In Vercel, import the repo and set **Root Directory = `veris`** (framework preset: Next.js, no env vars required). Or from the CLI:

```bash
cd veris && vercel
```

## What to try

- **Role switcher** (top-right): experience the app as the Credentialing Officer, Compliance Head, Medical Director, Clinician (self-scoped portal) or CFO/COO — navigation and data re-scope per the RBAC matrix (docs 04).
- **WF-A Renewal (live):** open any case from the Case Queue → simulate upload → run validation → record a **named approval** → assisted submit → record "License issued". The new expiry is written back to the register and every step is appended to the audit log.
- **WF-D Lapse prevention:** on the Dashboard, the at-risk list surfaces credentials with no open case — click **Open case** to spin one up.
- **WF-C Exceptions:** the Exceptions queue shows authority rejections with classified reasons and proposed corrective actions.
- **CSV import:** Admin › Integrations — validate a sample CSV (valid + invalid rows) and import clinicians into the register.
- **Dark mode** toggle, global **⌘K** search.

## Guardrails honored in the UI (BR-60..63)

No auto-submit control exists; a **named approval is required before every submission**; PSV status is read-only (never bypassed); privileges are display-only (never a grant/deny decision); the final portal submit is always an explicit human action (assisted mode, Phase 1).

## Project map

```
src/
  app/(app)/            route pages (dashboard, register, cases, exceptions,
                        onboarding, notifications, audit, admin/*, me)
  components/           app-shell, status badges, charts, case stepper, stat tiles
  lib/
    types.ts            domain entities (SRS §6.1)
    rbac.ts             RBAC matrix + nav visibility (docs 04)
    status.ts           case-state / expiry / validation display vocabulary
    store.ts            Zustand session store + workflow actions
    view.ts             merged-data hooks + at-risk detection (WF-D)
    mock-data/          authorities, users, rule sets, clinicians, cases, audit, ...
```

> Prototype only — all figures are illustrative mock data per the Draft v0.1 discovery baseline. Nothing here is a committed scope or a verified metric.
