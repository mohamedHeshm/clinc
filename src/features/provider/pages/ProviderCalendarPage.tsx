import { useMemo, useState } from "react";
import { format, isSameDay } from "date-fns";
import { ar } from "date-fns/locale";
import { Calendar, type CalendarDayMeta } from "@/components/ui/calendar";
import { useProviderBookings } from "../hooks/useProviderBookings";
import { ProviderBookingCard } from "../components/ProviderBookingCard";
import { CardSkeleton } from "@/components/feedback/Loading";
import { EmptyState } from "@/components/feedback/EmptyState";
import { CalendarDays } from "lucide-react";

const DOT_BY_STATUS: Record<string, CalendarDayMeta["dotVariant"]> = {
  pending: "warning",
  accepted: "primary",
  confirmed: "primary",
  in_progress: "primary",
  completed: "success",
  cancelled: undefined,
  rejected: undefined,
};

export function ProviderCalendarPage() {
  const [selectedDate, setSelectedDate] = useState<Date>(new Date());
  const { data: bookings, isLoading } = useProviderBookings();

  const bookingsByDate = useMemo(() => {
    const map = new Map<string, typeof bookings>();

    for (const booking of bookings ?? []) {
      const key = booking.booking_date;
      const existing = map.get(key) ?? [];
      existing.push(booking);
      map.set(key, existing as NonNullable<typeof bookings>);
    }

    return map;
  }, [bookings]);

  const selectedDayBookings = (bookings ?? []).filter((b) =>
    isSameDay(new Date(b.booking_date), selectedDate)
  );

  const getDayMeta = (date: Date): CalendarDayMeta | undefined => {
    const key = format(date, "yyyy-MM-dd");
    const dayBookings = bookingsByDate.get(key);

    if (!dayBookings || dayBookings.length === 0) {
      return undefined;
    }

    const firstBooking = dayBookings[0];

    if (!firstBooking) {
      return undefined;
    }

    const priorityStatus = dayBookings.some((b) => b.status === "pending")
      ? "pending"
      : firstBooking.status;

    return {
      dotVariant: DOT_BY_STATUS[priorityStatus],
    };
  };

  return (
    <div className="max-w-2xl">
      <h1 className="text-2xl font-semibold text-foreground">التقويم</h1>

      <div className="mt-6">
        <Calendar
          selected={selectedDate}
          onSelect={setSelectedDate}
          getDayMeta={getDayMeta}
        />
      </div>

      <section className="mt-6">
        <h2 className="text-sm font-semibold text-foreground">
          حجوزات {format(selectedDate, "d MMMM yyyy", { locale: ar })}
        </h2>

        <div className="mt-3 space-y-4">
          {isLoading ? (
            <CardSkeleton />
          ) : selectedDayBookings.length > 0 ? (
            selectedDayBookings.map((booking) => (
              <ProviderBookingCard key={booking.id} booking={booking} />
            ))
          ) : (
            <EmptyState
              icon={CalendarDays}
              title="لا توجد حجوزات في هذا اليوم"
              className="py-8"
            />
          )}
        </div>
      </section>
    </div>
  );
}