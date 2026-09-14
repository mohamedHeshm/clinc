import { useState } from "react";
import { ChevronRight, ChevronLeft } from "lucide-react";
import {
  addMonths,
  endOfMonth,
  endOfWeek,
  format,
  isSameDay,
  isSameMonth,
  isToday,
  startOfMonth,
  startOfWeek,
  subMonths,
} from "date-fns";
import { ar } from "date-fns/locale";
import { cn } from "@/lib/utils";

const WEEKDAY_LABELS = ["سبت", "أحد", "إثنين", "ثلاثاء", "أربعاء", "خميس", "جمعة"];

export interface CalendarDayMeta {
  /** نقطة ملوّنة صغيرة تحت اليوم — تستخدم لعرض حالة حجوزات هذا اليوم */
  dotVariant?: "primary" | "success" | "warning" | "destructive";
}

interface CalendarProps {
  selected?: Date;
  onSelect?: (date: Date) => void;
  /** أيام لا يمكن اختيارها (مثال: أيام الماضي أو الأيام بلا Availability) */
  isDateDisabled?: (date: Date) => boolean;
  /** بيانات إضافية لكل يوم (نقطة حالة) */
  getDayMeta?: (date: Date) => CalendarDayMeta | undefined;
  className?: string;
}

const DOT_COLOR: Record<NonNullable<CalendarDayMeta["dotVariant"]>, string> = {
  primary: "bg-primary",
  success: "bg-accent",
  warning: "bg-warning",
  destructive: "bg-destructive",
};

export function Calendar({ selected, onSelect, isDateDisabled, getDayMeta, className }: CalendarProps) {
  const [visibleMonth, setVisibleMonth] = useState(selected ?? new Date());

  const monthStart = startOfMonth(visibleMonth);
  const monthEnd = endOfMonth(visibleMonth);
  const gridStart = startOfWeek(monthStart, { weekStartsOn: 6 }); // السبت
  const gridEnd = endOfWeek(monthEnd, { weekStartsOn: 6 });

  const days: Date[] = [];
  for (let d = new Date(gridStart); d <= gridEnd; d.setDate(d.getDate() + 1)) {
    days.push(new Date(d));
  }

  return (
    <div className={cn("rounded-lg border border-border bg-surface p-4", className)}>
      <div className="flex items-center justify-between">
        <button
          type="button"
          aria-label="الشهر السابق"
          onClick={() => setVisibleMonth((m) => subMonths(m, 1))}
          className="rounded p-1.5 hover:bg-surface-muted focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-ring"
        >
          <ChevronRight className="h-4 w-4" />
        </button>
        <p className="text-sm font-medium text-foreground">
          {format(visibleMonth, "MMMM yyyy", { locale: ar })}
        </p>
        <button
          type="button"
          aria-label="الشهر التالي"
          onClick={() => setVisibleMonth((m) => addMonths(m, 1))}
          className="rounded p-1.5 hover:bg-surface-muted focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-ring"
        >
          <ChevronLeft className="h-4 w-4" />
        </button>
      </div>

      <div className="mt-4 grid grid-cols-7 gap-1 text-center text-xs text-muted-foreground">
        {WEEKDAY_LABELS.map((label) => (
          <div key={label} className="py-1">
            {label}
          </div>
        ))}
      </div>

      <div className="grid grid-cols-7 gap-1">
        {days.map((day) => {
          const disabled = isDateDisabled?.(day) ?? false;
          const inMonth = isSameMonth(day, visibleMonth);
          const isSelected = selected && isSameDay(day, selected);
          const meta = getDayMeta?.(day);

          return (
            <button
              key={day.toISOString()}
              type="button"
              disabled={disabled}
              onClick={() => onSelect?.(day)}
              className={cn(
                "relative flex h-10 flex-col items-center justify-center rounded text-sm transition-colors",
                "focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-ring",
                !inMonth && "text-muted-foreground/40",
                inMonth && !isSelected && "text-foreground hover:bg-surface-muted",
                isSelected && "bg-primary text-primary-foreground",
                isToday(day) && !isSelected && "font-semibold text-primary",
                disabled && "cursor-not-allowed opacity-40 hover:bg-transparent"
              )}
            >
              {day.getDate()}
              {meta?.dotVariant && (
                <span className={cn("absolute bottom-1 h-1 w-1 rounded-full", DOT_COLOR[meta.dotVariant])} />
              )}
            </button>
          );
        })}
      </div>
    </div>
  );
}
