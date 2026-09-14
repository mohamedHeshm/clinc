import { useState } from "react";
import { Plus, Trash2, ClipboardList } from "lucide-react";
import {
  useCatalogServices,
  useMyProviderServices,
  useAddProviderService,
  useUpdateProviderServicePrice,
  useRemoveProviderService,
} from "../hooks/useProviderServices";
import { PageHeader } from "@/components/shared/PageHeader";
import { Input } from "@/components/ui/input";
import { Button } from "@/components/ui/button";
import { Spinner } from "@/components/feedback/Loading";
import { EmptyState } from "@/components/feedback/EmptyState";

export function ProviderServicesPage() {
  const { data: catalog, isLoading: catalogLoading } = useCatalogServices();
  const { data: myServices, isLoading: myServicesLoading } = useMyProviderServices();
  const addService = useAddProviderService();
  const updatePrice = useUpdateProviderServicePrice();
  const removeService = useRemoveProviderService();

  const [priceDrafts, setPriceDrafts] = useState<Record<string, string>>({});

  const myServiceIds = new Set((myServices ?? []).map((s) => s.service_id));
  const availableToAdd = (catalog ?? []).filter((s) => !myServiceIds.has(s.id));

  return (
    <div className="max-w-2xl">
      <PageHeader
        title="خدماتي وأسعاري"
        description="اختر الخدمات اللي تقدّمها وحدّد سعرك الخاص لكل خدمة — ده اللي هيظهر فعليًا للمريض"
      />

      <section>
        <h2 className="text-sm font-semibold text-foreground">الخدمات المضافة لملفك</h2>

        {myServicesLoading ? (
          <div className="mt-4 flex justify-center py-6">
            <Spinner />
          </div>
        ) : !myServices || myServices.length === 0 ? (
          <EmptyState
            icon={ClipboardList}
            title="لم تُضِف أي خدمة بعد"
            description="اختر خدمة من القائمة تحت لإضافتها"
            className="py-8"
          />
        ) : (
          <div className="mt-3 space-y-2">
            {myServices.map((service) => {
              const draft = priceDrafts[service.service_id];
              const currentValue =
                draft !== undefined ? draft : String(service.price ?? service.default_price ?? "");

              return (
                <div
                  key={service.service_id}
                  className="flex flex-wrap items-center justify-between gap-3 rounded-lg border border-border bg-surface px-4 py-3"
                >
                  <div className="min-w-0">
                    <p className="text-sm font-medium text-foreground">{service.name}</p>
                    {service.description && (
                      <p className="mt-0.5 truncate text-xs text-muted-foreground">{service.description}</p>
                    )}
                  </div>

                  <div className="flex items-center gap-2">
                    <div className="relative">
                      <Input
                        type="number"
                        min={0}
                        value={currentValue}
                        onChange={(e) =>
                          setPriceDrafts((prev) => ({ ...prev, [service.service_id]: e.target.value }))
                        }
                        onBlur={() => {
                          const numeric = currentValue ? Number(currentValue) : null;
                          if (numeric !== service.price) {
                            updatePrice.mutate({ serviceId: service.service_id, price: numeric });
                          }
                        }}
                        className="w-28 pl-12"
                      />
                      <span className="pointer-events-none absolute left-3 top-1/2 -translate-y-1/2 text-xs text-muted-foreground">
                        جنيه
                      </span>
                    </div>
                    <button
                      onClick={() => removeService.mutate(service.service_id)}
                      className="rounded p-2 text-muted-foreground hover:bg-surface-muted hover:text-destructive"
                      aria-label="إزالة الخدمة"
                    >
                      <Trash2 className="h-4 w-4" />
                    </button>
                  </div>
                </div>
              );
            })}
          </div>
        )}
      </section>

      <section className="mt-8">
        <h2 className="text-sm font-semibold text-foreground">إضافة خدمة من الكتالوج</h2>

        {catalogLoading ? (
          <div className="mt-4 flex justify-center py-6">
            <Spinner />
          </div>
        ) : availableToAdd.length === 0 ? (
          <p className="mt-3 text-sm text-muted-foreground">أضفت كل الخدمات المتاحة بالفعل.</p>
        ) : (
          <div className="mt-3 space-y-2">
            {availableToAdd.map((service) => (
              <div
                key={service.id}
                className="flex items-center justify-between rounded-lg border border-dashed border-border px-4 py-3"
              >
                <div>
                  <p className="text-sm font-medium text-foreground">{service.name}</p>
                  {service.default_price && (
                    <p className="text-xs text-muted-foreground">
                      السعر المقترح: {service.default_price} جنيه (يمكنك تغييره بعد الإضافة)
                    </p>
                  )}
                </div>
                <Button
                  size="sm"
                  variant="outline"
                  disabled={addService.isPending}
                  onClick={() =>
                    addService.mutate({ serviceId: service.id, price: service.default_price ?? null })
                  }
                >
                  <Plus className="h-4 w-4" />
                  إضافة
                </Button>
              </div>
            ))}
          </div>
        )}
      </section>
    </div>
  );
}
