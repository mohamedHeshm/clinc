import { z } from "zod";
import { GENDERS } from "@/types/enums";

const egyptianPhoneRegex = /^01[0-2,5]{1}[0-9]{8}$/;

export const registerSchema = z
  .object({
    fullName: z.string().trim().min(3, "الاسم يجب أن يكون 3 أحرف على الأقل"),
    phone: z.string().regex(egyptianPhoneRegex, "رقم هاتف غير صحيح (مثال: 01012345678)"),
    email: z.string().trim().email("بريد إلكتروني غير صحيح"),
    gender: z.enum(GENDERS, { required_error: "برجاء اختيار الجنس" }),
    address: z.string().trim().optional(),
    password: z.string().min(8, "كلمة المرور يجب أن تكون 8 أحرف على الأقل"),
    confirmPassword: z.string(),
  })
  .refine((data) => data.password === data.confirmPassword, {
    message: "كلمتا المرور غير متطابقتين",
    path: ["confirmPassword"],
  });

export type RegisterFormValues = z.infer<typeof registerSchema>;

export const loginSchema = z.object({
  email: z.string().trim().email("بريد إلكتروني غير صحيح"),
  password: z.string().min(1, "برجاء إدخال كلمة المرور"),
});

export type LoginFormValues = z.infer<typeof loginSchema>;

export const forgotPasswordSchema = z.object({
  email: z.string().trim().email("بريد إلكتروني غير صحيح"),
});

export type ForgotPasswordFormValues = z.infer<typeof forgotPasswordSchema>;

export const resetPasswordSchema = z
  .object({
    password: z.string().min(8, "كلمة المرور يجب أن تكون 8 أحرف على الأقل"),
    confirmPassword: z.string(),
  })
  .refine((data) => data.password === data.confirmPassword, {
    message: "كلمتا المرور غير متطابقتين",
    path: ["confirmPassword"],
  });

export type ResetPasswordFormValues = z.infer<typeof resetPasswordSchema>;
