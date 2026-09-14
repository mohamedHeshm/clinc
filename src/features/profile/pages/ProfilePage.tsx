import { useRef, useState } from "react";
import type { ChangeEvent } from "react";
import { useForm } from "react-hook-form";
import { zodResolver } from "@hookform/resolvers/zod";
import { z } from "zod";
import { toast } from "sonner";
import { Camera, ArrowRight } from "lucide-react";
import { Link } from "react-router-dom";
import { useAuth } from "@/contexts/AuthContext";
import { getPostLoginRoute } from "@/features/auth/utils/post-login-route";
import { Avatar, AvatarFallback, AvatarImage } from "@/components/ui/avatar";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { updateProfile, uploadAvatar } from "../services/profile.service";

const profileSchema = z.object({
  fullName: z.string().trim().min(3, "الاسم يجب أن يكون 3 أحرف على الأقل"),
  phone: z.string().regex(/^01[0-2,5]{1}[0-9]{8}$/, "رقم هاتف غير صحيح"),
  address: z.string().trim().optional(),
});

type ProfileFormValues = z.infer<typeof profileSchema>;

export function ProfilePage() {
  const { profile, refreshProfile } = useAuth();
  const [isUploading, setIsUploading] = useState(false);
  const fileInputRef = useRef<HTMLInputElement>(null);

  const {
    register,
    handleSubmit,
    formState: { errors, isSubmitting },
  } = useForm<ProfileFormValues>({
    resolver: zodResolver(profileSchema),
    defaultValues: {
      fullName: profile?.full_name ?? "",
      phone: profile?.phone ?? "",
      address: profile?.address ?? "",
    },
  });

  if (!profile) return null;

  const onSubmit = async (values: ProfileFormValues) => {
    try {
      await updateProfile(profile.id, {
        full_name: values.fullName,
        phone: values.phone,
        address: values.address || null,
      });
      await refreshProfile();
      toast.success("تم حفظ التعديلات");
    } catch {
      toast.error("تعذّر حفظ التعديلات. برجاء المحاولة مرة أخرى.");
    }
  };

  const handleAvatarChange = async (e: ChangeEvent<HTMLInputElement>) => {
    const file = e.target.files?.[0];
    if (!file) return;

    setIsUploading(true);
    try {
      const url = await uploadAvatar(profile.id, file);
      await updateProfile(profile.id, { avatar_url: url });
      await refreshProfile();
      toast.success("تم تحديث الصورة");
    } catch (error) {
      toast.error(error instanceof Error ? error.message : "تعذّر رفع الصورة");
    } finally {
      setIsUploading(false);
      if (fileInputRef.current) fileInputRef.current.value = "";
    }
  };

  return (
    <div className="container max-w-xl py-10">
      <Link
        to={getPostLoginRoute(profile.role)}
        className="mb-4 inline-flex items-center gap-1.5 text-sm text-muted-foreground transition-colors hover:text-foreground"
      >
        <ArrowRight className="h-4 w-4" />
        رجوع للوحة التحكم
      </Link>

      <h1 className="text-2xl font-semibold tracking-tight text-foreground">الملف الشخصي</h1>
      <p className="mt-1.5 text-sm text-muted-foreground">بياناتك الأساسية وصورتك الشخصية</p>

      <div className="mt-6 flex items-center gap-4">
        <div className="relative">
          <Avatar className="h-20 w-20">
            <AvatarImage src={profile.avatar_url ?? undefined} alt={profile.full_name} />
            <AvatarFallback className="text-xl">{profile.full_name.charAt(0)}</AvatarFallback>
          </Avatar>
          <button
            type="button"
            onClick={() => fileInputRef.current?.click()}
            disabled={isUploading}
            className="absolute -bottom-1 -left-1 flex h-8 w-8 items-center justify-center rounded-full bg-primary text-primary-foreground shadow-soft hover:bg-primary-hover disabled:opacity-50"
            aria-label="تغيير الصورة"
          >
            <Camera className="h-4 w-4" />
          </button>
          <input
            ref={fileInputRef}
            type="file"
            accept="image/jpeg,image/png,image/webp"
            className="hidden"
            onChange={handleAvatarChange}
          />
        </div>
        <div>
          <p className="font-medium text-foreground">{profile.full_name}</p>
          <p className="text-sm text-muted-foreground">
            {isUploading ? "جارٍ رفع الصورة..." : "JPG أو PNG أو WEBP، حتى 2 ميجابايت"}
          </p>
        </div>
      </div>

      <form onSubmit={handleSubmit(onSubmit)} className="mt-8 space-y-4">
        <div className="space-y-1.5">
          <Label htmlFor="fullName">الاسم الكامل</Label>
          <Input id="fullName" {...register("fullName")} />
          {errors.fullName && <p className="text-xs text-destructive">{errors.fullName.message}</p>}
        </div>

        <div className="space-y-1.5">
          <Label htmlFor="phone">رقم الهاتف</Label>
          <Input id="phone" type="tel" {...register("phone")} />
          {errors.phone && <p className="text-xs text-destructive">{errors.phone.message}</p>}
        </div>

        <div className="space-y-1.5">
          <Label htmlFor="address">العنوان</Label>
          <Input id="address" {...register("address")} />
        </div>

        <Button type="submit" disabled={isSubmitting}>
          {isSubmitting ? "جارٍ الحفظ..." : "حفظ التعديلات"}
        </Button>
      </form>
    </div>
  );
}
