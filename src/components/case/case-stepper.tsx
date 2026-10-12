import { caseFlow, caseStateMeta } from "@/lib/status";
import type { CaseState } from "@/lib/types";
import { cn } from "@/lib/utils";
import { Check, TriangleAlert } from "lucide-react";

// Off-flow states that branch from Tracking.
const OFF_FLOW: CaseState[] = ["Rejected", "Remediating", "Escalated"];

export function CaseStepper({ state }: { state: CaseState }) {
  const offFlow = OFF_FLOW.includes(state);
  const currentIdx = offFlow ? caseFlow.indexOf("Tracking") : caseFlow.indexOf(state);

  return (
    <div className="flex flex-col gap-3">
      <ol className="flex flex-wrap items-center gap-y-3">
        {caseFlow.map((s, i) => {
          const done = i < currentIdx;
          const active = !offFlow && i === currentIdx;
          return (
            <li key={s} className="flex items-center">
              <div className="flex items-center gap-2">
                <span
                  className={cn(
                    "flex size-6 items-center justify-center rounded-full border text-[11px] font-semibold",
                    done && "border-success bg-success/15 text-success",
                    active && "border-primary bg-primary text-primary-foreground",
                    !done && !active && "border-border bg-muted text-muted-foreground",
                  )}
                >
                  {done ? <Check className="size-3.5" /> : i + 1}
                </span>
                <span
                  className={cn(
                    "text-xs font-medium whitespace-nowrap",
                    active ? "text-foreground" : "text-muted-foreground",
                  )}
                >
                  {caseStateMeta[s].label}
                </span>
              </div>
              {i < caseFlow.length - 1 && (
                <span className={cn("mx-2 h-px w-6 shrink-0", done ? "bg-success" : "bg-border")} />
              )}
            </li>
          );
        })}
      </ol>
      {offFlow && (
        <div className="flex items-center gap-2 rounded-md border border-escalate/30 bg-escalate/5 px-3 py-1.5 text-xs">
          <TriangleAlert className="size-3.5 text-escalate" />
          <span>
            Branched to <strong>{caseStateMeta[state].label}</strong> — resolve to rejoin the main flow at Ready for Approval.
          </span>
        </div>
      )}
    </div>
  );
}
