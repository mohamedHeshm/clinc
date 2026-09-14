import { useQuery } from "@tanstack/react-query";
import { fetchProviderReviews } from "../services/reviews.service";

export function useProviderReviews(providerId: string | undefined, providerType: "doctor" | "nurse") {
  return useQuery({
    queryKey: ["provider-reviews", providerType, providerId],
    queryFn: () => fetchProviderReviews(providerId as string, providerType),
    enabled: Boolean(providerId),
  });
}
