import { useMemo } from "react";
import { Link } from "react-router-dom";
import { LocateFixed, MapPin } from "lucide-react";
import { useNursesWithLocation } from "@/features/nurses/hooks/useNurses";
import { useGeolocation } from "@/hooks/useGeolocation";
import { distanceInKm, formatDistance } from "@/utils/distance";
import { Avatar, AvatarFallback, AvatarImage } from "@/components/ui/avatar";
import { Badge } from "@/components/ui/badge";
import { Button } from "@/components/ui/button";
import { RatingStars } from "@/components/shared/RatingStars";
import { Spinner } from "@/components/feedback/Loading";
import { EmptyState } from "@/components/feedback/EmptyState";
import { ROUTES } from "@/constants/routes";

export function NursesNearbyPage() {
  const { latitude, longitude, status, errorMessage, requestLocation } = useGeolocation();
  const { data: nurses, isLoading } = useNursesWithLocation();

  const sorted = useMemo(() => {
    if (!nurses || latitude === null || longitude === null) return [];

    return nurses
      .map((nurse) => ({
        ...nurse,
        distanceKm: distanceInKm(
          { latitude, longitude },
          { latitude: nurse.base_latitude!, longitude: nurse.base_longitude! }
        ),
      }))
      .sort((a, b) => {
        // الترتيب المطلوب بالضبط: المسافة ← التقييم ← السعر ← التوفر
        if (a.distanceKm !== b.distanceKm) return a.distanceKm - b.distanceKm;
        if (b.rating_avg !== a.rating_avg) return b.rating_avg - a.rating_avg;
        if (a.visit_price !== b.visit_price) return a.visit_price - b.visit_price;
        return Number(b.available_today) - Number(a.available_today);
      });
  }, [nurses, latitude, longitude]);

  return (
    <div className="container max-w-2xl py-10">
      <h1 className="text-2xl font-semibold text-foreground">ممرضون قريبون منك</h1>
      <p className="mt-1 text-sm text-muted-foreground">
        نرتّب النتائج حسب المسافة، ثم التقييم، ثم السعر، ثم التوفر
      </p>

      {status !== "success" && (
        <div className="mt-6 rounded-lg border border-border p-6 text-center">
          <Button onClick={requestLocation} disabled={status === "loading"}>
            <LocateFixed className="h-4 w-4" />
            {status === "loading" ? "جارٍ تحديد موقعك..." : "استخدام موقعي الحالي"}
          </Button>
          {status === "error" && <p className="mt-3 text-sm text-destructive">{errorMessage}</p>}
        </div>
      )}

      {status === "success" && (
        <div className="mt-6">
          {isLoading ? (
            <div className="flex justify-center py-10">
              <Spinner />
            </div>
          ) : sorted.length === 0 ? (
            <EmptyState
              icon={MapPin}
              title="لا يوجد ممرضون بموقع مسجَّل قريب منك حاليًا"
              description="جرّب تصفّح كل الممرضين المتاحين بدلًا من ذلك"
              action={
                <Button asChild size="sm" variant="outline">
                  <Link to={ROUTES.nurses}>تصفّح كل الممرضين</Link>
                </Button>
              }
            />
          ) : (
            <div className="space-y-4">
              {sorted.map((nurse) => (
                <div
                  key={nurse.id}
                  className="flex flex-col gap-4 rounded-lg border border-border bg-surface p-5 sm:flex-row sm:items-center"
                >
                  <Avatar className="h-14 w-14">
                    <AvatarImage src={nurse.avatar_url ?? undefined} alt={nurse.full_name} />
                    <AvatarFallback>{nurse.full_name.charAt(0)}</AvatarFallback>
                  </Avatar>

                  <div className="flex-1">
                    <p className="font-medium text-foreground">{nurse.full_name}</p>
                    <div className="mt-1 flex flex-wrap items-center gap-x-4 gap-y-1">
                      <RatingStars rating={nurse.rating_avg} reviewCount={nurse.rating_count} />
                      <span className="flex items-center gap-1 text-xs text-muted-foreground">
                        <MapPin className="h-3.5 w-3.5" />
                        على بعد {formatDistance(nurse.distanceKm)}
                      </span>
                    </div>
                  </div>

                  <div className="flex flex-row items-center justify-between gap-3 sm:flex-col sm:items-end">
                    <div className="text-left sm:text-right">
                      <p className="font-semibold text-foreground">{nurse.visit_price} جنيه</p>
                      {nurse.available_today && (
                        <Badge variant="success" className="mt-1">
                          متاحة اليوم
                        </Badge>
                      )}
                    </div>
                    <Button asChild size="sm">
                      <Link to={ROUTES.bookNurse(nurse.id)}>طلب زيارة</Link>
                    </Button>
                  </div>
                </div>
              ))}
            </div>
          )}
        </div>
      )}
    </div>
  );
}
