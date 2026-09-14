import { useMutation, useQuery, useQueryClient } from "@tanstack/react-query";
import { toast } from "sonner";
import {
  fetchAllProviderAvailability,
  addAvailabilitySlot,
  toggleAvailabilitySlot,
  deleteAvailabilitySlot,
  type AvailabilityInput,
} from "../services/availability.service";
import { useMyProvider } from "@/features/provider/hooks/useMyProvider";

export function useMyAvailability() {
  const { data: provider } = useMyProvider();

  return useQuery({
    queryKey: ["my-availability", provider?.id, provider?.type],
    queryFn: () => fetchAllProviderAvailability(provider!.id, provider!.type),
    enabled: Boolean(provider?.id),
  });
}

export function useAddAvailabilitySlot() {
  const queryClient = useQueryClient();
  return useMutation({
    mutationFn: (input: AvailabilityInput) => addAvailabilitySlot(input),
    onSuccess: () => {
      toast.success("تمت إضافة الموعد");
      queryClient.invalidateQueries({ queryKey: ["my-availability"] });
    },
    onError: () => toast.error("تعذّر إضافة الموعد — تأكد من عدم تكرار نفس اليوم والوقت"),
  });
}

export function useToggleAvailabilitySlot() {
  const queryClient = useQueryClient();
  return useMutation({
    mutationFn: ({ id, isAvailable }: { id: string; isAvailable: boolean }) =>
      toggleAvailabilitySlot(id, isAvailable),
    onSuccess: () => queryClient.invalidateQueries({ queryKey: ["my-availability"] }),
    onError: () => toast.error("تعذّر تحديث الحالة"),
  });
}

export function useDeleteAvailabilitySlot() {
  const queryClient = useQueryClient();
  return useMutation({
    mutationFn: (id: string) => deleteAvailabilitySlot(id),
    onSuccess: () => {
      toast.success("تم حذف الموعد");
      queryClient.invalidateQueries({ queryKey: ["my-availability"] });
    },
    onError: () => toast.error("تعذّر حذف الموعد"),
  });
}
