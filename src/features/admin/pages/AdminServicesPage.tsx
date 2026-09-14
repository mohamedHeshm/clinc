import { useState } from "react";
import { Plus } from "lucide-react";
import {
  useAdminServices,
  useCreateService,
  useToggleServiceActive,
  useUpdateService,
} from "../hooks/useAdminData";
import { Input } from "@/components/ui/input";
import { Button } from "@/components/ui/button";
import { Label } from "@/components/ui/label";
import { Switch } from "@/components/ui/switch";
import {
  Select,
  SelectContent,
  SelectItem,
  SelectTrigger,
  SelectValue,
} from "@/components/ui/select";
import { Spinner } from "@/components/feedback/Loading";
import { EmptyState } from "@/components/feedback/EmptyState";

export function AdminServicesPage() {
  const { data: services, isLoading } = useAdminServices();
  const createService = useCreateService();
  const toggleActive = useToggleServiceActive();
  const updateService = useUpdateService();

  const [name, setName] = useState("");
  const [appliesTo, setAppliesTo] = useState<"doctor" | "nurse" | "both">("both");
  const [price, setPrice] = useState("");

  const handleAdd = () => {
    if (!name.trim()) return;
    createService.mutate(
      {
        name: name.trim(),
        applies_to: appliesTo === "both" ? ["doctor", "nurse"] : [appliesTo],
        default_price: price ? Number(price) : null,
      },
      {
        onSuccess: () => {
          setName("");
          setPrice("");
        },
      }
    );
  };

  return (
    <div className="max-w-2xl">
      <h1 className="text-2xl font-semibold text-foreground">إدارة الخدمات</h1>

      <div className="mt-6 flex flex-wrap items-end gap-3 rounded-lg border border-border p-4">
        <div className="flex-1 space-y-1.5">
          <Label className="text-xs">اسم الخدمة</Label>
          <Input value={name} onChange={(e) => setName(e.target.value)} placeholder="مثال: غيار جروح" />
        </div>
        <div className="space-y-1.5">
          <Label className="text-xs">تخص</Label>
          <Select value={appliesTo} onValueChange={(v) => setAppliesTo(v as typeof appliesTo)}>
            <SelectTrigger className="w-32">
              <SelectValue />
            </SelectTrigger>
            <SelectContent>
              <SelectItem value="both">الكل</SelectItem>
              <SelectItem value="doctor">الأطباء</SelectItem>
              <SelectItem value="nurse">التمريض</SelectItem>
            </SelectContent>
          </Select>
        </div>
        <div className="w-28 space-y-1.5">
          <Label className="text-xs">السعر الافتراضي</Label>
          <Input type="number" value={price} onChange={(e) => setPrice(e.target.value)} />
        </div>
        <Button onClick={handleAdd} disabled={createService.isPending}>
          <Plus className="h-4 w-4" />
          إضافة
        </Button>
      </div>

      <div className="mt-6 space-y-2">
        {isLoading ? (
          <div className="flex justify-center py-6">
            <Spinner />
          </div>
        ) : !services || services.length === 0 ? (
          <EmptyState title="لا توجد خدمات بعد" />
        ) : (
          services.map((service) => (
            <div
              key={service.id}
              className="flex flex-wrap items-center justify-between gap-3 rounded-lg border border-border px-4 py-3"
            >
              <div>
                <p className="text-sm font-medium text-foreground">{service.name}</p>
                <p className="text-xs text-muted-foreground">
                  {service.applies_to.includes("doctor") && service.applies_to.includes("nurse")
                    ? "الأطباء والتمريض"
                    : service.applies_to.includes("doctor")
                      ? "الأطباء"
                      : "التمريض"}
                </p>
              </div>
              <div className="flex items-center gap-3">
                <Input
                  type="number"
                  defaultValue={service.default_price ?? ""}
                  className="w-24"
                  onBlur={(e) => {
                    const value = e.target.value ? Number(e.target.value) : null;
                    if (value !== service.default_price) {
                      updateService.mutate({ id: service.id, updates: { default_price: value } });
                    }
                  }}
                />
                <Switch
                  checked={service.is_active}
                  onCheckedChange={(checked) => toggleActive.mutate({ id: service.id, isActive: checked })}
                />
              </div>
            </div>
          ))
        )}
      </div>
    </div>
  );
}
