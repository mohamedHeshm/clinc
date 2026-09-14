import { useMutation, useQuery, useQueryClient } from "@tanstack/react-query";
import { toast } from "sonner";
import { fetchAdminOverviewStats } from "../services/admin-stats.service";
import {
  fetchAdminDoctors,
  fetchAdminDoctorById,
  createDoctorAccount,
  updateDoctorAsAdmin,
  setDoctorAccountStatus,
  type CreateDoctorAccountInput,
  type UpdateDoctorInput,
} from "../services/admin-doctors.service";
import {
  fetchAdminNurses,
  fetchAdminNurseById,
  createNurseAccount,
  updateNurseAsAdmin,
  setNurseAccountStatus,
  type CreateNurseAccountInput,
  type UpdateNurseInput,
} from "../services/admin-nurses.service";
import { fetchAdminUsers, fetchUserById, setUserAccountStatus } from "../services/admin-users.service";
import {
  fetchAdminServices,
  createService,
  updateService,
  toggleServiceActive,
  type ServiceInput,
} from "../services/admin-services.service";
import { fetchAdminBookings, fetchAdminBookingById, type AdminBookingFilters } from "../services/admin-bookings.service";
import { fetchAnalytics } from "../services/admin-analytics.service";
import { fetchAuditLog } from "../services/admin-audit.service";

// ── نظرة عامة ──────────────────────────────────────────────
export function useAdminOverviewStats() {
  return useQuery({ queryKey: ["admin-overview"], queryFn: fetchAdminOverviewStats });
}

// ── الأطباء ─────────────────────────────────────────────────
export function useAdminDoctors(search?: string) {
  return useQuery({ queryKey: ["admin-doctors", search], queryFn: () => fetchAdminDoctors(search) });
}

export function useAdminDoctorDetails(id: string | undefined) {
  return useQuery({
    queryKey: ["admin-doctor", id],
    queryFn: () => fetchAdminDoctorById(id as string),
    enabled: Boolean(id),
  });
}

export function useCreateDoctorAccount() {
  const queryClient = useQueryClient();
  return useMutation({
    mutationFn: (input: CreateDoctorAccountInput) => createDoctorAccount(input),
    onSuccess: () => {
      toast.success("تم إنشاء حساب الطبيب بنجاح");
      queryClient.invalidateQueries({ queryKey: ["admin-doctors"] });
      queryClient.invalidateQueries({ queryKey: ["admin-overview"] });
    },
    onError: (error) => {
      toast.error(error instanceof Error ? error.message : "تعذّر إنشاء الحساب");
    },
  });
}

export function useUpdateDoctor() {
  const queryClient = useQueryClient();
  return useMutation({
    mutationFn: ({ id, updates, description }: { id: string; updates: UpdateDoctorInput; description: string }) =>
      updateDoctorAsAdmin(id, updates, description),
    onSuccess: () => {
      toast.success("تم حفظ التعديلات");
      queryClient.invalidateQueries({ queryKey: ["admin-doctors"] });
      queryClient.invalidateQueries({ queryKey: ["audit-log"] });
    },
    onError: () => toast.error("تعذّر حفظ التعديلات"),
  });
}

export function useSetDoctorAccountStatus() {
  const queryClient = useQueryClient();
  return useMutation({
    mutationFn: ({ profileId, status }: { profileId: string; status: "active" | "suspended" }) =>
      setDoctorAccountStatus(profileId, status),
    onSuccess: () => {
      toast.success("تم تحديث حالة الحساب");
      queryClient.invalidateQueries({ queryKey: ["admin-doctors"] });
    },
    onError: () => toast.error("تعذّر تحديث الحالة"),
  });
}

// ── الممرضون ────────────────────────────────────────────────
export function useAdminNurses(search?: string) {
  return useQuery({ queryKey: ["admin-nurses", search], queryFn: () => fetchAdminNurses(search) });
}

export function useAdminNurseDetails(id: string | undefined) {
  return useQuery({
    queryKey: ["admin-nurse", id],
    queryFn: () => fetchAdminNurseById(id as string),
    enabled: Boolean(id),
  });
}

export function useCreateNurseAccount() {
  const queryClient = useQueryClient();
  return useMutation({
    mutationFn: (input: CreateNurseAccountInput) => createNurseAccount(input),
    onSuccess: () => {
      toast.success("تم إنشاء حساب الممرض/ة بنجاح");
      queryClient.invalidateQueries({ queryKey: ["admin-nurses"] });
      queryClient.invalidateQueries({ queryKey: ["admin-overview"] });
    },
    onError: (error) => {
      toast.error(error instanceof Error ? error.message : "تعذّر إنشاء الحساب");
    },
  });
}

export function useUpdateNurse() {
  const queryClient = useQueryClient();
  return useMutation({
    mutationFn: ({ id, updates, description }: { id: string; updates: UpdateNurseInput; description: string }) =>
      updateNurseAsAdmin(id, updates, description),
    onSuccess: () => {
      toast.success("تم حفظ التعديلات");
      queryClient.invalidateQueries({ queryKey: ["admin-nurses"] });
      queryClient.invalidateQueries({ queryKey: ["audit-log"] });
    },
    onError: () => toast.error("تعذّر حفظ التعديلات"),
  });
}

export function useSetNurseAccountStatus() {
  const queryClient = useQueryClient();
  return useMutation({
    mutationFn: ({ profileId, status }: { profileId: string; status: "active" | "suspended" }) =>
      setNurseAccountStatus(profileId, status),
    onSuccess: () => {
      toast.success("تم تحديث حالة الحساب");
      queryClient.invalidateQueries({ queryKey: ["admin-nurses"] });
    },
    onError: () => toast.error("تعذّر تحديث الحالة"),
  });
}

// ── المستخدمون ──────────────────────────────────────────────
export function useAdminUsers(search?: string) {
  return useQuery({ queryKey: ["admin-users", search], queryFn: () => fetchAdminUsers(search) });
}

export function useAdminUserDetails(id: string | undefined) {
  return useQuery({
    queryKey: ["admin-user", id],
    queryFn: () => fetchUserById(id as string),
    enabled: Boolean(id),
  });
}

export function useSetUserAccountStatus() {
  const queryClient = useQueryClient();
  return useMutation({
    mutationFn: ({ profileId, status }: { profileId: string; status: "active" | "suspended" }) =>
      setUserAccountStatus(profileId, status),
    onSuccess: () => {
      toast.success("تم تحديث حالة الحساب");
      queryClient.invalidateQueries({ queryKey: ["admin-users"] });
      queryClient.invalidateQueries({ queryKey: ["admin-user"] });
    },
    onError: () => toast.error("تعذّر تحديث الحالة"),
  });
}

// ── الخدمات ─────────────────────────────────────────────────
export function useAdminServices() {
  return useQuery({ queryKey: ["admin-services"], queryFn: fetchAdminServices });
}

export function useCreateService() {
  const queryClient = useQueryClient();
  return useMutation({
    mutationFn: (input: ServiceInput) => createService(input),
    onSuccess: () => {
      toast.success("تمت إضافة الخدمة");
      queryClient.invalidateQueries({ queryKey: ["admin-services"] });
    },
    onError: () => toast.error("تعذّر إضافة الخدمة"),
  });
}

export function useUpdateService() {
  const queryClient = useQueryClient();
  return useMutation({
    mutationFn: ({ id, updates }: { id: string; updates: Partial<ServiceInput> }) => updateService(id, updates),
    onSuccess: () => {
      toast.success("تم الحفظ");
      queryClient.invalidateQueries({ queryKey: ["admin-services"] });
    },
    onError: () => toast.error("تعذّر الحفظ"),
  });
}

export function useToggleServiceActive() {
  const queryClient = useQueryClient();
  return useMutation({
    mutationFn: ({ id, isActive }: { id: string; isActive: boolean }) => toggleServiceActive(id, isActive),
    onSuccess: () => queryClient.invalidateQueries({ queryKey: ["admin-services"] }),
    onError: () => toast.error("تعذّر تحديث الحالة"),
  });
}

// ── الحجوزات ────────────────────────────────────────────────
export function useAdminBookings(filters: AdminBookingFilters) {
  return useQuery({ queryKey: ["admin-bookings", filters], queryFn: () => fetchAdminBookings(filters) });
}

export function useAdminBookingDetails(id: string | undefined) {
  return useQuery({
    queryKey: ["admin-booking", id],
    queryFn: () => fetchAdminBookingById(id as string),
    enabled: Boolean(id),
  });
}

// ── التحليلات وسجل التدقيق ─────────────────────────────────
export function useAnalytics() {
  return useQuery({ queryKey: ["admin-analytics"], queryFn: fetchAnalytics });
}

export function useAuditLog() {
  return useQuery({ queryKey: ["audit-log"], queryFn: () => fetchAuditLog() });
}
