import { useState } from "react";
import { Link } from "react-router-dom";
import { useForm } from "react-hook-form";
import { zodResolver } from "@hookform/resolvers/zod";
import { toast } from "sonner";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { Card } from "@/components/ui/card";
import {
  forgotPasswordSchema,
  type ForgotPasswordFormValues,
} from "../schemas/auth.schemas";
import { requestPasswordReset } from "../services/auth.service";
import { getAuthErrorMessage } from "../utils/auth-error";
import { ROUTES } from "@/constants/routes";

export function ForgotPasswordPage() {
  const [isSubmitting, setIsSubmitting] = useState(false);
  const [isSent, setIsSent] = useState(false);

  const {
    register,
    handleSubmit,
    formState: { errors },
  } = useForm<ForgotPasswordFormValues>({ resolver: zodResolver(forgotPasswordSchema) });

  const onSubmit = async (values: ForgotPasswordFormValues) => {
    setIsSubmitting(true);
    try {
      await requestPasswordReset(values.email);
      setIsSent(true);
    } catch (error) {
      toast.error(getAuthErrorMessage(error));
    } finally {
      setIsSubmitting(false);
    }
  };

  return (
    <div className="flex min-h-screen items-center justify-center bg-background px-4">
      <Card className="w-full max-w-sm">
        <h1 className="text-xl font-semibold text-foreground">نسيت كلمة المرور</h1>

        {isSent ? (
          <p className="mt-4 text-sm text-muted-foreground">
            إذا كان بريدك الإلكتروني مسجّلًا لدينا، ستصلك رسالة تحتوي على رابط لإعادة تعيين
            كلمة المرور.
          </p>
        ) : (
          <>
            <p className="mt-1 text-sm text-muted-foreground">
              أدخل بريدك الإلكتروني وسنرسل لك رابط إعادة التعيين.
            </p>
            <form onSubmit={handleSubmit(onSubmit)} className="mt-6 space-y-4">
              <div className="space-y-1.5">
                <Label htmlFor="email">البريد الإلكتروني</Label>
                <Input id="email" type="email" autoComplete="email" {...register("email")} />
                {errors.email && (
                  <p className="text-xs text-destructive">{errors.email.message}</p>
                )}
              </div>
              <Button type="submit" className="w-full" disabled={isSubmitting}>
                {isSubmitting ? "جارٍ الإرسال..." : "إرسال رابط إعادة التعيين"}
              </Button>
            </form>
          </>
        )}

        <p className="mt-6 text-center text-sm text-muted-foreground">
          <Link to={ROUTES.login} className="text-primary hover:underline">
            العودة لتسجيل الدخول
          </Link>
        </p>
      </Card>
    </div>
  );
}
