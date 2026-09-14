import { useEffect, useState } from "react";
import { useNavigate, useParams } from "react-router-dom";
import { toast } from "sonner";
import {
  useAdminDoctorDetails,
  useCreateDoctorAccount,
  useUpdateDoctor,
} from "../hooks/useAdminData";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { Switch } from "@/components/ui/switch";
import { Spinner } from "@/components/feedback/Loading";
import { ROUTES } from "@/constants/routes";

export function AdminDoctorFormPage() {
  const { id } = useParams<{ id: string }>();
  const isEdit = Boolean(id);
  const navigate = useNavigate();

  const { data: existing, isLoading } = useAdminDoctorDetails(id);
  const createAccount = useCreateDoctorAccount();
  const updateDoctor = useUpdateDoctor();

  const [fullName, setFullName] = useState("");
  const [phone, setPhone] = useState("");
  const [email, setEmail] = useState("");
  const [password, setPassword] = useState("");
  const [specialization, setSpecialization] = useState("");
  const [bio, setBio] = useState("");
  const [experienceYears, setExperienceYears] = useState("0");
  const [clinicAddress, setClinicAddress] = useState("");
  const [price, setPrice] = useState("0");
  const [isActive, setIsActive] = useState(true);

  useEffect(() => {
    if (existing) {
      setSpecialization(existing.specialization);
      setBio(existing.bio ?? "");
      setExperienceYears(String(existing.experience_years));
      setClinicAddress(existing.clinic_address);
      setPrice(String(existing.consultation_price));
      setIsActive(existing.is_active);
    }
  }, [existing]);

  if (isEdit && isLoading) {
    return (
      <div className="flex min-h-[40vh] items-center justify-center">
        <Spinner />
      </div>
    );
  }

  const handleCreate = async () => {
    if (!fullName || !phone || !email || !password || !specialization || !clinicAddress) {
      toast.error("برجاء ملء كل الحقول الأساسية");
      return;
    }
    createAccount.mutate(
      {
        fullName,
        phone,
        email,
        temporaryPassword: password,
        specialization,
        bio,
        experienceYears: Number(experienceYears),
        clinicAddress,
        consultationPrice: Number(price),
      },
      { onSuccess: () => navigate(ROUTES.adminDoctors) }
    );
  };

  const handleUpdate = () => {
    if (!existing) return;
    updateDoctor.mutate(
      {
        id: existing.id,
        updates: {
          specialization,
          bio,
          experience_years: Number(experienceYears),
          clinic_address: clinicAddress,
          consultation_price: Number(price),
          is_active: isActive,
        },
        description: `عدّل بيانات د. ${existing.full_name}`,
      },
      { onSuccess: () => navigate(ROUTES.adminDoctors) }
    );
  };

  return (
    <div className="max-w-xl">
      <h1 className="text-2xl font-semibold text-foreground">
        {isEdit ? "تعديل بيانات طبيب" : "إضافة طبيب جديد"}
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
          <Label>التخصص</Label>
          <Input value={specialization} onChange={(e) => setSpecialization(e.target.value)} />
        </div>

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
            <Label>سعر الكشف (جنيه)</Label>
            <Input type="number" min={0} value={price} onChange={(e) => setPrice(e.target.value)} />
          </div>
        </div>

        <div className="space-y-1.5">
          <Label>عنوان العيادة</Label>
          <Input value={clinicAddress} onChange={(e) => setClinicAddress(e.target.value)} />
        </div>

        {isEdit && (
          <div className="flex items-center gap-3">
            <Switch checked={isActive} onCheckedChange={setIsActive} />
            <Label className="cursor-pointer font-normal">الحساب نشط ويظهر في نتائج البحث</Label>
          </div>
        )}

        <Button
          onClick={isEdit ? handleUpdate : handleCreate}
          disabled={createAccount.isPending || updateDoctor.isPending}
        >
          {createAccount.isPending || updateDoctor.isPending
            ? "جارٍ الحفظ..."
            : isEdit
              ? "حفظ التعديلات"
              : "إنشاء الحساب"}
        </Button>
      </div>
    </div>
  );
}
