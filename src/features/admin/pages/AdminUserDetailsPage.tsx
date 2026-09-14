import { useParams } from "react-router-dom";
import { useQuery } from "@tanstack/react-query";
import { useAdminUserDetails, useSetUserAccountStatus } from "../hooks/useAdminData";
import { fetchMyBookings } from "@/features/bookings/services/bookings.service";
import { Badge } from "@/components/ui/badge";
import { Button } from "@/components/ui/button";
import { Spinner } from "@/components/feedback/Loading";
import { EmptyState } from "@/components/feedback/EmptyState";
import { BOOKING_STATUS_LABELS, BOOKING_STATUS_VARIANT } from "@/constants/booking-status";
import { format } from "date-fns";
import { ar } from "date-fns/locale";

export function AdminUserDetailsPage() {
  const { id } = useParams<{ id: string }>();
  const { data: user, isLoading } = useAdminUserDetails(id);
  const setStatus = useSetUserAccountStatus();

  const { data: bookings } = useQuery({
    queryKey: ["admin-user-bookings", id],
    queryFn: () => fetchMyBookings(id as string),
    enabled: Boolean(id),
  });

  if (isLoading || !user) {
    return (
      <div className="flex min-h-[40vh] items-center justify-center">
        <Spinner />
      </div>
    );
  }

  return (
    <div className="max-w-xl">
      <div className="flex items-center justify-between">
        <h1 className="text-2xl font-semibold text-foreground">{user.full_name}</h1>
        <Badge variant={user.status === "active" ? "success" : "destructive"}>
          {user.status === "active" ? "نشط" : "موقوف"}
        </Badge>
      </div>

      <div className="mt-4 space-y-2 rounded-lg border border-border p-5 text-sm">
        <div className="flex justify-between">
          <span className="text-muted-foreground">الهاتف</span>
          <span className="text-foreground">{user.phone}</span>
        </div>
        {user.address && (
          <div className="flex justify-between">
            <span className="text-muted-foreground">العنوان</span>
            <span className="text-foreground">{user.address}</span>
          </div>
        )}
        <div className="flex justify-between">
          <span className="text-muted-foreground">تاريخ التسجيل</span>
          <span className="text-foreground">
            {format(new Date(user.created_at), "d MMMM yyyy", { locale: ar })}
          </span>
        </div>
      </div>

      <Button
        variant="outline"
        className="mt-4"
        disabled={setStatus.isPending}
        onClick={() =>
          setStatus.mutate({ profileId: user.id, status: user.status === "active" ? "suspended" : "active" })
        }
      >
        {user.status === "active" ? "إيقاف الحساب" : "تفعيل الحساب"}
      </Button>

      <section className="mt-8">
        <h2 className="text-sm font-semibold text-foreground">الحجوزات</h2>
        <div className="mt-3 space-y-2">
          {!bookings || bookings.length === 0 ? (
            <EmptyState title="لا توجد حجوزات لهذا المستخدم" className="py-8" />
          ) : (
            bookings.map((b) => (
              <div key={b.id} className="flex items-center justify-between rounded-lg border border-border px-4 py-3 text-sm">
                <div>
                  <p className="text-foreground">{b.provider_name}</p>
                  <p className="text-xs text-muted-foreground">
                    {format(new Date(b.booking_date), "d MMMM yyyy", { locale: ar })}
                  </p>
                </div>
                <Badge variant={BOOKING_STATUS_VARIANT[b.status]}>{BOOKING_STATUS_LABELS[b.status]}</Badge>
              </div>
            ))
          )}
        </div>
      </section>
    </div>
  );
}
