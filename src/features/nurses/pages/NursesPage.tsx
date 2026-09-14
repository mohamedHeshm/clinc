import { useState } from "react";
import { useSearchParams, Link } from "react-router-dom";
import { HeartPulse, MapPin, Zap } from "lucide-react";
import { useNurses } from "../hooks/useNurses";
import { NurseFilters } from "../components/NurseFilters";
import { NurseCard } from "../components/NurseCard";
import type { NurseFilters as NurseFiltersType } from "../services/nurses.service";
import { useDebounce } from "@/hooks/useDebounce";
import { CardSkeleton } from "@/components/feedback/Loading";
import { EmptyState } from "@/components/feedback/EmptyState";
import { ErrorState } from "@/components/feedback/ErrorState";
import { Pagination } from "@/components/shared/Pagination";
import { Button } from "@/components/ui/button";
import { ROUTES } from "@/constants/routes";

export function NursesPage() {
  const [searchParams] = useSearchParams();
  const [filters, setFilters] = useState<NurseFiltersType>({
    page: 1,
    sortBy: "rating",
    search: searchParams.get("search") ?? undefined,
    region: searchParams.get("region") ?? undefined,
  });
  const debouncedSearch = useDebounce(filters.search, 350);

  const { data, isLoading, isError, refetch } = useNurses({
    ...filters,
    search: debouncedSearch,
  });

  return (
    <div className="container py-10">
      <div className="mb-8 flex flex-wrap items-start justify-between gap-4">
        <div>
          <h1 className="text-2xl font-semibold text-foreground">التمريض المنزلي</h1>
          <p className="mt-1 text-sm text-muted-foreground">
            اطلب ممرضًا أو ممرضة للزيارة المنزلية في المكان الذي تختاره
          </p>
        </div>
        <div className="flex gap-2">
          <Button variant="outline" size="sm" asChild>
            <Link to={ROUTES.nursesNearby}>
              <MapPin className="h-4 w-4" />
              الأقرب إليك
            </Link>
          </Button>
          <Button variant="outline" size="sm" asChild>
            <Link to={ROUTES.nursesUrgent}>
              <Zap className="h-4 w-4" />
              تمريض عاجل
            </Link>
          </Button>
        </div>
      </div>

      <div className="mb-8">
        <NurseFilters value={filters} onChange={setFilters} />
      </div>

      {isLoading ? (
        <div className="grid gap-4 sm:grid-cols-2">
          {Array.from({ length: 6 }).map((_, i) => (
            <CardSkeleton key={i} />
          ))}
        </div>
      ) : isError ? (
        <ErrorState onRetry={() => refetch()} />
      ) : data && data.items.length > 0 ? (
        <>
          <div className="grid gap-4 sm:grid-cols-2">
            {data.items.map((nurse) => (
              <NurseCard key={nurse.id} nurse={nurse} />
            ))}
          </div>
          <Pagination
            page={filters.page ?? 1}
            pageSize={12}
            total={data.total}
            onPageChange={(page) => setFilters((f) => ({ ...f, page }))}
          />
        </>
      ) : (
        <EmptyState
          icon={HeartPulse}
          title="لا يوجد ممرضون مطابقون لبحثك"
          description="جرّب تعديل الفلاتر أو البحث بكلمات مختلفة"
        />
      )}
    </div>
  );
}
