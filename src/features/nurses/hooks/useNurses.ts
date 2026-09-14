import { useQuery } from "@tanstack/react-query";
import {
  fetchNurses,
  fetchNurseById,
  fetchNurseServiceAreas,
  fetchNurseServices,
  fetchNursesWithLocation,
  type NurseFilters,
} from "../services/nurses.service";

export function useNurses(filters: NurseFilters) {
  return useQuery({
    queryKey: ["nurses", filters],
    queryFn: () => fetchNurses(filters),
    placeholderData: (previous) => previous,
  });
}

export function useNurse(id: string | undefined) {
  return useQuery({
    queryKey: ["nurse", id],
    queryFn: () => fetchNurseById(id as string),
    enabled: Boolean(id),
  });
}

export function useNurseServiceAreas() {
  return useQuery({
    queryKey: ["nurse-service-areas"],
    queryFn: fetchNurseServiceAreas,
    staleTime: 5 * 60_000,
  });
}

export function useNurseServices(nurseId: string | undefined) {
  return useQuery({
    queryKey: ["nurse-services", nurseId],
    queryFn: () => fetchNurseServices(nurseId as string),
    enabled: Boolean(nurseId),
  });
}

export function useNursesWithLocation() {
  return useQuery({
    queryKey: ["nurses-with-location"],
    queryFn: fetchNursesWithLocation,
  });
}
