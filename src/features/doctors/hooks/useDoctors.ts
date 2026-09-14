import { useQuery } from "@tanstack/react-query";
import {
  fetchDoctors,
  fetchDoctorById,
  fetchDoctorSpecializations,
  fetchDoctorServices,
  type DoctorFilters,
} from "../services/doctors.service";

export function useDoctors(filters: DoctorFilters) {
  return useQuery({
    queryKey: ["doctors", filters],
    queryFn: () => fetchDoctors(filters),
    placeholderData: (previous) => previous,
  });
}

export function useDoctor(id: string | undefined) {
  return useQuery({
    queryKey: ["doctor", id],
    queryFn: () => fetchDoctorById(id as string),
    enabled: Boolean(id),
  });
}

export function useDoctorSpecializations() {
  return useQuery({
    queryKey: ["doctor-specializations"],
    queryFn: fetchDoctorSpecializations,
    staleTime: 5 * 60_000,
  });
}

export function useDoctorServices(doctorId: string | undefined) {
  return useQuery({
    queryKey: ["doctor-services", doctorId],
    queryFn: () => fetchDoctorServices(doctorId as string),
    enabled: Boolean(doctorId),
  });
}
