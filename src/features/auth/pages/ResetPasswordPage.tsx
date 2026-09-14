import { useState } from "react";
import { useNavigate } from "react-router-dom";
import { useForm } from "react-hook-form";
import { zodResolver } from "@hookform/resolvers/zod";
import { toast } from "sonner";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { Card } from "@/components/ui/card";
import { resetPasswordSchema, type ResetPasswordFormValues } from "../schemas/auth.schemas";
import { updatePassword } from "../services/auth.service";
import { getAuthErrorMessage } from "../utils/auth-error";
import { ROUTES } from "@/constants/routes";

/**
 * يصل المستخدم لهذه الصفحة عبر رابط بريد إعادة التعيين — Supabase يضبط
 * جلسة مؤقتة تلقائيًا من الـ URL (detectSessionInUrl: true في lib/supabase.ts)
 * قبل ما الصفحة تفتح، فمفيش حاجة إضافية مطلوبة هنا غير استدعاء updatePassword.
 */
export function ResetPasswordPage() {
  const navigate = useNavigate();
  const [isSubmitting, setIsSubmitting] = useState(false);

  const {
    register,
    handleSubmit,
    formState: { errors },
  } = useForm<ResetPasswordFormValues>({ resolver: zodResolver(resetPasswordSchema) });

  const onSubmit = async (values: ResetPasswordFormValues) => {
    setIsSubmitting(true);
    try {
      await updatePassword(values.password);
      toast.success("تم تغيير كلمة المرور بنجاح");
      navigate(ROUTES.login, { replace: true });
    } catch (error) {
      toast.error(getAuthErrorMessage(error));
    } finally {
      setIsSubmitting(false);
    }
  };

  return (
    <div className="flex min-h-screen items-center justify-center bg-background px-4">
      <Card className="w-full max-w-sm">
        <h1 className="text-xl font-semibold text-foreground">إعادة تعيين كلمة المرور</h1>
        <p className="mt-1 text-sm text-muted-foreground">اختر كلمة مرور جديدة لحسابك</p>

        <form onSubmit={handleSubmit(onSubmit)} className="mt-6 space-y-4">
          <div className="space-y-1.5">
            <Label htmlFor="password">كلمة المرور الجديدة</Label>
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
          <Button type="submit" className="w-full" disabled={isSubmitting}>
            {isSubmitting ? "جارٍ الحفظ..." : "حفظ كلمة المرور"}
          </Button>
        </form>
      </Card>
    </div>
  );
}
