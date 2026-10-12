import { Card } from "@/components/ui/card";
import { cn } from "@/lib/utils";
import { type Tone, toneClasses } from "@/lib/status";
import type { LucideIcon } from "lucide-react";

export function StatTile({
  label,
  value,
  sub,
  icon: Icon,
  tone = "muted",
  className,
}: {
  label: string;
  value: React.ReactNode;
  sub?: string;
  icon?: LucideIcon;
  tone?: Tone;
  className?: string;
}) {
  return (
    <Card className={cn("gap-0 p-4", className)}>
      <div className="flex items-center justify-between">
        <span className="text-xs font-medium text-muted-foreground">{label}</span>
        {Icon && (
          <span
            className={cn(
              "flex size-7 items-center justify-center rounded-md border",
              toneClasses[tone],
            )}
          >
            <Icon className="size-4" />
          </span>
        )}
      </div>
      <div className="mt-2 text-3xl font-semibold tabular-nums tracking-tight">
        {value}
      </div>
      {sub && <p className="mt-1 text-xs text-muted-foreground">{sub}</p>}
    </Card>
  );
}
