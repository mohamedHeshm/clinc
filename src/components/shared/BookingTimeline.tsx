import { Check, X, Clock as ClockIcon } from "lucide-react";
import { cn } from "@/lib/utils";
import type { BookingStatus } from "@/types/enums";

interface TimelineStep {
  label: string;
  state: "done" | "current" | "upcoming" | "stopped";
}

function buildSteps(status: BookingStatus): TimelineStep[] {
  if (status === "rejected") {
    return [
      { label: "طلب الحجز", state: "done" },
      { label: "تم الرفض", state: "stopped" },
    ];
  }

  if (status === "cancelled") {
    return [
      { label: "طلب الحجز", state: "done" },
      { label: "تم التأكيد", state: "done" },
      { label: "تم الإلغاء", state: "stopped" },
    ];
  }

  const afterConfirmState = (target: BookingStatus): TimelineStep["state"] => {
    if (status === target) return "current";
    const order: BookingStatus[] = ["accepted", "confirmed", "in_progress", "completed"];
    return order.indexOf(status) > order.indexOf(target) ? "done" : "upcoming";
  };

  return [
    { label: "طلب الحجز", state: "done" },
    {
      label: "في انتظار التأكيد",
      state: status === "pending" ? "current" : "done",
    },
    {
      label: "تم التأكيد",
      state: status === "pending" ? "upcoming" : afterConfirmState("accepted"),
    },
    {
      label: "الموعد",
      state: status === "completed" ? "done" : afterConfirmState("in_progress"),
    },
  ];
}

export function BookingTimeline({ status }: { status: BookingStatus }) {
  const steps = buildSteps(status);

  return (
    <ol className="space-y-0">
      {steps.map((step, index) => (
        <li key={step.label} className="relative flex gap-3 pb-6 last:pb-0">
          {index < steps.length - 1 && (
            <span
              className={cn(
                "absolute right-[11px] top-6 h-full w-px",
                step.state === "done" ? "bg-primary/40" : "bg-border"
              )}
            />
          )}
          <span
            className={cn(
              "z-10 flex h-6 w-6 shrink-0 items-center justify-center rounded-full border-2",
              step.state === "done" && "border-primary bg-primary text-primary-foreground",
              step.state === "current" && "border-primary bg-surface text-primary",
              step.state === "upcoming" && "border-border bg-surface text-muted-foreground/40",
              step.state === "stopped" && "border-destructive bg-destructive text-destructive-foreground"
            )}
          >
            {step.state === "done" && <Check className="h-3.5 w-3.5" />}
            {step.state === "stopped" && <X className="h-3.5 w-3.5" />}
            {step.state === "current" && <ClockIcon className="h-3.5 w-3.5" />}
          </span>
          <span
            className={cn(
              "pt-0.5 text-sm",
              step.state === "upcoming" ? "text-muted-foreground/60" : "text-foreground",
              step.state === "current" && "font-medium"
            )}
          >
            {step.label}
          </span>
        </li>
      ))}
    </ol>
  );
}
