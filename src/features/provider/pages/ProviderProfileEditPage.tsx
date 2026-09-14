import { useEffect, useState } from "react";
import { toast } from "sonner";
import { supabase } from "@/lib/supabase";
import { useMyProvider } from "../hooks/useMyProvider";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { Spinner } from "@/components/feedback/Loading";
import { useQueryClient } from "@tanstack/react-query";
import { LocationPicker, type PickedLocation } from "@/features/maps/components/LocationPicker";

export function ProviderProfileEditPage() {
  const { data: provider, isLoading } = useMyProvider();
  const queryClient = useQueryClient();
  const [isSubmitting, setIsSubmitting] = useState(false);

  const [bio, setBio] = useState("");
  const [clinicAddress, setClinicAddress] = useState("");
  const [serviceArea, setServiceArea] = useState("");
  const [location, setLocation] = useState<PickedLocation | null>(null);

  useEffect(() => {
    if (provider?.doctor) {
      setBio(provider.doctor.bio ?? "");
      setClinicAddress(provider.doctor.clinic_address);
      if (provider.doctor.clinic_latitude !== null && provider.doctor.clinic_longitude !== null) {
        setLocation({ latitude: provider.doctor.clinic_latitude, longitude: provider.doctor.clinic_longitude, address: provider.doctor.clinic_address });
      }
    } else if (provider?.nurse) {
      setBio(provider.nurse.bio ?? "");
      setServiceArea(provider.nurse.service_area.join("، "));
      if (provider.nurse.base_latitude !== null && provider.nurse.base_longitude !== null) {
        setLocation({ latitude: provider.nurse.base_latitude, longitude: provider.nurse.base_longitude, address: "" });
      }
    }
  }, [provider]);

  if (isLoading || !provider) {
    return (
      <div className="flex min-h-[40vh] items-center justify-center">
        <Spinner />
      </div>
    );
  }

  const handleSave = async () => {
    setIsSubmitting(true);
    try {
      if (provider.type === "doctor") {
        const { error } = await supabase
          .from("doctors")
          .update({ bio, clinic_address: clinicAddress, clinic_latitude: location?.latitude ?? null, clinic_longitude: location?.longitude ?? null })
          .eq("id", provider.id);
        if (error) throw error;
      } else {
        const areas = serviceArea
          .split(/[،,]/)
          .map((a) => a.trim())
          .filter(Boolean);
        const { error } = await supabase.from("nurses").update({ bio, service_area: areas, base_latitude: location?.latitude ?? null, base_longitude: location?.longitude ?? null }).eq("id", provider.id);
        if (error) throw error;
      }
      queryClient.invalidateQueries({ queryKey: ["my-provider"] });
      toast.success("تم حفظ التعديلات");
    } catch {
      toast.error("تعذّر حفظ التعديلات");
    } finally {
      setIsSubmitting(false);
    }
  };

  return (
    <div className="max-w-xl">
      <h1 className="text-2xl font-semibold text-foreground">تعديل الملف</h1>
      <p className="mt-1 text-sm text-muted-foreground">
        يمكنك تعديل النبذة و{provider.type === "doctor" ? "عنوان العيادة" : "مناطق الخدمة"} فقط —
        باقي البيانات (السعر، التخصص، الحالة) يديرها فريق المنصة.
      </p>

      <div className="mt-6 space-y-4">
        <div className="space-y-1.5">
          <Label htmlFor="bio">نبذة</Label>
          <textarea
            id="bio"
            rows={4}
            value={bio}
            onChange={(e) => setBio(e.target.value)}
            className="w-full resize-none rounded border border-border bg-surface px-3.5 py-2.5 text-sm focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-ring"
          />
        </div>

        {provider.type === "doctor" ? (
          <div className="space-y-1.5">
            <Label htmlFor="clinicAddress">عنوان العيادة</Label>
            <Input id="clinicAddress" value={clinicAddress} onChange={(e) => setClinicAddress(e.target.value)} />
          </div>
        ) : (
          <div className="space-y-1.5">
            <Label htmlFor="serviceArea">مناطق الخدمة (افصل بينها بفاصلة)</Label>
            <Input id="serviceArea" value={serviceArea} onChange={(e) => setServiceArea(e.target.value)} />
          </div>
        )}

        <div className="space-y-1.5">
          <Label>موقع {provider.type === "doctor" ? "العيادة" : "منطقة الانطلاق"}</Label>
          <LocationPicker
            value={location}
            onChange={(nextLocation) => {
              setLocation(nextLocation);
              if (provider.type === "doctor") setClinicAddress(nextLocation.address);
            }}
          />
        </div>

        <Button onClick={handleSave} disabled={isSubmitting}>
          {isSubmitting ? "جارٍ الحفظ..." : "حفظ التعديلات"}
        </Button>
      </div>
    </div>
  );
}
