import { Inbox } from "lucide-react";
import { useProviderBookings } from "../hooks/useProviderBookings";
import { ProviderBookingCard } from "../components/ProviderBookingCard";
import { CardSkeleton } from "@/components/feedback/Loading";
import { EmptyState } from "@/components/feedback/EmptyState";
import { ErrorState } from "@/components/feedback/ErrorState";

export function ProviderRequestsPage() {
  const { data, isLoading, isError, refetch } = useProviderBookings(["pending"]);

  return (
    <div className="max-w-2xl">
      <h1 className="text-2xl font-semibold text-foreground">الطلبات الجديدة</h1>

      <div className="mt-6">
        {isLoading ? (
          <div className="space-y-4">
            {Array.from({ length: 3 }).map((_, i) => (
              <CardSkeleton key={i} />
            ))}
          </div>
        ) : isError ? (
          <ErrorState onRetry={() => refetch()} />
        ) : data && data.length > 0 ? (
          <div className="space-y-4">
            {data.map((booking) => (
              <ProviderBookingCard key={booking.id} booking={booking} />
            ))}
          </div>
        ) : (
          <EmptyState icon={Inbox} title="لا توجد طلبات جديدة حاليًا" />
        )}
      </div>
    </div>
  );
}
