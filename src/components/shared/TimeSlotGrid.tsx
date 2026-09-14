import { cn } from "@/lib/utils";
import type { TimeSlot } from "@/features/availability/services/slots.service";

interface Props {
  slots: TimeSlot[];
  selected: TimeSlot | null;
  onSelect: (slot: TimeSlot) => void;
}

export function TimeSlotGrid({ slots, selected, onSelect }: Props) {
  if (slots.length === 0) {
    return <p className="text-sm text-muted-foreground">لا توجد أوقات عمل متاحة في هذا اليوم.</p>;
  }

  return (
    <div className="grid grid-cols-3 gap-2 sm:grid-cols-4">
      {slots.map((slot) => {
        const isSelected = selected?.slot_start === slot.slot_start;
        return (
          <button
            key={slot.slot_start}
            type="button"
            disabled={!slot.is_available}
            onClick={() => onSelect(slot)}
            className={cn(
              "rounded border px-3 py-2.5 text-sm font-medium transition-colors",
              "focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-ring",
              !slot.is_available && "cursor-not-allowed border-border bg-surface-muted text-muted-foreground/60 line-through",
              slot.is_available && !isSelected && "border-border bg-surface text-foreground hover:border-primary",
              isSelected && "border-primary bg-primary text-primary-foreground"
            )}
          >
            {slot.slot_start.slice(0, 5)}
          </button>
        );
      })}
    </div>
  );
}
