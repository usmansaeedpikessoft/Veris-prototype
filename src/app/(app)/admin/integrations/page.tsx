"use client";

import { useState } from "react";
import { toast } from "sonner";
import { PageHeader } from "@/components/page-header";
import { Card, CardContent, CardHeader, CardTitle, CardDescription } from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import { Textarea } from "@/components/ui/textarea";
import { Badge } from "@/components/ui/badge";
import { TonePill } from "@/components/status/badges";
import {
  Table,
  TableBody,
  TableCell,
  TableHead,
  TableHeader,
  TableRow,
} from "@/components/ui/table";
import { useVeris } from "@/lib/store";
import { authorities, ruleSetFor } from "@/lib/mock-data";
import { TODAY, addDays } from "@/lib/dates";
import type { Clinician, Credential, AuthorityCode } from "@/lib/types";
import { Upload, FileSpreadsheet, CheckCircle2, XCircle, Plug, ShieldCheck, Mail, MessageCircle } from "lucide-react";

const SAMPLE_CSV = `name,specialty,authority,licenseType,nationalId,email
Dr. Reem Sultan,Cardiology,DHA,Specialist,784-1990-1234567-1,reem.sultan@group.ae
Dr. Omar Baig,Family Medicine,DHA,General Practitioner,784-1988-7654321-2,omar.baig@group.ae
Nurse Lucy Adeyemi,ICU Nursing,DHA,Registered Nurse,784-1992-2223334-5,lucy.adeyemi@group.ae
Dr. Bad Row,,XYZ,Specialist,,not-an-email`;

const VALID_AUTHORITIES = new Set(authorities.map((a) => a.code));

interface ParsedRow {
  line: number;
  name: string;
  specialty: string;
  authority: string;
  licenseType: string;
  nationalId: string;
  email: string;
  errors: string[];
}

function parseCsv(text: string): ParsedRow[] {
  const lines = text.trim().split(/\r?\n/);
  const rows: ParsedRow[] = [];
  for (let i = 1; i < lines.length; i++) {
    const cols = lines[i].split(",").map((c) => c.trim());
    const [name = "", specialty = "", authority = "", licenseType = "", nationalId = "", email = ""] = cols;
    const errors: string[] = [];
    if (name.length < 3) errors.push("Name missing");
    if (!VALID_AUTHORITIES.has(authority as AuthorityCode)) errors.push(`Unknown authority "${authority || "—"}"`);
    if (!licenseType) errors.push("License type missing");
    if (!/.+@.+\..+/.test(email)) errors.push("Invalid email");
    if (!nationalId) errors.push("National ID missing");
    rows.push({ line: i + 1, name, specialty, authority, licenseType, nationalId, email, errors });
  }
  return rows;
}

export default function IntegrationsPage() {
  const [text, setText] = useState(SAMPLE_CSV);
  const [rows, setRows] = useState<ParsedRow[] | null>(null);
  const importClinicians = useVeris((s) => s.importClinicians);
  const [importedCount, setImportedCount] = useState(0);

  const validRows = rows?.filter((r) => r.errors.length === 0) ?? [];
  const invalidRows = rows?.filter((r) => r.errors.length > 0) ?? [];

  function doImport() {
    const payload = validRows.map((r, idx) => {
      const id = `c-import-${Date.now()}-${idx}`;
      const rs = ruleSetFor(r.authority, r.licenseType);
      const credId = `${id}-cred-0`;
      const clinician: Clinician = {
        id,
        firstName: r.name.replace(/^(Dr\.|Nurse)\s+/i, "").split(" ")[0] ?? r.name,
        lastName: r.name.split(" ").slice(-1)[0] ?? "",
        title: /nurse/i.test(r.name) ? "Nurse" : "Dr.",
        specialty: r.specialty || "General",
        nationalId: r.nationalId,
        passportNo: "—",
        email: r.email,
        phone: "+971 5x xxxxxxx",
        site: "Imported",
        photoSeed: id,
        credentialIds: [credId],
      };
      const credential: Credential = {
        id: credId,
        clinicianId: id,
        authority: r.authority as AuthorityCode,
        licenseType: r.licenseType,
        licenseNumber: `${r.authority}-IMP-${idx}`,
        issueDate: addDays(TODAY.toISOString(), -200),
        expiryDate: addDays(TODAY.toISOString(), 165),
        state: "Open",
        psvProvider: "DataFlow",
        psvStatus: "not-started",
        cpdRequired: rs?.cpdThreshold ?? 40,
        cpdLedger: [],
        renewalCycleYears: rs?.validityYears ?? 1,
      };
      return { clinician, credential };
    });
    importClinicians(payload);
    setImportedCount(payload.length);
    toast.success(`${payload.length} clinician(s) imported`, {
      description: "They now appear in the Credential Register.",
    });
    setRows(null);
  }

  return (
    <div>
      <PageHeader
        title="Integrations"
        module="INT"
        description="HR/HIS import, notification channels and PSV status. Phase 1 uses CSV import with validation and an error report (FEAT-INT-01)."
      />

      <div className="grid grid-cols-1 gap-5 lg:grid-cols-3">
        <Card className="lg:col-span-2">
          <CardHeader>
            <CardTitle className="flex items-center gap-2 text-base">
              <FileSpreadsheet className="size-4" /> HR/HIS CSV import
            </CardTitle>
            <CardDescription>
              Columns: name, specialty, authority, licenseType, nationalId, email. Valid rows import; invalid rows are reported with reasons.
            </CardDescription>
          </CardHeader>
          <CardContent className="space-y-3">
            <Textarea value={text} onChange={(e) => setText(e.target.value)} rows={7} className="font-mono text-xs" />
            <div className="flex gap-2">
              <Button variant="outline" onClick={() => setText(SAMPLE_CSV)}>Load sample</Button>
              <Button className="gap-1.5" onClick={() => { setRows(parseCsv(text)); setImportedCount(0); }}>
                <Upload className="size-4" /> Validate rows
              </Button>
            </div>

            {importedCount > 0 && (
              <div className="flex items-center gap-2 rounded-lg border border-success/40 bg-success/5 p-3 text-sm">
                <CheckCircle2 className="size-4 text-success" />
                {importedCount} clinician(s) imported successfully.
              </div>
            )}

            {rows && (
              <div className="space-y-3">
                <div className="flex items-center gap-2 text-sm">
                  <TonePill tone="success">{validRows.length} valid</TonePill>
                  <TonePill tone="danger">{invalidRows.length} invalid</TonePill>
                </div>
                <div className="overflow-hidden rounded-lg border">
                  <Table>
                    <TableHeader>
                      <TableRow>
                        <TableHead className="w-10">#</TableHead>
                        <TableHead>Name</TableHead>
                        <TableHead className="hidden sm:table-cell">Authority</TableHead>
                        <TableHead>Result</TableHead>
                      </TableRow>
                    </TableHeader>
                    <TableBody>
                      {rows.map((r) => (
                        <TableRow key={r.line}>
                          <TableCell className="text-xs text-muted-foreground">{r.line}</TableCell>
                          <TableCell className="text-sm">{r.name || <span className="text-muted-foreground">—</span>}</TableCell>
                          <TableCell className="hidden sm:table-cell text-sm">{r.authority}</TableCell>
                          <TableCell>
                            {r.errors.length === 0 ? (
                              <span className="flex items-center gap-1.5 text-sm text-success"><CheckCircle2 className="size-4" /> Valid</span>
                            ) : (
                              <span className="flex items-center gap-1.5 text-sm text-danger"><XCircle className="size-4" /> {r.errors.join(", ")}</span>
                            )}
                          </TableCell>
                        </TableRow>
                      ))}
                    </TableBody>
                  </Table>
                </div>
                <Button disabled={validRows.length === 0} className="gap-1.5" onClick={doImport}>
                  <Upload className="size-4" /> Import {validRows.length} valid row{validRows.length === 1 ? "" : "s"}
                </Button>
              </div>
            )}
          </CardContent>
        </Card>

        <div className="space-y-5">
          <Card>
            <CardHeader><CardTitle className="flex items-center gap-2 text-base"><ShieldCheck className="size-4" /> PSV status feed</CardTitle></CardHeader>
            <CardContent className="space-y-3 text-sm">
              <ConnRow icon={<Plug className="size-4" />} name="DataFlow" status="connected" note="Status visible where permitted" />
              <ConnRow icon={<Plug className="size-4" />} name="TrueProfile" status="connected" note="SCFHS verifications" />
              <p className="text-xs text-muted-foreground">PSV status is read-only. Veris never bypasses verification (BR-61 / FEAT-INT-05). Dependent on provider permissions (B2).</p>
            </CardContent>
          </Card>
          <Card>
            <CardHeader><CardTitle className="text-base">Notification channels</CardTitle></CardHeader>
            <CardContent className="space-y-3 text-sm">
              <ConnRow icon={<Mail className="size-4" />} name="Email gateway" status="connected" note="Templated + logged" />
              <ConnRow icon={<MessageCircle className="size-4" />} name="WhatsApp provider" status="connected" note="Opt-in, email fallback" />
            </CardContent>
          </Card>
          <Card>
            <CardHeader><CardTitle className="text-base">HR/HIS API</CardTitle></CardHeader>
            <CardContent className="text-sm">
              <ConnRow icon={<Plug className="size-4" />} name="API sync" status="phase2" note="Once a connector exists" />
            </CardContent>
          </Card>
        </div>
      </div>
    </div>
  );
}

function ConnRow({ icon, name, status, note }: { icon: React.ReactNode; name: string; status: "connected" | "phase2"; note: string }) {
  return (
    <div className="flex items-center gap-3">
      <span className="flex size-8 items-center justify-center rounded-full bg-muted text-muted-foreground">{icon}</span>
      <div className="min-w-0 flex-1">
        <div className="text-sm font-medium">{name}</div>
        <div className="text-xs text-muted-foreground">{note}</div>
      </div>
      {status === "connected" ? (
        <TonePill tone="success">Connected</TonePill>
      ) : (
        <Badge variant="outline" className="text-[10px]">Phase 2</Badge>
      )}
    </div>
  );
}
