import type { LucideIcon } from "lucide-react";
import { cn } from "@/lib/utils";

interface StatCardProps {
  icon: LucideIcon;
  label: string;
  value: string | number;
  tone?: "primary" | "accent" | "warning" | "destructive" | "neutral";
  className?: string;
}

const TONE_STYLES: Record<NonNullable<StatCardProps["tone"]>, string> = {
  primary: "bg-primary-subtle text-primary",
  accent: "bg-accent-subtle text-accent",
  warning: "bg-warning/15 text-warning",
  destructive: "bg-destructive/10 text-destructive",
  neutral: "bg-surface-muted text-muted-foreground",
};

export function StatCard({ icon: Icon, label, value, tone = "neutral", className }: StatCardProps) {
  return (
    <div
      className={cn(
        "rounded-lg border border-border bg-surface p-4 transition-shadow hover:shadow-soft",
        className
      )}
    >
      <div className={cn("flex h-9 w-9 items-center justify-center rounded-full", TONE_STYLES[tone])}>
        <Icon className="h-4.5 w-4.5" />
      </div>
      <p className="mt-3 text-2xl font-semibold tracking-tight text-foreground">{value}</p>
      <p className="mt-0.5 text-sm text-muted-foreground">{label}</p>
    </div>
  );
}
