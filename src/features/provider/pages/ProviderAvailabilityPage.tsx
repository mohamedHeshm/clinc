import { useState } from "react";
import { Trash2, Clock } from "lucide-react";
import {
  useMyAvailability,
  useAddAvailabilitySlot,
  useToggleAvailabilitySlot,
  useDeleteAvailabilitySlot,
} from "@/features/availability/hooks/useMyAvailability";
import { dayOfWeekLabel } from "@/features/availability/services/availability.service";
import { useMyProvider } from "../hooks/useMyProvider";
import { Button } from "@/components/ui/button";
import { Switch } from "@/components/ui/switch";
import {
  Select,
  SelectContent,
  SelectItem,
  SelectTrigger,
  SelectValue,
} from "@/components/ui/select";
import { Spinner } from "@/components/feedback/Loading";
import { EmptyState } from "@/components/feedback/EmptyState";

const DAYS = [0, 1, 2, 3, 4, 5, 6];
const HOURS = Array.from({ length: 24 }, (_, h) => `${String(h).padStart(2, "0")}:00`);

export function ProviderAvailabilityPage() {
  const { data: provider } = useMyProvider();
  const { data: availability, isLoading } = useMyAvailability();
  const addSlot = useAddAvailabilitySlot();
  const toggleSlot = useToggleAvailabilitySlot();
  const deleteSlot = useDeleteAvailabilitySlot();

  const [day, setDay] = useState("6");
  const [startTime, setStartTime] = useState("10:00");
  const [endTime, setEndTime] = useState("18:00");

  const handleAdd = () => {
    if (!provider) return;
    if (startTime >= endTime) return;
    addSlot.mutate({
      provider_id: provider.id,
      provider_type: provider.type,
      day_of_week: Number(day),
      start_time: `${startTime}:00`,
      end_time: `${endTime}:00`,
      is_available: true,
    });
  };

  return (
    <div className="max-w-xl">
      <h1 className="text-2xl font-semibold text-foreground">أوقات التوفر</h1>
      <p className="mt-1 text-sm text-muted-foreground">
        حدّد أيام وأوقات عملك — تُستخدم هذه الأوقات لعرض المواعيد المتاحة للمرضى
      </p>

      <div className="mt-6 flex flex-wrap items-end gap-3 rounded-lg border border-border p-4">
        <div className="space-y-1.5">
          <label className="text-xs font-medium text-muted-foreground">اليوم</label>
          <Select value={day} onValueChange={setDay}>
            <SelectTrigger className="w-32">
              <SelectValue />
            </SelectTrigger>
            <SelectContent>
              {DAYS.map((d) => (
                <SelectItem key={d} value={String(d)}>
                  {dayOfWeekLabel(d)}
                </SelectItem>
              ))}
            </SelectContent>
          </Select>
        </div>

        <div className="space-y-1.5">
          <label className="text-xs font-medium text-muted-foreground">من</label>
          <Select value={startTime} onValueChange={setStartTime}>
            <SelectTrigger className="w-24">
              <SelectValue />
            </SelectTrigger>
            <SelectContent>
              {HOURS.map((h) => (
                <SelectItem key={h} value={h}>
                  {h}
                </SelectItem>
              ))}
            </SelectContent>
          </Select>
        </div>

        <div className="space-y-1.5">
          <label className="text-xs font-medium text-muted-foreground">إلى</label>
          <Select value={endTime} onValueChange={setEndTime}>
            <SelectTrigger className="w-24">
              <SelectValue />
            </SelectTrigger>
            <SelectContent>
              {HOURS.map((h) => (
                <SelectItem key={h} value={h}>
                  {h}
                </SelectItem>
              ))}
            </SelectContent>
          </Select>
        </div>

        <Button onClick={handleAdd} disabled={addSlot.isPending}>
          إضافة
        </Button>
      </div>

      <div className="mt-6 space-y-2">
        {isLoading ? (
          <div className="flex justify-center py-6">
            <Spinner />
          </div>
        ) : !availability || availability.length === 0 ? (
          <EmptyState icon={Clock} title="لم تُضِف أي أوقات عمل بعد" />
        ) : (
          availability.map((slot) => (
            <div
              key={slot.id}
              className="flex items-center justify-between rounded-lg border border-border px-4 py-3"
            >
              <div>
                <p className="text-sm font-medium text-foreground">{dayOfWeekLabel(slot.day_of_week)}</p>
                <p className="text-xs text-muted-foreground">
                  {slot.start_time.slice(0, 5)} — {slot.end_time.slice(0, 5)}
                </p>
              </div>
              <div className="flex items-center gap-3">
                <Switch
                  checked={slot.is_available}
                  onCheckedChange={(checked) => toggleSlot.mutate({ id: slot.id, isAvailable: checked })}
                />
                <button
                  onClick={() => deleteSlot.mutate(slot.id)}
                  className="rounded p-1.5 text-muted-foreground hover:bg-surface-muted hover:text-destructive"
                  aria-label="حذف"
                >
                  <Trash2 className="h-4 w-4" />
                </button>
              </div>
            </div>
          ))
        )}
      </div>
    </div>
  );
}
