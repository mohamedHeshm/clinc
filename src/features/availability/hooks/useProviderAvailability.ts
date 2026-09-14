import { useQuery } from "@tanstack/react-query";
import { fetchProviderAvailability } from "../services/availability.service";

export function useProviderAvailability(
  providerId: string | undefined,
  providerType: "doctor" | "nurse"
) {
  return useQuery({
    queryKey: ["availability", providerType, providerId],
    queryFn: () => fetchProviderAvailability(providerId as string, providerType),
    enabled: Boolean(providerId),
  });
}
