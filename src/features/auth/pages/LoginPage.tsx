import { useState } from "react";
import { Link, useLocation, useNavigate, useSearchParams } from "react-router-dom";
import { useForm } from "react-hook-form";
import { zodResolver } from "@hookform/resolvers/zod";
import { toast } from "sonner";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { Card } from "@/components/ui/card";
import { loginSchema, type LoginFormValues } from "../schemas/auth.schemas";
import { signIn } from "../services/auth.service";
import { getAuthErrorMessage } from "../utils/auth-error";
import { getPostLoginRoute } from "../utils/post-login-route";
import { useAuth } from "@/contexts/AuthContext";
import { ROUTES } from "@/constants/routes";
import { supabase } from "@/lib/supabase";

export function LoginPage() {
  const navigate = useNavigate();
  const location = useLocation();
  const [searchParams] = useSearchParams();
  const { refreshProfile } = useAuth();
  const [isSubmitting, setIsSubmitting] = useState(false);

  const {
    register,
    handleSubmit,
    formState: { errors },
  } = useForm<LoginFormValues>({ resolver: zodResolver(loginSchema) });

  const onSubmit = async (values: LoginFormValues) => {
    setIsSubmitting(true);
    try {
      const { user } = await signIn(values.email, values.password);
      await refreshProfile();

      const { data } = await supabase
        .from("profiles")
        .select("role")
        .eq("id", user.id)
        .single();

      const from = (location.state as { from?: Location })?.from?.pathname;
      navigate(from ?? getPostLoginRoute(data?.role ?? "USER"), { replace: true });
      toast.success("تم تسجيل الدخول بنجاح");
    } catch (error) {
      toast.error(getAuthErrorMessage(error));
    } finally {
      setIsSubmitting(false);
    }
  };

  return (
    <div className="flex min-h-screen items-center justify-center bg-background px-4">
      <Card className="w-full max-w-sm">
        <h1 className="text-xl font-semibold text-foreground">تسجيل الدخول</h1>
        <p className="mt-1 text-sm text-muted-foreground">
          سجّل الدخول لمتابعة حجوزاتك وحسابك
        </p>
        {searchParams.get("confirmed") === "1" && (
          <div className="mt-4 rounded-lg border border-accent/25 bg-accent-subtle p-3 text-sm text-foreground">
            تم تأكيد بريدك الإلكتروني بنجاح. يمكنك تسجيل الدخول الآن.
          </div>
        )}

        <form onSubmit={handleSubmit(onSubmit)} className="mt-6 space-y-4">
          <div className="space-y-1.5">
            <Label htmlFor="email">البريد الإلكتروني</Label>
            <Input id="email" type="email" autoComplete="email" {...register("email")} />
            {errors.email && <p className="text-xs text-destructive">{errors.email.message}</p>}
          </div>

          <div className="space-y-1.5">
            <div className="flex items-center justify-between">
              <Label htmlFor="password">كلمة المرور</Label>
              <Link to={ROUTES.forgotPassword} className="text-xs text-primary hover:underline">
                نسيت كلمة المرور؟
              </Link>
            </div>
            <Input id="password" type="password" autoComplete="current-password" {...register("password")} />
            {errors.password && (
              <p className="text-xs text-destructive">{errors.password.message}</p>
            )}
          </div>

          <Button type="submit" className="w-full" disabled={isSubmitting}>
            {isSubmitting ? "جارٍ الدخول..." : "تسجيل الدخول"}
          </Button>
        </form>

        <p className="mt-6 text-center text-sm text-muted-foreground">
          ليس لديك حساب؟{" "}
          <Link to={ROUTES.register} className="text-primary hover:underline">
            إنشاء حساب جديد
          </Link>
        </p>
      </Card>
    </div>
  );
}
