// supabase/functions/admin-create-provider-account/index.ts
//
// هذه الدالة تعمل على Supabase Edge Functions (Deno) — الوحيدة المصرّح لها
// باستخدام SUPABASE_SERVICE_ROLE_KEY، وهو Secret لا يظهر إطلاقًا في الـ
// Frontend (راجع قسم 45 و54 في المواصفة: "لا تضع Secrets في Frontend").
//
// التدفق الكامل لإنشاء حساب طبيب/ممرض (Admin فقط):
//   1) الأدمن (من لوحة الإدارة، بعد تسجيل دخول بحساب ADMIN) يستدعي هذه
//      الدالة مع بيانات الحساب الأساسية (بريد، اسم، هاتف...).
//   2) الدالة تتحقق أولًا أن المُستدعي فعلًا ADMIN (عبر الـ JWT المُرسَل).
//   3) تُنشئ حساب Auth عبر Admin API → يشغّل تلقائيًا trigger
//      handle_new_auth_user في قاعدة البيانات → يُنشئ profile بـ role='USER'.
//   4) الدالة بعد كده تستدعي RPC (admin_create_doctor أو admin_create_nurse)
//      اللي بترقّي الـ role وتُنشئ صف doctors/nurses وتسجّل العملية في
//      admin_actions — كل ده داخل نفس الطلب حتى لا يتبقى الحساب "USER يتيم".
//
// النشر:
//   npx supabase functions deploy admin-create-provider-account
//
// متغيرات البيئة المطلوبة (تُضبط تلقائيًا من Supabase أو يدويًا كـ Secrets):
//   SUPABASE_URL, SUPABASE_SERVICE_ROLE_KEY (سرّي — Edge Function فقط)

import { serve } from "https://deno.land/std@0.224.0/http/server.ts";
import { createClient } from "https://esm.sh/@supabase/supabase-js@2.45.4";

interface RequestBody {
  fullName: string;
  phone: string;
  email: string;
  temporaryPassword: string;
  providerType: "doctor" | "nurse";
  doctor?: {
    specialization: string;
    bio?: string;
    experienceYears?: number;
    clinicAddress: string;
    clinicLatitude?: number;
    clinicLongitude?: number;
    consultationPrice: number;
  };
  nurse?: {
    bio?: string;
    experienceYears?: number;
    serviceArea?: string[];
    visitPrice: number;
    baseLatitude?: number;
    baseLongitude?: number;
  };
}

serve(async (req) => {
  if (req.method !== "POST") {
    return new Response(JSON.stringify({ error: "Method not allowed" }), { status: 405 });
  }

  const authHeader = req.headers.get("Authorization");
  if (!authHeader) {
    return new Response(JSON.stringify({ error: "غير مصرَّح" }), { status: 401 });
  }

  const supabaseUrl = Deno.env.get("SUPABASE_URL")!;
  const serviceRoleKey = Deno.env.get("SUPABASE_SERVICE_ROLE_KEY")!;

  // عميل بصلاحية المُستدعي (لتحديد هويته والتأكد إنه ADMIN فعلًا)
  const callerClient = createClient(supabaseUrl, serviceRoleKey, {
    global: { headers: { Authorization: authHeader } },
  });

  const {
    data: { user: caller },
    error: callerError,
  } = await callerClient.auth.getUser();

  if (callerError || !caller) {
    return new Response(JSON.stringify({ error: "غير مصرَّح" }), { status: 401 });
  }

  const { data: callerProfile } = await callerClient
    .from("profiles")
    .select("role")
    .eq("id", caller.id)
    .single();

  if (callerProfile?.role !== "ADMIN") {
    return new Response(JSON.stringify({ error: "هذا الإجراء متاح فقط للمدير" }), {
      status: 403,
    });
  }

  const body: RequestBody = await req.json();

  // عميل بصلاحية service_role — لإنشاء حساب Auth مباشرة (Admin API)
  const adminClient = createClient(supabaseUrl, serviceRoleKey);

  const { data: created, error: createError } = await adminClient.auth.admin.createUser({
    email: body.email,
    password: body.temporaryPassword,
    email_confirm: true,
    user_metadata: {
      full_name: body.fullName,
      phone: body.phone,
    },
  });

  if (createError || !created.user) {
    return new Response(
      JSON.stringify({ error: createError?.message ?? "تعذّر إنشاء الحساب" }),
      { status: 400 }
    );
  }

  // ترقية الـ role وإنشاء صف doctors/nurses عبر RPC الآمنة (بصلاحية caller الأصلية)
  const rpcName = body.providerType === "doctor" ? "admin_create_doctor" : "admin_create_nurse";
  const rpcArgs =
    body.providerType === "doctor"
      ? {
          p_profile_id: created.user.id,
          p_specialization: body.doctor?.specialization,
          p_bio: body.doctor?.bio ?? null,
          p_experience_years: body.doctor?.experienceYears ?? 0,
          p_clinic_address: body.doctor?.clinicAddress,
          p_clinic_latitude: body.doctor?.clinicLatitude ?? null,
          p_clinic_longitude: body.doctor?.clinicLongitude ?? null,
          p_consultation_price: body.doctor?.consultationPrice,
        }
      : {
          p_profile_id: created.user.id,
          p_bio: body.nurse?.bio ?? null,
          p_experience_years: body.nurse?.experienceYears ?? 0,
          p_service_area: body.nurse?.serviceArea ?? [],
          p_visit_price: body.nurse?.visitPrice,
          p_base_latitude: body.nurse?.baseLatitude ?? null,
          p_base_longitude: body.nurse?.baseLongitude ?? null,
        };

  const { data: providerRow, error: rpcError } = await callerClient.rpc(rpcName, rpcArgs);

  if (rpcError) {
    // تراجع: احذف حساب Auth اليتيم بدل ما يفضل حساب USER بلا صف doctors/nurses
    await adminClient.auth.admin.deleteUser(created.user.id);
    return new Response(JSON.stringify({ error: rpcError.message }), { status: 400 });
  }

  return new Response(JSON.stringify({ data: providerRow }), {
    status: 200,
    headers: { "Content-Type": "application/json" },
  });
});
