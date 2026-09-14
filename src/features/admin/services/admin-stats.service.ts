import { supabase } from "@/lib/supabase";
import { isToday } from "date-fns";

export interface AdminOverviewStats {
  totalUsers: number;
  totalDoctors: number;
  totalNurses: number;
  todayBookings: number;
  upcomingBookings: number;
  pendingRequests: number;
  completedBookings: number;
}

export async function fetchAdminOverviewStats(): Promise<AdminOverviewStats> {
  const [usersRes, doctorsRes, nursesRes, bookingsRes] = await Promise.all([
    supabase.from("profiles").select("id", { count: "exact", head: true }).eq("role", "USER"),
    supabase.from("profiles").select("id", { count: "exact", head: true }).eq("role", "DOCTOR"),
    supabase.from("profiles").select("id", { count: "exact", head: true }).eq("role", "NURSE"),
    supabase.from("bookings").select("booking_date, status"),
  ]);

  const bookings = bookingsRes.data ?? [];

  return {
    totalUsers: usersRes.count ?? 0,
    totalDoctors: doctorsRes.count ?? 0,
    totalNurses: nursesRes.count ?? 0,
    todayBookings: bookings.filter((b) => isToday(new Date(b.booking_date))).length,
    upcomingBookings: bookings.filter((b) =>
      ["pending", "accepted", "confirmed", "in_progress"].includes(b.status)
    ).length,
    pendingRequests: bookings.filter((b) => b.status === "pending").length,
    completedBookings: bookings.filter((b) => b.status === "completed").length,
  };
}
