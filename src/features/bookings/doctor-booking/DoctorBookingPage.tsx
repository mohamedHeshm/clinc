import { useMemo, useState } from "react";
import { useNavigate, useParams, Link } from "react-router-dom";
import { format } from "date-fns";
import { ar } from "date-fns/locale";
import { toast } from "sonner";
import { MapPin } from "lucide-react";
import { useDoctor } from "@/features/doctors/hooks/useDoctors";
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

export function DoctorBookingPage() {
  const { doctorId } = useParams<{ doctorId: string }>();
  const navigate = useNavigate();

  const { data: doctor, isLoading, isError, refetch } = useDoctor(doctorId);
  const { data: availability } = useProviderAvailability(doctorId, "doctor");

  const [selectedDate, setSelectedDate] = useState<Date | undefined>();
  const [selectedSlot, setSelectedSlot] = useState<TimeSlot | null>(null);
  const [isSubmitting, setIsSubmitting] = useState(false);

  const dateKey = selectedDate ? format(selectedDate, "yyyy-MM-dd") : undefined;
  const { data: slots, isLoading: slotsLoading, refetch: refetchSlots } = useAvailableSlots(
    doctorId,
    "doctor",
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
    if (availableDaysOfWeek.size === 0) return false; // لسه البيانات بتتحمّل
    return !availableDaysOfWeek.has(date.getDay());
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
        serviceId: null,
        date: dateKey,
        startTime: selectedSlot.slot_start,
        endTime: selectedSlot.slot_end,
        price: doctor.consultation_price,
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
    <div className="container max-w-lg py-10">
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

      <section className="mt-6">
        <h2 className="text-sm font-semibold text-foreground">اختر التاريخ</h2>
        <Calendar
          className="mt-3"
          selected={selectedDate}
          onSelect={handleSelectDate}
          isDateDisabled={isDateDisabled}
        />
      </section>

      {selectedDate && (
        <section className="mt-6">
          <h2 className="text-sm font-semibold text-foreground">اختر الوقت</h2>
          <div className="mt-3">
            {slotsLoading ? (
              <div className="flex justify-center py-4">
                <Spinner />
              </div>
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
              <span className="text-foreground">{doctor.consultation_price} جنيه</span>
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
  );
}
