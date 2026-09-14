import { ListChecks } from "lucide-react";
import { Tabs, TabsList, TabsTrigger, TabsContent } from "@/components/ui/tabs";
import { useProviderBookings } from "../hooks/useProviderBookings";
import { ProviderBookingCard } from "../components/ProviderBookingCard";
import { CardSkeleton } from "@/components/feedback/Loading";
import { EmptyState } from "@/components/feedback/EmptyState";
import { ErrorState } from "@/components/feedback/ErrorState";
import type { BookingStatus } from "@/types/enums";

const UPCOMING: readonly BookingStatus[] = ["accepted", "confirmed", "in_progress"];
const PAST: readonly BookingStatus[] = ["completed", "cancelled", "rejected"];

function List({ statuses }: { statuses: readonly BookingStatus[] }) {
  const { data, isLoading, isError, refetch } = useProviderBookings(statuses);

  if (isLoading) {
    return (
      <div className="space-y-4">
        {Array.from({ length: 3 }).map((_, i) => (
          <CardSkeleton key={i} />
        ))}
      </div>
    );
  }
  if (isError) return <ErrorState onRetry={() => refetch()} />;
  if (!data || data.length === 0) {
    return <EmptyState icon={ListChecks} title="لا توجد حجوزات هنا حتى الآن" />;
  }

  return (
    <div className="space-y-4">
      {data.map((booking) => (
        <ProviderBookingCard key={booking.id} booking={booking} />
      ))}
    </div>
  );
}

export function ProviderBookingsPage() {
  return (
    <div className="max-w-2xl">
      <h1 className="text-2xl font-semibold text-foreground">الحجوزات</h1>

      <Tabs defaultValue="upcoming" className="mt-6">
        <TabsList>
          <TabsTrigger value="upcoming">القادمة</TabsTrigger>
          <TabsTrigger value="past">السابقة</TabsTrigger>
        </TabsList>
        <TabsContent value="upcoming">
          <List statuses={UPCOMING} />
        </TabsContent>
        <TabsContent value="past">
          <List statuses={PAST} />
        </TabsContent>
      </Tabs>
    </div>
  );
}
