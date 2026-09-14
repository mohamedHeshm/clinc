import { useState } from "react";
import { useForm } from "react-hook-form";
import { zodResolver } from "@hookform/resolvers/zod";
import { toast } from "sonner";
import { useNavigate, Link } from "react-router-dom";
import { ArrowRight, KeyRound, LogOut } from "lucide-react";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { useAuth } from "@/contexts/AuthContext";
import { ROUTES } from "@/constants/routes";
import { getPostLoginRoute } from "@/features/auth/utils/post-login-route";
import {
  resetPasswordSchema,
  type ResetPasswordFormValues,
} from "@/features/auth/schemas/auth.schemas";
import { updatePassword } from "@/features/auth/services/auth.service";
import { getAuthErrorMessage } from "@/features/auth/utils/auth-error";

export function SettingsPage() {
  const { signOut, profile } = useAuth();
  const navigate = useNavigate();
  const [isSubmitting, setIsSubmitting] = useState(false);

  const {
    register,
    handleSubmit,
    reset,
    formState: { errors },
  } = useForm<ResetPasswordFormValues>({ resolver: zodResolver(resetPasswordSchema) });

  const onSubmit = async (values: ResetPasswordFormValues) => {
    setIsSubmitting(true);
    try {
      await updatePassword(values.password);
      toast.success("تم تغيير كلمة المرور بنجاح");
      reset();
    } catch (error) {
      toast.error(getAuthErrorMessage(error));
    } finally {
      setIsSubmitting(false);
    }
  };

  const handleSignOut = async () => {
    await signOut();
    navigate(ROUTES.home);
  };

  return (
    <div className="container max-w-xl py-10">
      {profile && (
        <Link
          to={getPostLoginRoute(profile.role)}
          className="mb-4 inline-flex items-center gap-1.5 text-sm text-muted-foreground transition-colors hover:text-foreground"
        >
          <ArrowRight className="h-4 w-4" />
          رجوع للوحة التحكم
        </Link>
      )}

      <h1 className="text-2xl font-semibold tracking-tight text-foreground">الإعدادات</h1>
      <p className="mt-1.5 text-sm text-muted-foreground">إدارة كلمة المرور وجلسة حسابك</p>

      <section className="mt-7 rounded-lg border border-border bg-surface p-5">
        <div className="flex items-center gap-2.5">
          <div className="flex h-9 w-9 items-center justify-center rounded-full bg-primary-subtle text-primary">
            <KeyRound className="h-4 w-4" />
          </div>
          <h2 className="text-sm font-semibold text-foreground">تغيير كلمة المرور</h2>
        </div>

        <form onSubmit={handleSubmit(onSubmit)} className="mt-5 space-y-4">
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
          <Button type="submit" disabled={isSubmitting}>
            {isSubmitting ? "جارٍ الحفظ..." : "تحديث كلمة المرور"}
          </Button>
        </form>
      </section>

      <section className="mt-5 rounded-lg border border-border bg-surface p-5">
        <div className="flex items-center gap-2.5">
          <div className="flex h-9 w-9 items-center justify-center rounded-full bg-destructive/10 text-destructive">
            <LogOut className="h-4 w-4" />
          </div>
          <h2 className="text-sm font-semibold text-foreground">تسجيل الخروج</h2>
        </div>
        <p className="mt-2 text-sm text-muted-foreground">سيتم إنهاء الجلسة الحالية على هذا الجهاز</p>
        <Button variant="outline" className="mt-4" onClick={handleSignOut}>
          <LogOut className="h-4 w-4" />
          تسجيل الخروج
        </Button>
      </section>
    </div>
  );
}
