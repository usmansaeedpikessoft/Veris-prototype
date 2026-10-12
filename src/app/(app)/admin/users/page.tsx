"use client";

import { PageHeader } from "@/components/page-header";
import { Card, CardContent, CardHeader, CardTitle, CardDescription } from "@/components/ui/card";
import { Badge } from "@/components/ui/badge";
import { Tabs, TabsContent, TabsList, TabsTrigger } from "@/components/ui/tabs";
import {
  Table,
  TableBody,
  TableCell,
  TableHead,
  TableHeader,
  TableRow,
} from "@/components/ui/table";
import { UserAvatar } from "@/components/user-avatar";
import { TonePill } from "@/components/status/badges";
import { users } from "@/lib/mock-data";
import { RBAC, type Capability } from "@/lib/rbac";
import type { RoleCode } from "@/lib/types";
import { cn } from "@/lib/utils";

const CAP_LABELS: { cap: Capability; label: string }[] = [
  { cap: "view-register", label: "View register" },
  { cap: "edit-clinician", label: "Edit clinician" },
  { cap: "upload-documents", label: "Upload docs" },
  { cap: "progress-case", label: "Run case" },
  { cap: "approve-filing", label: "Approve filing" },
  { cap: "submit-filing", label: "Submit (assisted)" },
  { cap: "handle-exceptions", label: "Handle exceptions" },
  { cap: "view-dashboard", label: "View dashboard" },
  { cap: "author-rules", label: "Author rule sets" },
  { cap: "config-escalation", label: "Config escalation" },
  { cap: "manage-users", label: "Manage users" },
  { cap: "view-audit", label: "View audit" },
  { cap: "export-audit", label: "Export audit" },
];

const ROLE_ORDER: { code: RoleCode; short: string }[] = [
  { code: "officer", short: "Officer" },
  { code: "compliance-head", short: "Comp. Head" },
  { code: "medical-director", short: "Med. Dir." },
  { code: "clinician", short: "Clinician" },
  { code: "admin", short: "Admin" },
  { code: "rule-author", short: "Rule Author" },
  { code: "exec", short: "Exec" },
  { code: "implementation", short: "Impl." },
  { code: "auditor", short: "Auditor" },
];

const GRANT_TONE: Record<string, string> = {
  F: "bg-success/15 text-success",
  A: "bg-info/15 text-info",
  V: "bg-muted text-muted-foreground",
  S: "bg-warning/15 text-warning",
};

export default function UsersPage() {
  return (
    <div>
      <PageHeader
        title="Users & Roles"
        module="ADM / SEC"
        description="Provision and deactivate users; role-based access enforced per the matrix (FEAT-ADM-03 / FEAT-SEC-01). No role can auto-submit without approval."
      />

      <Tabs defaultValue="users">
        <TabsList>
          <TabsTrigger value="users">Users ({users.length})</TabsTrigger>
          <TabsTrigger value="matrix">RBAC Matrix</TabsTrigger>
        </TabsList>

        <TabsContent value="users" className="mt-4">
          <Card className="overflow-hidden p-0">
            <Table>
              <TableHeader>
                <TableRow>
                  <TableHead>User</TableHead>
                  <TableHead className="hidden md:table-cell">Role</TableHead>
                  <TableHead className="hidden lg:table-cell">Site</TableHead>
                  <TableHead>Status</TableHead>
                </TableRow>
              </TableHeader>
              <TableBody>
                {users.map((u) => (
                  <TableRow key={u.id}>
                    <TableCell>
                      <div className="flex items-center gap-3">
                        <UserAvatar name={u.name} seed={u.avatarSeed} />
                        <div className="min-w-0">
                          <div className="truncate text-sm font-medium">{u.name}</div>
                          <div className="truncate text-xs text-muted-foreground">{u.email}</div>
                        </div>
                      </div>
                    </TableCell>
                    <TableCell className="hidden md:table-cell text-sm">{u.roleLabel}</TableCell>
                    <TableCell className="hidden lg:table-cell text-sm text-muted-foreground">{u.site}</TableCell>
                    <TableCell>
                      <TonePill tone={u.status === "active" ? "success" : "muted"}>{u.status}</TonePill>
                    </TableCell>
                  </TableRow>
                ))}
              </TableBody>
            </Table>
          </Card>
        </TabsContent>

        <TabsContent value="matrix" className="mt-4">
          <Card>
            <CardHeader>
              <CardTitle className="text-base">RBAC permission matrix</CardTitle>
              <CardDescription>F = full · A = approve · V = view · S = self-scope (docs 04 §3).</CardDescription>
            </CardHeader>
            <CardContent className="overflow-x-auto px-0">
              <table className="w-full min-w-[720px] text-sm">
                <thead>
                  <tr className="border-b">
                    <th className="px-4 py-2 text-left font-medium">Capability</th>
                    {ROLE_ORDER.map((r) => (
                      <th key={r.code} className="px-2 py-2 text-center text-xs font-medium text-muted-foreground">{r.short}</th>
                    ))}
                  </tr>
                </thead>
                <tbody>
                  {CAP_LABELS.map(({ cap, label }) => (
                    <tr key={cap} className="border-b last:border-0">
                      <td className="px-4 py-2 text-xs font-medium">{label}</td>
                      {ROLE_ORDER.map((r) => {
                        const g = RBAC[r.code]?.[cap];
                        return (
                          <td key={r.code} className="px-2 py-2 text-center">
                            {g ? (
                              <span className={cn("inline-flex size-6 items-center justify-center rounded text-[11px] font-semibold", GRANT_TONE[g])}>{g}</span>
                            ) : (
                              <span className="text-muted-foreground/30">·</span>
                            )}
                          </td>
                        );
                      })}
                    </tr>
                  ))}
                </tbody>
              </table>
            </CardContent>
          </Card>
        </TabsContent>
      </Tabs>
    </div>
  );
}
