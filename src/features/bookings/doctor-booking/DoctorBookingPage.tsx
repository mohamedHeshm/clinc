import { useMemo, useState } from "react";
import { useNavigate, useParams, Link } from "react-router-dom";
import { format } from "date-fns";
import { ar } from "date-fns/locale";
import { toast } from "sonner";
import { MapPin } from "lucide-react";
import { useDoctor, useDoctorServices } from "@/features/doctors/hooks/useDoctors";
import { useProviderAvailability } from "@/features/availability/hooks/useProviderAvailability";
import { useAvailableSlots } from "@/features/availability/hooks/useAvailableSlots";
import { TimeSlotGrid } from "@/components/shared/TimeSlotGrid";
import { createDoctorBooking } from "./doctor-booking.service";
import type { TimeSlot } from "@/features/availability/services/slots.service";
import { Calendar } from "@/components/ui/calendar";
import { Button } from "@/components/ui/button";
import { Avatar, AvatarFallback, AvatarImage } from "@/components/ui/avatar";
import { Spinner } from "@/components/feedback/Loading";
import { ErrorState } from "@/components/feedback/ErrorState";
import { ROUTES } from "@/constants/routes";
import { cn } from "@/lib/utils";

export function DoctorBookingPage() {
  const { doctorId } = useParams<{ doctorId: string }>();
  const navigate = useNavigate();

  const { data: doctor, isLoading, isError, refetch } = useDoctor(doctorId);
  const { data: services } = useDoctorServices(doctorId);
  const {
    data: availability,
    isLoading: availabilityLoading,
    isError: availabilityError,
    refetch: refetchAvailability,
  } = useProviderAvailability(doctorId, "doctor");

  const [selectedDate, setSelectedDate] = useState<Date | undefined>();
  const [selectedServiceId, setSelectedServiceId] = useState<string | null>(null);
  const [selectedSlot, setSelectedSlot] = useState<TimeSlot | null>(null);
  const [isSubmitting, setIsSubmitting] = useState(false);

  const dateKey = selectedDate ? format(selectedDate, "yyyy-MM-dd") : undefined;
  const {
    data: slots,
    isLoading: slotsLoading,
    isError: slotsError,
    refetch: refetchSlots,
  } = useAvailableSlots(
    doctorId,
    "doctor",
    dateKey
  );

  const availableDaysOfWeek = useMemo(
    () => new Set((availability ?? []).map((a) => a.day_of_week)),
    [availability]
  );

  const selectedServicePrice = useMemo(
    () => services?.find((service) => service.service_id === selectedServiceId)?.price ?? doctor?.consultation_price ?? 0,
    [doctor?.consultation_price, selectedServiceId, services]
  );

  const isDateDisabled = (date: Date) => {
    const startOfToday = new Date();
    startOfToday.setHours(0, 0, 0, 0);
    if (date < startOfToday) return true;
    return availabilityLoading || !availableDaysOfWeek.has(date.getDay());
  };

  const handleSelectDate = (date: Date) => {
    if (isDateDisabled(date)) return;
    setSelectedDate(date);
    setSelectedSlot(null);
  };

  const handleConfirm = async () => {
    if (!doctor || !dateKey || !selectedSlot) return;

    setIsSubmitting(true);
    try {
      const booking = await createDoctorBooking({
        doctorId: doctor.id,
        date: dateKey,
        startTime: selectedSlot.slot_start,
        endTime: selectedSlot.slot_end,
        serviceId: selectedServiceId,
        price: selectedServicePrice,
      });
      toast.success("تم إرسال طلب الحجز — بانتظار رد الطبيب");
      navigate(ROUTES.dashboardBookingDetails((booking as { id: string }).id));
    } catch (error) {
      const isConflict = (error as { isSlotConflict?: boolean }).isSlotConflict;
      toast.error(
        isConflict
          ? "عذرًا، هذا الموعد لم يعد متاحًا. برجاء اختيار موعد آخر."
          : "تعذّر إتمام الحجز. برجاء المحاولة مرة أخرى."
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

  if (isError || !doctor) {
    return <ErrorState onRetry={() => refetch()} title="تعذّر تحميل بيانات الطبيب" />;
  }

  return (
    <div className="container max-w-xl py-6 sm:py-10">
      <div className="rounded-lg border border-border bg-surface p-4 shadow-soft sm:p-5">
      <div className="flex items-center gap-3">
        <Avatar className="h-12 w-12">
          <AvatarImage src={doctor.avatar_url ?? undefined} alt={doctor.full_name} />
          <AvatarFallback>{doctor.full_name.charAt(0)}</AvatarFallback>
        </Avatar>
        <div>
          <p className="font-medium text-foreground">د. {doctor.full_name}</p>
          <p className="text-sm text-muted-foreground">{doctor.specialization}</p>
        </div>
      </div>

      {services && services.length > 0 && (
        <section className="mt-6">
          <h2 className="text-sm font-semibold text-foreground">نوع الكشف</h2>
          <div className="mt-3 grid gap-2 sm:grid-cols-2">
            <button
              type="button"
              onClick={() => setSelectedServiceId(null)}
              className={cn(
                "flex min-h-14 items-center justify-between rounded border border-border px-4 py-3 text-right text-sm transition-colors",
                selectedServiceId === null && "border-primary bg-primary-subtle"
              )}
            >
              <span>كشف عيادة</span>
              <span className="text-muted-foreground">{doctor.consultation_price} جنيه</span>
            </button>
            {services.map((service) => (
              <button
                key={service.service_id}
                type="button"
                onClick={() => setSelectedServiceId(service.service_id)}
                className={cn(
                  "flex min-h-14 items-center justify-between rounded border border-border px-4 py-3 text-right text-sm transition-colors hover:border-primary",
                  selectedServiceId === service.service_id && "border-primary bg-primary-subtle"
                )}
              >
                <span>{service.name}</span>
                <span className="text-muted-foreground">{service.price ?? doctor.consultation_price} جنيه</span>
              </button>
            ))}
          </div>
        </section>
      )}

      <section className="mt-6">
        <h2 className="text-sm font-semibold text-foreground">اختر التاريخ</h2>
        {availabilityLoading ? (
          <div className="flex justify-center py-8"><Spinner /></div>
        ) : availabilityError ? (
          <ErrorState className="py-8" title="تعذّر تحميل مواعيد العمل" onRetry={() => refetchAvailability()} />
        ) : availableDaysOfWeek.size === 0 ? (
          <p className="mt-3 rounded border border-border bg-surface-muted p-4 text-sm text-muted-foreground">لا توجد مواعيد عمل متاحة لهذا الطبيب حاليًا.</p>
        ) : (
          <Calendar
            className="mt-3"
            selected={selectedDate}
            onSelect={handleSelectDate}
            isDateDisabled={isDateDisabled}
          />
        )}
      </section>

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

      {selectedDate && selectedSlot && (
        <section className="mt-6 rounded-lg border border-border p-5">
          <h2 className="text-sm font-semibold text-foreground">مراجعة الحجز</h2>
          <div className="mt-3 space-y-2 text-sm">
            <div className="flex justify-between">
              <span className="text-muted-foreground">الطبيب</span>
              <span className="text-foreground">د. {doctor.full_name}</span>
            </div>
            <div className="flex justify-between">
              <span className="text-muted-foreground">التخصص</span>
              <span className="text-foreground">{doctor.specialization}</span>
            </div>
            <div className="flex justify-between">
              <span className="text-muted-foreground">التاريخ</span>
              <span className="text-foreground">
                {format(selectedDate, "EEEE d MMMM yyyy", { locale: ar })}
              </span>
            </div>
            <div className="flex justify-between">
              <span className="text-muted-foreground">الوقت</span>
              <span className="text-foreground">{selectedSlot.slot_start.slice(0, 5)}</span>
            </div>
            <div className="flex justify-between">
              <span className="text-muted-foreground">العنوان</span>
              <span className="flex items-center gap-1 text-foreground">
                <MapPin className="h-3.5 w-3.5" />
                {doctor.clinic_address}
              </span>
            </div>
            <div className="flex justify-between border-t border-border pt-2 font-medium">
              <span className="text-muted-foreground">السعر</span>
              <span className="text-foreground">{selectedServicePrice} جنيه</span>
            </div>
          </div>

          <Button className="mt-5 w-full" disabled={isSubmitting} onClick={handleConfirm}>
            {isSubmitting ? "جارٍ الإرسال..." : "تأكيد الحجز"}
          </Button>
          <p className="mt-2 text-center text-xs text-muted-foreground">
            سيصلك إشعار بمجرد رد الطبيب على طلبك
          </p>
        </section>
      )}

      <p className="mt-6 text-center text-xs text-muted-foreground">
        غيّرت رأيك؟{" "}
        <Link to={ROUTES.doctorProfile(doctor.id)} className="text-primary hover:underline">
          العودة لملف الطبيب
        </Link>
      </p>
      </div>
    </div>
  );
}
