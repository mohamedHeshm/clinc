import { useEffect, useState } from "react";
import { useNavigate, useParams } from "react-router-dom";
import { toast } from "sonner";
import {
  useAdminNurseDetails,
  useCreateNurseAccount,
  useUpdateNurse,
} from "../hooks/useAdminData";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { Switch } from "@/components/ui/switch";
import { Spinner } from "@/components/feedback/Loading";
import { ROUTES } from "@/constants/routes";
import { LocationPicker, type PickedLocation } from "@/features/maps/components/LocationPicker";

export function AdminNurseFormPage() {
  const { id } = useParams<{ id: string }>();
  const isEdit = Boolean(id);
  const navigate = useNavigate();

  const { data: existing, isLoading } = useAdminNurseDetails(id);
  const createAccount = useCreateNurseAccount();
  const updateNurse = useUpdateNurse();

  const [fullName, setFullName] = useState("");
  const [phone, setPhone] = useState("");
  const [email, setEmail] = useState("");
  const [password, setPassword] = useState("");
  const [bio, setBio] = useState("");
  const [experienceYears, setExperienceYears] = useState("0");
  const [serviceArea, setServiceArea] = useState("");
  const [price, setPrice] = useState("0");
  const [isActive, setIsActive] = useState(true);
  const [baseLocation, setBaseLocation] = useState<PickedLocation | null>(null);

  useEffect(() => {
    if (existing) {
      setBio(existing.bio ?? "");
      setExperienceYears(String(existing.experience_years));
      setServiceArea(existing.service_area.join("، "));
      setPrice(String(existing.visit_price));
      setIsActive(existing.is_active);
      if (existing.base_latitude && existing.base_longitude) {
        setBaseLocation({
          latitude: existing.base_latitude,
          longitude: existing.base_longitude,
          address: existing.service_area[0] ?? "",
        });
      }
    }
  }, [existing]);

  if (isEdit && isLoading) {
    return (
      <div className="flex min-h-[40vh] items-center justify-center">
        <Spinner />
      </div>
    );
  }

  const parseAreas = () =>
    serviceArea
      .split(/[،,]/)
      .map((a) => a.trim())
      .filter(Boolean);

  const handleCreate = () => {
    if (!fullName || !phone || !email || !password) {
      toast.error("برجاء ملء كل الحقول الأساسية");
      return;
    }
    createAccount.mutate(
      {
        fullName,
        phone,
        email,
        temporaryPassword: password,
        bio,
        experienceYears: Number(experienceYears),
        serviceArea: parseAreas(),
        visitPrice: Number(price),
        baseLatitude: baseLocation?.latitude,
        baseLongitude: baseLocation?.longitude,
      },
      { onSuccess: () => navigate(ROUTES.adminNurses) }
    );
  };

  const handleUpdate = () => {
    if (!existing) return;
    updateNurse.mutate(
      {
        id: existing.id,
        updates: {
          bio,
          experience_years: Number(experienceYears),
          service_area: parseAreas(),
          visit_price: Number(price),
          is_active: isActive,
          base_latitude: baseLocation?.latitude ?? null,
          base_longitude: baseLocation?.longitude ?? null,
        },
        description: `عدّل بيانات ${existing.full_name}`,
      },
      { onSuccess: () => navigate(ROUTES.adminNurses) }
    );
  };

  return (
    <div className="max-w-xl">
      <h1 className="text-2xl font-semibold text-foreground">
        {isEdit ? "تعديل بيانات ممرض" : "إضافة ممرض جديد"}
      </h1>

      <div className="mt-6 space-y-4">
        {!isEdit && (
          <>
            <div className="grid grid-cols-2 gap-3">
              <div className="space-y-1.5">
                <Label>الاسم الكامل</Label>
                <Input value={fullName} onChange={(e) => setFullName(e.target.value)} />
              </div>
              <div className="space-y-1.5">
                <Label>رقم الهاتف</Label>
                <Input value={phone} onChange={(e) => setPhone(e.target.value)} />
              </div>
            </div>
            <div className="grid grid-cols-2 gap-3">
              <div className="space-y-1.5">
                <Label>البريد الإلكتروني</Label>
                <Input type="email" value={email} onChange={(e) => setEmail(e.target.value)} />
              </div>
              <div className="space-y-1.5">
                <Label>كلمة مرور مبدئية</Label>
                <Input type="text" value={password} onChange={(e) => setPassword(e.target.value)} />
              </div>
            </div>
          </>
        )}

        <div className="space-y-1.5">
          <Label>نبذة</Label>
          <textarea
            rows={3}
            value={bio}
            onChange={(e) => setBio(e.target.value)}
            className="w-full resize-none rounded border border-border bg-surface px-3.5 py-2.5 text-sm focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-ring"
          />
        </div>

        <div className="grid grid-cols-2 gap-3">
          <div className="space-y-1.5">
            <Label>سنوات الخبرة</Label>
            <Input type="number" min={0} value={experienceYears} onChange={(e) => setExperienceYears(e.target.value)} />
          </div>
          <div className="space-y-1.5">
            <Label>سعر الزيارة (جنيه)</Label>
            <Input type="number" min={0} value={price} onChange={(e) => setPrice(e.target.value)} />
          </div>
        </div>

        <div className="space-y-1.5">
          <Label>مناطق الخدمة (افصل بينها بفاصلة)</Label>
          <Input value={serviceArea} onChange={(e) => setServiceArea(e.target.value)} />
        </div>

        <div className="space-y-1.5">
          <Label>الموقع الأساسي (اختياري — يُستخدم فقط لترتيب "الأقرب إليك")</Label>
          <LocationPicker value={baseLocation} onChange={setBaseLocation} />
        </div>

        {isEdit && (
          <div className="flex items-center gap-3">
            <Switch checked={isActive} onCheckedChange={setIsActive} />
            <Label className="cursor-pointer font-normal">الحساب نشط ويظهر في نتائج البحث</Label>
          </div>
        )}

        <Button
          onClick={isEdit ? handleUpdate : handleCreate}
          disabled={createAccount.isPending || updateNurse.isPending}
        >
          {createAccount.isPending || updateNurse.isPending
            ? "جارٍ الحفظ..."
            : isEdit
              ? "حفظ التعديلات"
              : "إنشاء الحساب"}
        </Button>
      </div>
    </div>
  );
}
