import { useQuery } from "@tanstack/react-query";
import { fetchAvailableSlots } from "../services/slots.service";
import type { ProviderType } from "@/types/enums";

export function useAvailableSlots(
  providerId: string | undefined,
  providerType: ProviderType,
  date: string | undefined
) {
  return useQuery({
    queryKey: ["available-slots", providerType, providerId, date],
    queryFn: () => fetchAvailableSlots(providerId as string, providerType, date as string),
    enabled: Boolean(providerId && date),
  });
}
