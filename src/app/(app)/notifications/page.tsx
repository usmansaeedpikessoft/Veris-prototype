"use client";

import { PageHeader } from "@/components/page-header";
import { Card, CardContent, CardHeader, CardTitle, CardDescription } from "@/components/ui/card";
import { Badge } from "@/components/ui/badge";
import { Tabs, TabsContent, TabsList, TabsTrigger } from "@/components/ui/tabs";
import { TonePill } from "@/components/status/badges";
import { useVeris } from "@/lib/store";
import { notificationTemplates } from "@/lib/mock-data";
import { fmtDateTime } from "@/lib/dates";
import type { Tone } from "@/lib/status";
import { Mail, MessageCircle } from "lucide-react";

const STATUS_TONE: Record<string, Tone> = {
  delivered: "info",
  read: "success",
  sent: "muted",
  failed: "danger",
};

export default function NotificationsPage() {
  const notifications = useVeris((s) => s.notifications);

  return (
    <div>
      <PageHeader
        title="Notifications"
        module="NOT / INT"
        description="Templated email + WhatsApp chases with an escalating cadence toward deadlines. Every message is logged (SP-NOT / FEAT-INT-03/04)."
      />

      <Tabs defaultValue="log">
        <TabsList>
          <TabsTrigger value="log">Delivery log ({notifications.length})</TabsTrigger>
          <TabsTrigger value="templates">Templates ({notificationTemplates.length})</TabsTrigger>
        </TabsList>

        <TabsContent value="log" className="mt-4">
          <Card className="overflow-hidden p-0">
            <div className="divide-y">
              {notifications.map((n) => (
                <div key={n.id} className="flex items-center gap-3 px-4 py-3">
                  <span className={`flex size-8 shrink-0 items-center justify-center rounded-full ${n.channel === "email" ? "bg-info/12 text-info" : "bg-success/12 text-success"}`}>
                    {n.channel === "email" ? <Mail className="size-4" /> : <MessageCircle className="size-4" />}
                  </span>
                  <div className="min-w-0 flex-1">
                    <div className="truncate text-sm font-medium">{n.subject}</div>
                    <div className="truncate text-xs text-muted-foreground">
                      To {n.recipientName} · {n.recipient} · {fmtDateTime(n.sentAt)}
                    </div>
                  </div>
                  <Badge variant="outline" className="hidden font-mono text-[10px] sm:inline">{n.template}</Badge>
                  <TonePill tone={STATUS_TONE[n.status]}>{n.status}</TonePill>
                </div>
              ))}
            </div>
          </Card>
        </TabsContent>

        <TabsContent value="templates" className="mt-4 grid grid-cols-1 gap-4 md:grid-cols-2">
          {notificationTemplates.map((t) => (
            <Card key={t.key}>
              <CardHeader>
                <div className="flex items-center justify-between">
                  <CardTitle className="text-base">{t.name}</CardTitle>
                  <Badge variant="secondary">{t.channel}</Badge>
                </div>
                <CardDescription>Cadence: {t.cadence}</CardDescription>
              </CardHeader>
              <CardContent>
                <pre className="whitespace-pre-wrap rounded-lg border bg-muted/40 p-3 text-xs text-muted-foreground">{t.body}</pre>
              </CardContent>
            </Card>
          ))}
        </TabsContent>
      </Tabs>
    </div>
  );
}
