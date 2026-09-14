import { useQuery } from "@tanstack/react-query";
import { useAuth } from "@/contexts/AuthContext";
import { fetchMyProviderRecord } from "../services/provider.service";

export function useMyProvider() {
  const { profile } = useAuth();

  return useQuery({
    queryKey: ["my-provider", profile?.id],
    queryFn: () => fetchMyProviderRecord(profile!.id, profile!.role as "DOCTOR" | "NURSE"),
    enabled: Boolean(profile?.id && (profile.role === "DOCTOR" || profile.role === "NURSE")),
  });
}
