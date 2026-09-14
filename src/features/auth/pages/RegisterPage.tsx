import { useState } from "react";
import { Link, useNavigate } from "react-router-dom";
import { useForm } from "react-hook-form";
import { zodResolver } from "@hookform/resolvers/zod";
import { toast } from "sonner";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { Card } from "@/components/ui/card";
import { registerSchema, type RegisterFormValues } from "../schemas/auth.schemas";
import { signUp } from "../services/auth.service";
import { getAuthErrorMessage } from "../utils/auth-error";
import { ROUTES } from "@/constants/routes";

export function RegisterPage() {
  const navigate = useNavigate();
  const [isSubmitting, setIsSubmitting] = useState(false);

  const {
    register,
    handleSubmit,
    formState: { errors },
  } = useForm<RegisterFormValues>({ resolver: zodResolver(registerSchema) });

  const onSubmit = async (values: RegisterFormValues) => {
    setIsSubmitting(true);
    try {
      await signUp(values);
      toast.success("تم إنشاء الحساب بنجاح");
      navigate(ROUTES.dashboard, { replace: true });
    } catch (error) {
      toast.error(getAuthErrorMessage(error));
    } finally {
      setIsSubmitting(false);
    }
  };

  return (
    <div className="flex min-h-screen items-center justify-center bg-background px-4 py-10">
      <Card className="w-full max-w-md">
        <h1 className="text-xl font-semibold text-foreground">إنشاء حساب جديد</h1>
        <p className="mt-1 text-sm text-muted-foreground">
          أنشئ حسابك للبحث عن طبيب أو ممرض وحجز موعدك
        </p>

        <form onSubmit={handleSubmit(onSubmit)} className="mt-6 space-y-4">
          <div className="space-y-1.5">
            <Label htmlFor="fullName">الاسم الكامل</Label>
            <Input id="fullName" autoComplete="name" {...register("fullName")} />
            {errors.fullName && (
              <p className="text-xs text-destructive">{errors.fullName.message}</p>
            )}
          </div>

          <div className="grid grid-cols-2 gap-3">
            <div className="space-y-1.5">
              <Label htmlFor="phone">رقم الهاتف</Label>
              <Input id="phone" type="tel" autoComplete="tel" {...register("phone")} />
              {errors.phone && <p className="text-xs text-destructive">{errors.phone.message}</p>}
            </div>

            <div className="space-y-1.5">
              <Label htmlFor="gender">الجنس</Label>
              <select
                id="gender"
                className="flex h-11 w-full rounded border border-border bg-surface px-3 text-sm focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-ring"
                defaultValue=""
                {...register("gender")}
              >
                <option value="" disabled>
                  اختر
                </option>
                <option value="MALE">ذكر</option>
                <option value="FEMALE">أنثى</option>
              </select>
              {errors.gender && <p className="text-xs text-destructive">{errors.gender.message}</p>}
            </div>
          </div>

          <div className="space-y-1.5">
            <Label htmlFor="address">العنوان (اختياري)</Label>
            <Input id="address" autoComplete="street-address" {...register("address")} />
          </div>

          <div className="space-y-1.5">
            <Label htmlFor="email">البريد الإلكتروني</Label>
            <Input id="email" type="email" autoComplete="email" {...register("email")} />
            {errors.email && <p className="text-xs text-destructive">{errors.email.message}</p>}
          </div>

          <div className="grid grid-cols-2 gap-3">
            <div className="space-y-1.5">
              <Label htmlFor="password">كلمة المرور</Label>
              <Input id="password" type="password" autoComplete="new-password" {...register("password")} />
              {errors.password && (
                <p className="text-xs text-destructive">{errors.password.message}</p>
              )}
            </div>
            <div className="space-y-1.5">
              <Label htmlFor="confirmPassword">تأكيد كلمة المرور</Label>
              <Input
                id="confirmPassword"
                type="password"
                autoComplete="new-password"
                {...register("confirmPassword")}
              />
              {errors.confirmPassword && (
                <p className="text-xs text-destructive">{errors.confirmPassword.message}</p>
              )}
            </div>
          </div>

          <Button type="submit" className="w-full" disabled={isSubmitting}>
            {isSubmitting ? "جارٍ الإنشاء..." : "إنشاء الحساب"}
          </Button>
        </form>

        <p className="mt-6 text-center text-sm text-muted-foreground">
          لديك حساب بالفعل؟{" "}
          <Link to={ROUTES.login} className="text-primary hover:underline">
            تسجيل الدخول
          </Link>
        </p>
      </Card>
    </div>
  );
}
