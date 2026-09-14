import { useMutation, useQuery, useQueryClient } from "@tanstack/react-query";
import { toast } from "sonner";
import { useMyProvider } from "./useMyProvider";
import {
  fetchCatalogServices,
  fetchMyProviderServices,
  addMyProviderService,
  updateMyProviderServicePrice,
  removeMyProviderService,
} from "../services/provider-services.service";

export function useCatalogServices() {
  const { data: provider } = useMyProvider();
  return useQuery({
    queryKey: ["catalog-services", provider?.type],
    queryFn: () => fetchCatalogServices(provider!.type),
    enabled: Boolean(provider?.type),
  });
}

export function useMyProviderServices() {
  const { data: provider } = useMyProvider();
  return useQuery({
    queryKey: ["my-provider-services", provider?.id, provider?.type],
    queryFn: () => fetchMyProviderServices(provider!.id, provider!.type),
    enabled: Boolean(provider?.id),
  });
}

export function useAddProviderService() {
  const { data: provider } = useMyProvider();
  const queryClient = useQueryClient();

  return useMutation({
    mutationFn: ({ serviceId, price }: { serviceId: string; price: number | null }) =>
      addMyProviderService(provider!.id, provider!.type, serviceId, price),
    onSuccess: () => {
      toast.success("تمت إضافة الخدمة لملفك");
      queryClient.invalidateQueries({ queryKey: ["my-provider-services"] });
    },
    onError: () => toast.error("تعذّر إضافة الخدمة"),
  });
}

export function useUpdateProviderServicePrice() {
  const { data: provider } = useMyProvider();
  const queryClient = useQueryClient();

  return useMutation({
    mutationFn: ({ serviceId, price }: { serviceId: string; price: number | null }) =>
      updateMyProviderServicePrice(provider!.id, provider!.type, serviceId, price),
    onSuccess: () => {
      toast.success("تم حفظ السعر");
      queryClient.invalidateQueries({ queryKey: ["my-provider-services"] });
    },
    onError: () => toast.error("تعذّر حفظ السعر"),
  });
}

export function useRemoveProviderService() {
  const { data: provider } = useMyProvider();
  const queryClient = useQueryClient();

  return useMutation({
    mutationFn: (serviceId: string) => removeMyProviderService(provider!.id, provider!.type, serviceId),
    onSuccess: () => {
      toast.success("تمت إزالة الخدمة");
      queryClient.invalidateQueries({ queryKey: ["my-provider-services"] });
    },
    onError: () => toast.error("تعذّر إزالة الخدمة"),
  });
}
