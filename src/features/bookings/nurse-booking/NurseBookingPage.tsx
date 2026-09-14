import { useMemo, useState } from "react";
import { useNavigate, useParams, Link } from "react-router-dom";
import { format } from "date-fns";
import { ar } from "date-fns/locale";
import { toast } from "sonner";
import { AlertTriangle } from "lucide-react";
import { useNurse, useNurseServices } from "@/features/nurses/hooks/useNurses";
import { useProviderAvailability } from "@/features/availability/hooks/useProviderAvailability";
import { useAvailableSlots } from "@/features/availability/hooks/useAvailableSlots";
import type { TimeSlot } from "@/features/availability/services/slots.service";
import { TimeSlotGrid } from "@/components/shared/TimeSlotGrid";
import { LocationPicker, type PickedLocation } from "@/features/maps/components/LocationPicker";
import { createNurseBooking } from "./nurse-booking.service";
import { Calendar } from "@/components/ui/calendar";
import { Button } from "@/components/ui/button";
import { Avatar, AvatarFallback, AvatarImage } from "@/components/ui/avatar";
import { Spinner } from "@/components/feedback/Loading";
import { ErrorState } from "@/components/feedback/ErrorState";
import { cn } from "@/lib/utils";
import { ROUTES } from "@/constants/routes";

export function NurseBookingPage() {
  const { nurseId } = useParams<{ nurseId: string }>();
  const navigate = useNavigate();

  const { data: nurse, isLoading, isError, refetch } = useNurse(nurseId);
  const { data: services } = useNurseServices(nurseId);
  const {
    data: availability,
    isLoading: availabilityLoading,
    isError: availabilityError,
    refetch: refetchAvailability,
  } = useProviderAvailability(nurseId, "nurse");

  const [selectedServiceId, setSelectedServiceId] = useState<string | null | "default">(null);
  const [selectedDate, setSelectedDate] = useState<Date | undefined>();
  const [selectedSlot, setSelectedSlot] = useState<TimeSlot | null>(null);
  const [location, setLocation] = useState<PickedLocation | null>(null);
  const [notes, setNotes] = useState("");
  const [isSubmitting, setIsSubmitting] = useState(false);

  const dateKey = selectedDate ? format(selectedDate, "yyyy-MM-dd") : undefined;
  const {
    data: slots,
    isLoading: slotsLoading,
    isError: slotsError,
    refetch: refetchSlots,
  } = useAvailableSlots(
    nurseId,
    "nurse",
    dateKey
  );

  const availableDaysOfWeek = useMemo(
    () => new Set((availability ?? []).map((a) => a.day_of_week)),
    [availability]
  );

  const isDateDisabled = (date: Date) => {
    const startOfToday = new Date();
    startOfToday.setHours(0, 0, 0, 0);
    if (date < startOfToday) return true;
    return availabilityLoading || !availableDaysOfWeek.has(date.getDay());
  };

  const selectedServicePrice = useMemo(() => {
    if (!nurse) return 0;
    if (selectedServiceId && selectedServiceId !== "default") {
      return services?.find((s) => s.service_id === selectedServiceId)?.price ?? nurse.visit_price;
    }
    return nurse.visit_price;
  }, [selectedServiceId, services, nurse]);

  const handleConfirm = async () => {
    if (!nurse || !dateKey || !selectedSlot || !location) return;

    setIsSubmitting(true);
    try {
      const booking = await createNurseBooking({
        nurseId: nurse.id,
        serviceId: selectedServiceId && selectedServiceId !== "default" ? selectedServiceId : null,
        date: dateKey,
        startTime: selectedSlot.slot_start,
        endTime: selectedSlot.slot_end,
        price: selectedServicePrice,
        location,
        notes: notes.trim() || undefined,
      });
      toast.success("تم إرسال طلب الزيارة — بانتظار رد الممرض/ة");
      navigate(ROUTES.dashboardBookingDetails((booking as { id: string }).id));
    } catch (error) {
      const isConflict = (error as { isSlotConflict?: boolean }).isSlotConflict;
      toast.error(
        isConflict
          ? "عذرًا، هذا الموعد لم يعد متاحًا. برجاء اختيار موعد آخر."
          : error instanceof Error
            ? error.message
            : "تعذّر إرسال الطلب. برجاء المحاولة مرة أخرى."
      );
      if (isConflict) {
        setSelectedSlot(null);
        refetchSlots();
      }
    } finally {
      setIsSubmitting(false);
    }
  };

  if (isLoading) {
    return (
      <div className="flex min-h-[50vh] items-center justify-center">
        <Spinner />
      </div>
    );
  }

  if (isError || !nurse) {
    return <ErrorState onRetry={() => refetch()} title="تعذّر تحميل بيانات الممرض" />;
  }

  return (
    <div className="container max-w-lg py-10">
      <div className="flex items-center gap-3">
        <Avatar className="h-12 w-12">
          <AvatarImage src={nurse.avatar_url ?? undefined} alt={nurse.full_name} />
          <AvatarFallback>{nurse.full_name.charAt(0)}</AvatarFallback>
        </Avatar>
        <div>
          <p className="font-medium text-foreground">{nurse.full_name}</p>
          <p className="text-sm text-muted-foreground">زيارة منزلية</p>
        </div>
      </div>

      <div className="mt-5 flex items-start gap-2 rounded-lg border border-warning/30 bg-warning/10 p-3 text-xs text-foreground">
        <AlertTriangle className="mt-0.5 h-4 w-4 shrink-0 text-warning" />
        <p>
          هذه الخدمة ليست بديلًا عن الإسعاف أو الطوارئ الطبية. في الحالات الطارئة اتصل بخدمات
          الطوارئ المحلية.
        </p>
      </div>

      <section className="mt-6">
        <h2 className="text-sm font-semibold text-foreground">نوع الخدمة</h2>
        <div className="mt-3 space-y-2">
          <button
            type="button"
            onClick={() => setSelectedServiceId("default")}
            className={cn(
              "flex w-full items-center justify-between rounded border border-border px-4 py-3 text-sm",
              selectedServiceId === "default" && "border-primary bg-primary-subtle"
            )}
          >
            <span>رعاية منزلية عامة</span>
            <span className="text-muted-foreground">{nurse.visit_price} جنيه</span>
          </button>
          {services?.map((s) => (
            <button
              key={s.service_id}
              type="button"
              onClick={() => setSelectedServiceId(s.service_id)}
              className={cn(
                "flex w-full items-center justify-between rounded border border-border px-4 py-3 text-sm",
                selectedServiceId === s.service_id && "border-primary bg-primary-subtle"
              )}
            >
              <span>{s.name}</span>
              <span className="text-muted-foreground">{s.price ?? nurse.visit_price} جنيه</span>
            </button>
          ))}
        </div>
      </section>

      {selectedServiceId && (
        <section className="mt-6">
          <h2 className="text-sm font-semibold text-foreground">اختر التاريخ</h2>
          {availabilityLoading ? (
            <div className="flex justify-center py-8"><Spinner /></div>
          ) : availabilityError ? (
            <ErrorState className="py-8" title="تعذّر تحميل مواعيد العمل" onRetry={() => refetchAvailability()} />
          ) : availableDaysOfWeek.size === 0 ? (
            <p className="mt-3 rounded border border-border bg-surface-muted p-4 text-sm text-muted-foreground">لا توجد مواعيد عمل متاحة للممرض/ة حاليًا.</p>
          ) : (
            <Calendar
              className="mt-3"
              selected={selectedDate}
              onSelect={(date) => {
                if (isDateDisabled(date)) return;
                setSelectedDate(date);
                setSelectedSlot(null);
              }}
              isDateDisabled={isDateDisabled}
            />
          )}
        </section>
      )}

      {selectedDate && (
        <section className="mt-6">
          <h2 className="text-sm font-semibold text-foreground">اختر الوقت</h2>
          <div className="mt-3">
            {slotsLoading ? (
              <div className="flex justify-center py-4">
                <Spinner />
              </div>
            ) : slotsError ? (
              <ErrorState className="py-8" title="تعذّر تحميل الأوقات المتاحة" onRetry={() => refetchSlots()} />
            ) : (
              <TimeSlotGrid slots={slots ?? []} selected={selectedSlot} onSelect={setSelectedSlot} />
            )}
          </div>
        </section>
      )}

      {selectedSlot && (
        <section className="mt-6">
          <h2 className="text-sm font-semibold text-foreground">موقع الزيارة</h2>
          <div className="mt-3">
            <LocationPicker value={location} onChange={setLocation} />
          </div>

          <div className="mt-3 space-y-1.5">
            <label htmlFor="notes" className="text-sm font-medium text-foreground">
              ملاحظات (اختياري)
            </label>
            <textarea
              id="notes"
              rows={3}
              value={notes}
              onChange={(e) => setNotes(e.target.value)}
              placeholder="مثال: الدور الثالث، اتصل عند الوصول..."
              className="w-full resize-none rounded border border-border bg-surface px-3.5 py-2.5 text-sm focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-ring"
            />
          </div>
        </section>
      )}

      {selectedSlot && location && (
        <section className="mt-6 rounded-lg border border-border p-5">
          <h2 className="text-sm font-semibold text-foreground">مراجعة الطلب</h2>
          <div className="mt-3 space-y-2 text-sm">
            <div className="flex justify-between">
              <span className="text-muted-foreground">الممرض/ة</span>
              <span className="text-foreground">{nurse.full_name}</span>
            </div>
            <div className="flex justify-between">
              <span className="text-muted-foreground">التاريخ</span>
              <span className="text-foreground">
                {selectedDate && format(selectedDate, "EEEE d MMMM yyyy", { locale: ar })}
              </span>
            </div>
            <div className="flex justify-between">
              <span className="text-muted-foreground">الوقت</span>
              <span className="text-foreground">{selectedSlot.slot_start.slice(0, 5)}</span>
            </div>
            <div className="flex justify-between">
              <span className="text-muted-foreground">العنوان</span>
              <span className="max-w-[60%] text-left text-foreground">{location.address}</span>
            </div>
            <div className="flex justify-between border-t border-border pt-2 font-medium">
              <span className="text-muted-foreground">السعر</span>
              <span className="text-foreground">{selectedServicePrice} جنيه</span>
            </div>
          </div>

          <Button className="mt-5 w-full" disabled={isSubmitting} onClick={handleConfirm}>
            {isSubmitting ? "جارٍ الإرسال..." : "إرسال طلب الزيارة"}
          </Button>
        </section>
      )}

      <p className="mt-6 text-center text-xs text-muted-foreground">
        غيّرت رأيك؟{" "}
        <Link to={ROUTES.nurseProfile(nurse.id)} className="text-primary hover:underline">
          العودة لملف الممرض
        </Link>
      </p>
    </div>
  );
}
