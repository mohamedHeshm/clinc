import { useState } from "react";
import { useSearchParams } from "react-router-dom";
import { Stethoscope } from "lucide-react";
import { useDoctors } from "../hooks/useDoctors";
import { DoctorFilters } from "../components/DoctorFilters";
import { DoctorCard } from "../components/DoctorCard";
import type { DoctorFilters as DoctorFiltersType } from "../services/doctors.service";
import { useDebounce } from "@/hooks/useDebounce";
import { CardSkeleton } from "@/components/feedback/Loading";
import { EmptyState } from "@/components/feedback/EmptyState";
import { ErrorState } from "@/components/feedback/ErrorState";
import { Pagination } from "@/components/shared/Pagination";

export function DoctorsPage() {
  const [searchParams] = useSearchParams();
  const [filters, setFilters] = useState<DoctorFiltersType>({
    page: 1,
    sortBy: "rating",
    search: searchParams.get("search") ?? undefined,
    specialization: searchParams.get("specialization") ?? undefined,
  });
  const debouncedSearch = useDebounce(filters.search, 350);

  const { data, isLoading, isError, refetch } = useDoctors({
    ...filters,
    search: debouncedSearch,
  });

  return (
    <div className="container py-10">
      <div className="mb-8">
        <h1 className="text-2xl font-semibold text-foreground">الأطباء</h1>
        <p className="mt-1 text-sm text-muted-foreground">
          ابحث عن الطبيب المناسب واحجز موعدك في العيادة
        </p>
      </div>

      <div className="mb-8">
        <DoctorFilters value={filters} onChange={setFilters} />
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
            {data.items.map((doctor) => (
              <DoctorCard key={doctor.id} doctor={doctor} />
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
          icon={Stethoscope}
          title="لا يوجد أطباء مطابقون لبحثك"
          description="جرّب تعديل الفلاتر أو البحث بكلمات مختلفة"
        />
      )}
    </div>
  );
}
