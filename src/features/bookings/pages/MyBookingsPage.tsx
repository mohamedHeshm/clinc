import { CalendarX } from "lucide-react";
import { Tabs, TabsList, TabsTrigger, TabsContent } from "@/components/ui/tabs";
import { useMyBookings } from "../hooks/useMyBookings";
import { BookingCard } from "../components/BookingCard";
import { CardSkeleton } from "@/components/feedback/Loading";
import { EmptyState } from "@/components/feedback/EmptyState";
import { ErrorState } from "@/components/feedback/ErrorState";
import { Button } from "@/components/ui/button";
import { Link } from "react-router-dom";
import { ROUTES } from "@/constants/routes";

import type { BookingStatus } from "@/types/enums";

const UPCOMING_STATUSES: readonly BookingStatus[] = ["pending", "accepted", "confirmed", "in_progress"];
const PAST_STATUSES: readonly BookingStatus[] = ["completed", "cancelled", "rejected"];

function BookingsList({ statuses }: { statuses: readonly BookingStatus[] }) {
  const { data, isLoading, isError, refetch } = useMyBookings(statuses);

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
    return (
      <EmptyState
        icon={CalendarX}
        title="لا توجد حجوزات حتى الآن"
        description="ابحث عن طبيب أو ممرض وابدأ أول حجز لك"
        action={
          <Button asChild size="sm">
            <Link to={ROUTES.doctors}>تصفّح الأطباء</Link>
          </Button>
        }
      />
    );
  }

  return (
    <div className="space-y-4">
      {data.map((booking) => (
        <BookingCard key={booking.id} booking={booking} />
      ))}
    </div>
  );
}

export function MyBookingsPage() {
  return (
    <div className="max-w-3xl">
      <h1 className="text-2xl font-semibold text-foreground">حجوزاتي</h1>

      <Tabs defaultValue="upcoming" className="mt-6">
        <TabsList>
          <TabsTrigger value="upcoming">القادمة</TabsTrigger>
          <TabsTrigger value="past">السابقة</TabsTrigger>
        </TabsList>
        <TabsContent value="upcoming">
          <BookingsList statuses={UPCOMING_STATUSES} />
        </TabsContent>
        <TabsContent value="past">
          <BookingsList statuses={PAST_STATUSES} />
        </TabsContent>
      </Tabs>
    </div>
  );
}
